import express from "express";
import authRouter from "./auth.router.js";
import semesterRouter from "./semester.router.js";
const mainRouter = express.Router();

// Mount auth router under /api/auth path
mainRouter.use("/auth", authRouter);
mainRouter.use("/semesters", semesterRouter);

export default mainRouter;
