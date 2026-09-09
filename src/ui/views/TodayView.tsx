import { Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TodayModel } from '../../domain/actions';
import type { Action, ISODate, TimeString } from '../../domain/types';
import { texts } from '../../texts';
import { ActionCard } from '../components/ActionCard';
import { IconButton } from '../components/Button';
import { Section } from '../components/Section';
import { StatusCard } from '../components/StatusCard';
import { formatDayLong } from '../format';

export interface TodayViewProps {
  model: TodayModel;
  today: ISODate;
  nowTime: TimeString;
  onToggleDone: (action: Action) => void;
  onOpen: (action: Action) => void;
  onAdd: () => void;
  onSettings: () => void;
  extra?: ReactNode;
}

export function TodayView({ model, today, nowTime, onToggleDone, onOpen, onAdd, onSettings, extra }: TodayViewProps) {
  const cardProps = { today, nowTime, onToggleDone, onOpen };
  const isEmpty = model.status.kind === 'empty';

  return (
    <div className="view">
      <header className="view__header">
        <div className="view__heading">
          <span className="view__eyebrow">{texts.tabs.today}</span>
          <h1 className="view__title">{formatDayLong(today)}</h1>
        </div>
        <div className="view__tools">
          <IconButton label={texts.settings.open} icon={<Settings size={22} />} onClick={onSettings} />
        </div>
      </header>

      <StatusCard status={model.status} onAdd={onAdd} />

      {!isEmpty ? (
        <div className="view__stack">
          {model.beforeFreeTime.length > 0 ? (
            <Section title={texts.sections.beforeFreeTime} count={model.beforeFreeTime.length}>
              <div className="list">
                {model.beforeFreeTime.map((a) => (
                  <ActionCard key={a.id} action={a} {...cardProps} />
                ))}
              </div>
            </Section>
          ) : null}

          {model.otherToday.length > 0 ? (
            <Section title={texts.sections.otherToday} count={model.otherToday.length}>
              <div className="list">
                {model.otherToday.map((a) => (
                  <ActionCard key={a.id} action={a} {...cardProps} />
                ))}
              </div>
            </Section>
          ) : null}

          {model.earlier.length > 0 ? (
            <Section title={texts.sections.earlier} count={model.earlier.length} collapsible defaultOpen={false}>
              <div className="list">
                {model.earlier.map((a) => (
                  <ActionCard key={a.id} action={a} {...cardProps} />
                ))}
              </div>
            </Section>
          ) : null}

          <Section title={texts.sections.tomorrow} count={model.tomorrow.length}>
            {model.tomorrow.length > 0 ? (
              <div className="list">
                {model.tomorrow.map((a) => (
                  <ActionCard key={a.id} action={a} {...cardProps} showBeforeFreeTimeTag />
                ))}
              </div>
            ) : (
              <p className="section__empty">{texts.sections.nothingTomorrow}</p>
            )}
          </Section>

          {model.doneToday.length > 0 ? (
            <Section title={texts.sections.doneToday} count={model.doneToday.length} collapsible defaultOpen={false}>
              <div className="list">
                {model.doneToday.map((a) => (
                  <ActionCard key={a.id} action={a} {...cardProps} />
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}

      {extra}
    </div>
  );
}
