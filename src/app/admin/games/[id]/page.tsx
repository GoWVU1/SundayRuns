import { notFound } from "next/navigation";
import { getGameAllowlist, getGameById } from "@/lib/games";
import { listAccounts } from "@/lib/accounts";
import { utcToLocalInput } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GameFormFields } from "@/components/GameFormFields";
import { PillButton } from "@/components/Button";
import { updateGameAction } from "@/app/actions/games";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, allowlist, accounts] = await Promise.all([
    getGameById(id),
    getGameAllowlist(id),
    listAccounts(),
  ]);
  if (!game) notFound();

  const members = accounts.map((a) => ({ id: a.id, name: a.name, tier: a.tier }));

  return (
    <>
      <Header title="EDIT GAME" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <form action={updateGameAction} className="flex flex-col gap-3.5 p-5">
          <input type="hidden" name="gameId" value={game.id} />
          <GameFormFields
            defaultStartsAt={utcToLocalInput(game.starts_at)}
            defaultLocation={game.location}
            defaultCap={game.cap}
            defaultVisibility={game.visibility}
            defaultVisibleTiers={allowlist.tiers}
            defaultVisibleAccountIds={allowlist.accountIds}
            members={members}
          />
          <PillButton type="submit" className="mt-1.5">
            SAVE CHANGES
          </PillButton>
        </form>
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
