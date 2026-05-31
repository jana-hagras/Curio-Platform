import pool from "../../db/connection.js";
import { runAIPipeline, regenerateForRequest, refineAndRegenerate } from "./aiGeneration.service.js";

// ══════════════════════════════════════════════════════════════
//  Request Service — with AI Generation Pipeline + Versioning
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
    category: row.Category,
    status: row.Status || "Open",
    buyerName: row.FName ? `${row.FName} ${row.LName}` : null,
    imageSourceType: row.ImageSourceType || "AI",
    uploadedImageUrl: row.UploadedImageUrl || null,
    finalGenerationId: row.FinalGeneration_id || null,
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

// Helper: Attach AI generation images to requests (with version info)
const attachAIImages = async (requests) => {
  if (!requests.length) return requests;

  const requestIds = requests.map((r) => r.id);
  const [generations] = await pool.query(
    "SELECT Request_id, Generation_id, GeneratedImageUrl, ModelGlbUrl, GenerationStatus, ErrorMessage, CreatedAt, CompletedAt, MeshyTaskId, VersionNumber, RefinementPrompt, EnhancedPrompt, IsPreferred FROM RequestAIGeneration WHERE Request_id IN (?) ORDER BY VersionNumber ASC, CreatedAt ASC",
    [requestIds]
  );

  const genMap = {};
  for (const gen of generations) {
    if (!genMap[gen.Request_id]) genMap[gen.Request_id] = [];
    genMap[gen.Request_id].push({
      id: gen.Generation_id,
      imageUrl: gen.GeneratedImageUrl,
      modelGlbUrl: gen.ModelGlbUrl || null,
      status: gen.GenerationStatus,
      error: gen.ErrorMessage,
      createdAt: gen.CreatedAt,
      completedAt: gen.CompletedAt,
      meshyTaskId: gen.MeshyTaskId,
      versionNumber: gen.VersionNumber || 1,
      refinementPrompt: gen.RefinementPrompt || null,
      enhancedPrompt: gen.EnhancedPrompt || null,
      isPreferred: !!gen.IsPreferred,
    });
  }

  return requests.map((r) => {
    const gens = genMap[r.id] || [];
    const completedGens = gens.filter((g) => g.imageUrl && g.status === "Completed");

    // Find the preferred image and GLB model
    let preferredImage = null;
    let preferredModelGlbUrl = null;
    if (r.imageSourceType === 'Upload') {
      preferredImage = r.uploadedImageUrl;
    } else if (r.finalGenerationId) {
      const finalGen = completedGens.find((g) => g.id === r.finalGenerationId);
      preferredImage = finalGen ? finalGen.imageUrl : null;
      preferredModelGlbUrl = finalGen ? finalGen.modelGlbUrl : null;
    } else {
      const preferredGen = completedGens.find((g) => g.isPreferred);
      preferredImage = preferredGen?.imageUrl || null;
      preferredModelGlbUrl = preferredGen?.modelGlbUrl || null;
    }

    // Count unique versions
    const versionCount = new Set(gens.map((g) => g.versionNumber)).size;

    return {
      ...r,
      aiImages: completedGens.map((g) => g.imageUrl),
      aiGenerations: gens,
      aiStatus: r.imageSourceType === 'Upload' ? 'None' : getOverallAIStatus(gens),
      preferredImage,
      preferredModelGlbUrl,
      versionCount,
    };
  });
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
    const { buyer_id, title, description, budget, category, imageSourceType, uploadedImageUrl } = req.body;
    if (!buyer_id || !title) {
      return res.status(400).json({ ok: false, message: "buyer_id and title are required." });
    }
    if (budget !== undefined && budget !== null && Number(budget) < 1) {
      return res.status(400).json({ ok: false, message: "Budget must be at least $1 USD." });
    }

    // Save request FIRST — never lose the request due to AI failures
    const [result] = await pool.query(
      "INSERT INTO Request (Buyer_id, Title, Description, Request_Date, Budget, Category, Status, ImageSourceType, UploadedImageUrl) VALUES (?, ?, ?, CURRENT_DATE, ?, ?, 'Open', ?, ?)",
      [buyer_id, title, description || null, budget || null, category || null, imageSourceType || 'AI', uploadedImageUrl || null]
    );

    const requestId = result.insertId;

    const [rows] = await pool.query(`${REQ_QUERY} WHERE r.Request_id = ?`, [requestId]);
    const request = sanitizeRequest(rows[0]);

    // 🚀 Fire AI pipeline ASYNCHRONOUSLY — only if ImageSourceType is 'AI'
    const shouldRunAI = (imageSourceType || 'AI') === 'AI';
    if (shouldRunAI && description && description.trim().length > 0) {
      runAIPipeline(requestId, `${title}. ${description}`, category).catch((err) => {
        console.error(`[AI Pipeline] Background error for request #${requestId}:`, err.message);
      });
    }

    return res.status(201).json({
      ok: true,
      data: { request: { ...request, aiImages: [], aiGenerations: [], aiStatus: shouldRunAI && description ? "Processing" : "None", preferredImage: (imageSourceType === 'Upload') ? uploadedImageUrl : null, versionCount: 0 } },
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
      "SELECT * FROM RequestAIGeneration WHERE Request_id = ? ORDER BY VersionNumber ASC, CreatedAt ASC",
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
          versionNumber: g.VersionNumber || 1,
          refinementPrompt: g.RefinementPrompt || null,
          enhancedPrompt: g.EnhancedPrompt || null,
          isPreferred: !!g.IsPreferred,
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

    const [reqRows] = await pool.query(
      "SELECT FinalGeneration_id, ImageSourceType FROM Request WHERE Request_id = ?",
      [id]
    );
    if (!reqRows.length) return res.status(404).json({ ok: false, message: "Request not found." });

    const request = reqRows[0];
    if (request.ImageSourceType === 'Upload') {
      return res.status(400).json({ ok: false, message: "AI generation is disabled for reference image uploads." });
    }
    if (request.FinalGeneration_id) {
      return res.status(400).json({ ok: false, message: "Further regenerations or refinements are disabled once a final design is selected." });
    }

    const result = await regenerateForRequest(id);
    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
};

// =============================
// 🎨 AI REFINEMENT ENDPOINTS
// =============================

// POST refine + regenerate for a request
export const refineRequest = async (req, res, next) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { refinementPrompt } = req.body;
    if (!refinementPrompt || !refinementPrompt.trim()) {
      return res.status(400).json({ ok: false, message: "refinementPrompt is required." });
    }

    const [reqRows] = await pool.query(
      "SELECT FinalGeneration_id, ImageSourceType FROM Request WHERE Request_id = ?",
      [id]
    );
    if (!reqRows.length) return res.status(404).json({ ok: false, message: "Request not found." });

    const request = reqRows[0];
    if (request.ImageSourceType === 'Upload') {
      return res.status(400).json({ ok: false, message: "AI generation is disabled for reference image uploads." });
    }
    if (request.FinalGeneration_id) {
      return res.status(400).json({ ok: false, message: "Further regenerations or refinements are disabled once a final design is selected." });
    }

    // Fire refinement pipeline asynchronously
    refineAndRegenerate(id, refinementPrompt.trim()).catch((err) => {
      console.error(`[AI Pipeline] Background refinement error for request #${id}:`, err.message);
    });

    return res.status(200).json({
      ok: true,
      message: "Refinement started. New version will appear shortly.",
    });
  } catch (err) {
    next(err);
  }
};

// GET all versions for a request (grouped by version number)
export const getVersionsByRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.query.request_id);
    if (!requestId) return res.status(400).json({ ok: false, message: "Query parameter 'request_id' is required." });

    const [rows] = await pool.query(
      "SELECT * FROM RequestAIGeneration WHERE Request_id = ? ORDER BY VersionNumber ASC, Generation_id ASC",
      [requestId]
    );

    // Group by version number
    const versionsMap = {};
    for (const row of rows) {
      const vn = row.VersionNumber || 1;
      if (!versionsMap[vn]) {
        versionsMap[vn] = {
          versionNumber: vn,
          refinementPrompt: row.RefinementPrompt || null,
          enhancedPrompt: row.EnhancedPrompt || null,
          isPreferred: !!row.IsPreferred,
          status: row.GenerationStatus,
          createdAt: row.CreatedAt,
          completedAt: row.CompletedAt,
          images: [],
          modelGlbUrl: row.ModelGlbUrl || null,
          generations: [],
        };
      }

      // If any generation in this version is preferred, mark the version
      if (row.IsPreferred) versionsMap[vn].isPreferred = true;

      versionsMap[vn].generations.push({
        id: row.Generation_id,
        imageUrl: row.GeneratedImageUrl,
        modelGlbUrl: row.ModelGlbUrl || null,
        status: row.GenerationStatus,
        error: row.ErrorMessage,
        meshyTaskId: row.MeshyTaskId,
        createdAt: row.CreatedAt,
        completedAt: row.CompletedAt,
        isPreferred: !!row.IsPreferred,
      });

      if (row.ModelGlbUrl && row.GenerationStatus === "Completed") {
        versionsMap[vn].modelGlbUrl = row.ModelGlbUrl;
      }

      if (row.GeneratedImageUrl && row.GenerationStatus === "Completed") {
        versionsMap[vn].images.push(row.GeneratedImageUrl);
      }

      // Use the worst status in the version
      if (row.GenerationStatus === "Failed") versionsMap[vn].status = "Failed";
      else if (row.GenerationStatus === "Processing" && versionsMap[vn].status !== "Failed") versionsMap[vn].status = "Processing";
      else if (row.GenerationStatus === "Pending" && versionsMap[vn].status !== "Failed" && versionsMap[vn].status !== "Processing") versionsMap[vn].status = "Pending";
    }

    const versions = Object.values(versionsMap);

    return res.status(200).json({
      ok: true,
      data: { versions },
    });
  } catch (err) {
    next(err);
  }
};

// PUT set a version as preferred (unsets others for the same request)
export const setPreferredVersion = async (req, res, next) => {
  try {
    const generationId = Number(req.query.generation_id);
    if (!generationId) return res.status(400).json({ ok: false, message: "Query parameter 'generation_id' is required." });

    // Find the request this generation belongs to
    const [genRows] = await pool.query(
      "SELECT Request_id, VersionNumber FROM RequestAIGeneration WHERE Generation_id = ?",
      [generationId]
    );
    if (!genRows.length) return res.status(404).json({ ok: false, message: "Generation not found." });

    const requestId = genRows[0].Request_id;
    const versionNumber = genRows[0].VersionNumber;

    // Check if final design is selected
    const [reqRows] = await pool.query(
      "SELECT FinalGeneration_id FROM Request WHERE Request_id = ?",
      [requestId]
    );
    if (reqRows[0]?.FinalGeneration_id) {
      return res.status(400).json({ ok: false, message: "Cannot change preferred version after a final design has been selected." });
    }

    // Unset all preferred flags for this request
    await pool.query(
      "UPDATE RequestAIGeneration SET IsPreferred = FALSE WHERE Request_id = ?",
      [requestId]
    );

    // Set preferred for all generations in this version (since a version may have multiple images)
    await pool.query(
      "UPDATE RequestAIGeneration SET IsPreferred = TRUE WHERE Request_id = ? AND VersionNumber = ?",
      [requestId, versionNumber]
    );

    return res.status(200).json({
      ok: true,
      message: `Version ${versionNumber} set as preferred.`,
      data: { requestId, versionNumber },
    });
  } catch (err) {
    next(err);
  }
};

// PUT select a version as final design
export const selectFinalDesign = async (req, res, next) => {
  try {
    const generationId = Number(req.query.generation_id);
    if (!generationId) return res.status(400).json({ ok: false, message: "Query parameter 'generation_id' is required." });

    // Find the generation record
    const [genRows] = await pool.query(
      "SELECT Request_id, VersionNumber FROM RequestAIGeneration WHERE Generation_id = ?",
      [generationId]
    );
    if (!genRows.length) return res.status(404).json({ ok: false, message: "Generation not found." });

    const requestId = genRows[0].Request_id;
    const versionNumber = genRows[0].VersionNumber;

    // Verify request exists and does not already have a final design
    const [reqRows] = await pool.query(
      "SELECT FinalGeneration_id FROM Request WHERE Request_id = ?",
      [requestId]
    );
    if (!reqRows.length) return res.status(404).json({ ok: false, message: "Request not found." });

    if (reqRows[0].FinalGeneration_id) {
      return res.status(400).json({ ok: false, message: "A final design has already been selected for this request." });
    }

    // Set FinalGeneration_id on the Request
    await pool.query(
      "UPDATE Request SET FinalGeneration_id = ? WHERE Request_id = ?",
      [generationId, requestId]
    );

    // Set IsPreferred = TRUE for the selected version's generations, and FALSE for all others
    await pool.query(
      "UPDATE RequestAIGeneration SET IsPreferred = FALSE WHERE Request_id = ?",
      [requestId]
    );
    await pool.query(
      "UPDATE RequestAIGeneration SET IsPreferred = TRUE WHERE Request_id = ? AND VersionNumber = ?",
      [requestId, versionNumber]
    );

    return res.status(200).json({
      ok: true,
      message: `Version ${versionNumber} selected as the final design.`,
      data: { requestId, generationId, versionNumber },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Proxy GLB files from Meshy CDN to bypass CORS policy blocks in the browser.
 */
export const proxy3DModel = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ ok: false, message: "URL parameter is required." });
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ ok: false, message: "Invalid URL protocol." });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch 3D model: ${response.statusText}`);
    }

    res.setHeader("Content-Type", response.headers.get("Content-Type") || "model/gltf-binary");
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

