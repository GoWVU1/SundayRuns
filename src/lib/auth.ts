import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { Account } from "@/lib/accounts";

const SESSION_DAYS = 90;
export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "sr_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(accountId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const [session] = await sql<{ id: string }[]>`
    insert into sessions (account_id, expires_at)
    values (${accountId}, ${expiresAt.toISOString()})
    returning id
  `;
  const jar = await cookies();
  jar.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await sql`delete from sessions where id = ${token}`;
  }
  jar.delete(COOKIE_NAME);
}

/** Shared by getSessionAccount() (Server Components/Actions) and proxy.ts (which reads request.cookies instead of next/headers). */
export async function getAccountForToken(token: string | undefined): Promise<Account | null> {
  if (!token) return null;
  const rows = await sql<Account[]>`
    select a.id, a.name, a.phone, a.password_hash, a.is_admin, a.tier, a.fantasy_member, a.created_at
    from sessions s
    join accounts a on a.id = s.account_id
    where s.id = ${token} and s.expires_at > now()
  `;
  return rows[0] ?? null;
}

export async function getSessionAccount(): Promise<Account | null> {
  const jar = await cookies();
  return getAccountForToken(jar.get(COOKIE_NAME)?.value);
}

/** Server Action guard: any logged-in account. Redirects to /login otherwise. */
export async function requireAccount(): Promise<Account> {
  const account = await getSessionAccount();
  if (!account) redirect("/login");
  return account;
}

/** Server Action guard: admin only. Redirects non-admins home, unauthenticated to /login. */
export async function requireAdmin(): Promise<Account> {
  const account = await requireAccount();
  if (!account.is_admin) redirect("/");
  return account;
}
