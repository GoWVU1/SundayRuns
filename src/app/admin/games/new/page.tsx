import Link from "next/link";
import { listAccounts } from "@/lib/accounts";
import { getGameTemplates, getTierUnlockSettings, resolveTierUnlockInputs } from "@/lib/games";
import { nextSunday6pmUtc, utcToLocalInput } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GameFormFields } from "@/components/GameFormFields";
import { PillSubmitButton } from "@/components/SubmitButton";
import { createGameAction } from "@/app/actions/games";

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template: templateParam } = await searchParams;
  const [accounts, templates, globalUnlocks] = await Promise.all([
    listAccounts(),
    getGameTemplates(),
    getTierUnlockSettings(),
  ]);
  const members = accounts.map((a) => ({ id: a.id, name: a.name, tier: a.tier }));

  const templateSlot = Number(templateParam);
  const chosen = templates.find((t) => t.slot === templateSlot) ?? null;
  const defaultStartsAt = nextSunday6pmUtc();
  const tierUnlockInputs = resolveTierUnlockInputs(
    defaultStartsAt,
    chosen?.tier_unlocks ?? globalUnlocks
  );

  return (
    <>
      <Header title="NEW GAME" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 p-5">
          {templates.length > 0 && (
            <div className="flex gap-2.5">
              {templates.map((t) => (
                <Link
                  key={t.slot}
                  href={`/admin/games/new?template=${t.slot}`}
                  prefetch={false}
                  className={`flex-1 rounded-[14px] border-[1.5px] p-3 text-center ${
                    chosen?.slot === t.slot ? "border-navy bg-navy text-cream" : "border-navy/25 text-navy"
                  }`}
                >
                  <span className="text-xs font-extrabold tracking-wide">{t.name.toUpperCase()}</span>
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                    Cap {t.cap} · {t.visibility === "restricted" ? "Restricted" : "Standard"}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <form action={createGameAction} className="flex flex-col gap-3.5">
            <GameFormFields
              key={chosen?.slot ?? "blank"}
              defaultStartsAt={utcToLocalInput(defaultStartsAt)}
              defaultLocation={chosen?.location ?? ""}
              defaultAddress={chosen?.address ?? ""}
              defaultCap={chosen?.cap ?? 16}
              defaultIsOpen={true}
              defaultVisibility={chosen?.visibility ?? "standard"}
              defaultVisibleTiers={chosen?.visible_tiers ?? []}
              defaultVisibleAccountIds={[]}
              defaultUseCustomUnlocks={chosen?.tier_unlocks !== null && chosen?.tier_unlocks !== undefined}
              defaultTierUnlockInputs={tierUnlockInputs}
              members={members}
            />
            <PillSubmitButton pendingLabel="CREATING…" className="mt-1.5">
              CREATE GAME
            </PillSubmitButton>
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
