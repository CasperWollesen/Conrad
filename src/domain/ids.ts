import type { ISODate, StepId } from './types';

/** Random, stable id for stored entities. */
export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Fallback for non-secure contexts (e.g. plain http on a LAN).
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Stable identity of one step of one routine occurrence. */
export function occurrenceStateId(routineId: string, eventDate: ISODate, stepId: StepId): string {
  return `${routineId}|${eventDate}|${stepId}`;
}

export function taskActionId(taskId: string, stepId: StepId): string {
  return `task:${taskId}:${stepId}`;
}

export function routineActionId(routineId: string, eventDate: ISODate, stepId: StepId): string {
  return `routine:${routineId}:${eventDate}:${stepId}`;
}
