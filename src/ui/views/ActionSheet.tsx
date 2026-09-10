import { Check, Link2, Pencil, Repeat, RotateCcw, SkipForward, Trash, Undo2 } from 'lucide-react';
import { isOverdue } from '../../domain/actions';
import type { Action, ISODate, TimeString } from '../../domain/types';
import { texts } from '../../texts';
import { Sheet } from '../components/Sheet';
import { formatClock, formatRelativeDay, formatWhen } from '../format';

export interface ActionSheetProps {
  action: Action | null;
  today: ISODate;
  nowTime: TimeString;
  onClose: () => void;
  onToggleDone: (action: Action) => void;
  onSkip: (action: Action) => void;
  onUnskip: (action: Action) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditRoutine: (routineId: string) => void;
}

/**
 * Details and actions for one concrete action. For routine occurrences the
 * "this time only" actions are kept clearly apart from editing the routine.
 */
export function ActionSheet({
  action,
  today,
  nowTime,
  onClose,
  onToggleDone,
  onSkip,
  onUnskip,
  onEditTask,
  onDeleteTask,
  onEditRoutine,
}: ActionSheetProps) {
  const open = action !== null;
  const a = action;

  return (
    <Sheet open={open} onClose={onClose} title={a?.source.kind === 'routine' ? texts.occurrence.title : texts.actionMenu.title}>
      {a ? (
        <>
          <div className="detail">
            <h3 className="detail__title">{a.title}</h3>
            <div className={`detail__meta${isOverdue(a, today, nowTime) ? ' action__meta--overdue' : ''}`}>
              <span>{formatRelativeDay(a.date, today)}</span>
              {a.time ? <span>· {formatClock(a.time)}</span> : null}
              {a.beforeFreeTime ? <span className="tag tag--accent">{texts.action.beforeFreeTime}</span> : null}
              {a.status === 'done' ? <span className="tag tag--outline">{texts.action.done}</span> : null}
              {a.status === 'skipped' ? <span className="tag tag--outline">{texts.action.skipped}</span> : null}
              {a.source.kind === 'routine' ? (
                <span className="tag">
                  <Repeat size={12} aria-hidden="true" /> {texts.action.routine}
                </span>
              ) : null}
            </div>
            {a.note ? <p className="detail__note">{a.note}</p> : null}
            {a.parent ? (
              <div className="detail__link">
                <Link2 size={16} aria-hidden="true" />
                <span>
                  {texts.action.prepFor(a.parent.title)} · {formatWhen(a.parent.date, a.parent.time, today)}
                </span>
              </div>
            ) : null}
            {a.prepInfo ? (
              <div className="detail__link">
                <Link2 size={16} aria-hidden="true" />
                <span>
                  {texts.action.prepOf(a.prepInfo.title)} · {formatRelativeDay(a.prepInfo.date, today)}
                  {a.prepInfo.status === 'done' ? ` · ${texts.action.done.toLowerCase()}` : ''}
                  {a.prepInfo.status === 'skipped' ? ` · ${texts.action.skipped.toLowerCase()}` : ''}
                </span>
              </div>
            ) : null}
          </div>

          <div className="menu">
            <button
              type="button"
              className={`menu__item${a.status === 'done' ? '' : ' menu__item--primary'}`}
              onClick={() => {
                onToggleDone(a);
                onClose();
              }}
            >
              {a.status === 'done' ? <Undo2 size={20} aria-hidden="true" /> : <Check size={20} aria-hidden="true" />}
              {a.status === 'done' ? texts.action.markUndone : texts.action.markDone}
            </button>

            {a.source.kind === 'task' ? (
              <>
                <button type="button" className="menu__item" onClick={() => onEditTask(a.source.kind === 'task' ? a.source.taskId : '')}>
                  <Pencil size={20} aria-hidden="true" />
                  {texts.actionMenu.edit}
                </button>
                <button
                  type="button"
                  className="menu__item menu__item--danger"
                  onClick={() => {
                    if (a.source.kind === 'task') onDeleteTask(a.source.taskId);
                    onClose();
                  }}
                >
                  <Trash size={20} aria-hidden="true" />
                  {texts.actionMenu.delete}
                </button>
              </>
            ) : (
              <>
                {a.status === 'skipped' ? (
                  <button
                    type="button"
                    className="menu__item"
                    onClick={() => {
                      onUnskip(a);
                      onClose();
                    }}
                  >
                    <RotateCcw size={20} aria-hidden="true" />
                    {texts.occurrence.unskip}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="menu__item"
                    onClick={() => {
                      onSkip(a);
                      onClose();
                    }}
                  >
                    <SkipForward size={20} aria-hidden="true" />
                    {texts.occurrence.skip}
                  </button>
                )}
                <p className="menu__hint">{texts.occurrence.hint}</p>

                <div className="menu__group">
                  <span className="menu__group-title">{texts.action.routine}</span>
                  <button
                    type="button"
                    className="menu__item"
                    onClick={() => {
                      if (a.source.kind === 'routine') onEditRoutine(a.source.routineId);
                    }}
                  >
                    <Pencil size={20} aria-hidden="true" />
                    {texts.occurrence.editRoutine}
                  </button>
                  <p className="menu__hint">{texts.occurrence.routineHint}</p>
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </Sheet>
  );
}
