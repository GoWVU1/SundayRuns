import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in first.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const schema = readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");

try {
  await sql.unsafe(`create extension if not exists pgcrypto;`);
  await sql.unsafe(schema);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
