"use client";

import { useActionState } from "react";
import {
  resetPasswordAction,
  setAdminAction,
  setFantasyMemberAction,
  setTierAction,
  type ResetPasswordState,
} from "@/app/actions/admin";
import { TagButton } from "@/components/Button";
import { TIER_ORDER, TIER_LABELS } from "@/lib/tiers";

export type PublicMember = {
  id: string;
  name: string;
  phone: string;
  is_admin: boolean;
  tier: string;
  fantasy_member: boolean;
};

const initialState: ResetPasswordState = {};

async function callAction(action: (fd: FormData) => Promise<void>, fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  await action(fd);
}

export function MemberRow({ member, isSelf }: { member: PublicMember; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <details className="border-b border-navy/10 last:border-b-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-bold text-navy">{member.name}</span>
          <span className="text-[11px] text-muted">{member.phone}</span>
        </div>
        <TagButton
          type="button"
          variant={member.is_admin ? "gold" : "neutral"}
          disabled={isSelf && member.is_admin}
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await callAction(setAdminAction, { accountId: member.id, makeAdmin: (!member.is_admin).toString() });
          }}
        >
          {member.is_admin ? "ADMIN" : "MEMBER"}
        </TagButton>
        <span className="text-xs font-extrabold tracking-wide text-muted">RESET ▾</span>
      </summary>

      <div className="flex flex-col gap-3 px-3.5 pb-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold tracking-[2px] text-muted">TIER</span>
          <div className="flex gap-1.5">
            {TIER_ORDER.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => callAction(setTierAction, { accountId: member.id, tier })}
                className={`flex-1 rounded-full border-[1.5px] py-1.5 text-[10px] font-extrabold tracking-wide ${
                  member.tier === tier ? "border-navy bg-navy text-cream" : "border-navy/25 text-navy"
                }`}
              >
                {TIER_LABELS[tier]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-[10px] border border-navy/20 bg-cream px-3 py-2.5">
          <span className="text-xs font-semibold text-navy">Fantasy Football member</span>
          <input
            type="checkbox"
            defaultChecked={member.fantasy_member}
            onChange={(e) =>
              callAction(setFantasyMemberAction, {
                accountId: member.id,
                fantasyMember: e.target.checked.toString(),
              })
            }
            className="h-4 w-4 accent-navy"
          />
        </label>

        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="accountId" value={member.id} />
          <div className="flex gap-2">
            <input
              name="newPassword"
              type="password"
              placeholder="New password (min. 6 characters)"
              className="w-full flex-1 rounded-[10px] border border-navy/20 bg-cream px-3 py-2.5 text-sm text-navy outline-none focus:border-navy/50"
            />
            <button
              type="submit"
              disabled={pending}
              className="flex-shrink-0 rounded-[10px] bg-navy px-4 py-2.5 text-xs font-extrabold tracking-wide text-cream disabled:opacity-60"
            >
              {pending ? "SAVING…" : "SAVE"}
            </button>
          </div>
          {state.error && <span className="text-[11px] font-semibold text-danger">{state.error}</span>}
          {state.success && (
            <span className="text-[11px] font-semibold text-success">
              Password updated — tell {member.name.split(" ")[0]} their new one.
            </span>
          )}
        </form>
      </div>
    </details>
  );
}
