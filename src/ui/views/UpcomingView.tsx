import { CalendarDays, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import { groupByDay, HORIZON_DAYS, overdueActions } from '../../domain/actions';
import { addDays } from '../../domain/dates';
import type { Action, ISODate, TimeString } from '../../domain/types';
import { texts } from '../../texts';
import { ActionCard } from '../components/ActionCard';
import { Button, IconButton } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Section } from '../components/Section';
import { formatDayLong, formatDayShort, formatRelativeDay } from '../format';

const DEFAULT_DAYS = 14;
const STEP_DAYS = 14;

export interface UpcomingViewProps {
  actions: readonly Action[];
  today: ISODate;
  nowTime: TimeString;
  onToggleDone: (action: Action) => void;
  onOpen: (action: Action) => void;
  onAddForDate: (date: ISODate) => void;
  onSettings: () => void;
}

export function UpcomingView({ actions, today, nowTime, onToggleDone, onOpen, onAddForDate, onSettings }: UpcomingViewProps) {
  const [days, setDays] = useState(DEFAULT_DAYS);
  const to = addDays(today, days - 1);
  const groups = groupByDay(actions, today, to);
  const overdue = overdueActions(actions, today);
  const cardProps = { today, nowTime, onToggleDone, onOpen };
  const canShowMore = days < HORIZON_DAYS;

  return (
    <div className="view">
      <header className="view__header">
        <div className="view__heading">
          <span className="view__eyebrow">{texts.upcoming.showingDays(days)}</span>
          <h1 className="view__title">{texts.tabs.upcoming}</h1>
        </div>
        <div className="view__tools">
          <IconButton label={texts.settings.open} icon={<Settings size={22} />} onClick={onSettings} />
        </div>
      </header>

      <div className="view__stack">
        {overdue.length > 0 ? (
          <Section title={texts.upcoming.overdueSection} count={overdue.length} collapsible defaultOpen>
            <div className="list">
              {overdue.map((a) => (
                <ActionCard key={a.id} action={a} {...cardProps} showBeforeFreeTimeTag />
              ))}
            </div>
          </Section>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState icon={<CalendarDays size={26} />} title={texts.upcoming.empty} text={texts.upcoming.emptyHint}>
            <Button variant="primary" onClick={() => onAddForDate(today)} icon={<Plus size={18} />}>
              {texts.add.task}
            </Button>
          </EmptyState>
        ) : (
          groups.map((group) => {
            const relative = formatRelativeDay(group.date, today);
            const isNamedRelative = relative === texts.relative.today || relative === texts.relative.tomorrow;
            return (
              <section key={group.date} className={`day${group.date === today ? ' day--today' : ''}`}>
                <div className="day__header">
                  <h2 className="day__label">
                    <span className="day__name">{isNamedRelative ? relative : formatDayLong(group.date)}</span>
                    <span className="day__date">{isNamedRelative ? formatDayShort(group.date) : ''}</span>
                  </h2>
                  <IconButton
                    label={`${texts.upcoming.addToDay}: ${formatDayLong(group.date)}`}
                    icon={<Plus size={20} />}
                    onClick={() => onAddForDate(group.date)}
                  />
                </div>
                <div className="list">
                  {group.actions.map((a) => (
                    <ActionCard key={a.id} action={a} {...cardProps} showBeforeFreeTimeTag />
                  ))}
                </div>
              </section>
            );
          })
        )}

        {canShowMore ? (
          <div className="view__footer">
            <Button variant="ghost" onClick={() => setDays((d) => Math.min(HORIZON_DAYS, d + STEP_DAYS))}>
              {texts.upcoming.showMore(Math.min(STEP_DAYS, HORIZON_DAYS - days))}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
