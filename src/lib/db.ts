import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// Reuse the client across hot reloads in dev so we don't leak connections.
// prepare: false — required for Supabase's transaction pooler (port 6543), the
// recommended DATABASE_URL for serverless deploys like Vercel; it doesn't support
// prepared statements. Harmless against a direct connection or the session pooler too.
//
// Deliberately doesn't throw if DATABASE_URL is missing: `next build` evaluates this
// module while collecting page data, before deploy-target env vars are necessarily
// present, and postgres() connects lazily on first query — so a missing/bad
// DATABASE_URL surfaces as a normal connection error on the first real request
// instead of crashing the build.
export const sql = global.__sql ?? postgres(process.env.DATABASE_URL ?? "", { prepare: false });
if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}
