import { addDays, compareISODate, eachDay, weekdayOf } from './dates';
import { occurrenceStateId, routineActionId } from './ids';
import type { Action, ISODate, OccurrenceState, Routine } from './types';

/** Lookup for stored occurrence states keyed by `occurrenceStateId(...)`. */
export type OccurrenceStateMap = ReadonlyMap<string, OccurrenceState>;

export function occurrenceStateMap(states: readonly OccurrenceState[]): OccurrenceStateMap {
  return new Map(states.map((s) => [s.id, s]));
}

/**
 * Dates on which the routine's main event happens, within [from, to].
 * Nothing is generated before the routine's start date.
 */
export function routineEventDates(routine: Routine, from: ISODate, to: ISODate): ISODate[] {
  if (routine.weekdays.length === 0) return [];
  const start = compareISODate(routine.startDate, from) > 0 ? routine.startDate : from;
  if (compareISODate(start, to) > 0) return [];
  const wanted = new Set(routine.weekdays);
  return eachDay(start, to).filter((d) => wanted.has(weekdayOf(d)));
}

/** Date on which the preparation for the given event should be done, if any. */
export function routinePrepDate(routine: Routine, eventDate: ISODate): ISODate | null {
  if (!routine.prep) return null;
  return addDays(eventDate, -routine.prep.daysBefore);
}

/**
 * Concrete actions of a routine from its start date up to `horizonEnd`.
 *
 * - A paused routine yields nothing.
 * - Preparations whose date would fall before the routine's start date are
 *   not generated, so creating a routine never produces an instant backlog.
 * - Status comes from OccurrenceState rows; rows survive edits of the
 *   routine, so completed occurrences never resurface as pending.
 */
export function routineActions(
  routine: Routine,
  states: OccurrenceStateMap,
  horizonEnd: ISODate,
): Action[] {
  if (routine.paused) return [];
  const prepDays = routine.prep?.daysBefore ?? 0;
  // Events slightly beyond the horizon can still have a preparation inside it.
  const eventDates = routineEventDates(routine, routine.startDate, addDays(horizonEnd, Math.max(0, prepDays)));
  const out: Action[] = [];

  for (const eventDate of eventDates) {
    const mainState = states.get(occurrenceStateId(routine.id, eventDate, 'main'));
    const prepDate = routinePrepDate(routine, eventDate);
    const prepState = prepDate ? states.get(occurrenceStateId(routine.id, eventDate, 'prep')) : undefined;
    const includePrep =
      routine.prep !== null &&
      prepDate !== null &&
      compareISODate(prepDate, routine.startDate) >= 0 &&
      compareISODate(prepDate, horizonEnd) <= 0;

    if (includePrep && routine.prep && prepDate) {
      out.push({
        id: routineActionId(routine.id, eventDate, 'prep'),
        source: { kind: 'routine', routineId: routine.id, eventDate },
        step: 'prep',
        title: routine.prep.title,
        date: prepDate,
        time: null,
        note: routine.note,
        beforeFreeTime: routine.prep.beforeFreeTime,
        status: prepState?.status ?? 'pending',
        changedAt: prepState?.changedAt ?? null,
        parent: { title: routine.title, date: eventDate, time: routine.time },
        prepInfo: null,
      });
    }

    if (compareISODate(eventDate, horizonEnd) <= 0) {
      out.push({
        id: routineActionId(routine.id, eventDate, 'main'),
        source: { kind: 'routine', routineId: routine.id, eventDate },
        step: 'main',
        title: routine.title,
        date: eventDate,
        time: routine.time,
        note: routine.note,
        beforeFreeTime: routine.beforeFreeTime,
        status: mainState?.status ?? 'pending',
        changedAt: mainState?.changedAt ?? null,
        parent: null,
        prepInfo:
          routine.prep && prepDate
            ? { title: routine.prep.title, date: prepDate, status: prepState?.status ?? 'pending' }
            : null,
      });
    }
  }
  return out;
}
