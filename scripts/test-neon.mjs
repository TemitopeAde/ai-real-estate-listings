import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const envText = fs.readFileSync(".env.local", "utf8");
const match = envText.match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

let databaseUrl = match[1].trim();
if (
  (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) ||
  (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))
) {
  databaseUrl = databaseUrl.slice(1, -1);
}

const sql = neon(databaseUrl);
const rows = await sql`
  SELECT
    current_database() AS database_name,
    current_user AS database_user,
    EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ${"public"}
        AND table_name = ${"contact_events"}
    ) AS contact_events_exists,
    EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ${"public"}
        AND table_name = ${"app_lifecycle_events"}
    ) AS app_lifecycle_events_exists,
    (
      SELECT array_agg(column_name ORDER BY ordinal_position)
      FROM information_schema.columns
      WHERE table_schema = ${"public"}
        AND table_name = ${"app_lifecycle_events"}
    ) AS app_lifecycle_event_columns
`;

console.log(
  JSON.stringify({
    connected: true,
    database: rows[0].database_name,
    user: rows[0].database_user,
    contact_events_exists: rows[0].contact_events_exists,
    app_lifecycle_events_exists: rows[0].app_lifecycle_events_exists,
    app_lifecycle_event_columns: rows[0].app_lifecycle_event_columns,
  }),
);
