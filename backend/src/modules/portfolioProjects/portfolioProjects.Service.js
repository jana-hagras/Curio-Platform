// portfolioProjects.Service.js
import pool from "../../db/connection.js";

// sanitize project
const sanitizeProject = (row) => {
  if (!row) return null;
  return {
    id: row.Project_id,
    projectName: row.ProjectName,
    description: row.Description,
    artisan_id: row.Artisan_id,
    artisanName: row.FName ? `${row.FName} ${row.LName}` : null,
  };
};

const PROJ_QUERY = `
  SELECT p.*, u.FName, u.LName
  FROM PortfolioProjects p
  LEFT JOIN Artisan a ON p.Artisan_id = a.Artisan_id
  LEFT JOIN user u ON a.Artisan_id = u.User_id
`;

// =============================
// 🔍 SEARCH PROJECTS
// =============================
export const searchProjects = async (req, res, next) => {
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
      ${PROJ_QUERY}
      WHERE 
        p.Project_id LIKE ?
        OR p.ProjectName LIKE ?
        OR p.Description LIKE ?
        OR p.Artisan_id LIKE ?
        OR u.FName LIKE ?
        OR u.LName LIKE ?
    `;

    const values = Array(6).fill(searchValue);

    const [rows] = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      data: {
        projects: rows.map(sanitizeProject)
      }
    });

  } catch (err) {
    next(err);
  }
};

// CREATE
export const createProject = async (req, res, next) => {
  try {
    const { projectName, description, artisan_id } = req.body;

    if (!projectName || !artisan_id) {
      return res
        .status(400)
        .json({ ok: false, message: "ProjectName and artisan_id are required." });
    }

    // Insert project
    const [result] = await pool.query(
      "INSERT INTO PortfolioProjects (ProjectName, Description, Artisan_id) VALUES (?, ?, ?)",
      [projectName, description || null, artisan_id]
    );

    // Select project with artisan name from user table
    const [rows] = await pool.query(
      `
      SELECT p.*, u.FName, u.LName
      FROM PortfolioProjects p
      LEFT JOIN Artisan a ON p.Artisan_id = a.Artisan_id
      LEFT JOIN user u ON a.Artisan_id = u.User_id
      WHERE p.Project_id = ?
      `,
      [result.insertId]
    );

    if (!rows.length) {
      return res.status(201).json({
        ok: true,
        message: "Project created but artisan name not found.",
        data: { project: { id: result.insertId, projectName, description, artisan_id } },
      });
    }

    return res.status(201).json({ ok: true, data: { project: sanitizeProject(rows[0]) } });
  } catch (err) {
    next(err);
  }
};

// READ ALL
export const getAllProjects = async (req, res, next) => {
  try {
    const query = `
      SELECT p.*, u.FName, u.LName
      FROM PortfolioProjects p
      LEFT JOIN Artisan a ON p.Artisan_id = a.Artisan_id
      LEFT JOIN user u ON a.Artisan_id = u.User_id
    `;
    const [rows] = await pool.query(query);
    return res.status(200).json({ ok: true, data: { projects: rows.map(sanitizeProject) } });
  } catch (err) {
    next(err);
  }
};

// READ BY ARTISAN
export const getProjectsByArtisan = async (req, res, next) => {
  try {
    const artisanId = Number(req.query.artisan_id);
    if (!artisanId) return res.status(400).json({ ok: false, message: "Query parameter 'artisan_id' is required." });

    const [rows] = await pool.query(`${PROJ_QUERY} WHERE p.Artisan_id = ?`, [artisanId]);
    return res.status(200).json({ ok: true, data: { projects: rows.map(sanitizeProject) } });
  } catch (err) {
    next(err);
  }
};

// READ ONE
export const getProjectById = async (req, res, next) => {
  try {
    const projectId = Number(req.query.id);
    if (!projectId)
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const query = `
      SELECT p.*, u.FName, u.LName
      FROM PortfolioProjects p
      LEFT JOIN Artisan a ON p.Artisan_id = a.Artisan_id
      LEFT JOIN user u ON a.Artisan_id = u.User_id
      WHERE p.Project_id = ?
    `;
    const [rows] = await pool.query(query, [projectId]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Project not found." });

    return res.status(200).json({ ok: true, data: { project: sanitizeProject(rows[0]) } });
  } catch (err) {
    next(err);
  }
};

// UPDATE
export const updateProject = async (req, res, next) => {
  try {
    const projectId = Number(req.query.id);
    if (!projectId)
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const { projectName, description, artisan_id } = req.body;

    await pool.query(
      "UPDATE PortfolioProjects SET ProjectName=COALESCE(?, ProjectName), Description=COALESCE(?, Description), Artisan_id=COALESCE(?, Artisan_id) WHERE Project_id=?",
      [projectName ?? null, description ?? null, artisan_id ?? null, projectId]
    );

    return getProjectById(req, res, next);
  } catch (err) {
    next(err);
  }
};

// DELETE
export const deleteProject = async (req, res, next) => {
  try {
    const projectId = Number(req.query.id);
    if (!projectId)
      return res.status(400).json({ ok: false, message: "Query parameter 'id' is required." });

    const [result] = await pool.query("DELETE FROM PortfolioProjects WHERE Project_id = ?", [projectId]);
    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, message: "Project not found." });

    return res.status(200).json({ ok: true, message: "Project deleted successfully." });
  } catch (err) {
    next(err);
  }
};