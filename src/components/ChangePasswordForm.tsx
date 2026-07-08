"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/app/actions/account";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-[16px] border-[1.5px] border-navy/30 bg-card p-4"
    >
      <Field label="CURRENT PASSWORD" name="currentPassword" type="password" required />
      <Field label="NEW PASSWORD" name="newPassword" type="password" placeholder="At least 6 characters" required />
      <PillButton type="submit" variant="navy" disabled={pending}>
        {pending ? "SAVING…" : "UPDATE PASSWORD"}
      </PillButton>
      {state.error && <span className="text-center text-[11px] font-semibold text-danger">{state.error}</span>}
      {state.success && <span className="text-center text-[11px] font-semibold text-navy">Password updated.</span>}
    </form>
  );
}
