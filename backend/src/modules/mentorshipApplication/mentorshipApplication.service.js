import pool from "../../db/connection.js";

const sanitizeApp = (row) => {
  if (!row) return null;
  return {
    id: row.Application_id,
    mentorship_id: row.Mentorship_id,
    buyer_id: row.Buyer_id,
    applicationDate: row.ApplicationDate,
    message: row.Message,
    status: row.Status,
    buyerName: row.BuyerFName ? `${row.BuyerFName} ${row.BuyerLName}` : null,
    buyerProfileImage: row.BuyerProfileImage || null,
    artisan_id: row.Artisan_id || null,
    artisanName: row.ArtisanFName ? `${row.ArtisanFName} ${row.ArtisanLName}` : null,
    mentorshipCategory: row.MentorshipCategory || null,
    mentorshipPrice: row.MentorshipPrice || null,
    mentorshipDuration: row.MentorshipDuration || null,
    mentorshipDescription: row.MentorshipDescription || null,
    // Session info if exists
    sessionId: row.Session_id || null,
    scheduledAt: row.ScheduledAt || null,
    meetingLink: row.MeetingLink || null,
    meetingProvider: row.MeetingProvider || null,
    sessionStatus: row.SessionStatus || null,
  };
};

// Rich JOIN query
const APP_QUERY = `
  SELECT 
    ma.*,
    buyU.FName AS BuyerFName, buyU.LName AS BuyerLName,
    buyU.ProfileImage AS BuyerProfileImage,
    m.Artisan_id, m.Category AS MentorshipCategory, 
    m.SessionPrice AS MentorshipPrice, m.Duration AS MentorshipDuration,
    m.Description AS MentorshipDescription,
    artU.FName AS ArtisanFName, artU.LName AS ArtisanLName,
    ms.Session_id, ms.ScheduledAt, ms.MeetingLink, ms.MeetingProvider, ms.Status AS SessionStatus
  FROM MentorshipApplication ma
  LEFT JOIN Buyer b ON ma.Buyer_id = b.Buyer_id
  LEFT JOIN user buyU ON b.Buyer_id = buyU.User_id
  LEFT JOIN Mentorship m ON ma.Mentorship_id = m.Mentorship_id
  LEFT JOIN Artisan a ON m.Artisan_id = a.Artisan_id
  LEFT JOIN user artU ON a.Artisan_id = artU.User_id
  LEFT JOIN MentorshipSession ms ON ma.Application_id = ms.Application_id
`;

// =============================
// 📋 GET ALL
// =============================
export const getAllApplications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${APP_QUERY} ORDER BY ma.ApplicationDate DESC`);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApp) } });
  } catch (err) { next(err); }
};

// =============================
// 🔍 SEARCH
// =============================
export const searchApplications = async (req, res, next) => {
  try {
    const value = req.query.value;
    if (!value) return res.status(400).json({ ok: false, message: "Search value is required" });

    const sv = `%${value}%`;
    const query = `
      ${APP_QUERY}
      WHERE 
        ma.Application_id LIKE ? OR ma.Status LIKE ?
        OR buyU.FName LIKE ? OR buyU.LName LIKE ?
        OR artU.FName LIKE ? OR artU.LName LIKE ?
        OR m.Category LIKE ?
      ORDER BY ma.ApplicationDate DESC
    `;
    const [rows] = await pool.query(query, Array(7).fill(sv));
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApp) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY MENTORSHIP
// =============================
export const getByMentorship = async (req, res, next) => {
  try {
    const id = Number(req.query.mentorship_id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'mentorship_id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE ma.Mentorship_id = ? ORDER BY ma.ApplicationDate DESC`, [id]);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApp) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY BUYER
// =============================
export const getByBuyer = async (req, res, next) => {
  try {
    const id = Number(req.query.buyer_id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE ma.Buyer_id = ? ORDER BY ma.ApplicationDate DESC`, [id]);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApp) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ARTISAN (all apps for artisan's mentorships)
// =============================
export const getByArtisan = async (req, res, next) => {
  try {
    const id = Number(req.query.artisan_id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE m.Artisan_id = ? ORDER BY ma.ApplicationDate DESC`, [id]);
    return res.status(200).json({ ok: true, data: { applications: rows.map(sanitizeApp) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ID
// =============================
export const getById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${APP_QUERY} WHERE ma.Application_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Application not found." });

    return res.status(200).json({ ok: true, data: { application: sanitizeApp(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// ➕ CREATE APPLICATION
// =============================
export const createApplication = async (req, res, next) => {
  try {
    const { mentorship_id, buyer_id, message } = req.body;
    if (!mentorship_id || !buyer_id) {
      return res.status(400).json({ ok: false, message: "mentorship_id and buyer_id are required." });
    }

    // Check if mentorship exists and is active
    const [mentorship] = await pool.query("SELECT * FROM Mentorship WHERE Mentorship_id = ?", [mentorship_id]);
    if (!mentorship.length) return res.status(404).json({ ok: false, message: "Mentorship not found." });
    if (mentorship[0].Status !== 'Active') return res.status(400).json({ ok: false, message: "This mentorship is not accepting applications." });

    // Check duplicate
    const [existing] = await pool.query(
      "SELECT * FROM MentorshipApplication WHERE Mentorship_id = ? AND Buyer_id = ?",
      [mentorship_id, buyer_id]
    );
    if (existing.length) return res.status(400).json({ ok: false, message: "You have already applied for this mentorship." });

    const [result] = await pool.query(
      "INSERT INTO MentorshipApplication (Mentorship_id, Buyer_id, ApplicationDate, Message, Status) VALUES (?, ?, CURRENT_DATE, ?, 'Pending')",
      [mentorship_id, buyer_id, message || null]
    );

    const [rows] = await pool.query(`${APP_QUERY} WHERE ma.Application_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { application: sanitizeApp(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// ✏️ UPDATE (Accept/Reject + auto-session creation)
// =============================
export const updateApplication = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { status, message, meetingLink, scheduledAt } = req.body;

    const [currentRows] = await pool.query(`${APP_QUERY} WHERE ma.Application_id = ?`, [id]);
    if (!currentRows.length) return res.status(404).json({ ok: false, message: "Application not found." });

    const current = currentRows[0];
    const wasAccepted = current.Status === 'Accepted';
    const isBeingAccepted = status === 'Accepted' && !wasAccepted;

    await pool.query(
      "UPDATE MentorshipApplication SET Status=COALESCE(?,Status), Message=COALESCE(?,Message) WHERE Application_id=?",
      [status, message, id]
    );

    // On acceptance: create a session and optionally reject other pending apps
    if (isBeingAccepted) {
      const mentorshipId = current.Mentorship_id;
      const mentorshipDuration = current.MentorshipDuration;

      // Create session
      await pool.query(
        `INSERT INTO MentorshipSession (Application_id, ScheduledAt, Duration, MeetingLink, MeetingProvider, Status)
         VALUES (?, ?, ?, ?, 'custom', 'Scheduled')`,
        [id, scheduledAt || null, mentorshipDuration || 60, meetingLink || null]
      );

      console.log(`[Mentorship] Session created for application ${id}`);
    }

    // If artisan provides meeting link, update session
    if (meetingLink && current.Session_id) {
      await pool.query(
        "UPDATE MentorshipSession SET MeetingLink=?, ScheduledAt=COALESCE(?,ScheduledAt) WHERE Session_id=?",
        [meetingLink, scheduledAt, current.Session_id]
      );
    }

    const [rows] = await pool.query(`${APP_QUERY} WHERE ma.Application_id = ?`, [id]);
    return res.status(200).json({ ok: true, data: { application: sanitizeApp(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 🗑️ DELETE
// =============================
export const deleteApplication = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM MentorshipApplication WHERE Application_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Application not found." });

    return res.status(200).json({ ok: true, message: "Application deleted successfully." });
  } catch (err) { next(err); }
};
