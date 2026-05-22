import pool from "../../db/connection.js";

const sanitizeWorkshop = (row) => {
  if (!row) return null;
  return {
    id: row.Workshop_id,
    artisan_id: row.Artisan_id,
    title: row.Title,
    description: row.Description,
    workshopDate: row.WorkshopDate,
    duration: row.Duration,
    price: row.Price,
    category: row.Category,
    maxParticipants: row.MaxParticipants,
    status: row.Status,
    createdAt: row.CreatedAt,
    artisanName: row.ArtisanFName ? `${row.ArtisanFName} ${row.ArtisanLName}` : null,
    artisanBio: row.ArtisanBio || null,
    artisanVerified: row.ArtisanVerified || false,
    artisanProfileImage: row.ArtisanProfileImage || null,
    registrationCount: row.RegistrationCount || 0,
  };
};

const WORKSHOP_QUERY = `
  SELECT 
    w.*,
    u.FName AS ArtisanFName, u.LName AS ArtisanLName,
    u.ProfileImage AS ArtisanProfileImage,
    a.Bio AS ArtisanBio, a.Verified AS ArtisanVerified,
    (SELECT COUNT(*) FROM WorkshopRegistration wr WHERE wr.Workshop_id = w.Workshop_id AND wr.Status != 'Cancelled') AS RegistrationCount
  FROM Workshop w
  LEFT JOIN Artisan a ON w.Artisan_id = a.Artisan_id
  LEFT JOIN user u ON a.Artisan_id = u.User_id
`;

// =============================
// 📋 GET ALL WORKSHOPS
// =============================
export const getAllWorkshops = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${WORKSHOP_QUERY} ORDER BY w.WorkshopDate ASC, w.CreatedAt DESC`);
    return res.status(200).json({ ok: true, data: { workshops: rows.map(sanitizeWorkshop) } });
  } catch (err) { next(err); }
};

// =============================
// 🔍 SEARCH WORKSHOPS
// =============================
export const searchWorkshops = async (req, res, next) => {
  try {
    const value = req.query.value;
    if (!value) return res.status(400).json({ ok: false, message: "Search value is required" });

    const sv = `%${value}%`;
    const query = `
      ${WORKSHOP_QUERY}
      WHERE 
        w.Title LIKE ? OR w.Description LIKE ? OR w.Category LIKE ?
        OR u.FName LIKE ? OR u.LName LIKE ?
      ORDER BY w.WorkshopDate ASC
    `;
    const [rows] = await pool.query(query, Array(5).fill(sv));
    return res.status(200).json({ ok: true, data: { workshops: rows.map(sanitizeWorkshop) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ID
// =============================
export const getWorkshopById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${WORKSHOP_QUERY} WHERE w.Workshop_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Workshop not found." });

    return res.status(200).json({ ok: true, data: { workshop: sanitizeWorkshop(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 📖 GET BY ARTISAN
// =============================
export const getWorkshopsByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(`${WORKSHOP_QUERY} WHERE w.Artisan_id = ? ORDER BY w.WorkshopDate ASC`, [artisanId]);
    return res.status(200).json({ ok: true, data: { workshops: rows.map(sanitizeWorkshop) } });
  } catch (err) { next(err); }
};

// =============================
// ➕ CREATE WORKSHOP
// =============================
export const createWorkshop = async (req, res, next) => {
  try {
    const { artisan_id, title, description, workshopDate, duration, price, category, maxParticipants, status } = req.body;

    if (!artisan_id || !title) {
      return res.status(400).json({ ok: false, message: "artisan_id and title are required." });
    }

    const [result] = await pool.query(
      `INSERT INTO Workshop (Artisan_id, Title, Description, WorkshopDate, Duration, Price, Category, MaxParticipants, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [artisan_id, title, description || null, workshopDate || null, duration || null, price || 0, category || null, maxParticipants || 20, status || 'Upcoming']
    );

    const [rows] = await pool.query(`${WORKSHOP_QUERY} WHERE w.Workshop_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { workshop: sanitizeWorkshop(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// ✏️ UPDATE WORKSHOP
// =============================
export const updateWorkshop = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { title, description, workshopDate, duration, price, category, maxParticipants, status } = req.body;

    const [existing] = await pool.query("SELECT * FROM Workshop WHERE Workshop_id = ?", [id]);
    if (!existing.length) return res.status(404).json({ ok: false, message: "Workshop not found." });

    await pool.query(
      `UPDATE Workshop SET 
        Title=COALESCE(?,Title),
        Description=COALESCE(?,Description),
        WorkshopDate=COALESCE(?,WorkshopDate),
        Duration=COALESCE(?,Duration),
        Price=COALESCE(?,Price),
        Category=COALESCE(?,Category),
        MaxParticipants=COALESCE(?,MaxParticipants),
        Status=COALESCE(?,Status)
       WHERE Workshop_id=?`,
      [title, description, workshopDate, duration, price, category, maxParticipants, status, id]
    );

    const [rows] = await pool.query(`${WORKSHOP_QUERY} WHERE w.Workshop_id = ?`, [id]);
    return res.status(200).json({ ok: true, data: { workshop: sanitizeWorkshop(rows[0]) } });
  } catch (err) { next(err); }
};

// =============================
// 🗑️ DELETE WORKSHOP
// =============================
export const deleteWorkshop = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Workshop WHERE Workshop_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Workshop not found." });

    return res.status(200).json({ ok: true, message: "Workshop deleted successfully." });
  } catch (err) { next(err); }
};
