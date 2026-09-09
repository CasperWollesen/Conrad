import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  eachDay,
  isISODate,
  isTimeString,
  msUntilNextMidnight,
  toISODate,
  weekdayOf,
} from './dates';

describe('dates', () => {
  it('formats local calendar dates without UTC conversion', () => {
    // 00:30 local on 1 Jan; in UTC this may still be 31 Dec.
    expect(toISODate(new Date(2027, 0, 1, 0, 30))).toBe('2027-01-01');
    expect(toISODate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('adds calendar days across month boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
  });

  it('adds calendar days across year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('handles daylight saving switches as whole calendar days', () => {
    // Denmark: DST ends 2026-10-25 (25 hour day), starts 2027-03-28 (23 hour day).
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-10-26', -1)).toBe('2026-10-25');
    expect(addDays('2027-03-27', 1)).toBe('2027-03-28');
    expect(addDays('2027-03-28', 1)).toBe('2027-03-29');
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2027-03-27', '2027-03-29')).toBe(2);
  });

  it('computes ISO weekdays', () => {
    expect(weekdayOf('2026-09-07')).toBe(1); // Monday
    expect(weekdayOf('2026-09-11')).toBe(5); // Friday
    expect(weekdayOf('2026-09-13')).toBe(7); // Sunday
  });

  it('enumerates inclusive ranges', () => {
    expect(eachDay('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
    expect(eachDay('2026-09-10', '2026-09-09')).toEqual([]);
  });

  it('validates dates and times', () => {
    expect(isISODate('2026-09-11')).toBe(true);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('2026-9-1')).toBe(false);
    expect(isISODate(20260911)).toBe(false);
    expect(isTimeString('08:00')).toBe(true);
    expect(isTimeString('24:00')).toBe(false);
    expect(isTimeString('8:00')).toBe(false);
  });

  it('computes time until next local midnight', () => {
    const ms = msUntilNextMidnight(new Date(2026, 8, 9, 23, 0, 0));
    expect(ms).toBe(60 * 60 * 1000);
  });
});
