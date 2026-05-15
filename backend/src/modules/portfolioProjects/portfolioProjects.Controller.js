import { Router } from "express";
import * as Portfolio from "./portfolioProjects.Service.js";

const router = Router();

router.get("/search", Portfolio.searchProjects);
router.post("/", Portfolio.createProject);     // Create
router.get("/all", Portfolio.getAllProjects);  // Get all projects
router.get("/artisan", Portfolio.getProjectsByArtisan); // Get by artisan
router.get("/", Portfolio.getProjectById);     // Get single project by ?id
router.put("/", Portfolio.updateProject);      // Update project by ?id
router.delete("/", Portfolio.deleteProject);   // Delete project by ?id

export default router;