import { listAccounts } from "@/lib/accounts";
import { nextSunday6pmUtc, utcToLocalInput } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GameFormFields } from "@/components/GameFormFields";
import { PillButton } from "@/components/Button";
import { createGameAction } from "@/app/actions/games";

export default async function NewGamePage() {
  const accounts = await listAccounts();
  const members = accounts.map((a) => ({ id: a.id, name: a.name, tier: a.tier }));

  return (
    <>
      <Header title="NEW GAME" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <form
          action={createGameAction}
          className="flex flex-col gap-3.5 p-5"
        >
          <GameFormFields
            defaultStartsAt={utcToLocalInput(nextSunday6pmUtc())}
            defaultLocation=""
            defaultCap={16}
            defaultVisibility="standard"
            defaultVisibleTiers={[]}
            defaultVisibleAccountIds={[]}
            members={members}
          />
          <PillButton type="submit" className="mt-1.5">
            CREATE GAME
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
