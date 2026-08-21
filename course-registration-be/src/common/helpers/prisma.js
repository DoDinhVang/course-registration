import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as AppConfig from '../config/app.config.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables.");
}

const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.substring(1);

const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
  user: parsedUrl.username,
  password: decodeURIComponent(parsedUrl.password),
  database: databaseName,
  connectionLimit: AppConfig.DB_CONECTION_LIMIT,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
