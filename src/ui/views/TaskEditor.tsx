import { Trash } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { addDays, isISODate, isTimeString } from '../../domain/dates';
import type { ISODate, Task } from '../../domain/types';
import type { TaskInput } from '../../storage/repository';
import { texts } from '../../texts';
import { Button } from '../components/Button';
import { Field, TextArea, TextInput, TimeField, Toggle } from '../components/FormFields';
import { Sheet } from '../components/Sheet';

export interface TaskEditorProps {
  open: boolean;
  task: Task | null;
  defaultDate: ISODate;
  onClose: () => void;
  onSave: (id: string | null, input: TaskInput) => Promise<boolean>;
  onDelete: (task: Task) => void;
}

interface FormState {
  title: string;
  date: string;
  time: string;
  note: string;
  beforeFreeTime: boolean;
  hasPrep: boolean;
  prepTitle: string;
  prepDate: string;
  prepBeforeFreeTime: boolean;
  /** True once the user has touched the prep date, so we stop suggesting "the day before". */
  prepDateTouched: boolean;
}

function initialState(task: Task | null, defaultDate: ISODate): FormState {
  if (task) {
    return {
      title: task.title,
      date: task.date,
      time: task.time ?? '',
      note: task.note,
      beforeFreeTime: task.beforeFreeTime,
      hasPrep: task.prep !== null,
      prepTitle: task.prep?.title ?? '',
      prepDate: task.prep?.date ?? addDays(task.date, -1),
      prepBeforeFreeTime: task.prep?.beforeFreeTime ?? true,
      prepDateTouched: task.prep !== null,
    };
  }
  return {
    title: '',
    date: defaultDate,
    time: '',
    note: '',
    beforeFreeTime: true,
    hasPrep: false,
    prepTitle: '',
    prepDate: addDays(defaultDate, -1),
    prepBeforeFreeTime: true,
    prepDateTouched: false,
  };
}

export function TaskEditor({ open, task, defaultDate, onClose, onSave, onDelete }: TaskEditorProps) {
  const [form, setForm] = useState<FormState>(() => initialState(task, defaultDate));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const ids = {
    title: useId(),
    date: useId(),
    time: useId(),
    note: useId(),
    prepTitle: useId(),
    prepDate: useId(),
  };

  useEffect(() => {
    if (open) {
      setForm(initialState(task, defaultDate));
      setErrors({});
      setSaving(false);
    }
  }, [open, task, defaultDate]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDate = (date: string) =>
    setForm((f) => ({
      ...f,
      date,
      // Keep suggesting "the day before" until the user picks a prep date themselves.
      prepDate: f.prepDateTouched || !isISODate(date) ? f.prepDate : addDays(date, -1),
    }));

  const validate = (): TaskInput | null => {
    const next: typeof errors = {};
    const title = form.title.trim();
    if (!title) next.title = texts.taskForm.titleRequired;
    if (!isISODate(form.date)) next.date = texts.taskForm.dateRequired;
    const time = form.time.trim();
    if (time && !isTimeString(time)) next.time = texts.taskForm.dateRequired;
    const prepTitle = form.prepTitle.trim();
    if (form.hasPrep) {
      if (!prepTitle) next.prepTitle = texts.taskForm.prepTitleRequired;
      if (!isISODate(form.prepDate)) next.prepDate = texts.taskForm.prepDateRequired;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return {
      title,
      date: form.date,
      time: time || null,
      note: form.note.trim(),
      beforeFreeTime: form.beforeFreeTime,
      completedAt: task?.completedAt ?? null,
      prep: form.hasPrep
        ? {
            title: prepTitle,
            date: form.prepDate,
            beforeFreeTime: form.prepBeforeFreeTime,
            completedAt: task?.prep?.completedAt ?? null,
          }
        : null,
    };
  };

  const submit = async () => {
    const input = validate();
    if (!input) return;
    setSaving(true);
    const ok = await onSave(task?.id ?? null, input);
    setSaving(false);
    if (ok) onClose();
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        {texts.taskForm.cancel}
      </Button>
      <Button variant="primary" onClick={() => void submit()} disabled={saving}>
        {task ? texts.taskForm.save : texts.taskForm.create}
      </Button>
    </>
  );

  return (
    <Sheet open={open} onClose={onClose} title={task ? texts.taskForm.editTitle : texts.taskForm.newTitle} footer={footer}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label={texts.taskForm.title} htmlFor={ids.title} error={errors.title}>
          <TextInput
            id={ids.title}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={texts.taskForm.titlePlaceholder}
            autoComplete="off"
            enterKeyHint="done"
            invalid={Boolean(errors.title)}
            autoFocus={!task}
          />
        </Field>

        <div className="row">
          <Field label={texts.taskForm.date} htmlFor={ids.date} error={errors.date}>
            <TextInput
              id={ids.date}
              type="date"
              value={form.date}
              onChange={(e) => setDate(e.target.value)}
              invalid={Boolean(errors.date)}
              required
            />
          </Field>
          <Field label={texts.taskForm.time} htmlFor={ids.time} optional error={errors.time}>
            <TimeField id={ids.time} value={form.time} onChange={(v) => update('time', v)} />
          </Field>
        </div>

        <Toggle
          checked={form.beforeFreeTime}
          onChange={(v) => update('beforeFreeTime', v)}
          label={texts.taskForm.beforeFreeTime}
          hint={texts.taskForm.beforeFreeTimeHint}
        />

        <Toggle
          checked={form.hasPrep}
          onChange={(v) => update('hasPrep', v)}
          label={texts.taskForm.hasPrep}
          hint={texts.taskForm.hasPrepHint}
        />

        {form.hasPrep ? (
          <div className="subform">
            <Field label={texts.taskForm.prepTitle} htmlFor={ids.prepTitle} error={errors.prepTitle}>
              <TextInput
                id={ids.prepTitle}
                value={form.prepTitle}
                onChange={(e) => update('prepTitle', e.target.value)}
                placeholder={texts.taskForm.prepTitlePlaceholder}
                autoComplete="off"
                invalid={Boolean(errors.prepTitle)}
                autoFocus
              />
            </Field>
            <Field
              label={texts.taskForm.prepDate}
              htmlFor={ids.prepDate}
              error={errors.prepDate}
              hint={form.prepDateTouched ? undefined : texts.taskForm.prepDateHint}
            >
              <TextInput
                id={ids.prepDate}
                type="date"
                value={form.prepDate}
                onChange={(e) => setForm((f) => ({ ...f, prepDate: e.target.value, prepDateTouched: true }))}
                invalid={Boolean(errors.prepDate)}
              />
            </Field>
            <Toggle
              checked={form.prepBeforeFreeTime}
              onChange={(v) => update('prepBeforeFreeTime', v)}
              label={texts.taskForm.prepBeforeFreeTime}
            />
          </div>
        ) : null}

        <Field label={texts.taskForm.note} htmlFor={ids.note} optional>
          <TextArea
            id={ids.note}
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder={texts.taskForm.notePlaceholder}
          />
        </Field>

        {task ? (
          <div>
            <Button
              variant="danger"
              icon={<Trash size={18} />}
              onClick={() => {
                onDelete(task);
                onClose();
              }}
            >
              {texts.taskForm.delete}
            </Button>
          </div>
        ) : null}

        {/* Lets Enter in the title field submit on physical keyboards. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true">
          {texts.taskForm.save}
        </button>
      </form>
    </Sheet>
  );
}
