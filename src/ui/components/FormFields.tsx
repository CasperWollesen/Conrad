import { Minus, Plus } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import type { Weekday } from '../../domain/types';
import { WEEKDAY_LETTER, WEEKDAY_NAMES, texts } from '../../texts';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, optional = false, children }: FieldProps) {
  return (
    <div className="field">
      <label className={`field__label${optional ? ' field__label--optional' : ''}`} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid = false, className, ...rest }: TextInputProps) {
  return <input className={['input', invalid ? 'input--invalid' : '', className ?? ''].join(' ').trim()} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={['input', 'input--textarea', className ?? ''].join(' ').trim()} rows={2} {...rest} />;
}

export interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

/** Switch control; the whole row is the tap target. */
export function Toggle({ id, checked, onChange, label, hint }: ToggleProps) {
  return (
    <button
      type="button"
      id={id}
      className="toggle"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint ? <span className="toggle__hint">{hint}</span> : null}
      </span>
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </button>
  );
}

export interface WeekdayPickerProps {
  value: readonly Weekday[];
  onChange: (value: Weekday[]) => void;
  labelledBy?: string;
}

export function WeekdayPicker({ value, onChange, labelledBy }: WeekdayPickerProps) {
  const toggle = (day: Weekday) => {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    onChange(next.sort((a, b) => a - b));
  };
  return (
    <div className="weekdays" role="group" aria-labelledby={labelledBy}>
      {WEEKDAY_LETTER.map((letter, i) => {
        const day = (i + 1) as Weekday;
        const on = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            className="weekdays__day"
            aria-pressed={on}
            aria-label={WEEKDAY_NAMES[i]}
            title={WEEKDAY_NAMES[i]}
            onClick={() => toggle(day)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
}

export function Stepper({ value, min, max, onChange, format, label, decreaseLabel, increaseLabel }: StepperProps) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decreaseLabel}
      >
        <Minus size={18} />
      </button>
      <span className="stepper__value" aria-live="polite">
        {format(value)}
      </span>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={increaseLabel}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

export interface TimeFieldProps {
  id?: string;
  /** "HH:MM" or empty string for no time. */
  value: string;
  onChange: (value: string) => void;
  /** Minute step; defaults to 5. */
  step?: number;
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

/**
 * 24-hour time picker built from two native selects (hour, minute), so the
 * format never depends on the device locale and there is no AM/PM.
 */
export function TimeField({ id, value, onChange, step = 5 }: TimeFieldProps) {
  const [hour = '', minute = ''] = value ? value.split(':') : [];
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => String(i * step).padStart(2, '0'));
  // A stored time outside the step grid (e.g. from a backup) stays selectable.
  if (minute && !minutes.includes(minute)) minutes.push(minute);
  minutes.sort();

  const setHour = (h: string) => onChange(h ? `${h}:${minute || '00'}` : '');
  const setMinute = (m: string) => onChange(hour ? `${hour}:${m}` : '');

  return (
    <div className="time-field">
      <select
        id={id}
        className="input time-field__select"
        value={hour}
        onChange={(e) => setHour(e.target.value)}
        aria-label={texts.time.hour}
      >
        <option value="">{texts.time.none}</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="time-field__sep" aria-hidden="true">
        .
      </span>
      <select
        className="input time-field__select"
        value={hour ? minute || '00' : ''}
        onChange={(e) => setMinute(e.target.value)}
        disabled={!hour}
        aria-label={texts.time.minute}
      >
        {!hour ? <option value="">–</option> : null}
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
