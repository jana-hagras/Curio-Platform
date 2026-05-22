import pool from "../../db/connection.js";

const sanitizeMentorship = (row) => {
  if (!row) return null;
  return {
    id: row.Mentorship_id,
    artisan_id: row.Artisan_id,
    category: row.Category,
    sessionPrice: row.SessionPrice,
    duration: row.Duration,
    description: row.Description,
    status: row.Status,
    maxStudents: row.MaxStudents,
    startDate: row.StartDate,
    createdAt: row.CreatedAt,
    artisanName: row.ArtisanFName ? `${row.ArtisanFName} ${row.ArtisanLName}` : null,
    artisanBio: row.ArtisanBio || null,
    artisanVerified: row.ArtisanVerified || false,
    artisanProfileImage: row.ArtisanProfileImage || null,
    applicationCount: row.ApplicationCount || 0,
  };
};

// Rich JOIN query — resolves artisan info
const MENTORSHIP_QUERY = `
  SELECT 
    m.*,
    u.FName AS ArtisanFName, u.LName AS ArtisanLName,
    u.ProfileImage AS ArtisanProfileImage,
    a.Bio AS ArtisanBio, a.Verified AS ArtisanVerified,
    (SELECT COUNT(*) FROM MentorshipApplication ma WHERE ma.Mentorship_id = m.Mentorship_id) AS ApplicationCount
  FROM Mentorship m
  LEFT JOIN Artisan a ON m.Artisan_id = a.Artisan_id
  LEFT JOIN user u ON a.Artisan_id = u.User_id
`;

// =============================
// 📋 GET ALL MENTORSHIPS
// =============================
export const getAllMentorships = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${MENTORSHIP_QUERY} ORDER BY m.CreatedAt DESC`);
    return res.status(200).json({ ok: true, data: { mentorships: rows.map(sanitizeMentorship) } });
  } catch (err) { next(err); }
};

// =============================
// 🔍 SEARCH MENTORSHIPS
// =============================
export const searchMentorships = async (req, res, next) => {
  try {
    const value = req.query.value;
    if (!value) return res.status(400).json({ ok: false, message: "Search value is required" });

    const searchValue = `%${value}%`;
    const query = `
      ${MENTORSHIP_QUERY}
      WHERE 
        m.Category LIKE ?
        OR m.Description LIKE ?
        OR m.Status LIKE ?
        OR u.FName LIKE ?
        OR u.LName LIKE ?
      ORDER BY m.CreatedAt DESC
    `;
    const [rows] = await pool.query(query, Array(5).fill(searchValue));
    return res.status(200).json({ ok: true, data: { mentorships: rows.map(sanitizeMentorship) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ID
// =============================
export const getMentorshipById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${MENTORSHIP_QUERY} WHERE m.Mentorship_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Mentorship not found." });

    return res.status(200).json({ ok: true, data: { mentorship: sanitizeMentorship(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ARTISAN
// =============================
export const getMentorshipsByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(`${MENTORSHIP_QUERY} WHERE m.Artisan_id = ? ORDER BY m.CreatedAt DESC`, [artisanId]);
    return res.status(200).json({ ok: true, data: { mentorships: rows.map(sanitizeMentorship) } });
  } catch (err) { next(err); }
};

// =============================
// ➕ CREATE MENTORSHIP
// =============================
export const createMentorship = async (req, res, next) => {
  try {
    const { artisan_id, category, sessionPrice, duration, description, status, maxStudents, startDate } = req.body;

    if (!artisan_id || !sessionPrice || !duration) {
      return res.status(400).json({ ok: false, message: "artisan_id, sessionPrice, and duration are required." });
    }

    if (Number(sessionPrice) < 0) {
      return res.status(400).json({ ok: false, message: "Session price cannot be negative." });
    }

    const [result] = await pool.query(
      `INSERT INTO Mentorship (Artisan_id, Category, SessionPrice, Duration, Description, Status, MaxStudents, StartDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [artisan_id, category || null, sessionPrice, duration, description || null, status || 'Active', maxStudents || 10, startDate || null]
    );

    const [rows] = await pool.query(`${MENTORSHIP_QUERY} WHERE m.Mentorship_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { mentorship: sanitizeMentorship(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// ✏️ UPDATE MENTORSHIP
// =============================
export const updateMentorship = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { category, sessionPrice, duration, description, status, maxStudents, startDate } = req.body;

    const [existing] = await pool.query("SELECT * FROM Mentorship WHERE Mentorship_id = ?", [id]);
    if (!existing.length) return res.status(404).json({ ok: false, message: "Mentorship not found." });

    await pool.query(
      `UPDATE Mentorship SET 
        Category=COALESCE(?,Category), 
        SessionPrice=COALESCE(?,SessionPrice),
        Duration=COALESCE(?,Duration),
        Description=COALESCE(?,Description),
        Status=COALESCE(?,Status),
        MaxStudents=COALESCE(?,MaxStudents),
        StartDate=COALESCE(?,StartDate)
       WHERE Mentorship_id=?`,
      [category, sessionPrice, duration, description, status, maxStudents, startDate, id]
    );

    const [rows] = await pool.query(`${MENTORSHIP_QUERY} WHERE m.Mentorship_id = ?`, [id]);
    return res.status(200).json({ ok: true, data: { mentorship: sanitizeMentorship(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 🗑️ DELETE MENTORSHIP
// =============================
export const deleteMentorship = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Mentorship WHERE Mentorship_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Mentorship not found." });

    return res.status(200).json({ ok: true, message: "Mentorship deleted successfully." });
  } catch (err) { next(err); }
};
