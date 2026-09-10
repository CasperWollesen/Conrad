import { Smartphone, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildActions, buildTodayModel } from './domain/actions';
import { BEDTIME_SETTING_KEY, isBedtime, parseBedtimeSettings } from './domain/bedtime';
import type { Action, ISODate, Routine, Task } from './domain/types';
import { repository } from './storage/repository';
import { texts } from './texts';
import { Button, IconButton } from './ui/components/Button';
import { Nav, type Tab } from './ui/components/Nav';
import { Toast } from './ui/components/Toast';
import { UpdateBanner } from './ui/components/UpdateBanner';
import { useAppData } from './ui/hooks/useAppData';
import { useInstallPrompt } from './ui/hooks/useInstallPrompt';
import { ToastProvider } from './ui/hooks/useToast';
import { useClock } from './ui/hooks/useToday';
import { useActionHandlers } from './ui/useActions';
import { ActionSheet } from './ui/views/ActionSheet';
import { RoutineEditor } from './ui/views/RoutineEditor';
import { RoutinesView } from './ui/views/RoutinesView';
import { SettingsSheet } from './ui/views/SettingsSheet';
import { TaskEditor } from './ui/views/TaskEditor';
import { TodayView } from './ui/views/TodayView';
import { UpcomingView } from './ui/views/UpcomingView';

type Overlay =
  | { kind: 'none' }
  | { kind: 'task'; task: Task | null; defaultDate: ISODate }
  | { kind: 'routine'; routine: Routine | null }
  | { kind: 'action'; actionId: string }
  | { kind: 'settings' };

const DEMO_ENABLED = import.meta.env.DEV || new URLSearchParams(window.location.search).has('demo');

export function App() {
  return (
    <ToastProvider>
      <Shell />
      <Toast />
    </ToastProvider>
  );
}

function Shell() {
  const [reloadKey, setReloadKey] = useState(0);
  const data = useAppData(reloadKey);
  const { today, nowTime } = useClock();
  const handlers = useActionHandlers();
  const install = useInstallPrompt();
  const [tab, setTab] = useState<Tab>('today');
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });

  const userData = data.status === 'ready' ? data.data : null;

  const actions = useMemo(
    () => (userData ? buildActions(userData, today) : []),
    [userData, today],
  );
  const hasAnyData = Boolean(userData && (userData.tasks.length > 0 || userData.routines.length > 0));
  const todayModel = useMemo(() => buildTodayModel(actions, today, hasAnyData), [actions, today, hasAnyData]);

  const bedtimeSetting = userData?.settings.find((s) => s.key === BEDTIME_SETTING_KEY)?.value;
  const bedtime = useMemo(() => parseBedtimeSettings(bedtimeSetting), [bedtimeSetting]);
  const bedtimeUntil = isBedtime(today, nowTime, bedtime) ? bedtime.end : null;

  const openAction = overlay.kind === 'action' ? (actions.find((a) => a.id === overlay.actionId) ?? null) : null;
  const closeOverlay = useCallback(() => setOverlay({ kind: 'none' }), []);

  // If the action behind the open sheet disappears (deleted, routine paused…), close the sheet.
  useEffect(() => {
    if (overlay.kind === 'action' && userData && !openAction) setOverlay({ kind: 'none' });
  }, [overlay, openAction, userData]);

  const installHintDismissed = userData?.settings.some((s) => s.key === 'installHintDismissed' && s.value === true) ?? true;
  const showInstallHint =
    !install.isStandalone && !installHintDismissed && hasAnyData && (install.canPrompt || install.platform === 'ios');

  const dismissInstallHint = () => {
    void repository.setSetting('installHintDismissed', true).catch(console.error);
  };

  const openTaskEditor = (task: Task | null, defaultDate: ISODate = today) =>
    setOverlay({ kind: 'task', task, defaultDate });
  const openRoutineEditor = (routine: Routine | null) => setOverlay({ kind: 'routine', routine });
  const openActionSheet = (action: Action) => setOverlay({ kind: 'action', actionId: action.id });
  const onAdd = () => (tab === 'routines' ? openRoutineEditor(null) : openTaskEditor(null, today));

  const editTaskById = (taskId: string) => {
    const task = userData?.tasks.find((t) => t.id === taskId);
    if (task) openTaskEditor(task);
  };
  const editRoutineById = (routineId: string) => {
    const routine = userData?.routines.find((r) => r.id === routineId);
    if (routine) openRoutineEditor(routine);
  };
  const deleteTaskById = (taskId: string) => {
    const task = userData?.tasks.find((t) => t.id === taskId);
    if (task) void handlers.deleteTask(task);
  };

  if (data.status === 'error') {
    return (
      <div className="fullscreen" role="alert">
        <h1 className="fullscreen__title">{texts.errors.dbTitle}</h1>
        <p className="fullscreen__text">{texts.errors.dbBody}</p>
        <Button variant="primary" onClick={() => setReloadKey((k) => k + 1)}>
          {texts.errors.retry}
        </Button>
      </div>
    );
  }

  if (data.status === 'loading') {
    return (
      <div className="fullscreen" aria-busy="true">
        <p className="fullscreen__text">{texts.common.loading}</p>
      </div>
    );
  }

  const cardHandlers = {
    today,
    nowTime,
    onToggleDone: (a: Action) => void handlers.toggleDone(a),
    onOpen: openActionSheet,
    onSettings: () => setOverlay({ kind: 'settings' }),
  };

  return (
    <div className="app">
      <Nav
        active={tab}
        onChange={setTab}
        onAdd={onAdd}
        addLabel={tab === 'routines' ? texts.add.routine : texts.add.task}
        onSettings={() => setOverlay({ kind: 'settings' })}
      />

      <main className="app__main">
        <UpdateBanner suppressed={overlay.kind !== 'none'} />
        {tab === 'today' ? (
          <TodayView
            model={todayModel}
            bedtimeUntil={bedtimeUntil}
            {...cardHandlers}
            onAdd={() => openTaskEditor(null, today)}
            extra={
              showInstallHint ? (
                <div className="banner">
                  <Smartphone size={20} className="banner__icon" aria-hidden="true" />
                  <span className="banner__text">
                    <strong>{texts.settings.install.title}</strong>
                    {texts.settings.install.description}
                  </span>
                  <span className="banner__actions">
                    <Button size="sm" onClick={() => setOverlay({ kind: 'settings' })}>
                      {texts.settings.install.button}
                    </Button>
                    <IconButton label={texts.common.close} icon={<X size={18} />} onClick={dismissInstallHint} />
                  </span>
                </div>
              ) : null
            }
          />
        ) : tab === 'upcoming' ? (
          <UpcomingView actions={actions} {...cardHandlers} onAddForDate={(date) => openTaskEditor(null, date)} />
        ) : (
          <RoutinesView
            routines={userData?.routines ?? []}
            onEdit={(r) => openRoutineEditor(r)}
            onAdd={() => openRoutineEditor(null)}
            onTogglePause={(r) => void handlers.setRoutinePaused(r, !r.paused)}
            onSettings={() => setOverlay({ kind: 'settings' })}
          />
        )}
      </main>

      <TaskEditor
        open={overlay.kind === 'task'}
        task={overlay.kind === 'task' ? overlay.task : null}
        defaultDate={overlay.kind === 'task' ? overlay.defaultDate : today}
        today={today}
        nowTime={nowTime}
        onClose={closeOverlay}
        onSave={handlers.saveTask}
        onDelete={(t) => void handlers.deleteTask(t)}
      />

      <RoutineEditor
        open={overlay.kind === 'routine'}
        routine={overlay.kind === 'routine' ? overlay.routine : null}
        today={today}
        onClose={closeOverlay}
        onSave={handlers.saveRoutine}
        onDelete={(r) => void handlers.deleteRoutine(r)}
      />

      <ActionSheet
        action={openAction}
        today={today}
        nowTime={nowTime}
        onClose={closeOverlay}
        onToggleDone={(a) => void handlers.toggleDone(a)}
        onSkip={(a) => void handlers.skip(a)}
        onUnskip={(a) => void handlers.unskip(a)}
        onEditTask={editTaskById}
        onDeleteTask={deleteTaskById}
        onEditRoutine={editRoutineById}
      />

      <SettingsSheet
        open={overlay.kind === 'settings'}
        onClose={closeOverlay}
        today={today}
        install={install}
        demoEnabled={DEMO_ENABLED}
        bedtime={bedtime}
      />

    </div>
  );
}
