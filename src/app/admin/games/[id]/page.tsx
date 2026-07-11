import { notFound } from "next/navigation";
import {
  getGameAllowlist,
  getGameById,
  getGameTierUnlocks,
  getTierUnlockSettings,
  resolveTierUnlockInputs,
} from "@/lib/games";
import { listAccounts } from "@/lib/accounts";
import { getRoster } from "@/lib/rsvps";
import { utcToLocalInput } from "@/lib/time";
import { getTierLabel } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GameFormFields } from "@/components/GameFormFields";
import { PillSubmitButton } from "@/components/SubmitButton";
import { adminEnrollRsvpAction, updateGameAction } from "@/app/actions/games";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, allowlist, accounts, customUnlocks, globalUnlocks, roster] = await Promise.all([
    getGameById(id),
    getGameAllowlist(id),
    listAccounts(),
    getGameTierUnlocks(id),
    getTierUnlockSettings(),
    getRoster(id),
  ]);
  if (!game) notFound();

  const members = accounts.map((a) => ({ id: a.id, name: a.name, tier: a.tier }));
  const tierUnlockInputs = customUnlocks
    ? Object.fromEntries(
        Object.entries(customUnlocks).map(([tier, opensAt]) => [tier, utcToLocalInput(opensAt)])
      ) as Record<"core" | "regular" | "extended", string>
    : resolveTierUnlockInputs(game.starts_at, globalUnlocks);

  return (
    <>
      <Header title="EDIT GAME" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <form action={updateGameAction} className="flex flex-col gap-3.5">
            <input type="hidden" name="gameId" value={game.id} />
            <GameFormFields
              defaultStartsAt={utcToLocalInput(game.starts_at)}
              defaultLocation={game.location}
              defaultAddress={game.address}
              defaultCap={game.cap}
              defaultIsOpen={game.is_open}
              defaultVisibility={game.visibility}
              defaultVisibleTiers={allowlist.tiers}
              defaultVisibleAccountIds={allowlist.accountIds}
              defaultUseCustomUnlocks={customUnlocks !== null}
              defaultTierUnlockInputs={tierUnlockInputs}
              members={members}
            />
            <PillSubmitButton pendingLabel="SAVING…" className="mt-1.5">
              SAVE CHANGES
            </PillSubmitButton>
          </form>

          <form
            action={adminEnrollRsvpAction}
            className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-gold/60 bg-card p-4"
          >
            <input type="hidden" name="gameId" value={game.id} />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold tracking-wide text-navy">MANUAL ROSTER ENROLLMENT</span>
              <span className="text-[10px] text-muted">
                Recovery tool: confirmed can intentionally override the game cap.
              </span>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">MEMBER</span>
              <select
                name="accountId"
                required
                className="w-full rounded-[10px] border border-navy/20 bg-cream px-3.5 py-3 text-sm text-navy outline-none"
              >
                <option value="">Select a member</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({getTierLabel(account.tier)})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">ROSTER STATUS</span>
              <select
                name="status"
                defaultValue="confirmed"
                className="w-full rounded-[10px] border border-navy/20 bg-cream px-3.5 py-3 text-sm text-navy outline-none"
              >
                <option value="confirmed">Confirmed</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </label>
            <PillSubmitButton pendingLabel="ADDING…" variant="navy">ADD / UPDATE MEMBER</PillSubmitButton>
            {roster.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-navy/10 pt-3">
                {roster.map((entry) => (
                  <span
                    key={entry.id}
                    className="rounded-full border border-navy/20 px-2.5 py-1 text-[10px] font-bold text-navy"
                  >
                    {entry.name} · {entry.status === "confirmed" ? "IN" : "WAIT"}
                  </span>
                ))}
              </div>
            )}
          </form>
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: true },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
