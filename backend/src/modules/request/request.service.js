import pool from "../../db/connection.js";

const sanitizeRequest = (row) => {
  if (!row) return null;
  return {
    id: row.Request_id,
    buyer_id: row.Buyer_id,
    title: row.Title,
    description: row.Description,
    requestDate: row.Request_Date,
    budget: row.Budget,
    model3D: row["3D_Model"],
    category: row.Category,
    buyerName: row.FName ? `${row.FName} ${row.LName}` : null,
  };
};

const REQ_QUERY = `
  SELECT r.*, u.FName, u.LName
  FROM Request r
  LEFT JOIN Buyer b ON r.Buyer_id = b.Buyer_id
  LEFT JOIN user u ON b.Buyer_id = u.User_id
`;

// =============================
// 🔍 SEARCH REQUESTS
// =============================
export const searchRequests = async (req, res, next) => {
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
      ${REQ_QUERY}
      WHERE 
        r.Request_id LIKE ?
        OR r.Buyer_id LIKE ?
        OR r.Title LIKE ?
        OR r.Description LIKE ?
        OR r.Request_Date LIKE ?
        OR r.Budget LIKE ?
        OR r.\`3D_Model\` LIKE ?
        OR r.Category LIKE ?
        OR u.FName LIKE ?
        OR u.LName LIKE ?
    `;

    const values = Array(10).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        requests: rows.map(sanitizeRequest)
      }
    });

  } catch (err) {
    next(err);
  }
};

// CREATE
export const createRequest = async (req, res, next) => {
  try {
    const { buyer_id, title, description, budget, model3D, category } = req.body;
    if (!buyer_id || !title) {
      return res.status(400).json({ ok: false, message: "buyer_id and title are required." });
    }
    if (budget !== undefined && budget !== null && Number(budget) < 1) {
      return res.status(400).json({ ok: false, message: "Budget must be at least $1 USD." });
    }

    const [result] = await pool.query(
      "INSERT INTO Request (Buyer_id, Title, Description, Request_Date, Budget, `3D_Model`, Category) VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?)",
      [buyer_id, title, description || null, budget || null, model3D || null, category || null]
    );

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Request_id = ?`, [result.insertId]);
    return res.status(201).json({ ok: true, data: { request: sanitizeRequest(rows[0]) } });
  } catch (err) { next(err); }
};

// READ ALL
export const getAllRequests = async (req, res, next) => {
  try {
    const [rows] = await pool.query(REQ_QUERY);
    return res.status(200).json({ ok: true, data: { requests: rows.map(sanitizeRequest) } });
  } catch (err) { next(err); }
};

// READ BY ID
export const getRequestById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Request_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Request not found." });

    return res.status(200).json({ ok: true, data: { request: sanitizeRequest(rows[0]) } });
  } catch (err) { next(err); }
};

// READ BY BUYER
export const getRequestsByBuyer = async (req, res, next) => {
  try {
    const buyerId = Number(req.query.buyer_id);
    if (!buyerId) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Buyer_id = ?`, [buyerId]);
    return res.status(200).json({ ok: true, data: { requests: rows.map(sanitizeRequest) } });
  } catch (err) { next(err); }
};

// UPDATE
export const updateRequest = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { title, description, budget, model3D, category } = req.body;
    if (budget !== undefined && budget !== null && Number(budget) < 1) {
      return res.status(400).json({ ok: false, message: "Budget must be at least $1 USD." });
    }
    await pool.query(
      "UPDATE Request SET Title=COALESCE(?,Title), Description=COALESCE(?,Description), Budget=COALESCE(?,Budget), `3D_Model`=COALESCE(?,`3D_Model`), Category=COALESCE(?,Category) WHERE Request_id=?",
      [title, description, budget, model3D, category, id]
    );
    return getRequestById(req, res, next);
  } catch (err) { next(err); }
};

// DELETE
export const deleteRequest = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Request WHERE Request_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Request not found." });

    return res.status(200).json({ ok: true, message: "Request deleted successfully." });
  } catch (err) { next(err); }
};
