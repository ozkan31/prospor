import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.SERVER_PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  adminEmail: String(process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  adminPassword: String(process.env.ADMIN_PASSWORD || ""),
  db: {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "prospor",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  }
};
