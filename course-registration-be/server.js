import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./src/routers/index.js";
import { errorHandler } from "./src/common/middlware/error.middleware.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: true, // Allow frontend origin
    credentials: true, // Allow sending cookies
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(compression());

// Main App Router
app.use("/api", mainRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Global Error Handler
app.use(errorHandler);

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`server online at port: ${PORT}`);
});
