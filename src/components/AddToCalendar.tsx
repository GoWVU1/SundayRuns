import { buildGoogleCalendarUrl, buildIcsDataUri } from "@/lib/calendar";

export function AddToCalendar({
  game,
}: {
  game: { id: string; starts_at: string; location: string; address: string };
}) {
  return (
    <div className="flex gap-2">
      <a
        href={buildGoogleCalendarUrl(game)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 rounded-full border border-gold/40 py-2 text-center text-[10px] font-extrabold tracking-wide text-gold"
      >
        + GOOGLE CALENDAR
      </a>
      <a
        href={buildIcsDataUri(game)}
        download="sunday-run.ics"
        className="flex-1 rounded-full border border-gold/40 py-2 text-center text-[10px] font-extrabold tracking-wide text-gold"
      >
        + APPLE / OUTLOOK
      </a>
    </div>
  );
}
