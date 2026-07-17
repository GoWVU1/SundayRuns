import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getGameEditData, getTierUnlockSettings, resolveTierUnlockInputs } from "@/lib/games";
import { listAccounts } from "@/lib/accounts";
import { getRoster } from "@/lib/rsvps";
import { getGoatAccountIds, canViewGoatTags } from "@/lib/goat";
import { utcToLocalInput } from "@/lib/time";
import { getTierLabel } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GameFormFields } from "@/components/GameFormFields";
import { PillSubmitButton } from "@/components/SubmitButton";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { TierBadge } from "@/components/TierBadge";
import { adminEnrollRsvpAction, adminRemoveRsvpAction, updateGameAction } from "@/app/actions/games";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [viewer, { game, allowlist, tierUnlocks: customUnlocks }, accounts, globalUnlocks, roster, goatAccountIds] =
    await Promise.all([
      requireAccount(),
      getGameEditData(id),
      listAccounts(),
      getTierUnlockSettings(),
      getRoster(id),
      getGoatAccountIds(),
    ]);
  if (!game) notFound();
  const canSeeGoat = await canViewGoatTags(viewer.id);
  const goatSet = new Set(goatAccountIds);

  const confirmed = roster.filter((r) => r.status === "confirmed");
  const waitlisted = roster.filter((r) => r.status === "waitlisted");
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

          <div className="flex flex-col gap-3.5 rounded-2xl border-[1.5px] border-navy/20 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wide text-navy">CONFIRMED ROSTER</span>
              <span className="text-[10px] font-extrabold text-muted">
                {confirmed.length}/{game.cap}
              </span>
            </div>
            {confirmed.length === 0 ? (
              <span className="text-[11px] text-muted">No one confirmed yet.</span>
            ) : (
              <div className="flex flex-col gap-1.5">
                {confirmed.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <span className="w-5 flex-shrink-0 font-display text-sm text-[#9c8f6e]">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{entry.name}</span>
                    {entry.sponsor_name && (
                      <span className="flex-shrink-0 whitespace-nowrap text-[10px] italic text-muted">
                        guest of {entry.sponsor_name}
                      </span>
                    )}
                    <TierBadge tier={entry.tier} isGoat={canSeeGoat && goatSet.has(entry.account_id)} />
                    <form action={adminRemoveRsvpAction}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <input type="hidden" name="accountId" value={entry.account_id} />
                      <ConfirmSubmitButton
                        confirmMessage={`Remove ${entry.name} from this game?`}
                        pendingLabel="…"
                        aria-label={`Remove ${entry.name}`}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-danger text-xs font-extrabold text-danger disabled:cursor-wait disabled:opacity-55"
                      >
                        ×
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ))}
              </div>
            )}

            {waitlisted.length > 0 && (
              <>
                <div className="flex items-center justify-between border-t border-navy/10 pt-3">
                  <span className="text-xs font-extrabold tracking-wide text-navy">WAITLIST</span>
                  <span className="text-[10px] font-extrabold text-muted">{waitlisted.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {waitlisted.map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-2">
                      <span className="w-5 flex-shrink-0 font-display text-sm text-[#9c8f6e]">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{entry.name}</span>
                      {entry.sponsor_name && (
                        <span className="flex-shrink-0 whitespace-nowrap text-[10px] italic text-muted">
                          guest of {entry.sponsor_name}
                        </span>
                      )}
                      <TierBadge tier={entry.tier} isGoat={canSeeGoat && goatSet.has(entry.account_id)} />
                      <form action={adminRemoveRsvpAction}>
                        <input type="hidden" name="gameId" value={game.id} />
                        <input type="hidden" name="accountId" value={entry.account_id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Remove ${entry.name} from the waitlist?`}
                          pendingLabel="…"
                          aria-label={`Remove ${entry.name}`}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-danger text-xs font-extrabold text-danger disabled:cursor-wait disabled:opacity-55"
                        >
                          ×
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

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
