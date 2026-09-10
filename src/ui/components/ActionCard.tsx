import { Check, Repeat, SkipForward } from 'lucide-react';
import { isOverdue } from '../../domain/actions';
import { compareISODate } from '../../domain/dates';
import type { Action, ISODate, TimeString } from '../../domain/types';
import { texts } from '../../texts';
import { formatClock, formatRelativeDay, formatWhen } from '../format';

export interface ActionCardProps {
  action: Action;
  today: ISODate;
  nowTime: TimeString;
  onToggleDone: (action: Action) => void;
  onOpen: (action: Action) => void;
  /** Show the action's own date (lists that are not already grouped by day). */
  showDate?: boolean;
  /** Show the "Før fritid" tag (useful outside the before-free-time section). */
  showBeforeFreeTimeTag?: boolean;
}

export function ActionCard({
  action,
  today,
  nowTime,
  onToggleDone,
  onOpen,
  showDate = false,
  showBeforeFreeTimeTag = false,
}: ActionCardProps) {
  const done = action.status === 'done';
  const skipped = action.status === 'skipped';
  const pastDate = action.status === 'pending' && compareISODate(action.date, today) < 0;
  const overdue = isOverdue(action, today, nowTime);
  const isRoutine = action.source.kind === 'routine';

  const checkLabel = done ? `${texts.action.markUndone}: ${action.title}` : `${texts.action.markDone}: ${action.title}`;

  return (
    <article className={`action${done || skipped ? ' action--done' : ''}`}>
      <button
        type="button"
        className="action__check"
        role="checkbox"
        aria-checked={done}
        aria-label={checkLabel}
        data-status={action.status}
        onClick={() => onToggleDone(action)}
      >
        <span className="action__check-ring" aria-hidden="true">
          {skipped ? <SkipForward size={14} strokeWidth={2.5} /> : <Check size={16} strokeWidth={3} />}
        </span>
      </button>

      <button
        type="button"
        className="action__body"
        onClick={() => onOpen(action)}
        aria-label={`${texts.action.open}: ${action.title}`}
      >
        <span className="action__title">{action.title}</span>

        <span className={`action__meta${overdue ? ' action__meta--overdue' : ''}`}>
          {pastDate ? (
            <span>{texts.action.from(formatRelativeDay(action.date, today))}</span>
          ) : showDate ? (
            <span>{formatRelativeDay(action.date, today)}</span>
          ) : null}
          {action.time ? <span>{formatClock(action.time)}</span> : null}
          {skipped ? <span className="tag tag--outline">{texts.action.skipped}</span> : null}
          {showBeforeFreeTimeTag && action.beforeFreeTime ? (
            <span className="tag tag--accent">{texts.action.beforeFreeTime}</span>
          ) : null}
          {isRoutine ? (
            <span className="tag">
              <Repeat size={12} aria-hidden="true" />
              {texts.action.routine}
            </span>
          ) : null}
        </span>

        {action.parent ? (
          <span className="action__context">
            {texts.action.prepFor('')}
            <strong>{action.parent.title}</strong>
            {' · '}
            {formatWhen(action.parent.date, action.parent.time, today)}
          </span>
        ) : action.prepInfo ? (
          <span className="action__context">
            {texts.action.prepOf('')}
            <strong>{action.prepInfo.title}</strong>
            {' · '}
            {formatRelativeDay(action.prepInfo.date, today)}
            {action.prepInfo.status === 'done'
              ? ` · ${texts.action.done.toLowerCase()}`
              : action.prepInfo.status === 'skipped'
                ? ` · ${texts.action.skipped.toLowerCase()}`
                : ''}
          </span>
        ) : null}
      </button>
    </article>
  );
}
