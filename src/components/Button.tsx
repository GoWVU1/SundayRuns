import { ButtonHTMLAttributes } from "react";

type PillVariant = "gold" | "navy" | "muted";

export function PillButton({
  variant = "gold",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: PillVariant }) {
  const variants: Record<PillVariant, string> = {
    gold: "bg-gold text-navy py-4 font-display text-lg tracking-wide",
    navy: "bg-navy text-cream py-3.5 text-xs font-extrabold tracking-wide uppercase",
    muted: "bg-[#d8cfa8] text-navy py-4 font-display text-lg tracking-wide",
  };
  return (
    <button
      className={`w-full rounded-full text-center transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

type TagVariant = "danger" | "neutral" | "gold";

export function TagButton({
  variant = "neutral",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: TagVariant }) {
  const variants: Record<TagVariant, string> = {
    danger: "border border-danger-light text-danger-light",
    neutral: "border-[1.5px] border-navy/30 text-navy",
    gold: "bg-gold text-navy",
  };
  return (
    <button
      className={`rounded-full px-3.5 py-[7px] text-[11px] font-extrabold tracking-wide uppercase transition-opacity active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
