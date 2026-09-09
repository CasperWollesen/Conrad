import Dexie, { type EntityTable } from 'dexie';
import type { OccurrenceState, Routine, Setting, Task } from '../domain/types';

/**
 * IndexedDB schema. Bump `DB_VERSION` and add a `.version(n).stores(...)`
 * block (with an `upgrade` step if needed) whenever the shape changes.
 * Existing data must survive app updates, so never delete stores casually.
 */
export const DB_NAME = 'ready';
export const DB_VERSION = 1;

export class ReadyDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  occurrenceStates!: EntityTable<OccurrenceState, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      // Only indexed fields are listed; the objects hold more.
      tasks: 'id, date, completedAt',
      routines: 'id, paused',
      occurrenceStates: 'id, routineId, eventDate',
      settings: 'key',
    });
  }
}

export const db = new ReadyDatabase();
