import { daysBetween, parseISODate, weekdayOf } from '../domain/dates';
import type { ISODate, TimeString, Weekday } from '../domain/types';
import { MONTH_NAMES, MONTH_SHORT, WEEKDAY_NAMES, WEEKDAY_SHORT, texts } from '../texts';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function weekdayName(iso: ISODate): string {
  return WEEKDAY_NAMES[weekdayOf(iso) - 1] ?? '';
}

function weekdayShort(iso: ISODate): string {
  return WEEKDAY_SHORT[weekdayOf(iso) - 1] ?? '';
}

/** "Onsdag 9. september" */
export function formatDayLong(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${capitalize(weekdayName(iso))} ${d.getDate()}. ${MONTH_NAMES[d.getMonth()] ?? ''}`;
}

/** "ons. 9. sep." */
export function formatDayShort(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${weekdayShort(iso)}. ${d.getDate()}. ${MONTH_SHORT[d.getMonth()] ?? ''}`;
}

/** "9. september 2026" */
export function formatDateWithYear(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${d.getDate()}. ${MONTH_NAMES[d.getMonth()] ?? ''} ${d.getFullYear()}`;
}

/** "08.00" (Danish convention uses a period). */
export function formatTime(time: TimeString): string {
  return time.replace(':', '.');
}

/** "kl. 08.00" */
export function formatClock(time: TimeString): string {
  return `${texts.action.at} ${formatTime(time)}`;
}

/**
 * Relative day label: "I dag", "I morgen", "I går", weekday name within the
 * coming week, otherwise "Fredag 11. sep.".
 */
export function formatRelativeDay(iso: ISODate, today: ISODate): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return texts.relative.today;
  if (diff === 1) return texts.relative.tomorrow;
  if (diff === -1) return texts.relative.yesterday;
  if (diff > 1 && diff < 7) return capitalize(weekdayName(iso));
  return capitalize(formatDayShort(iso));
}

/** Combines relative day and optional time: "I morgen kl. 08.00". */
export function formatWhen(iso: ISODate, time: TimeString | null, today: ISODate): string {
  const day = formatRelativeDay(iso, today);
  return time ? `${day} ${formatClock(time)}` : day;
}

/** Weekday summary for routine cards: "Tirsdag og fredag", "Hverdage", "Hver dag". */
export function formatWeekdays(weekdays: readonly Weekday[]): string {
  const sorted = [...new Set(weekdays)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Hver dag';
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Hverdage';
  if (sorted.length === 2 && sorted[0] === 6 && sorted[1] === 7) return 'Weekend';
  const names = sorted.map((d) => (sorted.length <= 2 ? (WEEKDAY_NAMES[d - 1] ?? '') : `${WEEKDAY_SHORT[d - 1] ?? ''}.`));
  if (names.length === 1) return capitalize(names[0]!);
  const last = names[names.length - 1]!;
  return capitalize(`${names.slice(0, -1).join(', ')} og ${last}`);
}

/** "9. sep. 2026 kl. 14.03" for an ISO timestamp. */
export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()}. ${MONTH_SHORT[d.getMonth()] ?? ''} ${d.getFullYear()} kl. ${hh}.${mm}`;
}
