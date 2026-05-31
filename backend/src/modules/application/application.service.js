import pool from "../../db/connection.js";

const sanitizeApplication = (row) => {
  if (!row) return null;
  return {
    id: row.Application_id,
    request_id: row.Request_id,
    artisan_id: row.Artisan_id,
    applicationDate: row.ApplicationDate,
    proposal: row.Proposal,
    status: row.Status,
    artisanName: row.ArtisanFName ? `${row.ArtisanFName} ${row.ArtisanLName}` : null,
    requestTitle: row.RequestTitle || null,
    requestCategory: row.RequestCategory || null,
    requestBudget: row.RequestBudget || null,
    buyerName: row.BuyerFName ? `${row.BuyerFName} ${row.BuyerLName}` : null,
    buyer_id: row.BuyerId || null,
  };
};

// Rich JOIN query — resolves artisan name, request details, and buyer name
const APP_QUERY = `
  SELECT 
    ap.*,
    artU.FName AS ArtisanFName, artU.LName AS ArtisanLName,
    r.Title AS RequestTitle, r.Category AS RequestCategory, r.Budget AS RequestBudget,
    r.Buyer_id AS BuyerId,
    buyU.FName AS BuyerFName, buyU.LName AS BuyerLName
  FROM Application ap
  LEFT JOIN Artisan a   ON ap.Artisan_id = a.Artisan_id
  LEFT JOIN user artU   ON a.Artisan_id  = artU.User_id
  LEFT JOIN Request r   ON ap.Request_id = r.Request_id
  LEFT JOIN Buyer b     ON r.Buyer_id    = b.Buyer_id
  LEFT JOIN user buyU   ON b.Buyer_id    = buyU.User_id
`;


// =============================
// 📋 GET ALL APPLICATIONS
// =============================
export const getAllApplications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${APP_QUERY} ORDER BY ap.ApplicationDate DESC, ap.Application_id DESC`);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApplication) } });
  } catch (err) { next(err); }
};


// =============================
// 🔍 SEARCH APPLICATIONS
// =============================
export const searchApplications = async (req, res, next) => {
  try {
    const value = req.query.value;

    if (!value) {
      return res.status(400).json({
        ok: false,
        message: "Search value is required"
      });
    }

    const searchValue = `%${value}%`;

    const query = `
      ${APP_QUERY}
      WHERE 
        ap.Application_id LIKE ?
        OR ap.Request_id LIKE ?
        OR ap.Artisan_id LIKE ?
        OR ap.Proposal LIKE ?
        OR ap.Status LIKE ?
        OR ap.ApplicationDate LIKE ?
        OR artU.FName LIKE ?
        OR artU.LName LIKE ?
        OR r.Title LIKE ?
        OR buyU.FName LIKE ?
        OR buyU.LName LIKE ?
      ORDER BY ap.ApplicationDate DESC, ap.Application_id DESC
    `;

    const values = Array(11).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        applications: rows.map(sanitizeApplication)
      }
    });

  } catch (err) {
    next(err);
  }
};

// CREATE
export const createApplication = async (req, res, next) => {
  try {
    const { request_id, artisan_id, proposal } = req.body;
    if (!request_id || !artisan_id) {
      return res.status(400).json({ ok: false, message: "request_id and artisan_id are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO Application (Request_id, Artisan_id, ApplicationDate, Proposal, Status) VALUES (?, ?, CURRENT_DATE, ?, 'Pending')",
      [request_id, artisan_id, proposal || null]
    );

    const [rows] = await pool.query(`${APP_QUERY} WHERE ap.Application_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { application: sanitizeApplication(rows[0]) } });
  } catch (err) { next(err); }
};

// READ BY REQUEST
export const getApplicationsByRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.query.request_id);
    if (!requestId) return res.status(400).json({ ok: false, message: "Query parameter 'request_id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE ap.Request_id = ?`, [requestId]);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApplication) } });
  } catch (err) { next(err); }
};

// READ BY ARTISAN
export const getApplicationsByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE ap.Artisan_id = ?`, [artisanId]);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApplication) } });
  } catch (err) { next(err); }
};

// READ BY ID
export const getApplicationById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE ap.Application_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Application not found." });

    return res.status(200).json({ ok: true, data: { application: sanitizeApplication(rows[0]) } });
  } catch (err) { next(err); }
};

// UPDATE (with auto-milestone generation on approval)
// ─── TRANSACTIONAL: approval + milestone generation are atomic ───
export const updateApplication = async (req, res, next) => {
  // Grab a dedicated connection so we can use BEGIN / COMMIT / ROLLBACK.
  const conn = await pool.getConnection();
  try {
    const id = Number(req.query.id);
    if (!id) {
      conn.release();
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });
    }

    const { proposal, status } = req.body;

    // Fetch current application before update
    const [currentRows] = await conn.query(`${APP_QUERY} WHERE ap.Application_id = ?`, [id]);
    if (!currentRows.length) {
      conn.release();
      return res.status(404).json({ ok: false, message: "Application not found." });
    }

    const current = currentRows[0];
    const wasApproved = current.Status === 'Approved';
    const isBeingApproved = status === 'Approved' && !wasApproved;

    // ── START TRANSACTION ──────────────────────────────────────────
    // Everything from here until COMMIT is atomic: if milestone
    // generation fails, the approval itself rolls back too.
    await conn.beginTransaction();

    // Update the application
    await conn.query(
      "UPDATE Application SET Proposal=COALESCE(?,Proposal), Status=COALESCE(?,Status) WHERE Application_id=?",
      [proposal, status, id]
    );

    // If being approved, auto-generate milestones and reject others
    if (isBeingApproved) {
      const requestId = current.Request_id;
      const artisanId = current.Artisan_id;

      // 1. Reject all other pending applications for this request
      await conn.query(
        "UPDATE Application SET Status = 'Rejected' WHERE Request_id = ? AND Application_id != ? AND Status = 'Pending'",
        [requestId, id]
      );

      // 2. Get request budget
      const [reqRows] = await conn.query("SELECT Budget FROM Request WHERE Request_id = ?", [requestId]);
      const budget = Number(reqRows[0]?.Budget || 0);

      // 3. Check if milestones already exist for this request
      const [existingMilestones] = await conn.query(
        "SELECT Milestone_id FROM Milestone WHERE Request_id = ?",
        [requestId]
      );

      // 4. Auto-generate 5 default milestones (only if none exist yet)
      if (existingMilestones.length === 0) {

        // Safety check: artisanId must be a valid integer.
        // current.Artisan_id comes from ap.* in APP_QUERY — this is the Application table's column.
        if (!artisanId) {
          await conn.rollback();
          conn.release();
          console.error(`[Milestone Auto-Gen] ROLLBACK — artisanId is ${artisanId} for application ${id}.`);
          return res.status(500).json({ ok: false, message: "Cannot generate milestones: artisan ID is missing on this application." });
        }

        console.log(`[Milestone Auto-Gen] Generating 5 milestones for request=${requestId}, artisan=${artisanId}, application=${id}`);

        const milestoneTitles = [
          { title: 'Project Kickoff', desc: 'Project kickoff and initial planning phase' },
          { title: 'Design Phase', desc: 'Design concepts and approval phase' },
          { title: 'Production', desc: 'Main production and crafting phase' },
          { title: 'Quality Review', desc: 'Quality inspection and refinements phase' },
          { title: 'Delivery', desc: 'Final delivery and handover phase' },
        ];

        const milestoneShare = budget > 0 ? parseFloat((budget / milestoneTitles.length).toFixed(2)) : 0;
        const now = new Date();

        for (let i = 0; i < milestoneTitles.length; i++) {
          const due = new Date(now);
          due.setDate(due.getDate() + (i + 1) * 7);

          // Last milestone gets remaining amount to avoid rounding issues
          const amount = (i === milestoneTitles.length - 1 && budget > 0)
            ? parseFloat((budget - milestoneShare * (milestoneTitles.length - 1)).toFixed(2))
            : milestoneShare;

          const [insertResult] = await conn.query(
            "INSERT INTO Milestone (Request_id, Artisan_id, Application_id, Title, Description, DueDate, EscrowAmount, Status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')",
            [requestId, artisanId, id, milestoneTitles[i].title, milestoneTitles[i].desc, due.toISOString().slice(0, 10), amount]
          );
          console.log(`[Milestone Auto-Gen]   ✅ Milestone ${i + 1}/5 "${milestoneTitles[i].title}" inserted (id=${insertResult.insertId})`);
        }

        // Verification: confirm all 5 rows actually exist before committing
        const [verifyRows] = await conn.query(
          "SELECT COUNT(*) AS cnt FROM Milestone WHERE Request_id = ? AND Application_id = ?",
          [requestId, id]
        );
        const savedCount = verifyRows[0].cnt;
        if (savedCount < 5) {
          await conn.rollback();
          conn.release();
          console.error(`[Milestone Auto-Gen] ROLLBACK — only ${savedCount}/5 milestones found after INSERT for request=${requestId}`);
          return res.status(500).json({ ok: false, message: `Milestone generation incomplete (${savedCount}/5). Approval rolled back.` });
        }

        console.log(`[Milestone Auto-Gen] ✅ All 5 milestones verified in DB for request=${requestId}`);
      }
    }

    // ── COMMIT ─────────────────────────────────────────────────────
    await conn.commit();
    conn.release();

    return getApplicationById(req, res, next);
  } catch (err) {
    // ── ROLLBACK on any error ──────────────────────────────────────
    try { await conn.rollback(); } catch (_) { /* connection may already be dead */ }
    conn.release();
    console.error('[updateApplication] ❌ Transaction rolled back:', err.message, err.stack);
    next(err);
  }
};

// DELETE
export const deleteApplication = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Application WHERE Application_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Application not found." });

    return res.status(200).json({ ok: true, message: "Application deleted successfully." });
  } catch (err) { next(err); }
};
