import type { ReactNode } from 'react';
import styles from './Field.module.css';

export { styles as fieldStyles };

/**
 * Label, control, and the API's message for this input when there is one. `group` switches the
 * wrapper from a label to a plain group, for fields that hold several controls — a label may only
 * name one.
 */
export function Field({ label, required, optional, hint, error, group, children }: {
  label: string;
  /** The prototype's gray tag beside the label. */
  required?: boolean;
  optional?: boolean;
  hint?: string;
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
