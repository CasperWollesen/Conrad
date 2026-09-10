import { addDays, compareISODate, parseISODate, weekdayOf } from '../domain/dates';
import { occurrenceStateId } from '../domain/ids';
import { routineEventDates } from '../domain/routines';
import type { ISODate, OccurrenceState, Routine, Task } from '../domain/types';

/**
 * Example data for development and manual testing. Only inserted through the
 * explicit "Indlæs eksempeldata" action in settings; never automatically.
 * Uses fixed ids so loading twice does not duplicate anything.
 */
export function demoData(
  today: ISODate,
  now: Date = new Date(),
): { tasks: Task[]; routines: Routine[]; occurrenceStates: OccurrenceState[] } {
  const ts = now.toISOString();
  const nextFriday = nextWeekday(today, 5);
  const tasks: Task[] = [
    {
      id: 'demo-task-cake',
      title: 'Bring cake to school',
      date: nextFriday,
      time: '08:00',
      note: 'Friday treat for the class.',
      beforeFreeTime: true,
      completedAt: null,
      prep: { title: 'Bake the cake', date: addDays(nextFriday, -1), beforeFreeTime: true, completedAt: null },
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-task-math',
      title: 'Do maths homework',
      date: today,
      time: null,
      note: 'Pages 42–44.',
      beforeFreeTime: true,
      completedAt: null,
      prep: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-task-bike',
      title: 'Charge the e-bike',
      date: today,
      time: '21:00',
      note: '',
      beforeFreeTime: false,
      completedAt: null,
      prep: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-task-grandma',
      title: 'Call grandma',
      date: addDays(today, 3),
      time: null,
      note: '',
      beforeFreeTime: false,
      completedAt: null,
      prep: null,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const routines: Routine[] = [
    {
      id: 'demo-routine-gym',
      title: 'Gymnastics',
      weekdays: [2, 5],
      startDate: addDays(today, -7),
      time: '08:00',
      note: '',
      beforeFreeTime: false,
      prep: { title: 'Pack gym clothes', daysBefore: 1, beforeFreeTime: true },
      paused: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-routine-trash',
      title: 'Take the bin out',
      weekdays: [3],
      startDate: today,
      time: null,
      note: 'Collected Thursday morning.',
      beforeFreeTime: true,
      prep: null,
      paused: false,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  // Earlier gymnastics occurrences are marked done, except the most recent
  // preparation, which stays open to show how an unfinished item is carried over.
  const gym = routines[0]!;
  const pastEvents = routineEventDates(gym, gym.startDate, addDays(today, -1));
  const occurrenceStates: OccurrenceState[] = [];
  pastEvents.forEach((eventDate, i) => {
    const isLast = i === pastEvents.length - 1;
    const prepDate = addDays(eventDate, -(gym.prep?.daysBefore ?? 0));
    if (!isLast) {
      occurrenceStates.push(doneState(gym.id, eventDate, 'prep', parseISODate(prepDate).toISOString()));
    }
    if (compareISODate(eventDate, today) < 0) {
      occurrenceStates.push(doneState(gym.id, eventDate, 'main', parseISODate(eventDate).toISOString()));
    }
  });

  return { tasks, routines, occurrenceStates };
}

function doneState(routineId: string, eventDate: ISODate, stepId: 'main' | 'prep', ts: string): OccurrenceState {
  return { id: occurrenceStateId(routineId, eventDate, stepId), routineId, eventDate, stepId, status: 'done', changedAt: ts };
}

/** First date on or after `from` with the given ISO weekday; if it is today, use next week. */
function nextWeekday(from: ISODate, weekday: number): ISODate {
  let d = addDays(from, 1);
  while (weekdayOf(d) !== weekday) d = addDays(d, 1);
  return d;
}
