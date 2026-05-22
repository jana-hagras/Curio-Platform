import { Router } from "express";
import * as MA from "./mentorshipApplication.service.js";

const router = Router();

router.get("/all", MA.getAllApplications);
router.get("/search", MA.searchApplications);
router.get("/mentorship", MA.getByMentorship);
router.get("/buyer", MA.getByBuyer);
router.get("/artisan", MA.getByArtisan);
router.post("/", MA.createApplication);
router.get("/", MA.getById);
router.put("/", MA.updateApplication);
router.delete("/", MA.deleteApplication);

export default router;
