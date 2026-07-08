"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitGuestRequestAction, type GuestRequestFormState } from "@/app/actions/guests";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";

const initialState: GuestRequestFormState = {};

export function GuestRequestForm({ gameId, remaining }: { gameId: string; remaining: number }) {
  const [state, formAction, pending] = useActionState(submitGuestRequestAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const outOfInvites = remaining <= 0;

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-navy/30 bg-card p-[18px]"
    >
      <input type="hidden" name="gameId" value={gameId} />
      <Field label="GUEST'S NAME" name="guestName" placeholder="e.g. Terrence H." disabled={outOfInvites} />
      <Field
        label="GUEST'S PHONE"
        name="guestPhone"
        type="tel"
        placeholder="(555) 000-0000"
        disabled={outOfInvites}
      />
      <PillButton type="submit" variant={outOfInvites ? "muted" : "gold"} disabled={outOfInvites || pending} className="mt-1">
        {outOfInvites ? "NO INVITES LEFT" : pending ? "SENDING…" : "SEND FOR APPROVAL"}
      </PillButton>
      {state.error && <span className="text-center text-[11px] font-semibold text-danger">{state.error}</span>}
      {state.success && (
        <span className="text-center text-[11px] font-semibold text-navy">
          Sent — waiting on commissioner approval.
        </span>
      )}
    </form>
  );
}
