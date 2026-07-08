-- Sunday Runs schema.
-- Run this against your Postgres database (local dev or Supabase) via `npm run db:migrate`.
-- Safe to re-run: every statement is idempotent, EXCEPT the games/rsvps breaking
-- change noted below, which required a one-time manual `truncate` beforehand
-- (see the Stage A section) — that truncate is NOT part of this file.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text,
  is_admin boolean not null default false,
  tier text not null default 'extended',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_account_id_idx on sessions(account_id);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
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

-- ============================================================
-- Stage A — tiers, priority windows, multi-game visibility
-- ============================================================
--
-- BREAKING CHANGE: games.game_date/game_time (freeform text) can't be
-- mechanically converted to a real timestamp. Before running this file
-- against a database that already has the Phase 1 `games` table, run this
-- ONCE by hand (not part of this file, not idempotent, intentionally
-- destructive to games/rsvps only):
--
--   truncate table games restart identity cascade;
--
-- Guests never self-serve signup, so they have no password.
alter table accounts alter column password_hash drop not null;

-- accounts.tier becomes a real enum-like column.
update accounts set tier = 'extended' where tier = 'member';
alter table accounts alter column tier set default 'extended';
alter table accounts drop constraint if exists accounts_tier_check;
alter table accounts add constraint accounts_tier_check
  check (tier in ('core', 'regular', 'extended', 'guest'));

-- Fantasy Football membership, fully independent of basketball tier.
alter table accounts add column if not exists fantasy_member boolean not null default false;

-- games: drop the freeform text columns, add a real start time + visibility mode.
-- Only safe to run against an EMPTY games table (see the truncate note above) —
-- `not null` with no default will fail loudly on a non-empty table rather than
-- silently corrupting data, which is the point.
alter table games drop column if exists game_date;
alter table games drop column if exists game_time;
alter table games add column if not exists starts_at timestamptz not null;
alter table games add column if not exists visibility text not null default 'standard';
alter table games drop constraint if exists games_visibility_check;
alter table games add constraint games_visibility_check
  check (visibility in ('standard', 'restricted'));
alter table games add column if not exists created_by uuid references accounts(id) on delete set null;

-- Restricted-game allow-lists — two combinable mechanisms, only populated
-- when visibility = 'restricted'.
create table if not exists game_visible_tiers (
  game_id uuid not null references games(id) on delete cascade,
  tier text not null check (tier in ('core', 'regular', 'extended')),
  primary key (game_id, tier)
);

create table if not exists game_visible_accounts (
  game_id uuid not null references games(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  primary key (game_id, account_id)
);

-- rsvps.sponsor_account_id was added ahead of time in Stage A since
-- rsvps.ts's getRoster/insertRsvpRespectingCap already read/write it.
alter table rsvps add column if not exists sponsor_account_id uuid references accounts(id) on delete set null;

-- ============================================================
-- Stage B — sponsor-tied guest invites
-- ============================================================

create table if not exists guest_requests (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  sponsor_account_id uuid not null references accounts(id) on delete cascade,
  guest_name text not null,
  guest_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references accounts(id) on delete set null,
  resulting_account_id uuid references accounts(id) on delete set null,
  resulting_rsvp_id uuid references rsvps(id) on delete set null
);

create index if not exists guest_requests_sponsor_idx on guest_requests(sponsor_account_id, requested_at);
create index if not exists guest_requests_game_status_idx on guest_requests(game_id, status);

-- ============================================================
-- Stage C — attendance tracking, real push notifications
-- ============================================================

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  status text not null check (status in ('present', 'no_show')),
  marked_by uuid references accounts(id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (game_id, account_id)
);

create index if not exists attendance_account_idx on attendance(account_id, status);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_account_idx on push_subscriptions(account_id);

-- ============================================================
-- Stage D — Fantasy Football (independent of basketball tiers)
-- ============================================================
-- accounts.fantasy_member was added ahead of time in Stage A alongside tier.

create table if not exists fantasy_standings (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  place smallint not null check (place in (1, 2, 3)),
  account_id uuid references accounts(id) on delete set null,
  display_name text,
  payout_usd numeric(10, 2) not null,
  unique (year, place)
);

create table if not exists punishment_history (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  loser_account_id uuid references accounts(id) on delete set null,
  loser_display_name text,
  -- Nullable: the current loser is tracked from the moment they're determined,
  -- which is often before they've picked a punishment.
  punishment text check (punishment in
    ('act_exam', 'pacer_test', 'waffle_house_24', 'hot_ones', 'bodybuilding_comp')),
  loser_determined_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz
);

alter table punishment_history alter column punishment drop not null;

create table if not exists fantasy_contract_articles (
  article_number int primary key check (article_number between 1 and 4),
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);

insert into fantasy_contract_articles (article_number, title) values
  (1, 'Article I · Membership'),
  (2, 'Article II · Draft & Season Play'),
  (3, 'Article III · Payouts'),
  (4, 'Article IV · The League Loser')
on conflict (article_number) do nothing;
