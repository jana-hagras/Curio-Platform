import { Router } from "express";
import * as Workshop from "./workshop.service.js";

const router = Router();

router.get("/all", Workshop.getAllWorkshops);
router.get("/search", Workshop.searchWorkshops);
router.get("/artisan", Workshop.getWorkshopsByArtisan);
router.post("/", Workshop.createWorkshop);
router.get("/", Workshop.getWorkshopById);
router.put("/", Workshop.updateWorkshop);
router.delete("/", Workshop.deleteWorkshop);

export default router;
