import { Trash } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { isISODate, isTimeString } from '../../domain/dates';
import type { ISODate, Routine, Weekday } from '../../domain/types';
import type { RoutineInput } from '../../storage/repository';
import { texts } from '../../texts';
import { Button } from '../components/Button';
import { Field, Stepper, TextArea, TextInput, TimeField, Toggle, WeekdayPicker } from '../components/FormFields';
import { Sheet } from '../components/Sheet';

export interface RoutineEditorProps {
  open: boolean;
  routine: Routine | null;
  today: ISODate;
  onClose: () => void;
  onSave: (id: string | null, input: RoutineInput) => Promise<boolean>;
  onDelete: (routine: Routine) => void;
}

interface FormState {
  title: string;
  weekdays: Weekday[];
  startDate: string;
  time: string;
  note: string;
  beforeFreeTime: boolean;
  hasPrep: boolean;
  prepTitle: string;
  prepDaysBefore: number;
  prepBeforeFreeTime: boolean;
  paused: boolean;
}

function initialState(routine: Routine | null, today: ISODate): FormState {
  if (routine) {
    return {
      title: routine.title,
      weekdays: routine.weekdays,
      startDate: routine.startDate,
      time: routine.time ?? '',
      note: routine.note,
      beforeFreeTime: routine.beforeFreeTime,
      hasPrep: routine.prep !== null,
      prepTitle: routine.prep?.title ?? '',
      prepDaysBefore: routine.prep?.daysBefore ?? 1,
      prepBeforeFreeTime: routine.prep?.beforeFreeTime ?? true,
      paused: routine.paused,
    };
  }
  return {
    title: '',
    weekdays: [],
    startDate: today,
    time: '',
    note: '',
    beforeFreeTime: false,
    hasPrep: false,
    prepTitle: '',
    prepDaysBefore: 1,
    prepBeforeFreeTime: true,
    paused: false,
  };
}

export function RoutineEditor({ open, routine, today, onClose, onSave, onDelete }: RoutineEditorProps) {
  const [form, setForm] = useState<FormState>(() => initialState(routine, today));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const ids = {
    title: useId(),
    weekdays: useId(),
    startDate: useId(),
    time: useId(),
    note: useId(),
    prepTitle: useId(),
  };

  useEffect(() => {
    if (open) {
      setForm(initialState(routine, today));
      setErrors({});
      setSaving(false);
    }
  }, [open, routine, today]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): RoutineInput | null => {
    const next: typeof errors = {};
    const title = form.title.trim();
    if (!title) next.title = texts.routineForm.titleRequired;
    if (form.weekdays.length === 0) next.weekdays = texts.routineForm.weekdaysRequired;
    if (!isISODate(form.startDate)) next.startDate = texts.routineForm.startDateRequired;
    const time = form.time.trim();
    if (time && !isTimeString(time)) next.time = texts.routineForm.startDateRequired;
    const prepTitle = form.prepTitle.trim();
    if (form.hasPrep && !prepTitle) next.prepTitle = texts.routineForm.prepTitleRequired;
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      title,
      weekdays: [...form.weekdays].sort((a, b) => a - b),
      startDate: form.startDate,
      time: time || null,
      note: form.note.trim(),
      beforeFreeTime: form.beforeFreeTime,
      prep: form.hasPrep
        ? { title: prepTitle, daysBefore: form.prepDaysBefore, beforeFreeTime: form.prepBeforeFreeTime }
        : null,
      paused: form.paused,
    };
  };

  const submit = async () => {
    const input = validate();
    if (!input) return;
    setSaving(true);
    const ok = await onSave(routine?.id ?? null, input);
    setSaving(false);
    if (ok) onClose();
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        {texts.routineForm.cancel}
      </Button>
      <Button variant="primary" onClick={() => void submit()} disabled={saving}>
        {routine ? texts.routineForm.save : texts.routineForm.create}
      </Button>
    </>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={routine ? texts.routineForm.editTitle : texts.routineForm.newTitle}
      footer={footer}
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label={texts.routineForm.title} htmlFor={ids.title} error={errors.title}>
          <TextInput
            id={ids.title}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={texts.routineForm.titlePlaceholder}
            autoComplete="off"
            enterKeyHint="done"
            invalid={Boolean(errors.title)}
            autoFocus={!routine}
          />
        </Field>

        <div className="field">
          <span className="field__label" id={ids.weekdays}>
            {texts.routineForm.weekdays}
          </span>
          <WeekdayPicker value={form.weekdays} onChange={(v) => update('weekdays', v)} labelledBy={ids.weekdays} />
          {errors.weekdays ? (
            <p className="field__error" role="alert">
              {errors.weekdays}
            </p>
          ) : null}
        </div>

        <div className="row">
          <Field label={texts.routineForm.time} htmlFor={ids.time} optional error={errors.time}>
            <TimeField id={ids.time} value={form.time} onChange={(v) => update('time', v)} />
          </Field>
          <Field label={texts.routineForm.startDate} htmlFor={ids.startDate} error={errors.startDate}>
            <TextInput
              id={ids.startDate}
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              invalid={Boolean(errors.startDate)}
              required
            />
          </Field>
        </div>

        <Toggle
          checked={form.beforeFreeTime}
          onChange={(v) => update('beforeFreeTime', v)}
          label={texts.routineForm.beforeFreeTime}
          hint={texts.taskForm.beforeFreeTimeHint}
        />

        <Toggle
          checked={form.hasPrep}
          onChange={(v) => update('hasPrep', v)}
          label={texts.routineForm.hasPrep}
          hint={texts.routineForm.hasPrepHint}
        />

        {form.hasPrep ? (
          <div className="subform">
            <Field label={texts.routineForm.prepTitle} htmlFor={ids.prepTitle} error={errors.prepTitle}>
              <TextInput
                id={ids.prepTitle}
                value={form.prepTitle}
                onChange={(e) => update('prepTitle', e.target.value)}
                placeholder={texts.routineForm.prepTitlePlaceholder}
                autoComplete="off"
                invalid={Boolean(errors.prepTitle)}
                autoFocus
              />
            </Field>
            <div className="field">
              <span className="field__label">{texts.routineForm.prepDaysBefore}</span>
              <Stepper
                value={form.prepDaysBefore}
                min={0}
                max={7}
                onChange={(v) => update('prepDaysBefore', v)}
                format={texts.routineForm.daysBefore}
                label={texts.routineForm.prepDaysBefore}
                decreaseLabel="Færre dage før"
                increaseLabel="Flere dage før"
              />
            </div>
            <Toggle
              checked={form.prepBeforeFreeTime}
              onChange={(v) => update('prepBeforeFreeTime', v)}
              label={texts.routineForm.prepBeforeFreeTime}
            />
          </div>
        ) : null}

        <Field label={texts.routineForm.note} htmlFor={ids.note} optional>
          <TextArea id={ids.note} value={form.note} onChange={(e) => update('note', e.target.value)} />
        </Field>

        {routine ? (
          <>
            <Toggle
              checked={form.paused}
              onChange={(v) => update('paused', v)}
              label={texts.routineForm.paused}
              hint={texts.routineForm.pausedHint}
            />
            <div>
              <Button
                variant="danger"
                icon={<Trash size={18} />}
                onClick={() => {
                  onDelete(routine);
                  onClose();
                }}
              >
                {texts.routineForm.delete}
              </Button>
            </div>
          </>
        ) : null}

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true">
          {texts.routineForm.save}
        </button>
      </form>
    </Sheet>
  );
}
