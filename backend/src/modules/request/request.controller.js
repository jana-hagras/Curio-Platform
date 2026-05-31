import { Router } from "express";
import * as Request from "./request.service.js";

const router = Router();

router.get("/search", Request.searchRequests);
router.post("/", Request.createRequest);
router.get("/all", Request.getAllRequests);
router.get("/generations", Request.getGenerationsByRequest);
router.get("/versions", Request.getVersionsByRequest);
router.get("/admin", Request.getRequestByIdAdmin);
router.get("/", Request.getRequestById);
router.get("/buyer", Request.getRequestsByBuyer);
router.put("/", Request.updateRequest);
router.delete("/", Request.deleteRequest);
router.post("/regenerate", Request.regenerateAI);
router.post("/refine", Request.refineRequest);
router.put("/prefer-version", Request.setPreferredVersion);

export default router;
