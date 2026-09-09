import { Clock, PackageCheck, Pause, Pencil, Play, Plus, Repeat, Settings } from 'lucide-react';
import type { Routine } from '../../domain/types';
import { texts } from '../../texts';
import { Button, IconButton } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { formatClock, formatWeekdays } from '../format';

export interface RoutinesViewProps {
  routines: readonly Routine[];
  onEdit: (routine: Routine) => void;
  onAdd: () => void;
  onTogglePause: (routine: Routine) => void;
  onSettings: () => void;
}

export function RoutinesView({ routines, onEdit, onAdd, onTogglePause, onSettings }: RoutinesViewProps) {
  const sorted = [...routines].sort(
    (a, b) => Number(a.paused) - Number(b.paused) || a.title.localeCompare(b.title, 'da'),
  );

  return (
    <div className="view">
      <header className="view__header">
        <div className="view__heading">
          <span className="view__eyebrow">{texts.routines.everyWeek}</span>
          <h1 className="view__title">{texts.tabs.routines}</h1>
        </div>
        <div className="view__tools">
          <IconButton label={texts.settings.open} icon={<Settings size={22} />} onClick={onSettings} />
        </div>
      </header>

      {sorted.length === 0 ? (
        <EmptyState icon={<Repeat size={26} />} title={texts.routines.empty} text={texts.routines.emptyHint}>
          <Button variant="primary" onClick={onAdd} icon={<Plus size={18} />}>
            {texts.routines.add}
          </Button>
        </EmptyState>
      ) : (
        <div className="list">
          {sorted.map((routine) => (
            <article key={routine.id} className={`routine${routine.paused ? ' routine--paused' : ''}`}>
              <div className="routine__head">
                <h2 className="routine__title">{routine.title}</h2>
                <span className={`tag ${routine.paused ? '' : 'tag--accent'}`}>
                  {routine.paused ? texts.routines.paused : texts.routines.active}
                </span>
              </div>
              <div className="routine__lines">
                <span className="routine__line">
                  <Repeat size={16} aria-hidden="true" />
                  {formatWeekdays(routine.weekdays)}
                  {routine.time ? ` · ${formatClock(routine.time)}` : ''}
                </span>
                {routine.prep ? (
                  <span className="routine__line">
                    <PackageCheck size={16} aria-hidden="true" />
                    {texts.routines.prepLabel(routine.prep.title, routine.prep.daysBefore)}
                  </span>
                ) : null}
                {routine.beforeFreeTime || routine.prep?.beforeFreeTime ? (
                  <span className="routine__line">
                    <Clock size={16} aria-hidden="true" />
                    {texts.action.beforeFreeTime}
                    {routine.beforeFreeTime && routine.prep?.beforeFreeTime
                      ? ''
                      : routine.beforeFreeTime
                        ? ` (${routine.title.toLowerCase()})`
                        : ` (${routine.prep?.title.toLowerCase()})`}
                  </span>
                ) : null}
              </div>
              <div className="routine__actions">
                <Button size="sm" onClick={() => onEdit(routine)} icon={<Pencil size={16} />}>
                  {texts.routines.edit}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTogglePause(routine)}
                  icon={routine.paused ? <Play size={16} /> : <Pause size={16} />}
                >
                  {routine.paused ? texts.routines.resume : texts.routines.pause}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
