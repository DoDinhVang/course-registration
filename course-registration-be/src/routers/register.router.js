import express from "express";
import * as registerController from "../controllers/register.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";

const router = express.Router();
router.post("/", protect, registerController.register);
export default router;
