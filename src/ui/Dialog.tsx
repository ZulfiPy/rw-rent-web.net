import { useEffect, type ReactNode } from 'react';
import type { Failure } from '@/api/problem';
import { Button, type ButtonTone } from './Button';
import styles from './Dialog.module.css';

/**
 * One dialog shell for every mutation. The failure envelope decides what appears above the footer:
 *
 *   field / field-code   nothing here — the message sits under its input
 *   form                 the validation message the API returned
 *   stale                amber banner with Refresh; the record moved under the dialog
 *   conflict             red banner: the record no longer accepts the change
 *   forbidden            red banner: the action should never have been offered
 *   unauthorized         red banner: the session ended
 */
function FailureBanner({ failure, onRefresh }: { failure: Failure; onRefresh?: (() => void) | undefined }) {
  if (failure.kind === 'field' || failure.kind === 'field-code') return null;

  const tone = failure.kind === 'stale' ? 'warn' : 'bad';
  const icon = failure.kind === 'stale' ? 'history' : failure.kind === 'form' ? 'warning' : 'error';
  const title =
    failure.kind === 'stale' ? 'This record changed while you had it open.'
      : failure.kind === 'forbidden' ? 'Not permitted'
        : failure.kind === 'unauthorized' ? 'Your session has ended'
          : failure.kind === 'conflict' ? 'The change was refused' : null;
  const body =
    failure.kind === 'stale' ? 'Refresh to load the current values, then try again.'
      : failure.kind === 'unauthorized' ? 'Sign in again to continue.'
        : 'message' in failure ? failure.message : '';

  return (
    <p className={styles.banner} data-tone={failure.kind === 'form' ? 'warn' : tone}>
      <span data-icon aria-hidden="true" className={styles.bannerIcon}>{icon}</span>
      <span className={styles.bannerText}>
        {title ? <strong className={styles.bannerTitle}>{title}</strong> : null}
        {body}
      </span>
      {failure.kind === 'stale' && onRefresh ? (
        <Button label="Refresh" icon="refresh" small onClick={onRefresh} />
      ) : null}
    </p>
  );
}

export function DialogNote({ icon = 'info', children }: { icon?: string; children: ReactNode }) {
  return (
    <p className={styles.note}>
      <span data-icon aria-hidden="true" className={styles.noteIcon}>{icon}</span>
      {children}
    </p>
  );
}

export function Dialog({
  title, description, submitLabel, submitTone = 'primary', busy, failure, children,
  onClose, onSubmit, onRefresh,
}: {
  title: string;
  description?: string;
  submitLabel: string;
  submitTone?: ButtonTone;
  busy: boolean;
  failure: Failure | null;
  children?: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  onRefresh?: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          <div className={styles.heading}>
            <h2 className={styles.title}>{title}</h2>
            {description ? <p className={styles.desc}>{description}</p> : null}
          </div>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <span data-icon aria-hidden="true">close</span>
          </button>
        </div>

        <form
          className={styles.body}
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        >
          {children}
          {failure ? <FailureBanner failure={failure} onRefresh={onRefresh} /> : null}
        </form>

        <div className={styles.footer}>
          <Button label="Cancel" tone="ghost" onClick={onClose} />
          <Button label={submitLabel} tone={submitTone} busy={busy} onClick={onSubmit} />
        </div>
      </div>
    </div>
  );
}
