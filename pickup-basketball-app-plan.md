# Pickup Basketball & Fantasy League App — Implementation Plan

## The Problem This Solves

Right now too many people show up to your weekend game, including people nobody actually knows, because regulars bring guests without telling anyone in advance. You want a hard cap of 14-17 people, full accountability for who invited whom, and a system that costs you nothing to run and asks as little as possible of the people using it.

## Roles

The app has five levels: Admin, Core, Regular, Extended, and Guest. Admin is now a permission rather than something tied only to you — you can promote any trusted account to co-admin so they can also toggle games, approve guest requests, and adjust tiers, useful for a weekend you can't run things yourself. Core Members are your most trusted regulars — they get first access to sign up each week and can invite guests. Regular Members are known players with normal priority who currently cannot invite guests unless you decide to grant that later. Extended Members sit between Regular and Guest (name it whatever you like — "Extended" is just a placeholder) — people who show up often enough to be recognized and get their own account and signup priority, but haven't earned full Regular trust and can't invite guests of their own. Guests are one-off invitees tied to whichever member vouched for them; they need admin approval before they appear on the roster, and if a guest earns your trust you simply upgrade their account to Extended, Regular, or Core.

## How Accounts Will Work

Signup asks for a name, a phone number, and a password the person chooses themselves — nothing gets texted to them, so there's no per-message SMS charge and no verification code to wait for. The phone number just acts as their username, the same way an email would in a typical login form, except everyone already has one memorized and it doubles as a way to trace an account back to a real person. Once someone logs in, their session stays active for about 90 days on that device, so in practice most people log in once and never see a login screen again unless they switch phones or clear their browser.

Because there's no email or SMS service involved, there's also no automated "forgot password" flow, which is normally the expensive/complicated part of an account system. Given the group is only 14-17 people, if someone forgets their password they just tell you, and you reset it for them from the admin panel in a few seconds. That keeps costs at zero and avoids building out a whole reset-email pipeline for a group this size.

## Core Features

The weekly game toggle is the switch you flip to announce that a game is happening — you set the date, time, and the cap (14-17, adjustable anytime). Nothing opens up for signups until you turn this on. Once it's on, priority signup windows kick in: Core Members can RSVP first (say, starting Thursday evening), Regular Members get access the next day, Extended Members get access after that, and Guests can only be added once a Core or Regular member submits a request on their behalf.

RSVPs are capped in real time — everyone sees a live counter like "13/16 spots filled," and once the cap is hit, further signups automatically land on a waitlist instead of the confirmed roster. If a confirmed player cancels, the next person on the waitlist gets notified that a spot opened up, first to respond gets it.

Guest invites are always tied to a sponsor. A Core Member can request to bring someone by submitting their name and phone number; that request sits pending until you approve or deny it, and once approved, the guest's spot on the roster visibly shows who invited them. You can also set a monthly guest allowance per account (say, one guest invite per month) so this can't be used to quietly funnel in a stream of new strangers.

Anyone logged in can see the current roster before committing — just first names (or first name plus last initial) of confirmed players and how many spots remain, so people know who they'll be playing with. Behind the scenes, you can mark attendance after each game, and repeated no-shows or late cancellations get logged against that account, giving you the information to manually (or eventually automatically) drop someone's tier if they're unreliable.

All of the above — toggling the game, approving or denying guest requests, adjusting a member's tier, resetting a forgotten password, marking who actually showed up, and granting or revoking admin access for other accounts — lives in the admin panel. You control who else gets in.

## Data Behind the Scenes

Nothing here requires you to understand databases, but for reference, the app tracks five kinds of records: accounts (name, phone, password, tier, admin flag, guest allowance, reliability history), games (date, time, cap, open/closed status), RSVPs (who, which game, confirmed vs. waitlisted, and if it's a guest, who sponsored them), guest requests (pending, approved, or denied), and an attendance log (who showed up to which game). You'll never need to touch this directly — everything is managed through the screens described below — but if you're ever curious, the database has a simple visual table view you could look at like a spreadsheet.

## Tech Stack and Cost

The plan is to build this as a single Next.js web app (handles both what people see and the behind-the-scenes logic in one project) hosted for free on Vercel, with a free-tier Supabase database for storage. Login is custom-built rather than using a third-party auth service, specifically so phone+password works without triggering any SMS costs. At 14-17 users doing a few RSVPs and guest requests a week, you're using a tiny fraction of what these free tiers allow — realistically this runs at $0/month indefinitely, with no credit card ever required. The app can also be saved to people's phone home screens like a regular app icon, without needing an app store.

## Screens You'll Actually See

There's a signup screen (name, phone, password) and a matching login screen. The home screen is what most people see most often — it shows whether a game is on, your tier, the current headcount and spots remaining, the roster of who's confirmed, and an RSVP button. From there, a separate screen lets Core Members (or whoever you grant access to) submit a guest invite, showing their remaining allowance for the month. Everything else — toggling games, approving guests, adjusting tiers, resetting passwords, marking attendance, and making someone else an admin — lives in the admin panel, visible only to accounts flagged as admin.

## Keeping Admin Tasks Simple

Since you're the one actually running this day to day, the admin experience matters as much as what the players see. The admin panel is built mobile-first, since most of your real admin moments — approving a guest request, toggling the game on, marking who showed up — will happen from your phone, not at a desk. Instead of a folder of separate settings pages, the admin home screen surfaces exactly what needs your attention right now (pending guest requests, an upcoming punishment deadline, unpaid dues) in one glance, with everything else a tap away but nothing buried. Common actions are one tap, not a form: approving or denying a guest request, resetting a password, or bumping someone's tier happens right from the list they already appear in, not a separate multi-step screen. Labels use plain language you'd actually say ("Make Sarah a Core Member," not "Update role"), and anything hard to undo — removing someone, deleting a season record — asks you to confirm first so a stray tap can't cause damage.

## Build Phases

Phase 1 covers the essentials: accounts, the weekly game toggle, RSVP with a live cap counter, and a waitlist. This alone solves your core overcrowding problem. Phase 2 layers in tiers and priority signup windows, plus sponsor-tied guest invites with your approval step — this is what solves the "people bring others without telling us" problem specifically. Phase 3 adds reliability tracking, automatic waitlist promotion notifications, and general polish like the add-to-homescreen setup. You could reasonably stop after Phase 1 or 2 if the extra features aren't worth the added complexity to you.

## Fantasy Football League Section

Since the site is already yours to use, it can also host a private area for the Sunday Runs fantasy football league — a separate, if overlapping, group of people from your basketball regulars. Based on the "Sunday Runs — Rules and Regulations 2.0" contract you shared, this section covers the three things you asked for. A contract page holds the full text of the rules so anyone can check the payout amounts, deadlines, or voting thresholds without digging up the original document. A standings display shows a small badge next to the top three finishers each season — champion, runner-up, and third place — matching the $160 / $45 / $35 payout tiers in Article III. A punishment options page lists the five enumerated punishments from Article IV (the ACT exam, the FitnessGram PACER test, 24 Hours in a Waffle House, the Hot Ones Challenge, and the Bodybuilding Competition) along with their specific rules, so everyone can see exactly what the League Loser is choosing from.

Two extensions are included given how much this contract already requires someone to track by hand. The contract bans a League Loser from repeating their own past punishment or whatever the prior year's Loser picked (Section 4.4), which right now depends entirely on someone's memory — so the app keeps a running punishment history (who did which punishment, which year, and whether they completed it) and automatically flags which options are off-limits when the next Loser is choosing. It also includes a "current League Loser" tracker showing who's on the clock, what they picked, and how much time is left against the two deadlines in Section 4.2 (60 days to start, 330 days to finish), so nobody quietly runs out the clock.

This section needs its own membership flag on an account, independent from the basketball tiers, since fantasy league members aren't necessarily the same people as your basketball regulars. You'd toggle this flag from the same admin panel already described above. Behind the scenes this adds a small amount of new data: the flag itself, one record per season listing the champion/runner-up/third place, a punishment history log, and a status record for the current Loser. None of this depends on the basketball roster logic, so it can be built and shipped independently of whichever basketball phases you choose.

## What Happens Next

Take a look at this plan and let me know if anything should change — the exact cap, who counts as Core vs. Regular initially, how many guest invites per month feels right, or if any feature here isn't actually needed. Once you sign off, I'll write the actual code for whichever phases you want and hand you a copy-paste deployment guide to get it live for free, no coding required on your end.
