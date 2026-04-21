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
    artisanName: row.FName ? `${row.FName} ${row.LName}` : null,
  };
};

const APP_QUERY = `
  SELECT ap.*, u.FName, u.LName
  FROM Application ap
  LEFT JOIN Artisan a ON ap.Artisan_id = a.Artisan_id
  LEFT JOIN user u ON a.Artisan_id = u.User_id
`;


// SEARCH APPLICATIONS 

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
        OR u.FName LIKE ?
        OR u.LName LIKE ?
    `;

    const values = Array(8).fill(searchValue);

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

// UPDATE
export const updateApplication = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { proposal, status } = req.body;
    await pool.query(
      "UPDATE Application SET Proposal=COALESCE(?,Proposal), Status=COALESCE(?,Status) WHERE Application_id=?",
      [proposal, status, id]
    );
    return getApplicationById(req, res, next);
  } catch (err) { next(err); }
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
