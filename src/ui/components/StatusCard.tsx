import { CircleCheckBig, ListChecks, Sparkles } from 'lucide-react';
import type { ReadyStatus } from '../../domain/actions';
import { texts } from '../../texts';
import { Button } from './Button';

export interface StatusCardProps {
  status: ReadyStatus;
  onAdd: () => void;
}

/** The big, calm answer to "can I go now?". Only speaks about registered actions. */
export function StatusCard({ status, onAdd }: StatusCardProps) {
  if (status.kind === 'empty') {
    return (
      <section className="status-card status-card--empty" aria-live="polite">
        <div className="status-card__eyebrow">
          <Sparkles size={16} aria-hidden="true" />
          {texts.app.name}
        </div>
        <h2 className="status-card__title">{texts.status.emptyTitle}</h2>
        <p className="status-card__subtitle">{texts.status.emptySubtitle}</p>
        <div className="status-card__footer">
          <div>
            <Button variant="primary" onClick={onAdd}>
              {texts.add.task}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const ready = status.kind === 'ready';
  const total = status.total;
  const done = status.done;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className={`status-card ${ready ? 'status-card--ready' : 'status-card--pending'}`} aria-live="polite">
      <div className="status-card__eyebrow">
        {ready ? <CircleCheckBig size={16} aria-hidden="true" /> : <ListChecks size={16} aria-hidden="true" />}
        {texts.sections.beforeFreeTime}
      </div>
      <h2 className="status-card__title">
        {ready ? texts.status.readyTitle : texts.status.pendingTitle(status.pending)}
      </h2>
      <p className="status-card__subtitle">
        {ready
          ? total > 0
            ? texts.status.readyDoneSubtitle
            : texts.status.readyNothingSubtitle
          : texts.status.pendingSubtitle}
      </p>
      {total > 0 ? (
        <div className="status-card__footer">
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label={texts.status.progress(done, total)}
          >
            <div className="progress__bar" style={{ width: `${percent}%` }} />
          </div>
          <span className="status-card__progress-label">{texts.status.progress(done, total)}</span>
        </div>
      ) : null}
    </section>
  );
}
