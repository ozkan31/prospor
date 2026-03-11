import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  const connection = await mysql.createConnection({
    ...config.db,
    multipleStatements: true
  });

  try {
    await connection.query(schemaSql);
    // eslint-disable-next-line no-console
    console.log("DB schema kuruldu/güncellendi.");
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("DB init hatası:", error.message);
  process.exit(1);
});
