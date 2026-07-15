import type { Account } from "@/lib/accounts";
import { canSponsorGuest } from "@/lib/guests";
import { canViewIL } from "@/lib/injuries";

// "ACCOUNT" isn't a bottom-nav tab (reached via the header avatar instead) — it's
// a valid `active` value purely so that page doesn't force one of the real tabs lit.
export type MemberNavLabel = "HOME" | "IL" | "GUESTS" | "FANTASY" | "ADMIN" | "ACCOUNT";

export async function memberNavItems(account: Account, active: MemberNavLabel) {
  const [canInvite, canSeeIL] = await Promise.all([canSponsorGuest(account.tier), canViewIL(account)]);
  return [
    { label: "HOME", href: "/", active: active === "HOME" },
    ...(canSeeIL ? [{ label: "IL", href: "/il", active: active === "IL" }] : []),
    ...(canInvite ? [{ label: "GUESTS", href: "/guests/new", active: active === "GUESTS" }] : []),
    ...(account.fantasy_member ? [{ label: "FANTASY", href: "/fantasy", active: active === "FANTASY" }] : []),
    ...(account.is_admin ? [{ label: "ADMIN", href: "/admin", active: active === "ADMIN" }] : []),
  ];
}
