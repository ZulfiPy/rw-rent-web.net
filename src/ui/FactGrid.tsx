import type { ReactNode } from 'react';
import styles from './FactGrid.module.css';

export function FactGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

/**
 * One labelled value. `mono` is for machine values only; `span` widens a cell whose value needs the
 * room (a before → after pair, a raw payload).
 */
export function Fact({ label, children, mono, dim, hint, span, pre }: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  dim?: boolean;
  hint?: string;
  span?: 2 | 'full';
  pre?: boolean;
}) {
  const spanClass = span === 'full' ? styles.full : span === 2 ? styles.span2 : '';
  return (
    <div className={`${styles.cell} ${spanClass}`}>
      <span className={styles.label}>{label}</span>
      <span className={`${mono ? styles.mono : styles.value} ${dim ? styles.dim : ''} ${pre ? styles.pre : ''}`}>
        {children}
      </span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
