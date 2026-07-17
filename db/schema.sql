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

-- Every page load and claim/cancel action filters+sorts games on starts_at
-- (see fetchCandidateGames in src/lib/games.ts).
create index if not exists games_starts_at_idx on games(starts_at);

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
  article_number int primary key,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);

-- Real structure per "Sunday Runs — Rules and Regulations 2.0" (Season 2): 3 articles, not 4.
alter table fantasy_contract_articles drop constraint if exists fantasy_contract_articles_article_number_check;
delete from fantasy_contract_articles where article_number = 4;
alter table fantasy_contract_articles add constraint fantasy_contract_articles_article_number_check
  check (article_number between 1 and 3);

insert into fantasy_contract_articles (article_number, title, body) values
  (1, 'Article I · Game Rules & Structure', $article1$Section 1.1 – League Dues
Each League Member ("Owner") shall tender an entry fee in the amount of twenty-five United States Dollars ($25.00) prior to the commencement of the draft. Payment of such dues is a condition precedent to participation in the League and its associated competitions.

Section 1.2 – League Platform
The League shall be hosted and operated via the ESPN Fantasy Football platform. All gameplay, scoring, and roster management shall be conducted in accordance with the tools and parameters available on said platform, unless otherwise modified by this Agreement.

Section 1.3 – Roster Composition
Each Owner shall maintain a starting lineup comprised of the following positional designations: one (1) Quarterback (QB), two (2) Running Backs (RB), two (2) Wide Receivers (WR), one (1) Tight End (TE), two (2) FLEX positions (RB/WR/TE eligible), one (1) Team Defense/Special Teams (D/ST), and seven (7) bench players.

Section 1.4 – Injured List (IL) Designation
Each team shall be entitled to utilize up to three (3) Injured List (IL) roster positions for players so designated by ESPN. Only players marked as IR, OUT, or otherwise eligible under ESPN’s IL rules may be placed in these slots.

Section 1.5 – Scoring System
The League shall utilize a Point-Per-Reception (PPR) scoring format. Scoring categories and point values shall be governed by the standard settings established by ESPN, unless amended by vote or Commissioner declaration.

Section 1.6 – Regular Season Duration
The regular season shall consist of thirteen (13) scoring weeks. All regular season standings shall be determined by win-loss record during this period.

Section 1.7 – Playoff Structure
The postseason shall consist of five (5) qualifying teams. The two (2) division winners shall receive the No. 1 and No. 2 seeds, ranked by overall regular season record. The Nos. 3 and 4 seeds shall be awarded to the non-division-winning teams with the next best records. The No. 5 seed shall be awarded to the remaining team with the highest value of Points For (PF) plus one-half (½) of Points Against (PA), subject to the exception noted in Section 1.9.

The Wild Card Round shall consist of a one-week matchup between the No. 4 and No. 5 seeds. The winners shall proceed to the Semifinal Round (one-week duration), and the Championship shall be contested over a two-week period.

Section 1.8 – Draft Structure
The League draft shall consist of sixteen (16) rounds. The draft order shall be determined randomly, unless otherwise agreed to by a majority vote of Owners.

Section 1.9 – Tie-Breaking and Seeding Adjustments
In the event that the team qualifying for the fifth (5th) seed based on the PF + ½ PA calculation is already eligible for a higher playoff seed (Nos. 1–4) by virtue of record, then the fifth seed shall be awarded to the next eligible team as determined by record. Where two or more teams share an identical record, ESPN’s default tie-breaking procedures shall be used to determine seeding and qualification.$article1$),

  (2, 'Article II · In-Season Conduct', $article2$Section 2.1 – Roster Control and Competitive Integrity

Each League Member ("Owner") hereby agrees to maintain an active and competitive roster throughout the duration of the Fantasy Football League season. "Active and competitive" shall be defined as the act of submitting a lineup that does not include any player who is declared inactive, on a bye week, on Injured Reserve (IR), or otherwise unavailable for NFL play during the scoring week.

While Owners retain full discretion to bench players for legitimate strategic reasons, such discretion must not extend to intentionally submitting non-competitive lineups. This obligation remains in full force and effect regardless of the Owner’s position in league standings or likelihood of playoff qualification. A failure to comply with this provision may, at the sole discretion of the League Commissioner, result in remedial measures, including but not limited to: lineup adjustments, point forfeiture, or other sanctions deemed reasonably necessary to preserve league integrity.

Section 2.2 – Trade Veto Procedure

Any trade entered into by two or more Owners shall be subject to veto by the non-involved Owners, pursuant to the following procedure:

A veto may only be initiated by a written notice (including text message) sent to the League Commissioner within twenty-four (24) hours following the formal acceptance and announcement of the trade.

Upon receipt of such notice, the Commissioner shall immediately initiate a vote among all non-involved Owners via the designated League group chat or other agreed-upon communication medium.

If fifty percent (50%) or more of the non-involved Owners vote to veto the trade within forty-eight (48) hours of the vote being initiated, the trade shall be nullified and rendered void ab initio.

If no such veto threshold is met within forty-eight (48) hours, or if no veto request is received within twenty-four (24) hours of trade acceptance, the trade shall be processed and finalized by the Commissioner.

All decisions made in accordance with this section shall be final and binding, subject only to Commissioner oversight for good-faith enforcement.$article2$),

  (3, 'Article III · Loser Punishments & Payouts', $article3$Section 3.1 – Payout Plan
The League shall distribute monetary prizes to the top three (3) finishers in accordance with the following schedule:

First Place: One Hundred Forty Dollars ($140.00);
Second Place: Thirty-Five Dollars ($35.00);
Third Place: Twenty-Five Dollars ($25.00).

Such prizes shall be payable no later than thirty (30) calendar days following the conclusion of the League Championship, provided all League dues have been paid in full and no breach of this Agreement has occurred by the recipient.

Section 3.2 – Determination of League Loser
The individual designated as the “League Loser” shall be the Owner whose team accrues the fewest total points in the consolation ladder during the postseason, as modified by a point adjustment system. For purposes of this determination, each team participating in the consolation ladder shall receive a bonus of twenty-five (25) points for each seed position above the lowest seed. The Owner with the lowest aggregate score after application of this adjustment shall be deemed the League Loser and shall be subject to the punishment requirements set forth herein.

Section 3.3 – Punishment Obligation and Enforcement
The League Loser shall be required to complete a punishment as prescribed in Article V of this Agreement. The following timelines and enforcement mechanisms shall govern:

(a) The League Loser shall commence, in good faith, verifiable steps toward the initiation of the selected punishment within sixty (60) days following the conclusion of the fantasy football season.

(b) The League Loser shall fully complete the selected punishment no later than three hundred thirty (330) days following the League draft date for that season.

(c) In the event the League Loser fails to meet the deadlines in subsections (a) or (b), the following sanctions shall apply:

A liquidated penalty of Ten Dollars ($10.00), which shall be due and payable to the League upon breach of the deadline; and

Accrual of interest on said penalty at a rate of ten percent (10%) per annum, calculated from the sixtieth (60th) day following the end of the fantasy season and continuing until the date of full satisfaction; and

Potential expulsion from the League, subject to a majority vote of all non-losing League Members, such vote to be binding and final.

Section 3.4 – Selection and Limitations
The League Loser, as determined pursuant to Article IV, shall be required to select and complete one (1) of the enumerated punishments set forth herein. The following restrictions shall govern the selection process:

(a) The selected punishment shall be subject to a single veto by a three-fourths (¾) supermajority vote of the non-losing League Members, such vote to be conducted within seven (7) days of the League Loser’s declared selection.

(b) No League Loser shall be permitted to select a punishment that was completed by the League Loser in the immediately preceding League year.

(c) No League Loser shall select the same punishment they personally selected in any prior League year.

Section 3.5 – Enumerated Punishments

3.5.1 – ACT Examination Requirement
The League Loser shall register for and complete an official paper-based ACT examination, including the Test Information Release (TIR) package. The examination must be administered at a testing center located within fifteen (15) miles of the League Loser’s primary residence. If no such location exists, the nearest alternative testing center is permissible.

To fulfill the obligation:

The League Loser must achieve a composite score of twenty-one (21) or higher.

If the League Loser scores between seventeen (17) and twenty (20), a follow-up practice ACT exam must be completed with a composite score of at least twenty-one (21).

If the initial composite score is sixteen (16) or below, the League Loser shall be required to retake the official ACT under the same conditions.

All score reports, including the TIR and testing documentation, must be provided to the League for verification. Failure to comply shall constitute non-completion of punishment.

3.2.2 – PACER Test Requirement
The League Loser shall complete the FitnessGram® 20-meter Progressive Aerobic Cardiovascular Endurance Run (PACER) Test in accordance with the official FitnessGram® PACER Test Manual. The following additional requirements apply:

The test shall be conducted at a public park.

The official PACER audio cadence shall be played via portable speaker at maximum volume throughout the test.

A minimum score of seventy-five (75) laps must be achieved for successful completion.

Each attempt must be fully recorded on video and transmitted to the League for verification.

If the League Loser fails to reach a score of 75, a new attempt shall be made at least once every three (3) calendar days until successful completion is achieved. The punishment shall not be deemed satisfied until a qualifying video is submitted to the League.

5.5.3 – Twenty-Four (24) Hours in Waffle House
The League Loser shall spend twenty-four (24) consecutive hours within a Waffle House® franchise location owned and operated by Waffle House, Inc. The following conditions shall apply:

One (1) hour shall be deducted from the required duration for each waffle consumed on-site during the punishment period.

The League Loser must livestream the entire punishment session publicly on Twitch® beginning from the time of seating.

The stream must remain continuously live, and access credentials shall be provided to the League prior to commencement.

The punishment shall be deemed completed upon the conclusion of a livestreamed session equating to twenty-four (24) hours, reduced by one (1) hour per waffle consumed.

3.5.4 – “Hot Ones” Challenge
The League Loser shall participate in a mock version of the “Hot Ones” interview-style hot sauce challenge. The following rules shall apply:

The challenge shall consist of at least ten (10) rounds, each featuring a different official Hot Ones™ sauce applied liberally to a chicken wing or reasonable non-meat substitute.

After consumption of each sauce, the League Loser shall respond to three (3) to five (5) questions posed by an interviewer.

Each non-losing League Member shall be entitled to prepare questions for one round. Members may opt out. The final round of questions shall be composed collectively by the League.

The interviewer shall not be required to consume any sauces.

In the event the League Loser is offered the opportunity to complete the challenge as part of a media interview (e.g., WJHL, East Tennessean) with the intent to publish or broadcast the segment, the League Loser must select this punishment unless it was (i) selected by the prior year's Loser or (ii) already completed by the current Loser in a prior year. The League may submit three (3) to five (5) questions to be asked during the media interview.

The punishment shall be deemed completed only upon submission of a full video recording of the challenge to the League group chat and confirmation that all sauce rounds and interview questions have been truthfully attempted in good faith.

3.5.5 – Bodybuilding Competition
The League Loser shall register for and participate in an officially sanctioned bodybuilding competition under the governance of the Organization of Competitive Bodybuilders (OCB), International Federation of Bodybuilding and Fitness (IFBB), or a substantially similar regulatory body. Acceptable divisions include:

Men’s Physique

Men’s Classic Physique

Men’s Bodybuilding

A complete and unedited video of the League Loser’s participation, including all competition rounds and, if applicable, final placement, shall be submitted to the League. The punishment shall not be considered complete without full and timely submission of said video.

Section 3.6 – Reimbursement of Costs Associated with Punishment
(a) The League acknowledges that certain punishments required of the League Loser may involve financial expense. To mitigate such burden, each Owner shall contribute Five Dollars ($5.00) from their annual League dues toward a collective reimbursement reserve (the “Reimbursement Bank”).

(b) Disbursements from the Reimbursement Bank shall be made solely for the purpose of reimbursing the League Loser for the minimum objectively necessary cost of completing their selected punishment, and only upon the following conditions:

(i) Submission to the League Manager of documentary proof of the punishment’s completion, which may include but is not limited to: test scores, video recordings, livestream links, receipts, or event registration confirmations;

(ii) Submission of itemized receipts or reasonable cost evidence for reimbursable expenses.

(c) Reimbursement shall be limited strictly to the minimum costs required to fulfill the punishment. Non-essential upgrades, add-ons, or personal expenditures (e.g., flavored waffles, hashbrowns, sodas, upgraded gear, apparel, etc.) shall be borne solely by the League Loser and are expressly excluded from reimbursement.

(d) Reimbursements shall not exceed the total amount available in the Reimbursement Bank. Any costs incurred above said amount shall be the sole and exclusive responsibility of the League Loser. Funds remaining in the Reimbursement Bank after reimbursement shall roll over and be added to the next League year's balance.

(e) A full accounting of the Reimbursement Bank’s balance shall be provided to all Owners between the annual draft and the start of Week One each season.

Section 3.7 – Collection and Enforcement of League Dues
(a) All League dues shall be paid in full to the League Manager prior to the commencement of Week One of the regular season. Accepted methods of payment are Zelle® or cash. Partial payments are expressly prohibited and shall be deemed noncompliant.

(b) Any Owner who fails to remit full payment by the conclusion of Week Thirteen (13) shall incur daily compounding interest at a rate of five percent (5%) per day on the unpaid principal amount. Accrued interest shall be deposited into the Reimbursement Bank.

(c) Any Owner who fails to remit full payment prior to the start of the League Playoffs shall be subject to the following mandatory penalties, without further notice:

(i) Immediate and irrevocable elimination from playoff contention;

(ii) Forfeiture of any and all claims to reimbursement from the Reimbursement Bank;

(iii) Expulsion from future participation in the League, subject to reinstatement by unanimous vote of all paying Owners; and

(iv) Continued accrual of penalties and interest as described in subsection (b).

Section 3.8 – Disbursement of Prizes and Reimbursements
(a) The League shall distribute all prize payouts listed in Section 4.1 within thirty (30) calendar days following the conclusion of the League Championship, contingent upon full payment of dues by all Owners and the absence of any breach of this Agreement by the recipient.

(b) In the event one or more Owners fail to remit dues, full prize payouts may be delayed or reduced. In such event, the League shall apply funds remaining in the Reimbursement Bank, if any, to supplement prize payments in the following priority:

(i) First Place prize;

(ii) Second Place prize;

(iii) Third Place prize.

(c) Reimbursements for completed punishments shall be issued within thirty (30) calendar days of submission of all required proof and documentation to the League Manager.

References: PF = Points For. PA = Points Against. ESPN tie-breaking rules: support.espn.com (Playoff Seeding / How Regular Season Standings Tiebreakers Work). FitnessGram PACER Test Manual: nova.edu/projectrise. Hot Ones official sauces: heatonist.com.$article3$)
-- do nothing, not do update: this file gets re-run on every migrate, and must
-- never clobber an admin's edits to the article body made through the app.
-- The one-time fix for rows already seeded with the old 4-article placeholder
-- content lives in scripts/seed-contract.mjs, run once by hand.
on conflict (article_number) do nothing;

-- ============================================================
-- Stage E — first/last name captured separately at signup
-- ============================================================
-- accounts.name stays the source of truth for display ("First L.") so
-- nothing else in the app needs to change — first_name/last_name are purely
-- structured storage for the commissioner's own reference.
alter table accounts add column if not exists first_name text not null default '';
alter table accounts add column if not exists last_name text not null default '';

-- One-time backfill for rows that predate these columns: best-effort split
-- of the existing free-text name on the first space. Guarded by
-- first_name = '' so it's a no-op once backfilled or on freshly-inserted rows.
update accounts
set first_name = split_part(name, ' ', 1),
    last_name = trim(substring(name from position(' ' in name) + 1))
where first_name = '' and last_name = '' and position(' ' in name) > 0;

update accounts
set first_name = name
where first_name = '' and last_name = '' and position(' ' in name) = 0;

-- ============================================================
-- Stage F — champion recap, lifetime winnings, buy-in tracking
-- ============================================================
-- Optional per-finish narrative fields for the champion recap screen.
-- All nullable — the recap page simply omits a row/section that's unset,
-- same pattern as fantasy_contract_articles' "hasn't been added yet".
alter table fantasy_standings add column if not exists record text;
alter table fantasy_standings add column if not exists final_standing text;
alter table fantasy_standings add column if not exists clinched text;
alter table fantasy_standings add column if not exists mvp text;
alter table fantasy_standings add column if not exists note text;

-- League dues ("buy-in") status per fantasy season, kept public so members
-- can see who's squared up before the draft (Section 1.1 of the contract).
create table if not exists fantasy_dues (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  account_id uuid not null references accounts(id) on delete cascade,
  paid boolean not null default false,
  paid_at timestamptz,
  unique (year, account_id)
);

-- ============================================================
-- Stage G — admin-configurable guest allowances + game templates
-- ============================================================
-- Monthly guest-invite allowance per tier — 0 means that tier can't sponsor
-- guests at all. Replaces the old hardcoded canSponsorGuest()/allowance=2.
create table if not exists tier_guest_settings (
  tier text primary key check (tier in ('core', 'regular', 'extended')),
  monthly_allowance int not null default 0
);

insert into tier_guest_settings (tier, monthly_allowance) values
  ('core', 2), ('regular', 2), ('extended', 0)
on conflict (tier) do nothing;

-- Two admin-editable quick-create presets for the "new one-off game" form —
-- just prefill values, not real games, so no FK/visibility-account wiring.
create table if not exists game_templates (
  slot smallint primary key check (slot in (1, 2)),
  name text not null,
  location text not null default '',
  cap integer not null default 16,
  visibility text not null default 'standard' check (visibility in ('standard', 'restricted')),
  visible_tiers text[] not null default '{}'
);

insert into game_templates (slot, name, location, cap, visibility) values
  (1, 'Weeknight Run', '', 12, 'standard'),
  (2, 'Weekend Game', '', 17, 'standard')
on conflict (slot) do nothing;

-- ============================================================
-- Stage H — street address alongside the gym/court name
-- ============================================================
-- "location" stays the human name ("Lincoln Park · Court #2"); "address" is
-- the real mailing address, so calendar apps can drop a map pin on it.
alter table games add column if not exists address text not null default '';
alter table game_templates add column if not exists address text not null default '';

-- ============================================================
-- Stage I — admin-configurable tier signup windows
-- ============================================================
-- offset_minutes is retained only so databases from the previous release can
-- be backfilled. Runtime code uses days_before + unlock_time: these are fixed
-- Eastern wall-clock times and never shift when a game's kickoff time changes.
create table if not exists tier_unlock_settings (
  tier text primary key check (tier in ('core', 'regular', 'extended')),
  offset_minutes int not null
);

alter table tier_unlock_settings add column if not exists days_before smallint;
alter table tier_unlock_settings add column if not exists unlock_time time;

insert into tier_unlock_settings (tier, offset_minutes, days_before, unlock_time) values
  ('core', 1500, 1, '17:00'),
  ('regular', 450, 0, '10:30'),
  ('extended', 300, 0, '13:00')
on conflict (tier) do nothing;

-- Convert the legacy offset against the old 6:00 PM reference exactly once.
update tier_unlock_settings
set days_before = greatest(0, ceil((offset_minutes - 1080) / 1440.0)::int),
    unlock_time = make_time(
      (((1080 - offset_minutes) % 1440 + 1440) % 1440) / 60,
      (((1080 - offset_minutes) % 1440 + 1440) % 1440) % 60,
      0
    )
where days_before is null or unlock_time is null;

alter table tier_unlock_settings alter column days_before set not null;
alter table tier_unlock_settings alter column unlock_time set not null;
alter table tier_unlock_settings drop constraint if exists tier_unlock_settings_days_before_check;
alter table tier_unlock_settings add constraint tier_unlock_settings_days_before_check
  check (days_before between 0 and 14);
alter table tier_unlock_settings enable row level security;

-- Optional exact overrides for one game. Absence means that tier uses the
-- fixed global day/time above.
create table if not exists game_tier_unlocks (
  game_id uuid not null references games(id) on delete cascade,
  tier text not null check (tier in ('core', 'regular', 'extended')),
  opens_at timestamptz not null,
  primary key (game_id, tier)
);
alter table game_tier_unlocks enable row level security;

-- Templates cannot store a calendar date, so their custom schedule is kept as
-- a day/time recipe. The new-game form resolves it to exact game-local
-- timestamps, which the admin can still edit before saving.
create table if not exists game_template_tier_unlocks (
  template_slot smallint not null references game_templates(slot) on delete cascade,
  tier text not null check (tier in ('core', 'regular', 'extended')),
  days_before smallint not null check (days_before between 0 and 14),
  unlock_time time not null,
  primary key (template_slot, tier)
);
alter table game_template_tier_unlocks enable row level security;

-- ============================================================
-- Stage J — Injured List (IL)
-- ============================================================
-- One active entry per account: re-saving overwrites in place, started_at is
-- only set on the initial insert so editing a description/return date later
-- doesn't reset how long someone's been out. Admin-managed only.
create table if not exists injuries (
  account_id uuid primary key references accounts(id) on delete cascade,
  description text not null,
  started_at date not null default current_date,
  expected_return date,
  created_at timestamptz not null default now()
);
alter table injuries enable row level security;

-- Hall of Fame (core tier) members always see the IL; this table grants
-- individually-picked non-core accounts the same access without changing
-- their tier.
create table if not exists il_visible_accounts (
  account_id uuid primary key references accounts(id) on delete cascade
);
alter table il_visible_accounts enable row level security;

-- Recovery timelines are rarely an exact date ("2 weeks", "2-3 weeks", "DTD"),
-- so expected_return is free text rather than a calendar date.
alter table injuries alter column expected_return type text using expected_return::text;

-- ============================================================
-- Stage K — GOAT tag
-- ============================================================
-- A cosmetic override of the tier badge ("GOAT" instead of Rookie/Veteran/
-- Hall of Fame) for admin-picked accounts. Visibility is a separate
-- admin-picked list — being tagged does NOT grant a tagged person the
-- ability to see their own tag; they need to be in goat_visible_accounts too.
create table if not exists goat_accounts (
  account_id uuid primary key references accounts(id) on delete cascade
);
alter table goat_accounts enable row level security;

create table if not exists goat_visible_accounts (
  account_id uuid primary key references accounts(id) on delete cascade
);
alter table goat_visible_accounts enable row level security;
