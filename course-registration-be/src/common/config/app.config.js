import "dotenv/config";
export const PORT = process.env.PORT || 3000;
export const DB_CONECTION_LIMIT = process.env.DB_CONNECTION_LIMIT || 20;