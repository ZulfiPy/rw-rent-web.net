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

/** The informational banner a dialog opens with, when the operation needs one line of framing. */
function InfoBanner({ title, body }: { title: string; body: string }) {
  return (
    <p className={styles.banner} data-tone="info">
      <span data-icon aria-hidden="true" className={styles.bannerIcon}>info</span>
      <span className={styles.bannerText}>
        <strong className={styles.bannerTitle}>{title}</strong>
        {body}
      </span>
    </p>
  );
}

/** The prototype's dialog tones, driving the tinted glyph in the header. */
export type DialogTone = 'ok' | 'info' | 'warn' | 'bad' | 'mute' | 'accent';

export function Dialog({
  title, description, icon, tone = 'accent', width = 560, submitLabel, submitIcon, submitTone = 'primary',
  submitBlocked, busy, failure, children, info, footnote, onClose, onSubmit, onRefresh,
}: {
  title: string;
  description?: string;
  icon?: string;
  tone?: DialogTone;
  /** The prototype gives each dialog its own width; 560 is its default. */
  width?: number;
  submitLabel: string;
  /** The prototype gives its destructive footer actions a leading icon. */
  submitIcon?: string | undefined;
  submitTone?: ButtonTone;
  /** The prototype's disable-with-reason on a footer action the form's own state refuses. */
  submitBlocked?: string | null;
  busy: boolean;
  failure: Failure | null;
  children?: ReactNode;
  info?: { title: string; body: string };
  footnote?: string;
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
      <div className={styles.panel} style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          {icon ? (
            <span data-icon aria-hidden="true" className={styles.headIcon} data-tone={tone}>{icon}</span>
          ) : null}
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
          {info ? <InfoBanner title={info.title} body={info.body} /> : null}
          {children}
          {failure ? <FailureBanner failure={failure} onRefresh={onRefresh} /> : null}
        </form>

        <div className={styles.footer}>
          {footnote ? <span className={styles.footnote}>{footnote}</span> : null}
          <span className={styles.spacer} />
          <Button label="Cancel" tone="ghost" onClick={onClose} />
          <Button
            label={submitLabel}
            icon={submitIcon}
            tone={submitTone}
            busy={busy}
            blockedReason={failure?.kind === 'stale'
              ? 'Refresh to load the current values first.'
              : submitBlocked ?? null}
            onClick={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
