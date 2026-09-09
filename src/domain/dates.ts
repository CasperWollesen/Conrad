import type { ISODate, TimeString, Weekday } from './types';

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false;
  const m = ISO_DATE_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  // Round-trip through a local Date to reject e.g. 2026-02-30.
  const dt = new Date(y, mo - 1, d, 12);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function isTimeString(value: unknown): value is TimeString {
  return typeof value === 'string' && TIME_RE.test(value);
}

/** Local calendar date of the given instant. Never uses UTC. */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Local wall-clock time of the given instant as HH:MM. */
export function toTimeString(date: Date): TimeString {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Parses an ISO date into a local Date at noon (safe across DST switches). */
export function parseISODate(iso: ISODate): Date {
  const m = ISO_DATE_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

/**
 * Adds calendar days. Uses the local calendar, so month/year boundaries and
 * daylight saving switches are handled by the Date implementation, not by
 * adding 24-hour multiples.
 */
export function addDays(iso: ISODate, days: number): ISODate {
  const m = ISO_DATE_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days, 12);
  return toISODate(dt);
}

/** ISO weekday, 1 = Monday … 7 = Sunday. */
export function weekdayOf(iso: ISODate): Weekday {
  const jsDay = parseISODate(iso).getDay(); // 0 = Sunday
  return (jsDay === 0 ? 7 : jsDay) as Weekday;
}

/** Lexicographic comparison works for YYYY-MM-DD strings. */
export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Number of calendar days from `a` to `b` (positive when b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  const da = parseISODate(a);
  const db = parseISODate(b);
  // Both are at local noon; rounding removes any DST hour difference.
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function compareTime(a: TimeString | null, b: TimeString | null): number {
  if (a === b) return 0;
  if (a === null) return 1; // no time sorts after times
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

/** Enumerates every date from `from` to `to` inclusive. */
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let cursor = from;
  while (compareISODate(cursor, to) <= 0) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Milliseconds from `now` until the next local midnight. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}
