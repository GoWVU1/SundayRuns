import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the client across hot reloads in dev so we don't leak connections.
// prepare: false — required for Supabase's transaction pooler (port 6543), the
// recommended DATABASE_URL for serverless deploys like Vercel; it doesn't support
// prepared statements. Harmless against a direct connection or the session pooler too.
export const sql = global.__sql ?? postgres(databaseUrl, { prepare: false });
if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}
