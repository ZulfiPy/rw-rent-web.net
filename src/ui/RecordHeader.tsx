import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './RecordHeader.module.css';

/** Back link, title with its state chip, and the record's headline facts. */
export function RecordHeader({ backTo, backLabel, title, chip, children }: {
  backTo: string;
  backLabel: string;
  title: string;
  chip?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      <Link to={backTo} className={styles.back}>
        <span data-icon aria-hidden="true" className={styles.backIcon}>arrow_back</span>{backLabel}
      </Link>
      <div className={styles.top}>
        <h1 className={styles.title}>{title}</h1>
        {chip}
      </div>
      {children ? <div className={styles.facts}>{children}</div> : null}
    </div>
  );
}

export function HeaderFact({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={mono ? styles.factMono : styles.factValue}>{value}</span>
    </div>
  );
}
