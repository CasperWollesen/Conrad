/**
 * Core data model.
 *
 * Dates are local calendar dates as `YYYY-MM-DD` (ISODate). Times are `HH:MM`
 * in local time and are kept separate from dates on purpose.
 */

/** Local calendar date, e.g. "2026-09-11". */
export type ISODate = string;
/** Local wall-clock time, e.g. "08:00". */
export type TimeString = string;
/** ISO 8601 timestamp (with timezone), used for audit fields only. */
export type Timestamp = string;

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** A task or routine occurrence consists of one or two steps. */
export type StepId = 'main' | 'prep';

export type ActionStatus = 'pending' | 'done' | 'skipped';

/** Preparation attached to a single task. Done on its own date. */
export interface TaskPrep {
  title: string;
  date: ISODate;
  beforeFreeTime: boolean;
  completedAt: Timestamp | null;
}

/** A single (non-recurring) task. Optionally has a linked preparation step. */
export interface Task {
  id: string;
  title: string;
  date: ISODate;
  time: TimeString | null;
  note: string;
  beforeFreeTime: boolean;
  completedAt: Timestamp | null;
  prep: TaskPrep | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Preparation rule for a routine: a fixed number of calendar days before each event. */
export interface RoutinePrep {
  title: string;
  daysBefore: number;
  beforeFreeTime: boolean;
}

/** A weekly recurring routine. Occurrence status is stored separately (OccurrenceState). */
export interface Routine {
  id: string;
  title: string;
  weekdays: Weekday[];
  startDate: ISODate;
  time: TimeString | null;
  note: string;
  beforeFreeTime: boolean;
  prep: RoutinePrep | null;
  paused: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Status for one concrete step of one concrete routine occurrence.
 * Identity: routineId + eventDate (the date of the main event) + stepId.
 * Pending occurrences have no row.
 */
export interface OccurrenceState {
  id: string;
  routineId: string;
  eventDate: ISODate;
  stepId: StepId;
  status: 'done' | 'skipped';
  changedAt: Timestamp;
}

export interface Setting {
  key: string;
  value: unknown;
}

/** Everything the user owns; also the payload of a backup. */
export interface UserData {
  tasks: Task[];
  routines: Routine[];
  occurrenceStates: OccurrenceState[];
  settings: Setting[];
}

/** Source of a computed action. */
export type ActionSource =
  | { kind: 'task'; taskId: string }
  | { kind: 'routine'; routineId: string; eventDate: ISODate };

/**
 * A concrete, checkable thing on a concrete date. Computed from tasks and
 * routines; never stored. `id` is stable across recomputation.
 */
export interface Action {
  id: string;
  source: ActionSource;
  step: StepId;
  title: string;
  date: ISODate;
  /** Deadline time for main steps; preparations carry no time of their own. */
  time: TimeString | null;
  note: string;
  beforeFreeTime: boolean;
  status: ActionStatus;
  /** When it was completed or skipped (if known). */
  changedAt: Timestamp | null;
  /** For preparation steps: what they prepare for. */
  parent: { title: string; date: ISODate; time: TimeString | null } | null;
  /** For main steps that have a preparation: its state. */
  prepInfo: { title: string; date: ISODate; status: ActionStatus } | null;
}
