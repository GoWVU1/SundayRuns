-- Sunday Runs — Phase 1 schema.
-- Run this once against your Postgres database (local dev or Supabase).
-- Safe to re-run: every statement is idempotent.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  is_admin boolean not null default false,
  -- Not used by Phase 1 UI yet; present so Phase 2 tiers are an additive change.
  tier text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_account_id_idx on sessions(account_id);

-- Only one row is ever "current" in Phase 1 — the admin Game screen
-- upserts it rather than creating a new row per week.
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  game_date text not null default '',
  game_time text not null default '',
  location text not null default '',
  cap integer not null default 16,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  status text not null check (status in ('confirmed', 'waitlisted')),
  created_at timestamptz not null default now(),
  unique (game_id, account_id)
);

create index if not exists rsvps_game_id_status_idx on rsvps(game_id, status, created_at);
