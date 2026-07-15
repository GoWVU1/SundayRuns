import "server-only";
import { sql } from "@/lib/db";

export type InjuryEntry = {
  account_id: string;
  name: string;
  tier: string;
  description: string;
  started_at: string;
  expected_return: string | null;
};

/** Soonest-expected-back first; open-ended entries (no return date) sort last. */
export async function getInjuries(): Promise<InjuryEntry[]> {
  return sql<InjuryEntry[]>`
    select
      i.account_id, a.name, a.tier, i.description,
      i.started_at::text as started_at,
      i.expected_return::text as expected_return
    from injuries i
    join accounts a on a.id = i.account_id
    order by i.expected_return asc nulls last, i.started_at asc
  `;
}

/** Re-saving for the same account overwrites description/return date but keeps the original started_at. */
export async function setInjury(
  accountId: string,
  description: string,
  expectedReturn: string | null
): Promise<void> {
  await sql`
    insert into injuries (account_id, description, expected_return)
    values (${accountId}, ${description}, ${expectedReturn})
    on conflict (account_id) do update
      set description = excluded.description, expected_return = excluded.expected_return
  `;
}

export async function clearInjury(accountId: string): Promise<void> {
  await sql`delete from injuries where account_id = ${accountId}`;
}
