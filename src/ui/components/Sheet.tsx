import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { texts } from '../../texts';
import { IconButton } from './Button';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal panel built on the native <dialog> element: bottom sheet on phones,
 * centered dialog on wider screens (see components.css). Gives us focus
 * trapping, Escape handling and inert background for free.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const onBackdropClick = (e: SyntheticEvent<HTMLDialogElement, MouseEvent>) => {
    if (e.target === ref.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={onBackdropClick}
    >
      {open ? (
        <div className="sheet__panel">
          <div className="sheet__handle" aria-hidden="true" />
          <header className="sheet__header">
            <h2 className="sheet__title" id={titleId}>
              {title}
            </h2>
            <IconButton label={texts.common.close} icon={<X size={22} />} onClick={onClose} />
          </header>
          <div className="sheet__body">{children}</div>
          {footer ? <footer className="sheet__footer">{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
