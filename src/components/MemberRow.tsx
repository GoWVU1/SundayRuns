"use client";

import { useActionState } from "react";
import { resetPasswordAction, setAdminAction, type ResetPasswordState } from "@/app/actions/admin";
import { TagButton } from "@/components/Button";

export type PublicMember = {
  id: string;
  name: string;
  phone: string;
  is_admin: boolean;
};

const initialState: ResetPasswordState = {};

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
            const fd = new FormData();
            fd.set("accountId", member.id);
            fd.set("makeAdmin", (!member.is_admin).toString());
            await setAdminAction(fd);
          }}
        >
          {member.is_admin ? "ADMIN" : "MEMBER"}
        </TagButton>
        <span className="text-xs font-extrabold tracking-wide text-muted">RESET ▾</span>
      </summary>

      <form action={formAction} className="flex flex-col gap-2 px-3.5 pb-3.5">
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
    </details>
  );
}
