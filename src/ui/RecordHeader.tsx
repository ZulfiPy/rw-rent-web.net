import type { ReactNode } from 'react';
import { usePageHeader, type PageHeaderModel } from '@/app/pageHeader';
import styles from './RecordHeader.module.css';

/**
 * A record's identity goes to the shell's header bar (breadcrumb back to the list, title, state
 * badge); what stays here is the headline fact row that sits above the record's panels.
 */
export function RecordHeader({ backTo, backLabel, title, mono, badges, children }: {
  backTo: string;
  backLabel: string;
  title: string;
  mono?: boolean;
  badges?: PageHeaderModel['badges'];
  children?: ReactNode;
}) {
  usePageHeader({
    crumbs: [{ label: backLabel, to: backTo }, { label: title }],
    title,
    mono,
    badges,
  });
  return children ? <div className={styles.facts}>{children}</div> : null;
}

export function HeaderFact({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={mono ? styles.factMono : styles.factValue}>{value}</span>
    </div>
  );
}
