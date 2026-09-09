import { CircleCheck, Download, FlaskConical, Info, Smartphone, Trash, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createBackup, parseBackup, serializeBackup, type BackupError, type BackupSummary } from '../../domain/backup';
import type { ISODate, UserData } from '../../domain/types';
import { demoData } from '../../storage/demoData';
import { repository } from '../../storage/repository';
import { APP_NAME, texts } from '../../texts';
import { Button } from '../components/Button';
import { Sheet } from '../components/Sheet';
import { formatTimestamp } from '../format';
import type { InstallState } from '../hooks/useInstallPrompt';
import { useToast } from '../hooks/useToast';

export interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  today: ISODate;
  install: InstallState;
  /** The demo section is only shown in development or with ?demo in the URL. */
  demoEnabled: boolean;
}

type ImportState =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'error'; error: BackupError | 'read-failed' }
  | { kind: 'preview'; data: UserData; summary: BackupSummary }
  | { kind: 'importing' };

const APP_VERSION: string = __APP_VERSION__;

function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${APP_NAME.toLowerCase()}-backup-${stamp}.json`;
}

export function SettingsSheet({ open, onClose, today, install, demoEnabled }: SettingsSheetProps) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ kind: 'idle' });
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setImportState({ kind: 'idle' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
        if (!cancelled) setPersisted(result);
      } catch {
        if (!cancelled) setPersisted(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const data = await repository.exportAll();
      const now = new Date();
      const json = serializeBackup(createBackup(data, now));
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName(now);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.show({ message: texts.toast.exported });
    } catch (e) {
      console.error(e);
      toast.show({ message: texts.toast.saveFailed, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return;
    setImportState({ kind: 'reading' });
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportState({ kind: 'error', error: 'read-failed' });
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setImportState({ kind: 'error', error: parsed.error });
      return;
    }
    setImportState({ kind: 'preview', data: parsed.data, summary: parsed.summary });
  };

  const confirmImport = async () => {
    if (importState.kind !== 'preview') return;
    const { data } = importState;
    setImportState({ kind: 'importing' });
    try {
      await repository.replaceAll(data);
      setImportState({ kind: 'idle' });
      toast.show({ message: texts.toast.imported });
      onClose();
    } catch (e) {
      console.error(e);
      setImportState({ kind: 'error', error: 'invalid-data' });
    }
  };

  const loadDemo = async () => {
    setBusy(true);
    try {
      const { tasks, routines, occurrenceStates } = demoData(today);
      await repository.addMany(tasks, routines, occurrenceStates);
      toast.show({ message: texts.toast.demoLoaded });
      onClose();
    } catch (e) {
      console.error(e);
      toast.show({ message: texts.toast.saveFailed, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    if (!window.confirm(texts.settings.danger.confirm)) return;
    setBusy(true);
    try {
      await repository.clearUserData();
      toast.show({ message: texts.toast.allDeleted });
      onClose();
    } catch (e) {
      console.error(e);
      toast.show({ message: texts.toast.saveFailed, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const installText = install.isStandalone
    ? texts.settings.install.installed
    : install.platform === 'ios'
      ? texts.settings.install.ios
      : install.platform === 'android'
        ? texts.settings.install.android
        : texts.settings.install.desktop;

  return (
    <Sheet open={open} onClose={onClose} title={texts.settings.title}>
      <section className="settings-group">
        <h3 className="settings-group__title">{texts.settings.install.title}</h3>
        <p className="settings-group__text">{texts.settings.install.description}</p>
        <div className="settings-group__status">
          <Smartphone size={18} aria-hidden="true" />
          <span>{installText}</span>
        </div>
        {!install.isStandalone && install.canPrompt ? (
          <div className="settings-group__actions">
            <Button variant="primary" onClick={() => void install.prompt()}>
              {texts.settings.install.button}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="settings-group">
        <h3 className="settings-group__title">{texts.settings.backup.title}</h3>
        <p className="settings-group__text">{texts.settings.backup.description}</p>
        {persisted !== null ? (
          <div className="settings-group__status">
            {persisted ? <CircleCheck size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
            <span>{persisted ? texts.settings.backup.storagePersisted : texts.settings.backup.storageNotPersisted}</span>
          </div>
        ) : null}
        <div className="settings-group__actions">
          <Button onClick={() => void exportBackup()} disabled={busy} icon={<Download size={18} />}>
            {texts.settings.backup.export}
          </Button>
          <Button
            onClick={() => fileInput.current?.click()}
            disabled={busy || importState.kind === 'reading' || importState.kind === 'importing'}
            icon={<Upload size={18} />}
          >
            {importState.kind === 'reading' ? texts.settings.backup.importing : texts.settings.backup.import}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            tabIndex={-1}
            onChange={(e) => {
              void onFileChosen(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        {importState.kind === 'error' ? (
          <p className="form-error" role="alert">
            {texts.settings.backup.errors[importState.error]}
          </p>
        ) : null}

        {importState.kind === 'preview' || importState.kind === 'importing' ? (
          <div className="preview" role="group" aria-label={texts.settings.backup.previewTitle}>
            <p className="preview__title">{texts.settings.backup.previewTitle}</p>
            <p className="settings-group__text">{texts.settings.backup.previewBody}</p>
            {importState.kind === 'preview' ? (
              <ul className="preview__list">
                <li>{texts.settings.backup.previewTasks(importState.summary.tasks)}</li>
                <li>{texts.settings.backup.previewRoutines(importState.summary.routines)}</li>
                <li>{texts.settings.backup.previewStates(importState.summary.occurrenceStates)}</li>
                {importState.summary.exportedAt ? (
                  <li>{texts.settings.backup.previewExportedAt(formatTimestamp(importState.summary.exportedAt))}</li>
                ) : null}
              </ul>
            ) : null}
            <div className="settings-group__actions">
              <Button variant="primary" onClick={() => void confirmImport()} disabled={importState.kind === 'importing'}>
                {texts.settings.backup.confirm}
              </Button>
              <Button variant="ghost" onClick={() => setImportState({ kind: 'idle' })}>
                {texts.settings.backup.cancel}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {demoEnabled ? (
        <section className="settings-group">
          <h3 className="settings-group__title">{texts.settings.demo.title}</h3>
          <p className="settings-group__text">{texts.settings.demo.description}</p>
          <div className="settings-group__actions">
            <Button onClick={() => void loadDemo()} disabled={busy} icon={<FlaskConical size={18} />}>
              {texts.settings.demo.button}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="settings-group">
        <h3 className="settings-group__title">{texts.settings.danger.title}</h3>
        <p className="settings-group__text">{texts.settings.danger.description}</p>
        <div className="settings-group__actions">
          <Button variant="danger" onClick={() => void deleteAll()} disabled={busy} icon={<Trash size={18} />}>
            {texts.settings.danger.button}
          </Button>
        </div>
      </section>

      <section className="settings-group">
        <h3 className="settings-group__title">{texts.settings.about.title}</h3>
        <div className="settings-group__status">
          <Info size={18} aria-hidden="true" />
          <span>
            {APP_NAME} · {texts.settings.about.version(APP_VERSION)}
            <br />
            {texts.settings.about.offline}
          </span>
        </div>
      </section>
    </Sheet>
  );
}
