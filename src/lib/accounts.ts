import "server-only";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export type Account = {
  id: string;
  name: string;
  phone: string;
  password_hash: string;
  is_admin: boolean;
  tier: string;
  created_at: string;
};

export function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "");
}

export async function findAccountByPhone(phone: string) {
  const rows = await sql<Account[]>`
    select id, name, phone, password_hash, is_admin, tier, created_at
    from accounts where phone = ${normalizePhone(phone)}
  `;
  return rows[0] ?? null;
}

export async function createAccount(name: string, phone: string, password: string) {
  const passwordHash = await hashPassword(password);
  const rows = await sql<Account[]>`
    insert into accounts (name, phone, password_hash)
    values (${name.trim()}, ${normalizePhone(phone)}, ${passwordHash})
    returning id, name, phone, password_hash, is_admin, tier, created_at
  `;
  return rows[0];
}

export async function listAccounts() {
  return sql<Account[]>`
    select id, name, phone, password_hash, is_admin, tier, created_at
    from accounts order by name asc
  `;
}

export async function setAccountPassword(accountId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await sql`update accounts set password_hash = ${passwordHash} where id = ${accountId}`;
}

export async function setAccountAdmin(accountId: string, isAdmin: boolean) {
  await sql`update accounts set is_admin = ${isAdmin} where id = ${accountId}`;
}

export async function countAccounts() {
  const [{ count }] = await sql<{ count: string }[]>`select count(*)::text from accounts`;
  return Number(count);
}
