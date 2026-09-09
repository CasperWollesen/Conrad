import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

export interface SectionProps {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  /** Renders the header as a toggle that shows/hides the content. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function Section({ title, count, action, children, collapsible = false, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  if (collapsible) {
    return (
      <section className="section">
        <button
          type="button"
          className="section__toggle"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="section__title">
            {title}
            {count !== undefined ? <span className="section__count">{count}</span> : null}
          </span>
          <ChevronDown size={18} className="section__toggle-icon" aria-hidden="true" />
        </button>
        {open ? <div id={contentId}>{children}</div> : null}
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section__header">
        <h3 className="section__title">
          {title}
          {count !== undefined ? <span className="section__count">{count}</span> : null}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}
