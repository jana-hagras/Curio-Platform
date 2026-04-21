import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Import your module routers 
import userRouter from "./modules/user/user.controller.js";
import portfolioRouter from "./modules/portfolioProjects/portfolioProjects.Controller.js";
import galleryRouter from "./modules/Gallery/Gallery.controller.js";
import marketItemRouter from "./modules/marketItem/marketItem.controller.js";
import requestRouter from "./modules/request/request.controller.js";
import milestoneRouter from "./modules/milestone/milestone.controller.js";
import applicationRouter from "./modules/application/application.controller.js";
import orderRouter from "./modules/order/order.controller.js";
import orderItemRouter from "./modules/orderItem/orderItem.controller.js";
import paymentRouter from "./modules/payment/payment.controller.js";
import reviewRouter from "./modules/review/review.controller.js";
import uploadRouter from "./modules/upload/upload.controller.js";

export const bootstrap = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  
  // Serve static UI images from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  app.use("/upload", uploadRouter);
  app.use("/user", userRouter);
  app.use("/portfolio", portfolioRouter);
  app.use("/gallery", galleryRouter);
  app.use("/market-items", marketItemRouter);
  app.use("/requests", requestRouter);
  app.use("/milestones", milestoneRouter);
  app.use("/applications", applicationRouter);
  app.use("/orders", orderRouter);
  app.use("/order-items", orderItemRouter);
  app.use("/payments", paymentRouter);
  app.use("/reviews", reviewRouter);

  app.use((req, res) => {
    res.status(404).json({ ok: false, message: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
      ok: false,
      message: err.message || "Server error",
    });
  });

  return app;
};
