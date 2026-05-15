import { Router } from "express";
import * as Application from "./application.service.js";

const router = Router();

router.get("/all", Application.getAllApplications);
router.get("/search", Application.searchApplications);
router.post("/", Application.createApplication);
router.get("/request", Application.getApplicationsByRequest);
router.get("/artisan", Application.getApplicationsByArtisan);
router.get("/", Application.getApplicationById);
router.put("/", Application.updateApplication);
router.delete("/", Application.deleteApplication);

export default router;
