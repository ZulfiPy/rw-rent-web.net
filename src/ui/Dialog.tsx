import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
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

export { styles as dialogStyles };

/**
 * The prototype's `SEC`: a titled group of fields in its own column layout, with the section's
 * caveat below them. Every dialog that groups its inputs uses this.
 */
export function DialogSection({ title, cols = 2, note, children }: {
  title?: string;
  cols?: 1 | 2 | 3;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.section}>
      {title ? <p className={styles.sectionTitle}>{title}</p> : null}
      <div className={styles.grid} data-cols={cols}>{children}</div>
      {note ? <DialogNote>{note}</DialogNote> : null}
    </div>
  );
}

/**
 * The caveat under a section, and — with a tone and a title — the callout a dialog opens with.
 * The titled form is the prototype's box: a bold line naming the case, then what it means.
 */
export function DialogNote({ icon = 'info', tone, title, children }: {
  icon?: string;
  tone?: 'warn';
  title?: string;
  children: ReactNode;
}) {
  return (
    <p className={styles.note} data-tone={tone}>
      <span data-icon aria-hidden="true" className={styles.noteIcon}>{icon}</span>
      {title ? (
        <span className={styles.noteText}>
          <strong className={styles.noteTitle}>{title}</strong>
          {children}
        </span>
      ) : children}
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

/** Tab order inside the panel: the close button, the form's controls, then the footer actions. */
const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLFormElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /**
   * Focus enters the dialog on open and returns to whatever opened it on close — the record's own
   * action button, so a keyboard user carries on where they left off.
   */
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? closeRef.current;
    first?.focus();
    return () => opener?.focus();
  }, []);

  /**
   * A field-error response leaves its message under an input that may be out of view in a sheet
   * that scrolls inside. Bring the first invalid control to the middle of the body and focus it.
   * The body's own scrollTop moves, so the page behind the dialog stays put.
   */
  useEffect(() => {
    if (!failure || (failure.kind !== 'field' && failure.kind !== 'field-code')) return;
    const body = bodyRef.current;
    const el = body?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!body || !el) return;
    const eb = el.getBoundingClientRect();
    const bb = body.getBoundingClientRect();
    body.scrollTop += (eb.top - bb.top) - (bb.height - eb.height) / 2;
    el.focus({ preventScroll: true });
  }, [failure]);

  /** Tab and Shift+Tab wrap inside the panel while it is open. */
  const trap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((x) => x.offsetParent !== null || x === document.activeElement);
    if (!items.length) return;
    const edge = e.shiftKey ? items[0] : items[items.length - 1];
    const wrapTo = e.shiftKey ? items[items.length - 1] : items[0];
    if (document.activeElement === edge) {
      e.preventDefault();
      wrapTo?.focus();
    }
  };

  const showBanner = !!failure && failure.kind !== 'field' && failure.kind !== 'field-code';

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        className={styles.panel}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trap}
      >
        <div className={styles.head}>
          {icon ? (
            <span aria-hidden="true" className={styles.headIcon} data-tone={tone}>
              <span data-icon className={styles.headGlyph}>{icon}</span>
            </span>
          ) : null}
          <div className={styles.heading}>
            <h2 className={styles.title}>{title}</h2>
            {description ? <p className={styles.desc}>{description}</p> : null}
          </div>
          <button type="button" ref={closeRef} className={styles.close} aria-label="Close" onClick={onClose}>
            <span data-icon aria-hidden="true">close</span>
          </button>
        </div>

        <form
          ref={bodyRef}
          className={styles.body}
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        >
          {info ? <InfoBanner title={info.title} body={info.body} /> : null}
          {children}
        </form>

        {/* Outside the scroll area: a stale or conflict answer must be readable beside the footer
            action it disables, in a sheet whose body is taller than the window. */}
        {showBanner && failure ? (
          <div className={styles.alert}>
            <FailureBanner failure={failure} onRefresh={onRefresh} />
          </div>
        ) : null}

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
