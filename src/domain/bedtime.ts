import { isTimeString, weekdayOf } from './dates';
import type { ISODate, TimeString } from './types';

/**
 * Bedtime window. From `weekdayStart` (Sunday–Thursday evenings) or
 * `weekendStart` (Friday and Saturday evenings) until `end` the next morning
 * the front page answers "Good night" instead of listing what is left.
 */
export interface BedtimeSettings {
  enabled: boolean;
  weekdayStart: TimeString;
  weekendStart: TimeString;
  end: TimeString;
}

export const BEDTIME_SETTING_KEY = 'bedtime';

export const DEFAULT_BEDTIME: BedtimeSettings = {
  enabled: true,
  weekdayStart: '21:30',
  weekendStart: '23:00',
  end: '06:00',
};

/** Evenings that count as weekend nights: Friday (5) and Saturday (6). */
export function isWeekendNight(date: ISODate): boolean {
  const day = weekdayOf(date);
  return day === 5 || day === 6;
}

export function bedtimeStartFor(date: ISODate, settings: BedtimeSettings): TimeString {
  return isWeekendNight(date) ? settings.weekendStart : settings.weekdayStart;
}

/**
 * True while it is bedtime: after this evening's start, or before the morning
 * end time (which always belongs to the previous evening's window).
 */
export function isBedtime(today: ISODate, nowTime: TimeString, settings: BedtimeSettings): boolean {
  if (!settings.enabled) return false;
  if (nowTime < settings.end) return true;
  return nowTime >= bedtimeStartFor(today, settings);
}

/** Settings are user-editable; reject windows that would cover most of the day. */
export function isValidBedtime(settings: BedtimeSettings): boolean {
  return (
    isTimeString(settings.weekdayStart) &&
    isTimeString(settings.weekendStart) &&
    isTimeString(settings.end) &&
    settings.end < settings.weekdayStart &&
    settings.end < settings.weekendStart
  );
}

/** Reads a stored (untrusted) setting value, falling back to defaults. */
export function parseBedtimeSettings(value: unknown): BedtimeSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_BEDTIME;
  const v = value as Record<string, unknown>;
  const candidate: BedtimeSettings = {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_BEDTIME.enabled,
    weekdayStart: isTimeString(v.weekdayStart) ? v.weekdayStart : DEFAULT_BEDTIME.weekdayStart,
    weekendStart: isTimeString(v.weekendStart) ? v.weekendStart : DEFAULT_BEDTIME.weekendStart,
    end: isTimeString(v.end) ? v.end : DEFAULT_BEDTIME.end,
  };
  return isValidBedtime(candidate) ? candidate : { ...DEFAULT_BEDTIME, enabled: candidate.enabled };
}
