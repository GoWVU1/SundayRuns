import { HTMLAttributes } from "react";

type Tone = "light" | "dark";

export function Card({
  tone = "light",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    light: "bg-card border-[1.5px] border-navy/30",
    dark: "bg-navy-light border border-gold/30",
  };
  return <div className={`rounded-[20px] p-5 ${tones[tone]} ${className}`} {...props} />;
}
