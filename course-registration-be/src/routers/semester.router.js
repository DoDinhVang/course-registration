import express from "express";
import * as semesterController from "../controllers/semester.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";
const router = express.Router();
router.get("/", protect, semesterController.getSemesterList);
router.post("/", protect, semesterController.createSemester)
export default router;
