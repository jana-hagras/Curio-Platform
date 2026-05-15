import pool from "../../db/connection.js";

const sanitizeMilestone = (row) => {
  if (!row) return null;
  return {
    id: row.Milestone_id,
    request_id: row.Request_id,
    title: row.Title,
    description: row.Description,
    dueDate: row.DueDate,
    escrowAmount: row.EscrowAmount,
    escrowReleaseDate: row.EscrowReleaseDate,
    status: row.Status,
  };
};

// =============================
// 🔍 SEARCH MILESTONES
// =============================
export const searchMilestones = async (req, res, next) => {
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
      SELECT * FROM Milestone
      WHERE 
        Milestone_id LIKE ?
        OR Request_id LIKE ?
        OR Title LIKE ?
        OR Description LIKE ?
        OR DueDate LIKE ?
        OR EscrowAmount LIKE ?
        OR EscrowReleaseDate LIKE ?
        OR Status LIKE ?
    `;

    const values = Array(8).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        milestones: rows.map(sanitizeMilestone)
      }
    });

  } catch (err) {
    next(err);
  }
};

// CREATE
export const createMilestone = async (req, res, next) => {
  try {
    const { request_id, title, description, dueDate, escrowAmount, status } = req.body;
    if (!request_id || !title) {
      return res.status(400).json({ ok: false, message: "request_id and title are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO Milestone (Request_id, Title, Description, DueDate, EscrowAmount, Status) VALUES (?, ?, ?, ?, ?, ?)",
      [request_id, title, description || null, dueDate || null, escrowAmount || null, status || 'Pending']
    );

    const [rows] = await pool.query("SELECT * FROM Milestone WHERE Milestone_id = ?", [result.insertId]);
    return res.status(201).json({ ok: true, data: { milestone: sanitizeMilestone(rows[0]) } });
  } catch (err) { next(err); }
};

// READ BY REQUEST
export const getMilestonesByRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.query.request_id);
    if (!requestId) return res.status(400).json({ ok: false, message: "Query parameter 'request_id' is required." });

    const [rows] = await pool.query("SELECT * FROM Milestone WHERE Request_id = ?", [requestId]);
    return res.status(200).json({ ok: true, data: { milestones: rows.map(sanitizeMilestone) } });
  } catch (err) { next(err); }
};

// READ BY ID
export const getMilestoneById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query("SELECT * FROM Milestone WHERE Milestone_id = ?", [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Milestone not found." });

    return res.status(200).json({ ok: true, data: { milestone: sanitizeMilestone(rows[0]) } });
  } catch (err) { next(err); }
};

// UPDATE
export const updateMilestone = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { title, description, dueDate, escrowAmount, escrowReleaseDate, status } = req.body;
    await pool.query(
      "UPDATE Milestone SET Title=COALESCE(?,Title), Description=COALESCE(?,Description), DueDate=COALESCE(?,DueDate), EscrowAmount=COALESCE(?,EscrowAmount), EscrowReleaseDate=COALESCE(?,EscrowReleaseDate), Status=COALESCE(?,Status) WHERE Milestone_id=?",
      [title, description, dueDate, escrowAmount, escrowReleaseDate, status, id]
    );
    return getMilestoneById(req, res, next);
  } catch (err) { next(err); }
};

// =============================
// ✅ COMPLETE MILESTONE (with escrow release logic)
// =============================
export const completeMilestone = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    // 1. Fetch the milestone
    const [milestoneRows] = await pool.query("SELECT * FROM Milestone WHERE Milestone_id = ?", [id]);
    if (!milestoneRows.length) return res.status(404).json({ ok: false, message: "Milestone not found." });

    const milestone = milestoneRows[0];

    // Prevent re-completing
    if (milestone.Status === 'Completed') {
      return res.status(400).json({ ok: false, message: "Milestone is already completed." });
    }

    const requestId = milestone.Request_id;
    const releaseAmount = Number(milestone.EscrowAmount || 0);

    // 2. Mark milestone as Completed with release date
    await pool.query(
      "UPDATE Milestone SET Status = 'Completed', EscrowReleaseDate = CURRENT_DATE WHERE Milestone_id = ?",
      [id]
    );

    // 3. Release escrow funds on the Payment record
    if (releaseAmount > 0) {
      // Find the escrow payment for this request
      const [paymentRows] = await pool.query(
        "SELECT * FROM Payment WHERE Request_id = ? AND PaymentType = 'escrow' LIMIT 1",
        [requestId]
      );

      if (paymentRows.length) {
        const payment = paymentRows[0];
        const newReleased = Number(payment.EscrowReleased || 0) + releaseAmount;
        const newHeld = Math.max(0, Number(payment.EscrowHeld || 0) - releaseAmount);

        // Determine new escrow status
        let newEscrowStatus;
        if (newHeld <= 0) {
          newEscrowStatus = 'fully_released';
        } else {
          newEscrowStatus = 'partially_released';
        }

        await pool.query(
          `UPDATE Payment SET 
            EscrowReleased = ?,
            EscrowHeld = ?,
            EscrowStatus = ?
           WHERE Payment_id = ?`,
          [newReleased, newHeld, newEscrowStatus, payment.Payment_id]
        );
      }
    }

    // 4. Check if all milestones for this request are now completed
    const [allMilestones] = await pool.query(
      "SELECT Status FROM Milestone WHERE Request_id = ?",
      [requestId]
    );
    const allCompleted = allMilestones.every(m => m.Status === 'Completed');

    // If all milestones done, update payment status
    if (allCompleted) {
      await pool.query(
        "UPDATE Payment SET EscrowStatus = 'fully_released' WHERE Request_id = ? AND PaymentType = 'escrow'",
        [requestId]
      );
    }

    // 5. Return updated milestone
    const [updatedRows] = await pool.query("SELECT * FROM Milestone WHERE Milestone_id = ?", [id]);
    return res.status(200).json({
      ok: true,
      message: "Milestone completed and escrow funds released.",
      data: { milestone: sanitizeMilestone(updatedRows[0]) }
    });

  } catch (err) { next(err); }
};

// DELETE
export const deleteMilestone = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Milestone WHERE Milestone_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Milestone not found." });

    return res.status(200).json({ ok: true, message: "Milestone deleted successfully." });
  } catch (err) { next(err); }
};
