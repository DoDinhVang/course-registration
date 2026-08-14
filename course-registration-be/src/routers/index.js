import express from "express";
import authRouter from "./auth.router.js";

const mainRouter = express.Router();

// Mount auth router under /api/auth path
mainRouter.use("/auth", authRouter);

export default mainRouter;
