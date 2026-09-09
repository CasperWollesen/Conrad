import { isISODate, isTimeString } from './dates';
import type {
  OccurrenceState,
  Routine,
  RoutinePrep,
  Setting,
  Task,
  TaskPrep,
  UserData,
  Weekday,
} from './types';

export const BACKUP_APP_ID = 'ready';
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  formatVersion: number;
  exportedAt: string;
  data: UserData;
}

export interface BackupSummary {
  tasks: number;
  routines: number;
  occurrenceStates: number;
  exportedAt: string | null;
}

export type ParseResult =
  | { ok: true; data: UserData; summary: BackupSummary }
  | { ok: false; error: BackupError };

export type BackupError =
  | 'not-json'
  | 'not-backup'
  | 'unsupported-version'
  | 'invalid-data';

export function createBackup(data: UserData, now: Date): BackupFile {
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    data: {
      tasks: data.tasks,
      routines: data.routines,
      occurrenceStates: data.occurrenceStates,
      settings: data.settings,
    },
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

/** Parses and validates backup JSON. Never throws. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP_ID || !isRecord(raw.data)) {
    return { ok: false, error: 'not-backup' };
  }
  if (raw.formatVersion !== BACKUP_FORMAT_VERSION) {
    return { ok: false, error: 'unsupported-version' };
  }
  const data = validateUserData(raw.data);
  if (!data) return { ok: false, error: 'invalid-data' };
  return {
    ok: true,
    data,
    summary: {
      tasks: data.tasks.length,
      routines: data.routines.length,
      occurrenceStates: data.occurrenceStates.length,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Validation helpers (hand-written to avoid a schema library dependency).

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const isString = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isTimeOrNull = (v: unknown): v is string | null => v === null || isTimeString(v);
const isTimestampOrNull = (v: unknown): v is string | null =>
  v === null || (typeof v === 'string' && !Number.isNaN(Date.parse(v)));
const isTimestamp = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

function validateTaskPrep(v: unknown): TaskPrep | null | undefined {
  if (v === null) return null;
  if (!isRecord(v)) return undefined;
  if (!isNonEmptyString(v.title) || !isISODate(v.date) || !isBool(v.beforeFreeTime)) return undefined;
  if (!isTimestampOrNull(v.completedAt)) return undefined;
  return { title: v.title, date: v.date, beforeFreeTime: v.beforeFreeTime, completedAt: v.completedAt };
}

function validateTask(v: unknown): Task | undefined {
  if (!isRecord(v)) return undefined;
  if (!isNonEmptyString(v.id) || !isNonEmptyString(v.title) || !isISODate(v.date)) return undefined;
  if (!isTimeOrNull(v.time) || !isString(v.note) || !isBool(v.beforeFreeTime)) return undefined;
  if (!isTimestampOrNull(v.completedAt) || !isTimestamp(v.createdAt) || !isTimestamp(v.updatedAt)) return undefined;
  const prep = validateTaskPrep(v.prep);
  if (prep === undefined) return undefined;
  return {
    id: v.id,
    title: v.title,
    date: v.date,
    time: v.time,
    note: v.note,
    beforeFreeTime: v.beforeFreeTime,
    completedAt: v.completedAt,
    prep,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function validateWeekdays(v: unknown): Weekday[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: Weekday[] = [];
  for (const d of v) {
    if (typeof d !== 'number' || !Number.isInteger(d) || d < 1 || d > 7) return undefined;
    if (!out.includes(d as Weekday)) out.push(d as Weekday);
  }
  return out.sort((a, b) => a - b);
}

function validateRoutinePrep(v: unknown): RoutinePrep | null | undefined {
  if (v === null) return null;
  if (!isRecord(v)) return undefined;
  if (!isNonEmptyString(v.title) || !isBool(v.beforeFreeTime)) return undefined;
  if (typeof v.daysBefore !== 'number' || !Number.isInteger(v.daysBefore) || v.daysBefore < 0 || v.daysBefore > 31) {
    return undefined;
  }
  return { title: v.title, daysBefore: v.daysBefore, beforeFreeTime: v.beforeFreeTime };
}

function validateRoutine(v: unknown): Routine | undefined {
  if (!isRecord(v)) return undefined;
  if (!isNonEmptyString(v.id) || !isNonEmptyString(v.title) || !isISODate(v.startDate)) return undefined;
  if (!isTimeOrNull(v.time) || !isString(v.note) || !isBool(v.beforeFreeTime) || !isBool(v.paused)) return undefined;
  if (!isTimestamp(v.createdAt) || !isTimestamp(v.updatedAt)) return undefined;
  const weekdays = validateWeekdays(v.weekdays);
  if (!weekdays) return undefined;
  const prep = validateRoutinePrep(v.prep);
  if (prep === undefined) return undefined;
  return {
    id: v.id,
    title: v.title,
    weekdays,
    startDate: v.startDate,
    time: v.time,
    note: v.note,
    beforeFreeTime: v.beforeFreeTime,
    prep,
    paused: v.paused,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function validateOccurrenceState(v: unknown): OccurrenceState | undefined {
  if (!isRecord(v)) return undefined;
  if (!isNonEmptyString(v.id) || !isNonEmptyString(v.routineId) || !isISODate(v.eventDate)) return undefined;
  if (v.stepId !== 'main' && v.stepId !== 'prep') return undefined;
  if (v.status !== 'done' && v.status !== 'skipped') return undefined;
  if (!isTimestamp(v.changedAt)) return undefined;
  return {
    id: v.id,
    routineId: v.routineId,
    eventDate: v.eventDate,
    stepId: v.stepId,
    status: v.status,
    changedAt: v.changedAt,
  };
}

function validateSetting(v: unknown): Setting | undefined {
  if (!isRecord(v) || !isNonEmptyString(v.key) || !('value' in v)) return undefined;
  return { key: v.key, value: v.value };
}

function validateList<T>(v: unknown, validate: (item: unknown) => T | undefined): T[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: T[] = [];
  const ids = new Set<string>();
  for (const item of v) {
    const valid = validate(item);
    if (valid === undefined) return undefined;
    const id = (valid as { id?: unknown; key?: unknown }).id ?? (valid as { key?: unknown }).key;
    if (typeof id === 'string') {
      if (ids.has(id)) return undefined; // duplicate primary key
      ids.add(id);
    }
    out.push(valid);
  }
  return out;
}

export function validateUserData(v: unknown): UserData | undefined {
  if (!isRecord(v)) return undefined;
  const tasks = validateList(v.tasks, validateTask);
  const routines = validateList(v.routines, validateRoutine);
  const occurrenceStates = validateList(v.occurrenceStates, validateOccurrenceState);
  const settings = validateList(v.settings ?? [], validateSetting);
  if (!tasks || !routines || !occurrenceStates || !settings) return undefined;
  return { tasks, routines, occurrenceStates, settings };
}
