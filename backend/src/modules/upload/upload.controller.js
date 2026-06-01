import { Router } from "express";
import { uploadMiddleware } from "../../middleware/upload.middleware.js";

const router = Router();

router.post("/", uploadMiddleware.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, message: "No file uploaded" });
        }
        
        // Return the Cloudinary URL
        const imagePath = req.file.path;
        
        res.status(200).json({
            ok: true,
            imageUrl: imagePath,
            message: "File uploaded successfully"
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ ok: false, message: "Internal server error during upload" });
    }
});

export default router;
