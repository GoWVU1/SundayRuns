import "server-only";
import { cache } from "react";
import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";
import { normalizePhone } from "@/lib/accounts";
import { insertRsvpRespectingCap, type RsvpStatus } from "@/lib/rsvps";
import { currentMonthStartUtc } from "@/lib/time";
import { TIER_ORDER, TIER_LABELS, isRankedTier, type RankedTier } from "@/lib/tiers";

/** Every tier's monthly guest-invite allowance, in TIER_ORDER — 0 means that tier can't sponsor at all. */
export async function getTierGuestAllowances(): Promise<Record<RankedTier, number>> {
  const rows = await sql<{ tier: RankedTier; monthly_allowance: number }[]>`
    select tier, monthly_allowance from tier_guest_settings
  `;
  const byTier = Object.fromEntries(rows.map((r) => [r.tier, r.monthly_allowance]));
  return Object.fromEntries(TIER_ORDER.map((t) => [t, byTier[t] ?? 0])) as Record<RankedTier, number>;
}

export async function setTierGuestAllowance(tier: RankedTier, monthlyAllowance: number): Promise<void> {
  await sql`
    insert into tier_guest_settings (tier, monthly_allowance)
    values (${tier}, ${monthlyAllowance})
    on conflict (tier) do update set monthly_allowance = ${monthlyAllowance}
  `;
}

/** Wrapped in cache() since nav.ts and pages that render "invite a guest" both check this independently. */
export const canSponsorGuest = cache(async (tier: string): Promise<boolean> => {
  if (!isRankedTier(tier)) return false;
  const [row] = await sql<{ monthly_allowance: number }[]>`
    select monthly_allowance from tier_guest_settings where tier = ${tier}
  `;
  return (row?.monthly_allowance ?? 0) > 0;
});

/** "Only Hall of Fame and Veterans members" — built from whichever tiers currently have an allowance, not a fixed pair. */
export async function getEligibleGuestSponsorLabel(): Promise<string> {
  const allowances = await getTierGuestAllowances();
  const eligible = TIER_ORDER.filter((t) => allowances[t] > 0).map((t) => TIER_LABELS[t]);
  if (eligible.length === 0) return "No";
  if (eligible.length === 1) return eligible[0];
  return `${eligible.slice(0, -1).join(", ")} and ${eligible[eligible.length - 1]}`;
}

export type GuestRequestStatus = "pending" | "approved" | "denied";

export type GuestRequest = {
  id: string;
  game_id: string;
  sponsor_account_id: string;
  sponsor_name: string;
  guest_name: string;
  guest_phone: string;
  status: GuestRequestStatus;
  requested_at: string;
  decided_at: string | null;
};

const REQUEST_FIELDS = `
  g.id, g.game_id, g.sponsor_account_id, s.name as sponsor_name,
  g.guest_name, g.guest_phone, g.status, g.requested_at, g.decided_at
`;

/** Counts guests who actually showed up, not just ones invited — a waitlisted or no-show guest shouldn't inflate this. */
export async function getGuestsBroughtCount(sponsorAccountId: string): Promise<number> {
  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text
    from rsvps r
    join attendance att on att.game_id = r.game_id and att.account_id = r.account_id
    where r.sponsor_account_id = ${sponsorAccountId} and att.status = 'present'
  `;
  return Number(count);
}

export async function getMonthlyGuestAllowanceStatus(
  sponsorAccountId: string
): Promise<{ remaining: number; allowance: number }> {
  const [row] = await sql<{ monthly_allowance: number; used: number }[]>`
    select
      coalesce(tgs.monthly_allowance, 0) as monthly_allowance,
      (
        select count(*)::int
        from guest_requests gr
        where gr.sponsor_account_id = a.id
          and gr.status in ('pending', 'approved')
          and gr.requested_at >= ${currentMonthStartUtc().toISOString()}
      ) as used
    from accounts a
    left join tier_guest_settings tgs on tgs.tier = a.tier
    where a.id = ${sponsorAccountId}
  `;
  const allowance = row?.monthly_allowance ?? 0;
  return { remaining: Math.max(0, allowance - (row?.used ?? 0)), allowance };
}

export async function listMyGuestRequests(sponsorAccountId: string): Promise<GuestRequest[]> {
  return sql<GuestRequest[]>`
    select ${sql.unsafe(REQUEST_FIELDS)}
    from guest_requests g
    join accounts s on s.id = g.sponsor_account_id
    where g.sponsor_account_id = ${sponsorAccountId}
    order by g.requested_at desc
  `;
}

export async function listPendingGuestRequests(): Promise<GuestRequest[]> {
  return sql<GuestRequest[]>`
    select ${sql.unsafe(REQUEST_FIELDS)}
    from guest_requests g
    join accounts s on s.id = g.sponsor_account_id
    where g.status = 'pending'
    order by g.requested_at asc
  `;
}

export async function listRecentGuestDecisions(limit = 10): Promise<GuestRequest[]> {
  return sql<GuestRequest[]>`
    select ${sql.unsafe(REQUEST_FIELDS)}
    from guest_requests g
    join accounts s on s.id = g.sponsor_account_id
    where g.status != 'pending'
    order by g.decided_at desc
    limit ${limit}
  `;
}

export async function requestGuestInvite(fields: {
  gameId: string;
  sponsorAccountId: string;
  guestName: string;
  /** Optional — most guests never give the sponsor a number, and none is required to play. */
  guestPhone: string;
}): Promise<{ error?: string }> {
  const { remaining } = await getMonthlyGuestAllowanceStatus(fields.sponsorAccountId);
  if (remaining <= 0) return { error: "You're out of guest invites for this month." };

  await sql`
    insert into guest_requests (game_id, sponsor_account_id, guest_name, guest_phone)
    values (${fields.gameId}, ${fields.sponsorAccountId}, ${fields.guestName.trim()}, ${normalizePhone(fields.guestPhone)})
  `;
  return {};
}

/**
 * Finds an existing GUEST-tier account by phone (a repeat guest, invited before), or creates a
 * fresh one. The match is deliberately scoped to tier = 'guest' — matching any tier would let a
 * phone number that happens to belong to a real member (the sponsor's own, say, or a typo)
 * silently reuse that member's account instead of adding a new roster entry, which surfaces as
 * "the guest never got added" with no error at all. When no phone was given, skips the lookup
 * entirely and always creates a new account with a synthetic placeholder — `accounts.phone` is
 * unique and not null, so a blank number can't be stored as-is without colliding.
 */
async function findOrCreateGuestAccount(tx: TransactionSql, name: string, phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  if (normalized) {
    const [existing] = await tx<{ id: string }[]>`
      select id from accounts where phone = ${normalized} and tier = 'guest'
    `;
    if (existing) return existing.id;
  }

  const [created] = await tx<{ id: string }[]>`
    insert into accounts (name, phone, tier)
    values (${name}, ${normalized || `guest-${randomUUID()}`}, 'guest')
    returning id
  `;
  return created.id;
}

export type ApproveResult = { status: RsvpStatus };

export async function approveGuestRequest(requestId: string, adminId: string): Promise<ApproveResult> {
  return sql.begin(async (tx) => {
    const [request] = await tx<{ game_id: string; sponsor_account_id: string; guest_name: string; guest_phone: string }[]>`
      select game_id, sponsor_account_id, guest_name, guest_phone
      from guest_requests where id = ${requestId} and status = 'pending'
      for update
    `;
    if (!request) throw new Error("Guest request not found or already decided");

    // Lock the game row so this participates in the same cap-check serialization as claimSpot.
    await tx`select id from games where id = ${request.game_id} for update`;

    const guestAccountId = await findOrCreateGuestAccount(tx, request.guest_name, request.guest_phone);
    const { status } = await insertRsvpRespectingCap(tx, request.game_id, guestAccountId, request.sponsor_account_id);

    const [rsvpRow] = await tx<{ id: string }[]>`
      select id from rsvps where game_id = ${request.game_id} and account_id = ${guestAccountId}
    `;

    await tx`
      update guest_requests set
        status = 'approved', decided_at = now(), decided_by = ${adminId},
        resulting_account_id = ${guestAccountId}, resulting_rsvp_id = ${rsvpRow?.id ?? null}
      where id = ${requestId}
    `;

    return { status };
  });
}

export async function denyGuestRequest(requestId: string, adminId: string): Promise<void> {
  await sql`
    update guest_requests set status = 'denied', decided_at = now(), decided_by = ${adminId}
    where id = ${requestId} and status = 'pending'
  `;
}
