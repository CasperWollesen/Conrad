import { describe, expect, it } from 'vitest';
import {
  buildActions,
  buildTodayModel,
  computeStatus,
  groupByDay,
  isOverdue,
  pendingBeforeFreeTime,
} from './actions';
import { occurrenceStateId } from './ids';
import { occurrenceStateMap, routineActions, routineEventDates } from './routines';
import { taskActions } from './tasks';
import type { OccurrenceState, Routine, Task } from './types';

const T0 = '2026-09-01T10:00:00.000Z';

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'date'>): Task {
  return {
    time: null,
    note: '',
    beforeFreeTime: true,
    completedAt: null,
    prep: null,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

function routine(overrides: Partial<Routine> & Pick<Routine, 'id' | 'title' | 'weekdays' | 'startDate'>): Routine {
  return {
    time: null,
    note: '',
    beforeFreeTime: false,
    prep: null,
    paused: false,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

function state(
  routineId: string,
  eventDate: string,
  stepId: 'main' | 'prep',
  status: 'done' | 'skipped',
  changedAt = '2026-09-07T15:00:00.000Z',
): OccurrenceState {
  return { id: occurrenceStateId(routineId, eventDate, stepId), routineId, eventDate, stepId, status, changedAt };
}

/** The cake example from the specification. */
const cakeTask = task({
  id: 'cake',
  title: 'Kage med i skole',
  date: '2026-09-11',
  time: '08:00',
  beforeFreeTime: true,
  prep: { title: 'Bag kage', date: '2026-09-10', beforeFreeTime: true, completedAt: null },
});

/** The gymnastics example: Tuesday + Friday, packing the day before. */
const gymRoutine = routine({
  id: 'gym',
  title: 'Gymnastik',
  weekdays: [2, 5],
  startDate: '2026-09-07', // Monday
  time: '08:00',
  prep: { title: 'Pak gymnastiktøj', daysBefore: 1, beforeFreeTime: true },
});

describe('before-free-time rule', () => {
  it('1. a before-free-time task today blocks until it is done', () => {
    const today = '2026-09-09';
    const t = task({ id: 'math', title: 'Lav matematik', date: today });
    let actions = buildActions({ tasks: [t], routines: [], occurrenceStates: [] }, today);
    expect(pendingBeforeFreeTime(actions, today).map((a) => a.title)).toEqual(['Lav matematik']);
    expect(computeStatus(actions, today, true)).toEqual({ kind: 'pending', pending: 1, done: 0, total: 1 });

    const done = { ...t, completedAt: '2026-09-09T14:00:00.000Z' };
    actions = buildActions({ tasks: [done], routines: [], occurrenceStates: [] }, today);
    expect(pendingBeforeFreeTime(actions, today)).toEqual([]);
    expect(computeStatus(actions, today, true)).toEqual({ kind: 'ready', done: 1, total: 1 });
  });

  it('2. a task tomorrow does not block today', () => {
    const today = '2026-09-09';
    const t = task({ id: 'math', title: 'Lav matematik', date: '2026-09-10' });
    const actions = buildActions({ tasks: [t], routines: [], occurrenceStates: [] }, today);
    expect(pendingBeforeFreeTime(actions, today)).toEqual([]);
    expect(computeStatus(actions, today, true)).toEqual({ kind: 'ready', done: 0, total: 0 });
    // …but it is still visible in the upcoming list.
    expect(groupByDay(actions, today, '2026-09-20').map((g) => g.date)).toEqual(['2026-09-10']);
  });

  it('empty app shows the empty state rather than "ready"', () => {
    expect(computeStatus([], '2026-09-09', false)).toEqual({ kind: 'empty' });
  });

  it('a task without a time is not overdue during its own day', () => {
    const today = '2026-09-09';
    const [noTime] = taskActions(task({ id: 'a', title: 'A', date: today }));
    const [withTime] = taskActions(task({ id: 'b', title: 'B', date: today, time: '08:00' }));
    const [earlier] = taskActions(task({ id: 'c', title: 'C', date: '2026-09-08' }));
    expect(isOverdue(noTime!, today, '00:01')).toBe(false);
    expect(isOverdue(noTime!, today, '23:59')).toBe(false);
    expect(isOverdue(withTime!, today, '07:59')).toBe(false);
    expect(isOverdue(withTime!, today, '08:01')).toBe(true);
    expect(isOverdue(earlier!, today, '00:01')).toBe(true);
  });

  it('a passed deadline never marks an action as done', () => {
    const today = '2026-09-12';
    const actions = buildActions({ tasks: [cakeTask], routines: [], occurrenceStates: [] }, today);
    expect(actions.every((a) => a.status === 'pending')).toBe(true);
    expect(pendingBeforeFreeTime(actions, today).map((a) => a.title)).toEqual(['Bag kage', 'Kage med i skole']);
  });
});

describe('cake example (task with preparation)', () => {
  it('3. yields baking on 10 September and bringing on 11 September at 08:00', () => {
    const actions = taskActions(cakeTask);
    expect(actions).toHaveLength(2);
    const prep = actions.find((a) => a.step === 'prep')!;
    const main = actions.find((a) => a.step === 'main')!;
    expect(prep.title).toBe('Bag kage');
    expect(prep.date).toBe('2026-09-10');
    expect(prep.parent).toEqual({ title: 'Kage med i skole', date: '2026-09-11', time: '08:00' });
    expect(main.date).toBe('2026-09-11');
    expect(main.time).toBe('08:00');
    expect(main.prepInfo).toEqual({ title: 'Bag kage', date: '2026-09-10', status: 'pending' });
  });

  it('on Thursday only the preparation blocks; the main action is upcoming', () => {
    const today = '2026-09-10';
    const actions = buildActions({ tasks: [cakeTask], routines: [], occurrenceStates: [] }, today);
    expect(pendingBeforeFreeTime(actions, today).map((a) => a.title)).toEqual(['Bag kage']);
    const model = buildTodayModel(actions, today, true);
    expect(model.tomorrow.map((a) => a.title)).toEqual(['Kage med i skole']);
  });

  it('4. completing the preparation does not complete the main action', () => {
    const today = '2026-09-10';
    const baked: Task = {
      ...cakeTask,
      prep: { ...cakeTask.prep!, completedAt: '2026-09-10T16:00:00.000Z' },
    };
    const actions = buildActions({ tasks: [baked], routines: [], occurrenceStates: [] }, today);
    expect(pendingBeforeFreeTime(actions, today)).toEqual([]);
    expect(computeStatus(actions, today, true)).toEqual({ kind: 'ready', done: 1, total: 1 });
    const main = actions.find((a) => a.step === 'main')!;
    expect(main.status).toBe('pending');

    // Friday: bringing the cake becomes relevant.
    const friday = '2026-09-11';
    const fridayActions = buildActions({ tasks: [baked], routines: [], occurrenceStates: [] }, friday);
    expect(pendingBeforeFreeTime(fridayActions, friday).map((a) => a.title)).toEqual(['Kage med i skole']);
  });
});

describe('weekly routines', () => {
  it('5. gymnastics Tuesday/Friday gives preparation Monday/Thursday', () => {
    const actions = routineActions(gymRoutine, occurrenceStateMap([]), '2026-09-20');
    const preps = actions.filter((a) => a.step === 'prep').map((a) => [a.date, a.parent?.date]);
    expect(preps).toEqual([
      ['2026-09-07', '2026-09-08'],
      ['2026-09-10', '2026-09-11'],
      ['2026-09-14', '2026-09-15'],
      ['2026-09-17', '2026-09-18'],
    ]);
    const mains = actions.filter((a) => a.step === 'main').map((a) => a.date);
    expect(mains).toEqual(['2026-09-08', '2026-09-11', '2026-09-15', '2026-09-18']);
    expect(actions.find((a) => a.step === 'main')?.time).toBe('08:00');
  });

  it('6. a check-off applies to one concrete occurrence only', () => {
    const states = [state('gym', '2026-09-08', 'prep', 'done')];
    const actions = routineActions(gymRoutine, occurrenceStateMap(states), '2026-09-20');
    const byId = new Map(actions.map((a) => [a.id, a]));
    expect(byId.get('routine:gym:2026-09-08:prep')?.status).toBe('done');
    expect(byId.get('routine:gym:2026-09-08:main')?.status).toBe('pending');
    expect(byId.get('routine:gym:2026-09-11:prep')?.status).toBe('pending');
    expect(byId.get('routine:gym:2026-09-15:prep')?.status).toBe('pending');
  });

  it('the preparation for Friday is identified by Friday even though it is done Thursday', () => {
    const actions = routineActions(gymRoutine, occurrenceStateMap([]), '2026-09-20');
    const thursdayPrep = actions.find((a) => a.step === 'prep' && a.date === '2026-09-10')!;
    expect(thursdayPrep.source).toEqual({ kind: 'routine', routineId: 'gym', eventDate: '2026-09-11' });
    expect(thursdayPrep.id).toBe('routine:gym:2026-09-11:prep');
  });

  it('7. skipping one occurrence does not affect next week', () => {
    const today = '2026-09-10';
    const states = [state('gym', '2026-09-11', 'prep', 'skipped')];
    const actions = buildActions({ tasks: [], routines: [gymRoutine], occurrenceStates: states }, today);
    expect(pendingBeforeFreeTime(actions, today).map((a) => a.id)).toEqual(['routine:gym:2026-09-08:prep']);
    const skipped = actions.find((a) => a.id === 'routine:gym:2026-09-11:prep')!;
    expect(skipped.status).toBe('skipped');
    const nextWeek = actions.find((a) => a.id === 'routine:gym:2026-09-18:prep')!;
    expect(nextWeek.status).toBe('pending');
    // Skipped is different from done: it does not count as finished work.
    expect(computeStatus(actions, today, true)).toEqual({ kind: 'pending', pending: 1, done: 0, total: 1 });
  });

  it('8. earlier unfinished actions do not disappear at the date change', () => {
    const states = [state('gym', '2026-09-11', 'prep', 'done', '2026-09-10T18:00:00.000Z')];
    const nextWeek = '2026-09-16';
    const actions = buildActions({ tasks: [], routines: [gymRoutine], occurrenceStates: states }, nextWeek);
    const pending = pendingBeforeFreeTime(actions, nextWeek).map((a) => a.id);
    // Monday 7 Sep (for Tue 8 Sep) was never done; Thursday 10 Sep (for Fri 11 Sep) was; Monday 14 Sep (for Tue 15 Sep) is pending.
    expect(pending).toEqual(['routine:gym:2026-09-08:prep', 'routine:gym:2026-09-15:prep']);
    // Last week's and this week's occurrences exist independently.
    expect(new Set(pending).size).toBe(2);
  });

  it('9. creating a routine does not produce a historical backlog', () => {
    const created = routine({
      id: 'r',
      title: 'Træning',
      weekdays: [2, 5],
      startDate: '2026-09-08', // created on a Tuesday
      prep: { title: 'Pak taske', daysBefore: 1, beforeFreeTime: true },
    });
    const actions = routineActions(created, occurrenceStateMap([]), '2026-09-13');
    // No events before start; the preparation that would fall on Monday 7 Sep is not generated.
    expect(actions.map((a) => [a.step, a.date])).toEqual([
      ['main', '2026-09-08'],
      ['prep', '2026-09-10'],
      ['main', '2026-09-11'],
    ]);
    expect(routineEventDates(created, '2026-01-01', '2026-09-07')).toEqual([]);
  });

  it('a paused routine yields no actions', () => {
    const paused = { ...gymRoutine, paused: true };
    expect(routineActions(paused, occurrenceStateMap([]), '2026-09-20')).toEqual([]);
  });

  it('editing a routine keeps completed occurrences from resurfacing', () => {
    const today = '2026-09-16';
    const states = [
      state('gym', '2026-09-08', 'prep', 'done', '2026-09-07T18:00:00.000Z'),
      state('gym', '2026-09-11', 'prep', 'done', '2026-09-10T18:00:00.000Z'),
      state('gym', '2026-09-15', 'prep', 'done', '2026-09-14T18:00:00.000Z'),
    ];
    // Preparation moved to two days before; weekdays changed to Wednesday/Friday.
    const edited: Routine = {
      ...gymRoutine,
      weekdays: [3, 5],
      prep: { ...gymRoutine.prep!, daysBefore: 2 },
    };
    const actions = buildActions({ tasks: [], routines: [edited], occurrenceStates: states }, today);
    const pending = pendingBeforeFreeTime(actions, today).map((a) => a.id);
    // Friday 11 Sep stays done (state is keyed by event date, not the prep date).
    expect(pending).not.toContain('routine:gym:2026-09-11:prep');
    // The new Wednesday occurrence this week (16 Sep) has prep on Monday 14 Sep, now pending.
    expect(pending).toContain('routine:gym:2026-09-16:prep');
  });

  it('10. routine dates are correct across month, year and DST boundaries', () => {
    const r = routine({
      id: 'r',
      title: 'Mandagsting',
      weekdays: [1],
      startDate: '2026-10-19',
      prep: { title: 'Forbered', daysBefore: 1, beforeFreeTime: true },
    });
    // DST ends Sunday 2026-10-25 in Denmark; Monday 26 Oct still has its prep on Sunday 25 Oct.
    // (The prep for Monday 19 Oct would fall before the start date and is not generated.)
    const oct = routineActions(r, occurrenceStateMap([]), '2026-11-03');
    expect(oct.filter((a) => a.step === 'prep').map((a) => a.date)).toEqual(['2026-10-25', '2026-11-01']);
    expect(oct.filter((a) => a.step === 'main').map((a) => a.date)).toEqual(['2026-10-19', '2026-10-26', '2026-11-02']);

    // Year boundary: Monday 2027-01-04 has its prep on Sunday 2027-01-03; Monday 28 Dec prep on 27 Dec.
    const newYear = routineActions({ ...r, startDate: '2026-12-21' }, occurrenceStateMap([]), '2027-01-05');
    expect(newYear.map((a) => [a.step, a.date])).toEqual([
      ['main', '2026-12-21'],
      ['prep', '2026-12-27'],
      ['main', '2026-12-28'],
      ['prep', '2027-01-03'],
      ['main', '2027-01-04'],
    ]);

    // DST starts Sunday 2027-03-28.
    const spring = routineActions({ ...r, startDate: '2027-03-22' }, occurrenceStateMap([]), '2027-03-30');
    expect(spring.map((a) => [a.step, a.date])).toEqual([
      ['main', '2027-03-22'],
      ['prep', '2027-03-28'],
      ['main', '2027-03-29'],
    ]);
  });

  it('routine actions beyond the horizon are not generated, but preparations inside it are', () => {
    const actions = routineActions(gymRoutine, occurrenceStateMap([]), '2026-09-10');
    expect(actions.map((a) => [a.step, a.date])).toEqual([
      ['prep', '2026-09-07'],
      ['main', '2026-09-08'],
      ['prep', '2026-09-10'], // for Friday 11 Sep, which itself is outside the horizon
    ]);
  });
});

describe('today model and grouping', () => {
  it('orders pending actions by relevance: earlier dates first, then today by time', () => {
    const today = '2026-09-10';
    const tasks = [
      task({ id: 'a', title: 'Senere i dag', date: today, time: '18:00' }),
      task({ id: 'b', title: 'Uden tid', date: today }),
      task({ id: 'c', title: 'Fra i går', date: '2026-09-09' }),
      task({ id: 'd', title: 'Tidligt i dag', date: today, time: '08:00' }),
    ];
    const actions = buildActions({ tasks, routines: [], occurrenceStates: [] }, today);
    expect(pendingBeforeFreeTime(actions, today).map((a) => a.title)).toEqual([
      'Fra i går',
      'Tidligt i dag',
      'Senere i dag',
      'Uden tid',
    ]);
  });

  it('keeps ordinary tasks visible even though they do not affect status', () => {
    const today = '2026-09-10';
    const tasks = [
      task({ id: 'a', title: 'Ring til mormor', date: today, beforeFreeTime: false }),
      task({ id: 'b', title: 'Gammel ting', date: '2026-09-01', beforeFreeTime: false }),
    ];
    const actions = buildActions({ tasks, routines: [], occurrenceStates: [] }, today);
    const model = buildTodayModel(actions, today, true);
    expect(model.status).toEqual({ kind: 'ready', done: 0, total: 0 });
    expect(model.otherToday.map((a) => a.title)).toEqual(['Ring til mormor']);
    expect(model.earlier.map((a) => a.title)).toEqual(['Gammel ting']);
  });

  it('counts older actions completed today as done today', () => {
    const today = '2026-09-10';
    const tasks = [
      task({ id: 'a', title: 'Fra i går', date: '2026-09-09', completedAt: '2026-09-10T12:00:00.000Z' }),
      task({ id: 'b', title: 'Fra sidste uge', date: '2026-09-03', completedAt: '2026-09-03T12:00:00.000Z' }),
    ];
    const actions = buildActions({ tasks, routines: [], occurrenceStates: [] }, today);
    const model = buildTodayModel(actions, today, true);
    expect(model.doneToday.map((a) => a.title)).toEqual(['Fra i går']);
    expect(model.status).toEqual({ kind: 'ready', done: 1, total: 1 });
  });

  it('groups upcoming actions by day within a window', () => {
    const today = '2026-09-09';
    const actions = buildActions({ tasks: [cakeTask], routines: [gymRoutine], occurrenceStates: [] }, today);
    const groups = groupByDay(actions, today, '2026-09-15');
    expect(groups.map((g) => [g.date, g.actions.map((a) => a.title)])).toEqual([
      ['2026-09-10', ['Bag kage', 'Pak gymnastiktøj']],
      ['2026-09-11', ['Kage med i skole', 'Gymnastik']],
      ['2026-09-14', ['Pak gymnastiktøj']],
      ['2026-09-15', ['Gymnastik']],
    ]);
  });
});
