import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const envText = fs.readFileSync(".env.local", "utf8");
const match = envText.match(/^DATABASE_URL=(.*)$/m);
if (!match) throw new Error("DATABASE_URL is not set in .env.local");

let databaseUrl = match[1].trim();
if (
  (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) ||
  (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))
) {
  databaseUrl = databaseUrl.slice(1, -1);
}

const sql = neon(databaseUrl);
const counts = await sql`
  SELECT event_type, COUNT(*)::int AS count
  FROM app_lifecycle_events
  GROUP BY event_type
  ORDER BY event_type
`;

const latest = await sql`
  SELECT
    event_type,
    app_name,
    owner_email IS NOT NULL AS has_owner_email,
    instance_id,
    account_id,
    site_id,
    occurred_at,
    created_at
  FROM app_lifecycle_events
  ORDER BY created_at DESC
  LIMIT 20
`;

console.log(JSON.stringify({ counts, latest }, null, 2));
