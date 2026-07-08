import type { Account } from "@/lib/accounts";
import { canSponsorGuest } from "@/lib/tiers";

export type MemberNavLabel = "HOME" | "GUESTS" | "FANTASY" | "ADMIN";

export function memberNavItems(account: Account, active: MemberNavLabel) {
  return [
    { label: "HOME", href: "/", active: active === "HOME" },
    ...(canSponsorGuest(account.tier)
      ? [{ label: "GUESTS", href: "/guests/new", active: active === "GUESTS" }]
      : []),
    ...(account.fantasy_member ? [{ label: "FANTASY", href: "/fantasy", active: active === "FANTASY" }] : []),
    ...(account.is_admin ? [{ label: "ADMIN", href: "/admin", active: active === "ADMIN" }] : []),
  ];
}
