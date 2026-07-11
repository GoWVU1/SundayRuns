"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";
import { PillButton, TagButton } from "@/components/Button";

/** PillButton that shows immediate pending feedback for plain Server-Action forms (no useActionState involved). */
export function PillSubmitButton({
  pendingLabel = "…",
  children,
  variant,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  variant?: "gold" | "navy" | "muted";
}) {
  const { pending } = useFormStatus();
  return (
    <PillButton type="submit" variant={variant} className={className} disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </PillButton>
  );
}

/** TagButton with the same pending-feedback behavior, for smaller inline actions like cancel/leave-waitlist. */
export function TagSubmitButton({
  pendingLabel = "…",
  children,
  variant,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  variant?: "danger" | "neutral" | "gold";
}) {
  const { pending } = useFormStatus();
  return (
    <TagButton type="submit" variant={variant} className={className} disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </TagButton>
  );
}

/** Pending-aware native button for icon buttons and bespoke admin controls. */
export function ActionSubmitButton({
  pendingLabel,
  children,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${pending ? "cursor-wait opacity-55" : ""} ${className}`}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
