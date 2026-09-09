import { CalendarDays, Check, Plus, Repeat, Settings, Sun } from 'lucide-react';
import { texts } from '../../texts';

export type Tab = 'today' | 'upcoming' | 'routines';

export interface NavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onAdd: () => void;
  addLabel: string;
  onSettings: () => void;
}

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'today', label: texts.tabs.today, icon: Sun },
  { id: 'upcoming', label: texts.tabs.upcoming, icon: CalendarDays },
  { id: 'routines', label: texts.tabs.routines, icon: Repeat },
];

/** Bottom tab bar on phones and sidebar on desktop (CSS decides which shows). */
export function Nav({ active, onChange, onAdd, addLabel, onSettings }: NavProps) {
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            <Check size={22} strokeWidth={3} />
          </span>
          <span className="sidebar__name">{texts.app.name}</span>
        </div>
        <nav className="sidebar__nav" aria-label="Hovedmenu">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="sidebar__item"
              aria-current={active === id ? 'page' : undefined}
              onClick={() => onChange(id)}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <button type="button" className="btn btn--primary btn--block" onClick={onAdd}>
          <Plus size={20} aria-hidden="true" />
          {addLabel}
        </button>
        <div className="sidebar__spacer" />
        <button type="button" className="sidebar__item" onClick={onSettings}>
          <Settings size={20} aria-hidden="true" />
          {texts.settings.title}
        </button>
      </aside>

      <button type="button" className="fab" onClick={onAdd}>
        <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
        {addLabel}
      </button>

      <nav className="tabbar" aria-label="Hovedmenu">
        <div className="tabbar__inner">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="tabbar__item"
              aria-current={active === id ? 'page' : undefined}
              onClick={() => onChange(id)}
            >
              <span className="tabbar__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
