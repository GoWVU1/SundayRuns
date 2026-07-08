import "server-only";
import { sql } from "@/lib/db";

export type Game = {
  id: string;
  game_date: string;
  game_time: string;
  location: string;
  cap: number;
  is_open: boolean;
  created_at: string;
};

const GAME_FIELDS = "id, game_date, game_time, location, cap, is_open, created_at";

/** Phase 1 keeps a single "current" game row — the most recently created one. */
export async function getCurrentGame() {
  const rows = await sql<Game[]>`
    select ${sql.unsafe(GAME_FIELDS)} from games order by created_at desc limit 1
  `;
  return rows[0] ?? null;
}

async function ensureCurrentGame() {
  const current = await getCurrentGame();
  if (current) return current;
  const rows = await sql<Game[]>`
    insert into games (game_date, game_time, location, cap, is_open)
    values ('', '', '', 16, false)
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

export async function updateGameDetails(fields: { gameDate: string; gameTime: string; location: string }) {
  const current = await ensureCurrentGame();
  const rows = await sql<Game[]>`
    update games set
      game_date = ${fields.gameDate},
      game_time = ${fields.gameTime},
      location = ${fields.location}
    where id = ${current.id}
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

export async function toggleCurrentGame() {
  const current = await ensureCurrentGame();
  const rows = await sql<Game[]>`
    update games set is_open = not is_open where id = ${current.id}
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

export async function adjustCurrentGameCap(delta: number) {
  const current = await ensureCurrentGame();
  const nextCap = Math.max(14, Math.min(17, current.cap + delta));
  const rows = await sql<Game[]>`
    update games set cap = ${nextCap} where id = ${current.id}
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}
