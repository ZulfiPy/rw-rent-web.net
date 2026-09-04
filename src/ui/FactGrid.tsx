import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './FactGrid.module.css';

export function FactGrid({ children, oneRow }: { children: ReactNode; oneRow?: boolean }) {
  return <div className={oneRow ? `${styles.grid} ${styles.oneRow}` : styles.grid}>{children}</div>;
}

/**
 * One labelled value. `mono` is for machine values only; `span` widens a cell whose value needs the
 * room (a before → after pair, a raw payload). `to` makes the value the prototype's record link;
 * `sub` is the prototype's second line under the value (a customer's type, say).
 */
export function Fact({ label, children, mono, dim, hint, span, pre, sub, to }: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  dim?: boolean;
  hint?: string;
  span?: 2 | 'full';
  pre?: boolean;
  sub?: string | null;
  to?: string;
}) {
  const spanClass = span === 'full' ? styles.full : span === 2 ? styles.span2 : '';
  const valueClass = `${mono ? styles.mono : styles.value} ${dim ? styles.dim : ''} ${pre ? styles.pre : ''}`;
  return (
    <div className={`${styles.cell} ${spanClass}`}>
      <span className={styles.label}>{label}</span>
      {to ? (
        <Link to={to} className={`${mono ? styles.mono : styles.value} ${styles.link}`}>{children}</Link>
      ) : (
        <span className={valueClass}>{children}</span>
      )}
      {sub ? <span className={styles.sub}>{sub}</span> : null}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
