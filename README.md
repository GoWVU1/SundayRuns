# Sunday Runs

Pickup basketball roster app — accounts, a weekly game toggle, RSVP with a live cap counter, and a
waitlist. This is **Phase 1**: no tiers/priority windows, no guest invites, no Fantasy Football
section yet — see `pickup-basketball-app-plan.md` for the full roadmap.

## Stack

Next.js (App Router) + TypeScript + Tailwind, with Postgres for storage. There's no third-party auth
service — login is phone number + a password you pick, hashed and checked entirely by this app's own
server code, with sessions stored in the database and read from an httpOnly cookie. The database is
only ever touched from server-side code (Server Actions), never directly from the browser.

## Local development

You need Node.js and a Postgres database.

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL — see below
npm run db:migrate           # creates the accounts/sessions/games/rsvps tables
npm run dev                  # http://localhost:3000
```

For `DATABASE_URL` locally, point it at any Postgres server you have running, e.g.:

```
DATABASE_URL=postgres://YOUR_MAC_USERNAME@localhost:5432/sunday_runs_dev
```

(Create that database first with `createdb sunday_runs_dev` if it doesn't exist.)

## Deploying for free (Supabase + Vercel)

This is the "no coding required on your end" path from the original plan — about 10 minutes, no
credit card.

### 1. Create a Supabase project (free tier)

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once it's ready, go to **Project Settings → Database** and copy the **Connection string** under
   "Connection pooling" (URI format, with the password already filled in). It looks like
   `postgres://postgres.xxxx:[password]@aws-...pooler.supabase.com:6543/postgres`.
3. Go to the **SQL Editor** in the Supabase dashboard, paste in the entire contents of
   [`db/schema.sql`](db/schema.sql), and run it. (If you'd rather do this from your machine instead,
   set `DATABASE_URL` to the connection string above in `.env.local` and run `npm run db:migrate`.)

### 2. Push this project to GitHub

If it isn't already:

```bash
git init
git add .
git commit -m "Sunday Runs Phase 1"
```

Create a new GitHub repo and push this project to it.

### 3. Deploy to Vercel (free tier)

1. Go to [vercel.com](https://vercel.com), sign in, and click **Add New → Project**.
2. Import the GitHub repo you just pushed.
3. Before deploying, add one environment variable:
   - `DATABASE_URL` = the Supabase connection string from step 1.
   - (Optional) `SESSION_COOKIE_NAME` = `sr_session` (or leave unset — that's the default).
4. Click **Deploy**. Vercel gives you a free `.vercel.app` URL — that's the live app.

### 4. Make yourself an admin

The very first account anyone creates is a regular member, not an admin — there's no chicken-and-egg
special-casing. After you sign up through the live app, open the Supabase **Table Editor**, find your
row in the `accounts` table, and flip `is_admin` to `true`. From then on you can promote/demote other
admins from inside the app itself (Admin → Members → tap the ADMIN/MEMBER chip).

### 5. Add it to your phone's home screen

Open the `.vercel.app` URL on your phone in Safari or Chrome, then use "Add to Home Screen" from the
share/menu button. It'll behave like a normal app icon from there.

## Notes on how RSVPs work

- The cap (14–17) is enforced inside a database transaction that locks the game row, so two people
  claiming the last spot at the same instant can't both get confirmed.
- If a confirmed player gives up their spot, the longest-waiting person on the waitlist is
  automatically promoted to confirmed. There's no push/SMS notification for this yet (that's a later
  phase) — they'll see it next time they open the app.
- The admin Game screen always edits a single "current" game rather than creating a new one every
  week; toggling games on/off week to week is intentionally lightweight for now.
