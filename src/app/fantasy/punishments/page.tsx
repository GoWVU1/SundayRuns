import { requireAccount } from "@/lib/auth";
import { getCurrentLoser, getOffLimitsPunishments, PUNISHMENTS } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { memberNavItems } from "@/lib/nav";
import { pickPunishmentAction } from "@/app/actions/fantasy";

export default async function FantasyPunishmentsPage() {
  const account = await requireAccount();
  const current = await getCurrentLoser();
  const offLimits = current ? await getOffLimitsPunishments(current) : [];

  return (
    <>
      <Header title="PUNISHMENT OPTIONS" backHref="/fantasy" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          <span className="text-xs leading-relaxed text-muted">
            Five choices, per Article IV. Greyed-out picks are off-limits under Section 4.4.
            {account.is_admin && current && !current.punishment && " Tap one to set the Loser's pick."}
          </span>

          {PUNISHMENTS.map((p) => {
            const off = offLimits.find((o) => o.key === p.key);
            const selected = current?.punishment === p.key;
            const canPick = account.is_admin && !!current && !current.punishment && !off;

            const card = (
              <div
                className="flex flex-col gap-1.5 rounded-2xl border-[1.5px] p-4"
                style={{
                  background: off ? "#e9e3d3" : selected ? "#fff9ea" : "#fffdf7",
                  borderColor: off ? "rgba(4,30,66,0.15)" : selected ? "#FFC72C" : "rgba(4,30,66,0.3)",
                }}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span
                    className="font-display text-base"
                    style={{ color: off ? "#9c8f6e" : "#041E42" }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="flex-shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-extrabold tracking-wide"
                    style={{
                      borderColor: off ? "#9c8f6e" : selected ? "#FFC72C" : "rgba(4,30,66,0.25)",
                      color: off ? "#9c8f6e" : selected ? "#8a6a00" : "#6b6353",
                    }}
                  >
                    {off ? "OFF LIMITS" : selected ? "SELECTED" : "AVAILABLE"}
                  </span>
                </div>
                <span className="text-xs leading-relaxed" style={{ color: off ? "#a89f89" : "#6b6353" }}>
                  {p.desc}
                </span>
                {off && <span className="text-[10px] italic text-[#a89f89]">{off.reason}</span>}
              </div>
            );

            if (!canPick) return <div key={p.key}>{card}</div>;

            return (
              <form key={p.key} action={pickPunishmentAction}>
                <input type="hidden" name="id" value={current!.id} />
                <input type="hidden" name="punishment" value={p.key} />
                <button type="submit" className="w-full text-left">
                  {card}
                </button>
              </form>
            );
          })}
        </div>
      </main>
      <BottomNav items={memberNavItems(account, "FANTASY")} />
    </>
  );
}
