import express from "express";
import * as registerController from "../controllers/register.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.post("/", registerController.register);
router.get("/", registerController.getMyRegistrations);
router.delete("/:id", registerController.cancel);

export default router;
