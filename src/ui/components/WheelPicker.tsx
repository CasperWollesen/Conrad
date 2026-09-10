import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';

export interface WheelOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface WheelPickerProps {
  options: readonly WheelOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the wheel, e.g. "Hour". */
  label: string;
}

export const WHEEL_ROW_HEIGHT = 40;
const VISIBLE_ROWS = 5;
/** The list is rendered this many times so the wheel can be spun around endlessly. */
const COPIES = 3;
const SETTLE_DELAY_MS = 120;

/**
 * iOS-style drum picker built on native scrolling with scroll snapping.
 * The options are repeated three times and the wheel silently re-centres on
 * the middle copy after every stop, so the user can keep scrolling in either
 * direction while "12" is always the same 12.
 */
export function WheelPicker({ options, value, onChange, label }: WheelPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const settledValue = useRef(value);
  const count = options.length;

  const indexOf = useCallback(
    (v: string) => {
      const i = options.findIndex((o) => o.value === v);
      return i < 0 ? 0 : i;
    },
    [options],
  );

  /** Scrolls so that option `index` of the middle copy sits in the centre row. */
  const centreOn = useCallback(
    (index: number, smooth = false) => {
      const el = ref.current;
      if (!el) return;
      const top = (count + index) * WHEEL_ROW_HEIGHT;
      if (Math.abs(el.scrollTop - top) < 1) return;
      el.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
    },
    [count],
  );

  // Sync the scroll position whenever the value changes from outside.
  useEffect(() => {
    if (settledValue.current === value) return;
    settledValue.current = value;
    centreOn(indexOf(value));
  }, [value, centreOn, indexOf]);

  // Initial position: once now and once more after the dialog is laid out.
  useEffect(() => {
    centreOn(indexOf(value));
    const raf = requestAnimationFrame(() => centreOn(indexOf(value)));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const settle = useCallback(() => {
    const el = ref.current;
    if (!el || count === 0) return;
    const raw = Math.round(el.scrollTop / WHEEL_ROW_HEIGHT);
    const index = ((raw % count) + count) % count;
    // Jump back to the middle copy (identical pixels, so it is invisible).
    centreOn(index);
    const next = options[index]?.value ?? value;
    if (next !== settledValue.current) {
      settledValue.current = next;
      onChange(next);
    }
  }, [count, centreOn, options, value, onChange]);

  // Prefer the native scrollend event where it exists; otherwise debounce scroll.
  const supportsScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window;
  useEffect(() => {
    const el = ref.current;
    if (!el || !supportsScrollEnd) return;
    el.addEventListener('scrollend', settle);
    return () => el.removeEventListener('scrollend', settle);
  }, [settle, supportsScrollEnd]);

  const onScroll = () => {
    if (supportsScrollEnd) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_DELAY_MS);
  };

  const step = (delta: number) => {
    if (count === 0) return;
    const index = (indexOf(value) + delta + count) % count;
    centreOn(index, true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      step(-5);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      step(5);
    }
  };

  const current = options[indexOf(value)];

  return (
    <div className="wheel" style={{ height: WHEEL_ROW_HEIGHT * VISIBLE_ROWS }}>
      <div className="wheel__band" aria-hidden="true" style={{ height: WHEEL_ROW_HEIGHT }} />
      <div
        ref={ref}
        className="wheel__scroller"
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={indexOf(value)}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, count - 1)}
        aria-valuetext={current?.label ?? ''}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        style={{ paddingTop: WHEEL_ROW_HEIGHT * 2, paddingBottom: WHEEL_ROW_HEIGHT * 2 }}
      >
        {Array.from({ length: COPIES }, (_, copy) =>
          options.map((option, index) => (
            <div
              key={`${copy}-${option.value}`}
              className={`wheel__item${option.value === value ? ' wheel__item--selected' : ''}${
                option.disabled ? ' wheel__item--disabled' : ''
              }`}
              style={{ height: WHEEL_ROW_HEIGHT }}
              aria-hidden="true"
              onClick={() => {
                const el = ref.current;
                if (!el) return;
                el.scrollTo({ top: (copy * count + index) * WHEEL_ROW_HEIGHT, behavior: 'smooth' });
              }}
            >
              {option.label}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
