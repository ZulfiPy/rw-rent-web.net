import type { ReactNode } from 'react';
import styles from './Panel.module.css';

/**
 * The card every screen is built from: heading, optional description, an actions slot, the body,
 * and a footer note. A `warn` note is the panel-level caveat the prototype uses for protected
 * accounts and permission limits.
 */
export function Panel({ title, description, actions, note, noteIcon = 'info', noteTone, children }: {
  title: string;
  description?: string;
  actions?: ReactNode;
  note?: string | null;
  noteIcon?: string;
  noteTone?: 'warn';
  children?: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {description ? <p className={styles.desc}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {children}
      {note ? (
        <p className={styles.note} data-tone={noteTone}>
          <span data-icon aria-hidden="true" className={styles.noteIcon}>{noteIcon}</span>
          {note}
        </p>
      ) : null}
    </section>
  );
}
