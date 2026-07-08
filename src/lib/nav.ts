import type { Account } from "@/lib/accounts";
import { canSponsorGuest } from "@/lib/tiers";

// "ACCOUNT" isn't a bottom-nav tab (reached via the header avatar instead) — it's
// a valid `active` value purely so that page doesn't force one of the real tabs lit.
export type MemberNavLabel = "HOME" | "GUESTS" | "FANTASY" | "ADMIN" | "ACCOUNT";

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
