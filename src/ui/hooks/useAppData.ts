import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import type { UserData } from '../../domain/types';
import { db } from '../../storage/db';

export type AppDataState =
  | { status: 'loading' }
  | { status: 'ready'; data: UserData }
  | { status: 'error'; error: unknown };

/**
 * Live view of everything in IndexedDB. Dexie's liveQuery re-runs the read
 * after every committed write (also from other tabs), so the UI only ever
 * shows what is actually stored.
 */
export function useAppData(reloadKey = 0): AppDataState {
  const [state, setState] = useState<AppDataState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });
    const subscription = liveQuery(async (): Promise<UserData> => {
      const [tasks, routines, occurrenceStates, settings] = await Promise.all([
        db.tasks.toArray(),
        db.routines.toArray(),
        db.occurrenceStates.toArray(),
        db.settings.toArray(),
      ]);
      return { tasks, routines, occurrenceStates, settings };
    }).subscribe({
      next: (data) => setState({ status: 'ready', data }),
      error: (error: unknown) => setState({ status: 'error', error }),
    });
    return () => subscription.unsubscribe();
  }, [reloadKey]);

  return state;
}
