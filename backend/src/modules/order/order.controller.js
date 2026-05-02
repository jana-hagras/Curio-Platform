import { Router } from "express";
import * as Order from "./order.service.js";

const router = Router();

router.post("/", Order.createOrder);
router.get("/all", Order.getAllOrders);
router.get("/", Order.getOrderById);
router.get("/buyer", Order.getOrdersByBuyer);
router.get("/artisan", Order.getOrdersByArtisan);
router.get("/search",Order.searchOrders);
router.put("/", Order.updateOrder);
router.delete("/", Order.deleteOrder);

export default router;
