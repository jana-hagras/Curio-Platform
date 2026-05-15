import { Router } from "express";
import * as Milestone from "./milestone.service.js";

const router = Router();

router.get("/search", Milestone.searchMilestones);
router.post("/", Milestone.createMilestone);
router.get("/request", Milestone.getMilestonesByRequest);
router.get("/", Milestone.getMilestoneById);
router.put("/complete", Milestone.completeMilestone);
router.put("/", Milestone.updateMilestone);
router.delete("/", Milestone.deleteMilestone);

export default router;
