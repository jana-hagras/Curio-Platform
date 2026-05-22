import { Router } from "express";
import * as Mentorship from "./mentorship.service.js";

const router = Router();

router.get("/all", Mentorship.getAllMentorships);
router.get("/search", Mentorship.searchMentorships);
router.get("/artisan", Mentorship.getMentorshipsByArtisan);
router.post("/", Mentorship.createMentorship);
router.get("/", Mentorship.getMentorshipById);
router.put("/", Mentorship.updateMentorship);
router.delete("/", Mentorship.deleteMentorship);

export default router;
