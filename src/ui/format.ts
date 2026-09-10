import { daysBetween, parseISODate, weekdayOf } from '../domain/dates';
import type { ISODate, TimeString, Weekday } from '../domain/types';
import { MONTH_NAMES, MONTH_SHORT, WEEKDAY_NAMES, WEEKDAY_SHORT, texts } from '../texts';

function weekdayName(iso: ISODate): string {
  return WEEKDAY_NAMES[weekdayOf(iso) - 1] ?? '';
}

function weekdayShort(iso: ISODate): string {
  return WEEKDAY_SHORT[weekdayOf(iso) - 1] ?? '';
}

/** "Wednesday 9 September" */
export function formatDayLong(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${weekdayName(iso)} ${d.getDate()} ${MONTH_NAMES[d.getMonth()] ?? ''}`;
}

/** "Wed 9 Sep" */
export function formatDayShort(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${weekdayShort(iso)} ${d.getDate()} ${MONTH_SHORT[d.getMonth()] ?? ''}`;
}

/** "9 September 2026" */
export function formatDateWithYear(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()] ?? ''} ${d.getFullYear()}`;
}

/** 24-hour clock, "08:00". */
export function formatTime(time: TimeString): string {
  return time;
}

/** Same as formatTime; kept as a separate name for call sites that mean "a clock time". */
export function formatClock(time: TimeString): string {
  return formatTime(time);
}

/**
 * Relative day label: "Today", "Tomorrow", "Yesterday", the weekday name
 * within the coming week, otherwise "Fri 11 Sep".
 */
export function formatRelativeDay(iso: ISODate, today: ISODate): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return texts.relative.today;
  if (diff === 1) return texts.relative.tomorrow;
  if (diff === -1) return texts.relative.yesterday;
  if (diff > 1 && diff < 7) return weekdayName(iso);
  return formatDayShort(iso);
}

/** Combines relative day and optional time: "Tomorrow at 08:00". */
export function formatWhen(iso: ISODate, time: TimeString | null, today: ISODate): string {
  const day = formatRelativeDay(iso, today);
  return time ? `${day} ${texts.action.at} ${formatClock(time)}` : day;
}

/** Weekday summary for routine cards: "Tuesday and Friday", "Weekdays", "Every day". */
export function formatWeekdays(weekdays: readonly Weekday[]): string {
  const sorted = [...new Set(weekdays)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Every day';
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Weekdays';
  if (sorted.length === 2 && sorted[0] === 6 && sorted[1] === 7) return 'Weekend';
  const names = sorted.map((d) => (sorted.length <= 2 ? (WEEKDAY_NAMES[d - 1] ?? '') : (WEEKDAY_SHORT[d - 1] ?? '')));
  if (names.length === 1) return names[0]!;
  const last = names[names.length - 1]!;
  return `${names.slice(0, -1).join(', ')} and ${last}`;
}

/** "9 Sep 2026, 14:03" for an ISO timestamp. */
export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()] ?? ''} ${d.getFullYear()}, ${hh}:${mm}`;
}
