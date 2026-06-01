import express from "express";
import pool from "../../db/connection.js";
import { getAssistantResponse, getKnowledge, updateKnowledge } from "./assistant.service.js";
import { extractUser } from "../../middleware/auth.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.type !== 'Admin') {
    return res.status(403).json({ ok: false, message: "Forbidden. Admin access required." });
  }
  next();
};

/**
 * POST /assistant/chat
 * Public/authenticated chatbot endpoint.
 */
router.post("/chat", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ ok: false, message: "Message is required" });
    }

    const userId = Number(req.headers['x-user-id']);
    let role = "Guest";
    let authenticatedUserId = null;

    if (userId && !isNaN(userId)) {
      const [rows] = await pool.query("SELECT User_id, Type FROM user WHERE User_id = ?", [userId]);
      if (rows.length > 0) {
        role = rows[0].Type;
        authenticatedUserId = rows[0].User_id;
      }
    }

    const reply = await getAssistantResponse(message, role, authenticatedUserId);
    return res.json({ ok: true, reply });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /assistant/knowledge
 * Access configurable chatbot FAQs and instructions.
 */
router.get("/knowledge", extractUser, requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ ok: false, message: "Query parameter 'key' is required" });
    }
    const content = await getKnowledge(key);
    return res.json({ ok: true, key, content });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /assistant/knowledge
 * Update configurable chatbot FAQs and instructions.
 */
router.put("/knowledge", extractUser, requireAdmin, async (req, res, next) => {
  try {
    const { key, content } = req.body;
    if (!key || content === undefined) {
      return res.status(400).json({ ok: false, message: "key and content are required in body" });
    }
    await updateKnowledge(key, content);
    return res.json({ ok: true, message: `Updated knowledge for ${key}` });
  } catch (err) {
    next(err);
  }
});

export default router;
