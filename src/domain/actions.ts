import { addDays, compareISODate, compareTime, toISODate } from './dates';
import { occurrenceStateMap, routineActions } from './routines';
import { taskActions } from './tasks';
import type { Action, ISODate, OccurrenceState, Routine, Task, TimeString } from './types';

/** How far ahead actions are computed. The upcoming view shows a subset. */
export const HORIZON_DAYS = 91;

export interface BuildInput {
  tasks: readonly Task[];
  routines: readonly Routine[];
  occurrenceStates: readonly OccurrenceState[];
}

/** All concrete actions from every task and routine, up to `today + HORIZON_DAYS`. */
export function buildActions(input: BuildInput, today: ISODate): Action[] {
  const horizonEnd = addDays(today, HORIZON_DAYS);
  const states = occurrenceStateMap(input.occurrenceStates);
  const out: Action[] = [];
  for (const task of input.tasks) out.push(...taskActions(task));
  for (const routine of input.routines) out.push(...routineActions(routine, states, horizonEnd));
  return out;
}

/**
 * The rule behind "You're ready": an action counts as pending-before-free-time
 * when it is flagged, its date is today or earlier, and it is still pending.
 * Future actions never block, preparations for tomorrow can block today.
 */
export function isPendingBeforeFreeTime(action: Action, today: ISODate): boolean {
  return action.beforeFreeTime && action.status === 'pending' && compareISODate(action.date, today) <= 0;
}

/** Pending before-free-time actions, earlier dates first, then today's by time. */
export function pendingBeforeFreeTime(actions: readonly Action[], today: ISODate): Action[] {
  return actions.filter((a) => isPendingBeforeFreeTime(a, today)).sort(compareByRelevance);
}

/** Local calendar date of a timestamp, or null. */
export function dateOfTimestamp(ts: string | null): ISODate | null {
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : toISODate(d);
}

/**
 * An action is overdue when its date has passed, or when it is due today and
 * its deadline time has passed. Actions without a time are never overdue on
 * their own day.
 */
export function isOverdue(action: Action, today: ISODate, nowTime: TimeString): boolean {
  if (action.status !== 'pending') return false;
  const cmp = compareISODate(action.date, today);
  if (cmp < 0) return true;
  if (cmp === 0 && action.time !== null) return action.time < nowTime;
  return false;
}

export type ReadyStatus =
  | { kind: 'empty' }
  | { kind: 'pending'; pending: number; done: number; total: number }
  | { kind: 'ready'; done: number; total: number };

/**
 * Status only speaks about registered actions. `hasAnyData` distinguishes a
 * brand new app (empty state) from a day with nothing relevant (ready).
 */
export function computeStatus(actions: readonly Action[], today: ISODate, hasAnyData: boolean): ReadyStatus {
  if (!hasAnyData) return { kind: 'empty' };
  const pending = pendingBeforeFreeTime(actions, today).length;
  const done = doneBeforeFreeTimeToday(actions, today).length;
  const total = pending + done;
  if (pending > 0) return { kind: 'pending', pending, done, total };
  return { kind: 'ready', done, total };
}

/** Before-free-time actions finished today (dated today, or older ones completed today). */
export function doneBeforeFreeTimeToday(actions: readonly Action[], today: ISODate): Action[] {
  return actions.filter(
    (a) =>
      a.beforeFreeTime &&
      a.status === 'done' &&
      (a.date === today || (compareISODate(a.date, today) < 0 && dateOfTimestamp(a.changedAt) === today)),
  );
}

/** Earlier dates first, then by deadline time (none last), then title. */
export function compareByRelevance(a: Action, b: Action): number {
  return (
    compareISODate(a.date, b.date) ||
    compareTime(a.time, b.time) ||
    Number(b.beforeFreeTime) - Number(a.beforeFreeTime) ||
    a.title.localeCompare(b.title, 'en')
  );
}

/** Within one day: pending before done/skipped, then time, then before-free-time first, then title. */
export function compareWithinDay(a: Action, b: Action): number {
  const rank = (s: Action['status']) => (s === 'pending' ? 0 : 1);
  return (
    rank(a.status) - rank(b.status) ||
    compareTime(a.time, b.time) ||
    Number(b.beforeFreeTime) - Number(a.beforeFreeTime) ||
    a.title.localeCompare(b.title, 'en')
  );
}

export interface TodayModel {
  status: ReadyStatus;
  /** Pending before-free-time actions dated today or earlier. */
  beforeFreeTime: Action[];
  /** Pending non-blocking actions dated today. */
  otherToday: Action[];
  /** Pending non-blocking actions from earlier days. Kept until handled. */
  earlier: Action[];
  /** Everything dated tomorrow. */
  tomorrow: Action[];
  /** Done or skipped actions dated today, plus older ones handled today. */
  doneToday: Action[];
}

export function buildTodayModel(actions: readonly Action[], today: ISODate, hasAnyData: boolean): TodayModel {
  const tomorrow = addDays(today, 1);
  const pending = actions.filter((a) => a.status === 'pending');
  return {
    status: computeStatus(actions, today, hasAnyData),
    beforeFreeTime: pendingBeforeFreeTime(actions, today),
    otherToday: pending.filter((a) => !a.beforeFreeTime && a.date === today).sort(compareByRelevance),
    earlier: pending.filter((a) => !a.beforeFreeTime && compareISODate(a.date, today) < 0).sort(compareByRelevance),
    tomorrow: actions.filter((a) => a.date === tomorrow).sort(compareWithinDay),
    doneToday: actions
      .filter(
        (a) =>
          a.status !== 'pending' &&
          (a.date === today || (compareISODate(a.date, today) < 0 && dateOfTimestamp(a.changedAt) === today)),
      )
      .sort(compareByRelevance),
  };
}

export interface DayGroup {
  date: ISODate;
  actions: Action[];
}

/** Actions dated within [from, to], grouped by day. Days without actions are omitted. */
export function groupByDay(actions: readonly Action[], from: ISODate, to: ISODate): DayGroup[] {
  const byDate = new Map<ISODate, Action[]>();
  for (const a of actions) {
    if (compareISODate(a.date, from) < 0 || compareISODate(a.date, to) > 0) continue;
    const list = byDate.get(a.date);
    if (list) list.push(a);
    else byDate.set(a.date, [a]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => compareISODate(a, b))
    .map(([date, list]) => ({ date, actions: list.sort(compareWithinDay) }));
}

/** Pending actions dated before `today` (any kind). */
export function overdueActions(actions: readonly Action[], today: ISODate): Action[] {
  return actions
    .filter((a) => a.status === 'pending' && compareISODate(a.date, today) < 0)
    .sort(compareByRelevance);
}
