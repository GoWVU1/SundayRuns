import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// Reuse the client across hot reloads in dev so we don't leak connections.
// prepare: false — required for Supabase's transaction pooler (port 6543), the
// recommended DATABASE_URL for serverless deploys like Vercel; it doesn't support
// prepared statements. Harmless against a direct connection or the session pooler too.
// Keep each serverless instance's client pool small: Supavisor already pools
// connections globally, and large per-instance pools add contention under load.
// max: 10, not 5 — the busiest page (admin game editor) fires 7 concurrent
// queries in one request; a pool smaller than that forces some to queue behind
// others every single load, and under any latency pressure that queueing can
// tip the whole request over Vercel's function timeout, orphaning the queued
// queries mid-flight (visible in pg_stat_activity as "active, ClientRead"
// sessions that never get read — the client that would read them is dead).
//
// Deliberately doesn't throw if DATABASE_URL is missing: `next build` evaluates this
// module while collecting page data, before deploy-target env vars are necessarily
// present, and postgres() connects lazily on first query — so a missing/bad
// DATABASE_URL surfaces as a normal connection error on the first real request
// instead of crashing the build.
export const sql = global.__sql ?? postgres(process.env.DATABASE_URL ?? "", {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}
