import "server-only";
import { sql } from "@/lib/db";

export async function getGoatAccountIds(): Promise<string[]> {
  const rows = await sql<{ account_id: string }[]>`select account_id from goat_accounts`;
  return rows.map((r) => r.account_id);
}

export async function setGoatAccountIds(accountIds: string[]): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from goat_accounts`;
    if (accountIds.length > 0) {
      await tx`insert into goat_accounts ${tx(accountIds.map((account_id) => ({ account_id })))}`;
    }
  });
}

export async function getGoatVisibleAccountIds(): Promise<string[]> {
  const rows = await sql<{ account_id: string }[]>`select account_id from goat_visible_accounts`;
  return rows.map((r) => r.account_id);
}

export async function setGoatVisibleAccountIds(accountIds: string[]): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from goat_visible_accounts`;
    if (accountIds.length > 0) {
      await tx`insert into goat_visible_accounts ${tx(accountIds.map((account_id) => ({ account_id })))}`;
    }
  });
}

/**
 * Whether this viewer is allowed to see GOAT tags at all. Deliberately not
 * tied to whether the viewer is themselves tagged — being GOAT doesn't grant
 * you visibility into your own tag.
 */
export async function canViewGoatTags(accountId: string): Promise<boolean> {
  const [row] = await sql`select 1 from goat_visible_accounts where account_id = ${accountId}`;
  return !!row;
}
