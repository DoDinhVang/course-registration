import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables.");
}

// Parse the MySQL URL structure
// Format: mysql://user:password@host:port/database
const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.substring(1); // Remove leading "/"

const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
  user: parsedUrl.username,
  password: decodeURIComponent(parsedUrl.password),
  database: databaseName,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
