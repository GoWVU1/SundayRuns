import "server-only";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";
import { normalizePhone } from "@/lib/accounts";
import { insertRsvpRespectingCap, type RsvpStatus } from "@/lib/rsvps";
import { currentMonthStartUtc } from "@/lib/time";

const MONTHLY_GUEST_ALLOWANCE = 2;

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

export async function getGuestsBroughtCount(sponsorAccountId: string): Promise<number> {
  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text from rsvps where sponsor_account_id = ${sponsorAccountId}
  `;
  return Number(count);
}

export async function getMonthlyGuestAllowanceRemaining(sponsorAccountId: string): Promise<number> {
  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text from guest_requests
    where sponsor_account_id = ${sponsorAccountId}
      and status in ('pending', 'approved')
      and requested_at >= ${currentMonthStartUtc().toISOString()}
  `;
  return Math.max(0, MONTHLY_GUEST_ALLOWANCE - Number(count));
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
  guestPhone: string;
}): Promise<{ error?: string }> {
  const remaining = await getMonthlyGuestAllowanceRemaining(fields.sponsorAccountId);
  if (remaining <= 0) return { error: "You're out of guest invites for this month." };

  await sql`
    insert into guest_requests (game_id, sponsor_account_id, guest_name, guest_phone)
    values (${fields.gameId}, ${fields.sponsorAccountId}, ${fields.guestName.trim()}, ${normalizePhone(fields.guestPhone)})
  `;
  return {};
}

/** Finds an existing account by phone (any tier — a "guest" may already be a real member), or creates a fresh guest account. */
async function findOrCreateGuestAccount(tx: TransactionSql, name: string, phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  const [existing] = await tx<{ id: string }[]>`select id from accounts where phone = ${normalized}`;
  if (existing) return existing.id;

  const [created] = await tx<{ id: string }[]>`
    insert into accounts (name, phone, tier)
    values (${name}, ${normalized}, 'guest')
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
