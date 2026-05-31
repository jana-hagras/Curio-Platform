import pool from "../../db/connection.js";
import { runAIPipeline, regenerateForRequest } from "./aiGeneration.service.js";

// ══════════════════════════════════════════════════════════════
//  Request Service — with AI Generation Pipeline
// ══════════════════════════════════════════════════════════════

const sanitizeRequest = (row, { includeEnhancedPrompt = false } = {}) => {
  if (!row) return null;
  const result = {
    id: row.Request_id,
    buyer_id: row.Buyer_id,
    title: row.Title,
    description: row.Description,
    requestDate: row.Request_Date,
    budget: row.Budget,
    model3D: row["3D_Model"],
    category: row.Category,
    status: row.Status || "Open",
    buyerName: row.FName ? `${row.FName} ${row.LName}` : null,
  };

  // EnhancedPrompt is internal — only include for admin
  if (includeEnhancedPrompt) {
    result.enhancedPrompt = row.EnhancedPrompt || null;
  }

  return result;
};

const REQ_QUERY = `
  SELECT r.*, u.FName, u.LName
  FROM Request r
  LEFT JOIN Buyer b ON r.Buyer_id = b.Buyer_id
  LEFT JOIN user u ON b.Buyer_id = u.User_id
`;

// Helper: Attach AI generation images to requests
const attachAIImages = async (requests) => {
  if (!requests.length) return requests;

  const requestIds = requests.map((r) => r.id);
  const [generations] = await pool.query(
    "SELECT Request_id, Generation_id, GeneratedImageUrl, GenerationStatus, ErrorMessage, CreatedAt, CompletedAt, MeshyTaskId FROM RequestAIGeneration WHERE Request_id IN (?) ORDER BY CreatedAt DESC",
    [requestIds]
  );

  const genMap = {};
  for (const gen of generations) {
    if (!genMap[gen.Request_id]) genMap[gen.Request_id] = [];
    genMap[gen.Request_id].push({
      id: gen.Generation_id,
      imageUrl: gen.GeneratedImageUrl,
      status: gen.GenerationStatus,
      error: gen.ErrorMessage,
      createdAt: gen.CreatedAt,
      completedAt: gen.CompletedAt,
      meshyTaskId: gen.MeshyTaskId,
    });
  }

  return requests.map((r) => ({
    ...r,
    aiImages: (genMap[r.id] || []).filter((g) => g.imageUrl && g.status === "Completed").map((g) => g.imageUrl),
    aiGenerations: genMap[r.id] || [],
    aiStatus: getOverallAIStatus(genMap[r.id] || []),
  }));
};

// Derive overall AI status from generation records
const getOverallAIStatus = (generations) => {
  if (!generations.length) return "None";
  const hasCompleted = generations.some((g) => g.status === "Completed");
  const hasPending = generations.some((g) => g.status === "Pending" || g.status === "Processing");
  const hasFailed = generations.some((g) => g.status === "Failed");

  if (hasCompleted) return "Completed";
  if (hasPending) return "Processing";
  if (hasFailed) return "Failed";
  return "Pending";
};

// =============================
// 🔍 SEARCH REQUESTS
// =============================
export const searchRequests = async (req, res, next) => {
  try {
    const value = req.query.value;

    if (!value) {
      return res.status(400).json({
        ok: false,
        message: "Search value is required",
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
        OR r.Status LIKE ?
        OR u.FName LIKE ?
        OR u.LName LIKE ?
    `;

    const values = Array(11).fill(searchValue);

    const [rows] = await pool.query(query, values);
    const requests = rows.map((r) => sanitizeRequest(r));
    const enriched = await attachAIImages(requests);

    return res.status(200).json({
      ok: true,
      data: { requests: enriched },
    });
  } catch (err) {
    next(err);
  }
};

// CREATE — with async AI pipeline
export const createRequest = async (req, res, next) => {
  try {
    const { buyer_id, title, description, budget, model3D, category } = req.body;
    if (!buyer_id || !title) {
      return res.status(400).json({ ok: false, message: "buyer_id and title are required." });
    }
    if (budget !== undefined && budget !== null && Number(budget) < 1) {
      return res.status(400).json({ ok: false, message: "Budget must be at least $1 USD." });
    }

    // Save request FIRST — never lose the request due to AI failures
    const [result] = await pool.query(
      "INSERT INTO Request (Buyer_id, Title, Description, Request_Date, Budget, `3D_Model`, Category, Status) VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?, 'Open')",
      [buyer_id, title, description || null, budget || null, model3D || null, category || null]
    );

    const requestId = result.insertId;

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Request_id = ?`, [requestId]);
    const request = sanitizeRequest(rows[0]);

    // 🚀 Fire AI pipeline ASYNCHRONOUSLY — do NOT await
    // The request is already saved, AI runs in background
    if (description && description.trim().length > 0) {
      runAIPipeline(requestId, `${title}. ${description}`, category).catch((err) => {
        console.error(`[AI Pipeline] Background error for request #${requestId}:`, err.message);
      });
    }

    return res.status(201).json({
      ok: true,
      data: { request: { ...request, aiImages: [], aiGenerations: [], aiStatus: description ? "Processing" : "None" } },
    });
  } catch (err) {
    next(err);
  }
};

// READ ALL
export const getAllRequests = async (req, res, next) => {
  try {
    const [rows] = await pool.query(REQ_QUERY);
    const requests = rows.map((r) => sanitizeRequest(r));
    const enriched = await attachAIImages(requests);
    return res.status(200).json({ ok: true, data: { requests: enriched } });
  } catch (err) {
    next(err);
  }
};

// READ BY ID
export const getRequestById = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Request_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Request not found." });

    const request = sanitizeRequest(rows[0]);
    const enriched = await attachAIImages([request]);
    return res.status(200).json({ ok: true, data: { request: enriched[0] } });
  } catch (err) {
    next(err);
  }
};

// READ BY ID — Admin (includes EnhancedPrompt)
export const getRequestByIdAdmin = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Request_id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Request not found." });

    const request = sanitizeRequest(rows[0], { includeEnhancedPrompt: true });
    const enriched = await attachAIImages([request]);
    return res.status(200).json({ ok: true, data: { request: enriched[0] } });
  } catch (err) {
    next(err);
  }
};

// READ BY BUYER
export const getRequestsByBuyer = async (req, res, next) => {
  try {
    const buyerId = Number(req.query.buyer_id);
    if (!buyerId) return res.status(400).json({ ok: false, message: "Query parameter 'buyer_id' is required." });

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Buyer_id = ?`, [buyerId]);
    const requests = rows.map((r) => sanitizeRequest(r));
    const enriched = await attachAIImages(requests);
    return res.status(200).json({ ok: true, data: { requests: enriched } });
  } catch (err) {
    next(err);
  }
};

// UPDATE
export const updateRequest = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { title, description, budget, model3D, category, status } = req.body;
    if (budget !== undefined && budget !== null && Number(budget) < 1) {
      return res.status(400).json({ ok: false, message: "Budget must be at least $1 USD." });
    }
    await pool.query(
      "UPDATE Request SET Title=COALESCE(?,Title), Description=COALESCE(?,Description), Budget=COALESCE(?,Budget), `3D_Model`=COALESCE(?,`3D_Model`), Category=COALESCE(?,Category), Status=COALESCE(?,Status) WHERE Request_id=?",
      [title, description, budget, model3D, category, status, id]
    );
    return getRequestById(req, res, next);
  } catch (err) {
    next(err);
  }
};

// DELETE
export const deleteRequest = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM Request WHERE Request_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Request not found." });

    return res.status(200).json({ ok: true, message: "Request deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// =============================
// 🤖 AI GENERATION ENDPOINTS
// =============================

// GET generations for a request
export const getGenerationsByRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.query.request_id);
    if (!requestId) return res.status(400).json({ ok: false, message: "Query parameter 'request_id' is required." });

    const [rows] = await pool.query(
      "SELECT * FROM RequestAIGeneration WHERE Request_id = ? ORDER BY CreatedAt DESC",
      [requestId]
    );

    return res.status(200).json({
      ok: true,
      data: {
        generations: rows.map((g) => ({
          id: g.Generation_id,
          requestId: g.Request_id,
          meshyTaskId: g.MeshyTaskId,
          imageUrl: g.GeneratedImageUrl,
          status: g.GenerationStatus,
          error: g.ErrorMessage,
          createdAt: g.CreatedAt,
          completedAt: g.CompletedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST regenerate AI for a request
export const regenerateAI = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const result = await regenerateForRequest(id);
    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
};
