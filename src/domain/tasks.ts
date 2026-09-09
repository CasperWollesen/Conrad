import { taskActionId } from './ids';
import type { Action, Task } from './types';

/** One or two concrete actions for a single task (main step and optional preparation). */
export function taskActions(task: Task): Action[] {
  const out: Action[] = [];
  const prepStatus = task.prep ? (task.prep.completedAt ? 'done' : 'pending') : null;

  if (task.prep) {
    out.push({
      id: taskActionId(task.id, 'prep'),
      source: { kind: 'task', taskId: task.id },
      step: 'prep',
      title: task.prep.title,
      date: task.prep.date,
      time: null,
      note: task.note,
      beforeFreeTime: task.prep.beforeFreeTime,
      status: task.prep.completedAt ? 'done' : 'pending',
      changedAt: task.prep.completedAt,
      parent: { title: task.title, date: task.date, time: task.time },
      prepInfo: null,
    });
  }

  out.push({
    id: taskActionId(task.id, 'main'),
    source: { kind: 'task', taskId: task.id },
    step: 'main',
    title: task.title,
    date: task.date,
    time: task.time,
    note: task.note,
    beforeFreeTime: task.beforeFreeTime,
    status: task.completedAt ? 'done' : 'pending',
    changedAt: task.completedAt,
    parent: null,
    prepInfo:
      task.prep && prepStatus
        ? { title: task.prep.title, date: task.prep.date, status: prepStatus }
        : null,
  });
  return out;
}
