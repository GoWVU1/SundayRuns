import "server-only";

const GAME_DURATION_HOURS = 2;

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

type CalendarGame = { id: string; starts_at: string; location: string; address: string };

/** "Lincoln Park · Court #2, 123 Main St, Anytown, ST 12345" — the address is what lets calendar apps drop a map pin. */
function combinedLocation(game: CalendarGame): string {
  if (game.location && game.address) return `${game.location}, ${game.address}`;
  return game.location || game.address || "";
}

export function buildGoogleCalendarUrl(game: CalendarGame): string {
  const start = new Date(game.starts_at);
  const end = new Date(start.getTime() + GAME_DURATION_HOURS * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Sunday Runs Pickup Basketball",
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
    location: combinedLocation(game),
    details: "Sunday Runs — pickup basketball. See you on the court!",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Raw .ics file text, served from a real route (see app/calendar/[gameId]/route.ts)
 * rather than a data: URI — iOS Safari doesn't support triggering downloads from
 * data: URIs via the `download` attribute, so tapping "+ APPLE / OUTLOOK" silently
 * did nothing on iPhone. A real response with Content-Type: text/calendar is what
 * iOS hands off to Calendar.app.
 */
export function buildIcsContent(game: CalendarGame): string {
  const start = new Date(game.starts_at);
  const end = new Date(start.getTime() + GAME_DURATION_HOURS * 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sunday Runs//EN",
    "BEGIN:VEVENT",
    `UID:${game.id}@sundayruns.net`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    "SUMMARY:Sunday Runs Pickup Basketball",
    `LOCATION:${combinedLocation(game).replace(/,/g, "\\,")}`,
    "DESCRIPTION:Sunday Runs — pickup basketball. See you on the court!",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
