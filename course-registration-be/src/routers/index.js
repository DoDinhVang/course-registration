import express from "express";
import authRouter from "./auth.router.js";
import semesterRouter from "./semester.router.js";
import registerRouter from "./register.router.js";
const mainRouter = express.Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/semesters", semesterRouter);
mainRouter.use("/register", registerRouter);

export default mainRouter;
