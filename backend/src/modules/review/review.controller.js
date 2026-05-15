import { Router } from "express";
import * as Review from "./review.service.js";

const router = Router();

router.get("/all", Review.getAllReviews);
router.get("/search", Review.searchReviews);
router.post("/", Review.createReview);
router.get("/item", Review.getReviewsByItem);
router.get("/buyer", Review.getReviewsByBuyer);
router.get("/", Review.getReviewById);
router.put("/", Review.updateReview);
router.delete("/", Review.deleteReview);

export default router;
