import { useCallback, useMemo } from 'react';
import type { Action, Routine, Task } from '../domain/types';
import { repository, type RoutineInput, type TaskInput } from '../storage/repository';
import { texts } from '../texts';
import { useToast } from './hooks/useToast';

/**
 * All user-triggered writes. Each call awaits the database; on failure the UI
 * (which mirrors the database through liveQuery) simply stays unchanged and
 * an error toast is shown. Most actions offer an undo in the toast.
 */
export function useActionHandlers() {
  const toast = useToast();

  const fail = useCallback(
    (error: unknown) => {
      console.error(error);
      toast.show({ message: texts.toast.saveFailed, variant: 'error' });
    },
    [toast],
  );

  const requestPersistentStorage = useCallback(async () => {
    try {
      const already = await repository.getSetting<boolean>('persistRequested');
      if (already) return;
      await repository.setSetting('persistRequested', true);
      if (navigator.storage && typeof navigator.storage.persist === 'function') {
        await navigator.storage.persist();
      }
    } catch {
      // Best effort only; backup remains the real safety net.
    }
  }, []);

  const setStatus = useCallback(
    async (action: Action, status: 'done' | 'skipped' | null) => {
      if (action.source.kind === 'task') {
        if (status === 'skipped') return; // tasks cannot be skipped
        await repository.setTaskStepDone(action.source.taskId, action.step, status === 'done');
      } else {
        await repository.setOccurrenceStatus(action.source.routineId, action.source.eventDate, action.step, status);
      }
    },
    [],
  );

  const toggleDone = useCallback(
    async (action: Action) => {
      const previous = action.status;
      const next = previous === 'done' ? null : 'done';
      try {
        await setStatus(action, next);
        toast.show({
          message: next === 'done' ? texts.toast.done(action.title) : texts.toast.undone(action.title),
          actionLabel: texts.toast.undo,
          onAction: async () => {
            try {
              await setStatus(action, previous === 'pending' ? null : previous);
            } catch (e) {
              fail(e);
            }
          },
        });
      } catch (e) {
        fail(e);
      }
    },
    [setStatus, toast, fail],
  );

  const skip = useCallback(
    async (action: Action) => {
      if (action.source.kind !== 'routine') return;
      const previous = action.status;
      try {
        await setStatus(action, 'skipped');
        toast.show({
          message: texts.toast.skipped(action.title),
          actionLabel: texts.toast.undo,
          onAction: async () => {
            try {
              await setStatus(action, previous === 'pending' ? null : previous);
            } catch (e) {
              fail(e);
            }
          },
        });
      } catch (e) {
        fail(e);
      }
    },
    [setStatus, toast, fail],
  );

  const unskip = useCallback(
    async (action: Action) => {
      if (action.source.kind !== 'routine') return;
      try {
        await setStatus(action, null);
        toast.show({
          message: texts.toast.unskipped(action.title),
          actionLabel: texts.toast.undo,
          onAction: async () => {
            try {
              await setStatus(action, 'skipped');
            } catch (e) {
              fail(e);
            }
          },
        });
      } catch (e) {
        fail(e);
      }
    },
    [setStatus, toast, fail],
  );

  const saveTask = useCallback(
    async (id: string | null, input: TaskInput): Promise<boolean> => {
      try {
        if (id) await repository.updateTask(id, input);
        else await repository.addTask(input);
        void requestPersistentStorage();
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [fail, requestPersistentStorage],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      try {
        const removed = await repository.deleteTask(task.id);
        if (!removed) return;
        toast.show({
          message: texts.toast.deleted(task.title),
          actionLabel: texts.toast.undo,
          onAction: async () => {
            try {
              await repository.putTask(removed);
            } catch (e) {
              fail(e);
            }
          },
        });
      } catch (e) {
        fail(e);
      }
    },
    [toast, fail],
  );

  const saveRoutine = useCallback(
    async (id: string | null, input: RoutineInput): Promise<boolean> => {
      try {
        if (id) await repository.updateRoutine(id, input);
        else await repository.addRoutine(input);
        void requestPersistentStorage();
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [fail, requestPersistentStorage],
  );

  const deleteRoutine = useCallback(
    async (routine: Routine) => {
      try {
        const removed = await repository.deleteRoutine(routine.id);
        if (!removed) return;
        toast.show({
          message: texts.toast.routineDeleted(routine.title),
          actionLabel: texts.toast.undo,
          onAction: async () => {
            try {
              await repository.restoreRoutine(removed.routine, removed.states);
            } catch (e) {
              fail(e);
            }
          },
        });
      } catch (e) {
        fail(e);
      }
    },
    [toast, fail],
  );

  const setRoutinePaused = useCallback(
    async (routine: Routine, paused: boolean) => {
      try {
        await repository.updateRoutine(routine.id, { paused });
      } catch (e) {
        fail(e);
      }
    },
    [fail],
  );

  return useMemo(
    () => ({ toggleDone, skip, unskip, saveTask, deleteTask, saveRoutine, deleteRoutine, setRoutinePaused }),
    [toggleDone, skip, unskip, saveTask, deleteTask, saveRoutine, deleteRoutine, setRoutinePaused],
  );
}

export type ActionHandlers = ReturnType<typeof useActionHandlers>;
