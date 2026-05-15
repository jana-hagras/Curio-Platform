import pool from "../../db/connection.js";

// sanitize gallery row
const sanitizeGallery = (row) => {
  if (!row) return null;
  return {
    Image_id: row.Image_id,
    project_id: row.Project_id,
    Image: row.Image,
    Caption: row.Caption
  };
};

// =============================
// 🔍 SEARCH GALLERY
// =============================
export const searchGallery = async (req, res, next) => {
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
      SELECT * FROM Gallery
      WHERE 
        Image_id LIKE ?
        OR Project_id LIKE ?
        OR Image LIKE ?
        OR Caption LIKE ?
    `;

    const values = Array(4).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        gallery: rows.map(sanitizeGallery)
      }
    });

  } catch (err) {
    next(err);
  }
};

// CREATE IMAGE
export const createGallery = async (req, res, next) => {
  try {
    const { project_id, Image, Caption } = req.body || {};

    if (!project_id || !Image) {
      return res.status(400).json({
        ok: false,
        message: "project_id and Image are required."
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Gallery (Project_id, Image, Caption) VALUES (?, ?, ?)",
      [project_id, Image, Caption || null]
    );

    const [rows] = await pool.query(
      "SELECT * FROM Gallery WHERE Image_id = ?",
      [result.insertId]
    );

    return res.status(201).json({
      ok: true,
      data: sanitizeGallery(rows[0])
    });

  } catch (err) {
    next(err);
  }
};

// GET ALL IMAGES
export const getAllImages = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Gallery");
    return res.status(200).json({
      ok: true,
      data: rows.map(sanitizeGallery)
    });
  } catch (err) {
    next(err);
  }
};

// GET IMAGES BY PROJECT
export const getGalleryByProject = async (req, res, next) => {
  try {
    const project_id = Number(req.query.id);
    if (!project_id) {
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });
    }

    const [rows] = await pool.query(
      "SELECT * FROM Gallery WHERE Project_id = ?",
      [project_id]
    );

    return res.status(200).json({
      ok: true,
      data: { gallery: rows.map(sanitizeGallery) }
    });

  } catch (err) {
    next(err);
  }
};

// UPDATE IMAGE
export const updateGallery = async (req, res, next) => {
  try {
    const Image_id = Number(req.query.id);
    if (!Image_id) {
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });
    }

    const { Image, Caption } = req.body || {};

    await pool.query(
      `UPDATE Gallery
       SET Image = COALESCE(?, Image),
           Caption = COALESCE(?, Caption)
       WHERE Image_id = ?`,
      [Image ?? null, Caption ?? null, Image_id]
    );

    const [rows] = await pool.query(
      "SELECT * FROM Gallery WHERE Image_id = ?",
      [Image_id]
    );

    return res.status(200).json({ ok: true, data: sanitizeGallery(rows[0]) });

  } catch (err) {
    next(err);
  }
};

// DELETE IMAGE
export const deleteGallery = async (req, res, next) => {
  try {
    const Image_id = Number(req.query.id);
    if (!Image_id) {
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });
    }

    const [result] = await pool.query(
      "DELETE FROM Gallery WHERE Image_id = ?",
      [Image_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "Image not found." });
    }

    return res.status(200).json({ ok: true, message: "Image deleted successfully." });

  } catch (err) {
    next(err);
  }
};