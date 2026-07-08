"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthFormState } from "@/app/actions/auth";
import { HeaderMark } from "@/components/Logo";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";

const initialState: AuthFormState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <div className="flex items-center gap-3 bg-navy px-5 py-3.5">
        <Link href="/login" className="font-display text-xl text-gold">
          ←
        </Link>
        <HeaderMark />
        <span className="font-display text-lg tracking-wide text-cream">JOIN THE RUN</span>
      </div>
      <div className="h-1 bg-gold" />

      <form action={formAction} className="flex flex-col gap-4 px-5 pt-5 pb-6">
        <p className="text-[13px] leading-relaxed text-muted">
          Your phone number is your username. No codes, no emails — just pick a password you&apos;ll
          remember.
        </p>

        <div className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-navy/30 bg-card p-[18px]">
          <div className="flex gap-3">
            <Field label="FIRST NAME" name="firstName" placeholder="Jackson" required className="flex-1" />
            <Field label="LAST NAME" name="lastName" placeholder="Noland" required className="flex-1" />
          </div>
          <Field label="PHONE NUMBER" name="phone" type="tel" placeholder="(555) 000-0000" required />
          <Field
            label="CHOOSE A PASSWORD"
            name="password"
            type="password"
            placeholder="At least 6 characters"
            required
          />
          {state.error && <p className="text-center text-[12px] font-semibold text-danger">{state.error}</p>}
          <PillButton type="submit" disabled={pending} className="mt-1">
            {pending ? "SIGNING UP…" : "SIGN ME UP"}
          </PillButton>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-navy/25 px-[15px] py-[13px]">
          <span className="font-display text-2xl text-[#8a6a00]">!</span>
          <span className="text-xs leading-relaxed text-muted">
            The commissioner can see everyone who signs up and can promote trusted regulars to admin
            whenever it makes sense.
          </span>
        </div>
      </form>
    </div>
  );
}
