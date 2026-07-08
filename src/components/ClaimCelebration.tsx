"use client";

import { useEffect, useState } from "react";

/** Plays once per confirmed spot — tracked in localStorage so refreshing the home page doesn't replay it. */
export function ClaimCelebration({ gameId, accountId }: { gameId: string; accountId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `sr-celebrated:${gameId}:${accountId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
    const timeout = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(timeout);
  }, [gameId, accountId]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center">
      <div className="relative h-[150px] w-[190px]">
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

        <svg className="basketball-arc" width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" fill="#e8742a" stroke="#3a1f0d" strokeWidth="1" />
          <path
            d="M1 11H21M11 1V21M4.3 4.3C7 7 7 15 4.3 17.7M17.7 4.3C15 7 15 15 17.7 17.7"
            stroke="#3a1f0d"
            strokeWidth="1"
          />
        </svg>

        <span className="claim-pop absolute left-1/2 top-[74px] -translate-x-1/2 whitespace-nowrap font-display text-[26px] tracking-wide text-gold">
          SWISH!
        </span>
      </div>
    </div>
  );
}
