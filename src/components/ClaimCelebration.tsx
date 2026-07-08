"use client";

import { useEffect, useState } from "react";

const PARTICLES = [
  { tx: 0, ty: -46, color: "#FFC72C" },
  { tx: 32, ty: -32, color: "#FFC72C" },
  { tx: 46, ty: 0, color: "#f4efe2" },
  { tx: 32, ty: 32, color: "#FFC72C" },
  { tx: 0, ty: 46, color: "#FFC72C" },
  { tx: -32, ty: 32, color: "#f4efe2" },
  { tx: -46, ty: 0, color: "#FFC72C" },
  { tx: -32, ty: -32, color: "#FFC72C" },
];

/** Plays once per confirmed spot — tracked in localStorage so refreshing the home page doesn't replay it. */
export function ClaimCelebration({
  gameId,
  accountId,
  subline,
}: {
  gameId: string;
  accountId: string;
  subline?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `sr-celebrated:${gameId}:${accountId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
    const timeout = setTimeout(() => setShow(false), 1750);
    return () => clearTimeout(timeout);
  }, [gameId, accountId]);

  if (!show) return null;

  return (
    <div className="claim-backdrop pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-navy/55">
      <div className="relative h-[170px] w-[190px]">
        <svg
          className="absolute left-1/2 top-0 -translate-x-1/2"
          width="72"
          height="60"
          viewBox="0 0 72 60"
          fill="none"
        >
          <ellipse className="rim-flash" cx="36" cy="10" rx="30" ry="6" stroke="#e8542a" strokeWidth="4" />
          <g className="net-flutter" stroke="#f4efe2" strokeWidth="1.3" opacity="0.85">
            <path d="M9 10 L17 42" />
            <path d="M20 10 L25 44" />
            <path d="M30 10 L31 46" />
            <path d="M42 10 L41 46" />
            <path d="M52 10 L47 44" />
            <path d="M63 10 L55 42" />
            <path d="M13 22 L59 22" opacity="0.6" />
            <path d="M17 33 L55 33" opacity="0.6" />
          </g>
        </svg>

        <div className="claim-ring absolute left-1/2 top-[10px] h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-gold" />

        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="claim-particle absolute left-1/2 top-[10px] h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: p.color, "--tx": `${p.tx}px`, "--ty": `${p.ty}px` } as React.CSSProperties}
          />
        ))}

        <svg className="basketball-arc" width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" fill="#e8742a" stroke="#3a1f0d" strokeWidth="1" />
          <path
            d="M1 11H21M11 1V21M4.3 4.3C7 7 7 15 4.3 17.7M17.7 4.3C15 7 15 15 17.7 17.7"
            stroke="#3a1f0d"
            strokeWidth="1"
          />
        </svg>

        <div className="claim-pop absolute left-1/2 top-[80px] flex -translate-x-1/2 flex-col items-center gap-0.5 text-center">
          <span className="whitespace-nowrap font-display text-[28px] leading-none tracking-wide text-gold">
            YOU&apos;RE IN!
          </span>
          {subline && <span className="whitespace-nowrap text-[12px] font-bold text-cream">{subline}</span>}
        </div>
      </div>
    </div>
  );
}
