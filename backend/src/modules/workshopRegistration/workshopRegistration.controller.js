import { Router } from "express";
import * as WR from "./workshopRegistration.service.js";

const router = Router();

router.get("/all", WR.getAllRegistrations);
router.get("/workshop", WR.getByWorkshop);
router.get("/buyer", WR.getByBuyer);
router.get("/artisan", WR.getByArtisan);
router.post("/", WR.createRegistration);
router.put("/", WR.updateRegistration);
router.delete("/", WR.deleteRegistration);

export default router;
