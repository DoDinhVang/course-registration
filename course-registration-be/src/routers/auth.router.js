import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Protected routes (require valid JWT)
router.get("/me", protect, authController.getMe);

export default router;
