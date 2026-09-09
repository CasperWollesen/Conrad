import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBackup, parseBackup, serializeBackup } from '../domain/backup';
import { buildActions, pendingBeforeFreeTime } from '../domain/actions';
import { ReadyDatabase } from './db';
import { Repository } from './repository';

let counter = 0;

function freshRepository(): { repo: Repository; db: ReadyDatabase } {
  const db = new ReadyDatabase(`ready-test-${++counter}`);
  return { repo: new Repository(db), db };
}

async function seed(repo: Repository) {
  const now = new Date('2026-09-09T10:00:00.000Z');
  const cake = await repo.addTask(
    {
      title: 'Kage med i skole',
      date: '2026-09-11',
      time: '08:00',
      note: '',
      beforeFreeTime: true,
      completedAt: null,
      prep: { title: 'Bag kage', date: '2026-09-10', beforeFreeTime: true, completedAt: null },
    },
    now,
  );
  const gym = await repo.addRoutine(
    {
      title: 'Gymnastik',
      weekdays: [2, 5],
      startDate: '2026-09-07',
      time: '08:00',
      note: '',
      beforeFreeTime: false,
      prep: { title: 'Pak gymnastiktøj', daysBefore: 1, beforeFreeTime: true },
      paused: false,
    },
    now,
  );
  await repo.setOccurrenceStatus(gym.id, '2026-09-08', 'prep', 'done', now);
  await repo.setOccurrenceStatus(gym.id, '2026-09-11', 'prep', 'skipped', now);
  await repo.setTaskStepDone(cake.id, 'prep', true, now);
  await repo.setSetting('installHintDismissed', true);
  return { cake, gym };
}

describe('repository', () => {
  it('checks off task steps independently', async () => {
    const { repo } = freshRepository();
    const { cake } = await seed(repo);
    const stored = (await repo.exportAll()).tasks.find((t) => t.id === cake.id)!;
    expect(stored.prep?.completedAt).not.toBeNull();
    expect(stored.completedAt).toBeNull();
  });

  it('clears an occurrence state to make it pending again (undo)', async () => {
    const { repo } = freshRepository();
    const { gym } = await seed(repo);
    await repo.setOccurrenceStatus(gym.id, '2026-09-08', 'prep', null);
    const states = (await repo.exportAll()).occurrenceStates;
    expect(states.map((s) => s.eventDate)).toEqual(['2026-09-11']);
  });

  it('deleting a routine removes its history and restore brings it back', async () => {
    const { repo } = freshRepository();
    const { gym } = await seed(repo);
    const removed = await repo.deleteRoutine(gym.id);
    expect(removed?.states).toHaveLength(2);
    expect((await repo.exportAll()).occurrenceStates).toHaveLength(0);
    await repo.restoreRoutine(removed!.routine, removed!.states);
    const data = await repo.exportAll();
    expect(data.routines).toHaveLength(1);
    expect(data.occurrenceStates).toHaveLength(2);
  });
});

describe('backup', () => {
  let source: Repository;
  beforeEach(async () => {
    source = freshRepository().repo;
    await seed(source);
  });

  it('11. export/import preserves tasks, routines and check-offs', async () => {
    const exported = await source.exportAll();
    const json = serializeBackup(createBackup(exported, new Date('2026-09-09T12:00:00.000Z')));

    const parsed = parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary).toEqual({
      tasks: 1,
      routines: 1,
      occurrenceStates: 2,
      exportedAt: '2026-09-09T12:00:00.000Z',
    });

    const target = freshRepository().repo;
    await target.addTask({
      title: 'Bliver erstattet',
      date: '2026-09-09',
      time: null,
      note: '',
      beforeFreeTime: true,
      completedAt: null,
      prep: null,
    });
    await target.replaceAll(parsed.data);

    const restored = await target.exportAll();
    expect(restored).toEqual(exported);

    // The restored data yields the same computed state.
    const today = '2026-09-10';
    const before = pendingBeforeFreeTime(buildActions(exported, today), today).map((a) => a.id);
    const after = pendingBeforeFreeTime(buildActions(restored, today), today).map((a) => a.id);
    expect(after).toEqual(before);
    expect(after).toEqual([]); // baking done, Friday prep skipped, Monday prep done
  });

  it('12. invalid import leaves existing data untouched', async () => {
    const before = await source.exportAll();

    const invalidInputs = [
      'not json at all',
      JSON.stringify({ hello: 'world' }),
      JSON.stringify({ app: 'ready', formatVersion: 99, data: { tasks: [], routines: [], occurrenceStates: [] } }),
      JSON.stringify({
        app: 'ready',
        formatVersion: 1,
        exportedAt: '2026-09-09T12:00:00.000Z',
        data: { tasks: [{ id: 't', title: 'Mangler felter' }], routines: [], occurrenceStates: [] },
      }),
      JSON.stringify({
        app: 'ready',
        formatVersion: 1,
        data: { tasks: [{ ...before.tasks[0], date: '2026-02-30' }], routines: [], occurrenceStates: [] },
      }),
      JSON.stringify({
        app: 'ready',
        formatVersion: 1,
        data: { tasks: [before.tasks[0], before.tasks[0]], routines: [], occurrenceStates: [] },
      }),
    ];
    const errors = invalidInputs.map((text) => {
      const r = parseBackup(text);
      return r.ok ? 'ok' : r.error;
    });
    expect(errors).toEqual([
      'not-json',
      'not-backup',
      'unsupported-version',
      'invalid-data',
      'invalid-data',
      'invalid-data',
    ]);

    expect(await source.exportAll()).toEqual(before);
  });

  it('a failing replace rolls back atomically', async () => {
    const before = await source.exportAll();
    const exported = await source.exportAll();
    // Duplicate primary keys make bulkAdd fail inside the transaction.
    const broken = { ...exported, routines: [exported.routines[0]!, exported.routines[0]!] };
    await expect(source.replaceAll(broken)).rejects.toBeTruthy();
    expect(await source.exportAll()).toEqual(before);
  });
});
