import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const envText = fs.readFileSync(".env.local", "utf8");
const envMatch = envText.match(/^DATABASE_URL=(.*)$/m);
if (!envMatch) throw new Error("DATABASE_URL is not set in .env.local");

let databaseUrl = envMatch[1].trim();
if (
  (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) ||
  (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))
) {
  databaseUrl = databaseUrl.slice(1, -1);
}

const sql = neon(databaseUrl);
const schema = fs.readFileSync("db/neon-schema.sql", "utf8");
const statements = schema
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} schema statements.`);
