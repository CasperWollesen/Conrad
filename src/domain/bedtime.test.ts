import { describe, expect, it } from 'vitest';
import { DEFAULT_BEDTIME, isBedtime, isValidBedtime, parseBedtimeSettings } from './bedtime';

// 2026-09-09 is a Wednesday, 2026-09-11 a Friday, 2026-09-12 a Saturday, 2026-09-13 a Sunday.
describe('bedtime', () => {
  it('starts at 21:30 on weekday evenings and ends at 06:00', () => {
    expect(isBedtime('2026-09-09', '21:29', DEFAULT_BEDTIME)).toBe(false);
    expect(isBedtime('2026-09-09', '21:30', DEFAULT_BEDTIME)).toBe(true);
    expect(isBedtime('2026-09-09', '23:59', DEFAULT_BEDTIME)).toBe(true);
    expect(isBedtime('2026-09-10', '00:00', DEFAULT_BEDTIME)).toBe(true);
    expect(isBedtime('2026-09-10', '05:59', DEFAULT_BEDTIME)).toBe(true);
    expect(isBedtime('2026-09-10', '06:00', DEFAULT_BEDTIME)).toBe(false);
    expect(isBedtime('2026-09-10', '15:00', DEFAULT_BEDTIME)).toBe(false);
  });

  it('starts at 23:00 on Friday and Saturday evenings', () => {
    expect(isBedtime('2026-09-11', '22:30', DEFAULT_BEDTIME)).toBe(false);
    expect(isBedtime('2026-09-11', '23:00', DEFAULT_BEDTIME)).toBe(true);
    expect(isBedtime('2026-09-12', '22:59', DEFAULT_BEDTIME)).toBe(false);
    expect(isBedtime('2026-09-12', '23:00', DEFAULT_BEDTIME)).toBe(true);
    // Saturday morning belongs to Friday's window and still ends at 06:00.
    expect(isBedtime('2026-09-12', '05:30', DEFAULT_BEDTIME)).toBe(true);
    // Sunday evening is a school night again.
    expect(isBedtime('2026-09-13', '21:30', DEFAULT_BEDTIME)).toBe(true);
  });

  it('can be switched off', () => {
    expect(isBedtime('2026-09-09', '23:00', { ...DEFAULT_BEDTIME, enabled: false })).toBe(false);
  });

  it('validates and parses stored settings defensively', () => {
    expect(isValidBedtime(DEFAULT_BEDTIME)).toBe(true);
    expect(isValidBedtime({ ...DEFAULT_BEDTIME, end: '22:00' })).toBe(false);
    expect(parseBedtimeSettings(undefined)).toEqual(DEFAULT_BEDTIME);
    expect(parseBedtimeSettings({ enabled: false, weekdayStart: '22:00', weekendStart: '23:30', end: '07:00' })).toEqual({
      enabled: false,
      weekdayStart: '22:00',
      weekendStart: '23:30',
      end: '07:00',
    });
    expect(parseBedtimeSettings({ enabled: true, weekdayStart: 'late', weekendStart: '23:00', end: '06:00' })).toEqual(
      DEFAULT_BEDTIME,
    );
  });
});
