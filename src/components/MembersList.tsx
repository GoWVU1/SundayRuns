"use client";

import { useMemo, useState } from "react";
import { MemberRow, type PublicMember } from "@/components/MemberRow";

export function MembersList({
  members,
  currentAccountId,
  adminCount,
}: {
  members: PublicMember[];
  currentAccountId: string;
  adminCount: number;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    const digits = q.replace(/\D/g, "");
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || (digits.length > 0 && m.phone.includes(digits))
    );
  }, [members, query]);

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search members..."
        className="w-full rounded-full border-[1.5px] border-navy/25 bg-card px-4 py-[11px] text-sm text-navy outline-none focus:border-navy/50"
      />
      <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
        {filtered.length === 0 && (
          <div className="px-3.5 py-4 text-center text-xs text-muted">No members match that search.</div>
        )}
        {filtered.map((m) => (
          <MemberRow key={m.id} member={m} isSelf={m.id === currentAccountId} adminCount={adminCount} />
        ))}
      </div>
      <span className="text-center text-[11px] text-muted">
        Tap a member to change their tier, nickname, password, or account settings
      </span>
    </>
  );
}
