import { neon } from "@neondatabase/serverless";

export function getSql() {
  const databaseUrl = import.meta.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  return neon(databaseUrl);
}
