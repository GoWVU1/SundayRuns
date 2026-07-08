import "server-only";

const GAME_DURATION_HOURS = 2;

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

type CalendarGame = { id: string; starts_at: string; location: string };

export function buildGoogleCalendarUrl(game: CalendarGame): string {
  const start = new Date(game.starts_at);
  const end = new Date(start.getTime() + GAME_DURATION_HOURS * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Sunday Runs Pickup Basketball",
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
    location: game.location || "",
    details: "Sunday Runs — pickup basketball. See you on the court!",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** A data: URI .ics download — works for Apple Calendar, Outlook, and anything else that isn't Google. */
export function buildIcsDataUri(game: CalendarGame): string {
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
    `LOCATION:${(game.location || "").replace(/,/g, "\\,")}`,
    "DESCRIPTION:Sunday Runs — pickup basketball. See you on the court!",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
