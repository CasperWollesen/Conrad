import { Minus, Plus } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import type { TimeString, Weekday } from '../../domain/types';
import { WEEKDAY_LETTER, WEEKDAY_NAMES, texts } from '../../texts';
import { WheelPicker, type WheelOption } from './WheelPicker';

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

// ---------------------------------------------------------------------------
// Time picking

export const TIME_STEP_MINUTES = 5;
export const DEFAULT_PICK_TIME: TimeString = '12:00';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 / TIME_STEP_MINUTES }, (_, i) => String(i * TIME_STEP_MINUTES).padStart(2, '0'));

/** Rounds a clock time up to the next 5-minute slot ("16:03" -> "16:05"). */
export function roundUpToStep(time: TimeString): TimeString {
  const [h = '0', m = '0'] = time.split(':');
  let hours = Number(h);
  let minutes = Math.ceil(Number(m) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
  if (minutes >= 60) {
    minutes = 0;
    hours = (hours + 1) % 24;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export interface TimePickerProps {
  value: TimeString;
  onChange: (value: TimeString) => void;
  /** Times earlier than this are shown as unavailable (used for "not before now"). */
  min?: TimeString | null;
}

/** Two drum wheels: hour (00–23) and minute (5-minute steps). Always 24-hour. */
export function TimePicker({ value, onChange, min = null }: TimePickerProps) {
  const [hour = '12', minute = '00'] = value.split(':');
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();
  const [minHour = '', minMinute = ''] = min ? min.split(':') : [];

  const hourOptions: WheelOption[] = HOURS.map((h) => ({ value: h, label: h, disabled: min !== null && h < minHour }));
  const minuteOptions: WheelOption[] = minutes.map((m) => ({
    value: m,
    label: m,
    disabled: min !== null && (hour < minHour || (hour === minHour && m < minMinute)),
  }));

  return (
    <div className="time-picker">
      <WheelPicker options={hourOptions} value={hour} onChange={(h) => onChange(`${h}:${minute}`)} label={texts.time.hour} />
      <span className="time-picker__sep" aria-hidden="true">
        :
      </span>
      <WheelPicker
        options={minuteOptions}
        value={minute}
        onChange={(m) => onChange(`${hour}:${m}`)}
        label={texts.time.minute}
      />
    </div>
  );
}

export interface TimeFieldProps {
  /** "HH:MM" or empty string for no time. */
  value: string;
  onChange: (value: string) => void;
  /** Switch label, e.g. "Set a deadline". */
  toggleLabel: string;
  hint?: string;
  /** Time chosen when the switch is turned on. */
  defaultValue?: TimeString;
  min?: TimeString | null;
}

/** Optional time: a switch that reveals the wheel picker. */
export function TimeField({ value, onChange, toggleLabel, hint, defaultValue = DEFAULT_PICK_TIME, min = null }: TimeFieldProps) {
  const enabled = value !== '';
  return (
    <div className="time-field">
      <Toggle checked={enabled} onChange={(on) => onChange(on ? defaultValue : '')} label={toggleLabel} hint={hint} />
      {enabled ? <TimePicker value={value} onChange={onChange} min={min} /> : null}
    </div>
  );
}
