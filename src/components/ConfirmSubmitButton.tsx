"use client";

import { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

export function ConfirmSubmitButton({
  confirmMessage,
  pendingLabel = "WORKING…",
  onClick,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
