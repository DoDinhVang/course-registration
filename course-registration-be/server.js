import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import mainRouter from "./src/routers/index.js";
import { errorHandler } from "./src/common/middlware/error.middleware.js";
import { swaggerSpec } from "./src/common/swagger/swagger.config.js";
import * as AppConfig from "./src/common/config/app.config.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(compression());

// API Docs (Swagger)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// Main App Router
app.use("/api", mainRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Global Error Handler
app.use(errorHandler);

const server = app.listen(AppConfig.PORT, () => {
  console.log(`server online at port: ${AppConfig.PORT}`);
});
