import { Router } from "express";
import * as Payment from "./payment.service.js";

const router = Router();

router.get("/all", Payment.getAllPayments);
router.get("/search", Payment.searchPayments);
router.get("/buyer", Payment.getPaymentsByBuyer);
router.get("/artisan", Payment.getPaymentsByArtisan);
router.get("/analytics", Payment.getPaymentAnalytics);
router.post("/", Payment.createPayment);
router.get("/", Payment.getPaymentById);
router.get("/order", Payment.getPaymentsByOrder);
router.get("/request", Payment.getPaymentsByRequest);
router.get("/mentorship", Payment.getPaymentsByMentorship);
router.put("/", Payment.updatePayment);
router.delete("/", Payment.deletePayment);

export default router;
