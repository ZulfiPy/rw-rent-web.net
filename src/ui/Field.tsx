import type { ReactNode } from 'react';
import styles from './Field.module.css';

export { styles as fieldStyles };

/**
 * The attributes a control carries while its field is showing a message: the prototype's invalid
 * border and fill, and the state assistive technology reads. Spread onto the input, select or
 * textarea inside a `Field` that takes an `error` — every one of them, because `aria-invalid` is also
 * what a dialog finds the refused field by, to bring it into view (Follow-up 11, F11-1).
 */
export function invalidProps(error?: string | null | undefined): {
  'data-invalid': boolean;
  'aria-invalid'?: true;
} {
  return error ? { 'data-invalid': true, 'aria-invalid': true } : { 'data-invalid': false };
}

/**
 * Label, control, and the API's message for this input when there is one. `group` switches the
 * wrapper from a label to a plain group, for fields that hold several controls — a label may only
 * name one.
 */
export function Field({ label, required, optional, hint, warning, error, group, children }: {
  label: string;
  /** The prototype's gray tag beside the label. */
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  /**
   * An amber line under the control: what the person should know before submitting, read from the
   * data the dialog already holds. It blocks nothing; the API still decides (Follow-up 11, F11-2).
   */
  warning?: ReactNode;
  error?: string | undefined;
  group?: boolean;
  children: ReactNode;
}) {
  const body = (
    <>
      <span className={styles.label}>
        <span>{label}</span>
        {required ? <span className={styles.required}>required</span> : null}
        {optional ? <span className={styles.optional}>· optional</span> : null}
      </span>
      {children}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      {warning ? (
        <span className={styles.warning}>
          <span data-icon aria-hidden="true" className={styles.warningIcon}>warning</span>
          <span>{warning}</span>
        </span>
      ) : null}
      {error ? (
        <span className={styles.error}>
          <span data-icon aria-hidden="true" className={styles.errorIcon}>error</span>
          {error}
        </span>
      ) : null}
    </>
  );

  return group
    ? <div className={styles.field} role="group" aria-label={label}>{body}</div>
    : <label className={styles.field}>{body}</label>;
}
