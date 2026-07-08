import "server-only";
import { DateTime } from "luxon";

export const APP_TIMEZONE = "America/New_York";

/**
 * Parses a `<input type="datetime-local">` value (e.g. "2026-07-12T18:00") as
 * wall-clock time in APP_TIMEZONE, regardless of the admin's actual browser/OS
 * timezone, and returns the corresponding UTC instant.
 */
export function localInputToUtc(value: string): Date {
  const dt = DateTime.fromFormat(value, "yyyy-MM-dd'T'HH:mm", { zone: APP_TIMEZONE });
  if (!dt.isValid) throw new Error(`Invalid datetime-local value: ${value}`);
  return dt.toJSDate();
}

/** Inverse of localInputToUtc — for pre-filling an edit form's datetime-local input. */
export function utcToLocalInput(date: Date | string): string {
  return DateTime.fromJSDate(new Date(date))
    .setZone(APP_TIMEZONE)
    .toFormat("yyyy-MM-dd'T'HH:mm");
}

/** "SAT, JUL 12" — matches the app's Bebas Neue all-caps headline copy. */
export function formatGameDateLabel(date: Date | string): string {
  return DateTime.fromJSDate(new Date(date)).setZone(APP_TIMEZONE).toFormat("ccc, LLL d").toUpperCase();
}

/** "6:00 PM" */
export function formatGameTimeLabel(date: Date | string): string {
  return DateTime.fromJSDate(new Date(date)).setZone(APP_TIMEZONE).toFormat("h:mm a");
}

/** "SAT, JUL 12 · 6:00 PM" combined, matching the original design's date-and-time copy. */
export function formatGameDateTime(date: Date | string): string {
  return `${formatGameDateLabel(date)} · ${formatGameTimeLabel(date)}`;
}

/** "Sat 5:00 PM" — for "unlocks {label}" copy. */
export function formatUnlockLabel(date: Date): string {
  return DateTime.fromJSDate(date).setZone(APP_TIMEZONE).toFormat("ccc h:mm a");
}

/** Default start time for a newly-created standard game: the coming Sunday, 6:00 PM. */
export function nextSunday6pmUtc(): Date {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  let target = now.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
  target = target.plus({ days: (7 - target.weekday) % 7 });
  if (target <= now) target = target.plus({ weeks: 1 });
  return target.toJSDate();
}

/** Start of the current calendar month in APP_TIMEZONE, as a UTC instant — guest allowance resets on the 1st. */
export function currentMonthStartUtc(): Date {
  return DateTime.now().setZone(APP_TIMEZONE).startOf("month").toJSDate();
}
