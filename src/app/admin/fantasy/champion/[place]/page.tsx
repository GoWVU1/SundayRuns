import { notFound } from "next/navigation";
import { getStandingByPlace, listFantasyMembers, PAYOUT_BY_PLACE } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";
import { saveChampionRecapAction } from "@/app/actions/fantasy";

const PLACE_LABEL: Record<number, string> = { 1: "CHAMPION", 2: "RUNNER-UP", 3: "THIRD PLACE" };

export default async function AdminChampionEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ place: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { place: placeRaw } = await params;
  const { year: yearRaw } = await searchParams;
  const place = Number(placeRaw);
  if (place !== 1 && place !== 2 && place !== 3) notFound();
  const year = Number(yearRaw) || new Date().getUTCFullYear();

  const [existing, members] = await Promise.all([
    getStandingByPlace(year, place as 1 | 2 | 3),
    listFantasyMembers(),
  ]);

  return (
    <>
      <Header title={`EDIT · ${PLACE_LABEL[place]}`} backHref="/admin/fantasy" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <form action={saveChampionRecapAction} className="flex flex-col gap-3 p-5">
          <input type="hidden" name="place" value={place} />
          <div className="flex gap-3">
            <Field label="YEAR" name="year" type="number" defaultValue={year} className="w-24" />
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">PAYOUT $</span>
              <div className="flex h-[46px] items-center rounded-[10px] border border-navy/20 bg-cream px-3.5 text-[15px] text-navy">
                ${PAYOUT_BY_PLACE[place as 1 | 2 | 3].toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountId" className="text-[10px] font-extrabold tracking-[2px] text-muted">
              MEMBER
            </label>
            <select
              id="accountId"
              name="accountId"
              defaultValue={existing?.accountId ?? ""}
              required
              className="w-full rounded-[10px] border border-navy/20 bg-card px-3.5 py-3 text-[15px] text-navy outline-none focus:border-navy/50"
            >
              <option value="" disabled>
                Select a fantasy member
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">SEASON RECAP</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <span className="-mt-2 text-[11px] text-muted">
            Optional — shown on the member-facing recap page when filled in.
          </span>
          <Field label="SEASON RECORD" name="record" placeholder="e.g. 11-3" defaultValue={existing?.record ?? ""} />
          <Field
            label="FINAL STANDING"
            name="finalStanding"
            placeholder="e.g. 1st of 8 · Champion"
            defaultValue={existing?.finalStanding ?? ""}
          />
          <Field
            label="CLINCHED"
            name="clinched"
            placeholder="e.g. Week 14 · vs. Sam T."
            defaultValue={existing?.clinched ?? ""}
          />
          <Field label="MVP" name="mvp" placeholder="e.g. Josh Allen, QB (BUF)" defaultValue={existing?.mvp ?? ""} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="note" className="text-[10px] font-extrabold tracking-[2px] text-muted">
              NOTE
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              placeholder="A short note shown on the recap page..."
              defaultValue={existing?.note ?? ""}
              className="w-full rounded-[10px] border border-navy/20 bg-card p-3 text-sm text-navy outline-none focus:border-navy/50"
            />
          </div>

          <PillButton type="submit" variant="navy" className="mt-2">
            SAVE
          </PillButton>
        </form>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: false },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
