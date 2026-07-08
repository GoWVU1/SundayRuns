"use client";

import { useActionState } from "react";
import { deleteOwnAccountAction, type DeleteAccountState } from "@/app/actions/account";
import { Field } from "@/components/Field";
import { TagButton } from "@/components/Button";

const initialState: DeleteAccountState = {};

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteOwnAccountAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Delete your account? This can't be undone — you'll lose your spot and RSVP history.")) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-3 rounded-[16px] border border-danger/40 bg-card p-4"
    >
      <span className="text-xs font-bold text-danger">DELETE MY ACCOUNT</span>
      <span className="text-[11px] leading-relaxed text-muted">
        Permanent and can&apos;t be undone. Enter your password to confirm.
      </span>
      <Field label="PASSWORD" name="password" type="password" required />
      <TagButton type="submit" variant="danger" disabled={pending} className="w-full py-3">
        {pending ? "DELETING…" : "DELETE MY ACCOUNT"}
      </TagButton>
      {state.error && <span className="text-center text-[11px] font-semibold text-danger">{state.error}</span>}
    </form>
  );
}
