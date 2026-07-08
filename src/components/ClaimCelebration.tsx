"use client";

import { useEffect, useState } from "react";

const PARTICLES = [
  { tx: -70, ty: -90, rot: -40, delay: 0, color: "var(--color-gold)" },
  { tx: 60, ty: -100, rot: 50, delay: 0.04, color: "var(--color-cream)" },
  { tx: -100, ty: -30, rot: -80, delay: 0.08, color: "var(--color-gold)" },
  { tx: 90, ty: -40, rot: 70, delay: 0.02, color: "var(--color-danger-light)" },
  { tx: -40, ty: -110, rot: -20, delay: 0.1, color: "var(--color-cream)" },
  { tx: 40, ty: -115, rot: 30, delay: 0.06, color: "var(--color-gold)" },
  { tx: -85, ty: -75, rot: -60, delay: 0.12, color: "var(--color-danger-light)" },
  { tx: 80, ty: -85, rot: 60, delay: 0.02, color: "var(--color-gold)" },
];

/** Plays once per confirmed spot — tracked in localStorage so refreshing the home page doesn't replay it. */
export function ClaimCelebration({ gameId, accountId }: { gameId: string; accountId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `sr-celebrated:${gameId}:${accountId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
    const timeout = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(timeout);
  }, [gameId, accountId]);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="confetti-particle absolute h-2 w-2 rounded-sm"
          style={
            {
              backgroundColor: p.color,
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
      <span className="claim-pop font-display text-[30px] tracking-wide text-gold">YOU&apos;RE IN!</span>
    </div>
  );
}
