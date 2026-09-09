import { newId, occurrenceStateId } from '../domain/ids';
import type {
  ISODate,
  OccurrenceState,
  Routine,
  Setting,
  StepId,
  Task,
  UserData,
} from '../domain/types';
import { db, type ReadyDatabase } from './db';

/** Input for creating/updating a task; audit fields are managed here. */
export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type RoutineInput = Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>;

export class Repository {
  constructor(private readonly database: ReadyDatabase = db) {}

  // -- Tasks ---------------------------------------------------------------

  async addTask(input: TaskInput, now: Date = new Date()): Promise<Task> {
    const ts = now.toISOString();
    const task: Task = { ...input, id: newId(), createdAt: ts, updatedAt: ts };
    await this.database.tasks.add(task);
    return task;
  }

  async updateTask(id: string, input: TaskInput, now: Date = new Date()): Promise<Task> {
    return this.database.transaction('rw', this.database.tasks, async () => {
      const existing = await this.database.tasks.get(id);
      if (!existing) throw new Error(`Task ${id} not found`);
      const task: Task = { ...existing, ...input, id, updatedAt: now.toISOString() };
      await this.database.tasks.put(task);
      return task;
    });
  }

  /** Restores a previously deleted task (used by undo). */
  async putTask(task: Task): Promise<void> {
    await this.database.tasks.put(task);
  }

  async deleteTask(id: string): Promise<Task | undefined> {
    return this.database.transaction('rw', this.database.tasks, async () => {
      const existing = await this.database.tasks.get(id);
      if (existing) await this.database.tasks.delete(id);
      return existing;
    });
  }

  /** Marks one step of a task done (`true`) or pending (`false`). */
  async setTaskStepDone(id: string, step: StepId, done: boolean, now: Date = new Date()): Promise<void> {
    const ts = now.toISOString();
    await this.database.transaction('rw', this.database.tasks, async () => {
      const existing = await this.database.tasks.get(id);
      if (!existing) throw new Error(`Task ${id} not found`);
      const completedAt = done ? ts : null;
      const next: Task =
        step === 'main'
          ? { ...existing, completedAt, updatedAt: ts }
          : existing.prep
            ? { ...existing, prep: { ...existing.prep, completedAt }, updatedAt: ts }
            : existing;
      await this.database.tasks.put(next);
    });
  }

  // -- Routines ------------------------------------------------------------

  async addRoutine(input: RoutineInput, now: Date = new Date()): Promise<Routine> {
    const ts = now.toISOString();
    const routine: Routine = { ...input, id: newId(), createdAt: ts, updatedAt: ts };
    await this.database.routines.add(routine);
    return routine;
  }

  async updateRoutine(id: string, input: Partial<RoutineInput>, now: Date = new Date()): Promise<Routine> {
    return this.database.transaction('rw', this.database.routines, async () => {
      const existing = await this.database.routines.get(id);
      if (!existing) throw new Error(`Routine ${id} not found`);
      const routine: Routine = { ...existing, ...input, id, updatedAt: now.toISOString() };
      await this.database.routines.put(routine);
      return routine;
    });
  }

  /** Deletes a routine and its occurrence history. Returns what was removed (for undo). */
  async deleteRoutine(id: string): Promise<{ routine: Routine; states: OccurrenceState[] } | undefined> {
    return this.database.transaction('rw', [this.database.routines, this.database.occurrenceStates], async () => {
      const routine = await this.database.routines.get(id);
      if (!routine) return undefined;
      const states = await this.database.occurrenceStates.where('routineId').equals(id).toArray();
      await this.database.occurrenceStates.where('routineId').equals(id).delete();
      await this.database.routines.delete(id);
      return { routine, states };
    });
  }

  async restoreRoutine(routine: Routine, states: OccurrenceState[]): Promise<void> {
    await this.database.transaction('rw', [this.database.routines, this.database.occurrenceStates], async () => {
      await this.database.routines.put(routine);
      if (states.length) await this.database.occurrenceStates.bulkPut(states);
    });
  }

  // -- Routine occurrences -------------------------------------------------

  /**
   * Sets the status of one concrete step of one occurrence. `null` clears the
   * row, i.e. makes the occurrence pending again (undo of done/skip).
   */
  async setOccurrenceStatus(
    routineId: string,
    eventDate: ISODate,
    step: StepId,
    status: 'done' | 'skipped' | null,
    now: Date = new Date(),
  ): Promise<void> {
    const id = occurrenceStateId(routineId, eventDate, step);
    if (status === null) {
      await this.database.occurrenceStates.delete(id);
      return;
    }
    const row: OccurrenceState = {
      id,
      routineId,
      eventDate,
      stepId: step,
      status,
      changedAt: now.toISOString(),
    };
    await this.database.occurrenceStates.put(row);
  }

  // -- Settings ------------------------------------------------------------

  async getSetting<T>(key: string): Promise<T | undefined> {
    const row = await this.database.settings.get(key);
    return row?.value as T | undefined;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.database.settings.put({ key, value });
  }

  // -- Whole dataset (backup, demo, reset) ---------------------------------

  async exportAll(): Promise<UserData> {
    return this.database.transaction(
      'r',
      [this.database.tasks, this.database.routines, this.database.occurrenceStates, this.database.settings],
      async () => ({
        tasks: await this.database.tasks.toArray(),
        routines: await this.database.routines.toArray(),
        occurrenceStates: await this.database.occurrenceStates.toArray(),
        settings: await this.database.settings.toArray(),
      }),
    );
  }

  /** Replaces everything atomically. If any write fails, nothing changes. */
  async replaceAll(data: UserData): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.tasks, this.database.routines, this.database.occurrenceStates, this.database.settings],
      async () => {
        await Promise.all([
          this.database.tasks.clear(),
          this.database.routines.clear(),
          this.database.occurrenceStates.clear(),
          this.database.settings.clear(),
        ]);
        await this.database.tasks.bulkAdd(data.tasks);
        await this.database.routines.bulkAdd(data.routines);
        await this.database.occurrenceStates.bulkAdd(data.occurrenceStates);
        await this.database.settings.bulkAdd(data.settings satisfies Setting[]);
      },
    );
  }

  /** Adds tasks, routines and occurrence states without touching other rows (used for demo data). */
  async addMany(tasks: Task[], routines: Routine[], occurrenceStates: OccurrenceState[] = []): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.tasks, this.database.routines, this.database.occurrenceStates],
      async () => {
        await this.database.tasks.bulkPut(tasks);
        await this.database.routines.bulkPut(routines);
        if (occurrenceStates.length) await this.database.occurrenceStates.bulkPut(occurrenceStates);
      },
    );
  }

  async clearUserData(): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.tasks, this.database.routines, this.database.occurrenceStates],
      async () => {
        await Promise.all([
          this.database.tasks.clear(),
          this.database.routines.clear(),
          this.database.occurrenceStates.clear(),
        ]);
      },
    );
  }
}

export const repository = new Repository();
