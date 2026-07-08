"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <form action={formAction} className="flex flex-col gap-6 px-7 pt-11 pb-9">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={168} />
          <span className="text-[11px] font-bold tracking-[3px] text-muted">MEMBERS ONLY</span>
        </div>

        <div className="flex flex-col gap-3.5">
          <Field label="PHONE NUMBER" name="phone" type="tel" placeholder="(555) 000-0000" required />
          <Field label="PASSWORD" name="password" type="password" placeholder="••••••••" required />
          {state.error && <p className="text-center text-[12px] font-semibold text-danger">{state.error}</p>}
          <PillButton type="submit" disabled={pending} className="mt-1">
            {pending ? "CHECKING IN…" : "CHECK IN"}
          </PillButton>
        </div>

        <div className="flex flex-col gap-2 text-center">
          <span className="text-xs text-muted">
            New to the run?{" "}
            <Link href="/signup" className="font-bold text-[#8a6a00]">
              Create an account
            </Link>
          </span>
          <span className="text-[11px] text-muted/80">
            Forgot your password? Text the commissioner — he&apos;ll reset it.
          </span>
        </div>
      </form>
    </div>
  );
}
