import { Router } from "express";
import * as userService from "./user.service.js";


const router = Router();
// Registration: Handles creating the User + Subtype (Buyer/Artisan)
router.post("/register", userService.register);

// Login: Authenticates and returns joined user data
router.post("/login", userService.login);

// Fetches current session user data
router.get("/me/:id", userService.me);

// Countries list for registration dropdown
router.get("/countries", userService.getCountries);

router.get("/all", userService.getAllUsers);
router.get("/", userService.getUserById);
router.put("/", userService.updateUser);
router.delete("/", userService.deleteUser);
router.get('/search', userService.searchUsers);

export default router;