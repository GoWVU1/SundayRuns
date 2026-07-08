import "server-only";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { RankedTier } from "@/lib/tiers";

const ACCOUNT_FIELDS =
  "id, name, first_name, last_name, phone, password_hash, is_admin, tier, fantasy_member, created_at";

export type Account = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  /** Null for guest accounts — they never self-serve signup, so they have no password. */
  password_hash: string | null;
  is_admin: boolean;
  tier: string;
  fantasy_member: boolean;
  created_at: string;
};

export function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "");
}

/** Two-letter initials for the avatar badge — falls back to splitting the display name for guest-created accounts. */
export function getInitials(account: Pick<Account, "first_name" | "last_name" | "name">): string {
  if (account.first_name && account.last_name) {
    return (account.first_name[0] + account.last_name[0]).toUpperCase();
  }
  const parts = account.name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export async function findAccountByPhone(phone: string) {
  const rows = await sql<Account[]>`
    select ${sql.unsafe(ACCOUNT_FIELDS)} from accounts where phone = ${normalizePhone(phone)}
  `;
  return rows[0] ?? null;
}

export async function findAccountById(accountId: string) {
  const rows = await sql<Account[]>`
    select ${sql.unsafe(ACCOUNT_FIELDS)} from accounts where id = ${accountId}
  `;
  return rows[0] ?? null;
}

export async function createAccount(firstName: string, lastName: string, phone: string, password: string) {
  const passwordHash = await hashPassword(password);
  const first = firstName.trim();
  const last = lastName.trim();
  const displayName = `${first} ${last.charAt(0)}.`;
  const rows = await sql<Account[]>`
    insert into accounts (name, first_name, last_name, phone, password_hash)
    values (${displayName}, ${first}, ${last}, ${normalizePhone(phone)}, ${passwordHash})
    returning ${sql.unsafe(ACCOUNT_FIELDS)}
  `;
  return rows[0];
}

export async function listAccounts() {
  return sql<Account[]>`
    select ${sql.unsafe(ACCOUNT_FIELDS)} from accounts where tier != 'guest' order by name asc
  `;
}

export async function setAccountPassword(accountId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await sql`update accounts set password_hash = ${passwordHash} where id = ${accountId}`;
}

export async function setAccountAdmin(accountId: string, isAdmin: boolean) {
  await sql`update accounts set is_admin = ${isAdmin} where id = ${accountId}`;
}

export async function setAccountTier(accountId: string, tier: RankedTier) {
  await sql`update accounts set tier = ${tier} where id = ${accountId}`;
}

export async function setAccountFantasyMember(accountId: string, fantasyMember: boolean) {
  await sql`update accounts set fantasy_member = ${fantasyMember} where id = ${accountId}`;
}

export async function countAccounts() {
  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text from accounts where tier != 'guest'
  `;
  return Number(count);
}
