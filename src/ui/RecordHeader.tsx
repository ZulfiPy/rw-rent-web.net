import type { ReactNode } from 'react';
import { usePageHeader, type PageHeaderModel } from '@/app/pageHeader';
import { Chip } from './Chip';
import type { Tone } from './status';
import styles from './RecordHeader.module.css';

/**
 * A record's identity goes to the shell's header bar (breadcrumb back to the list, title, state
 * badge, identifier); what stays here is the prototype's hero band above the panels — its state
 * chip, the headline facts, and the lifecycle actions.
 */
export function RecordHeader({
  backTo, backLabel, title, mono, description, badges, code, pageId, headerActions, actionsKey,
  chip, actions, children,
}: {
  backTo: string;
  backLabel: string;
  title: string;
  mono?: boolean;
  description?: string;
  badges?: PageHeaderModel['badges'];
  code?: string;
  pageId?: string;
  /** Actions that belong to the record as a whole: the prototype puts these in the header bar. */
  headerActions?: ReactNode;
  /** Everything variable about those actions, so the bar re-renders when they change. */
  actionsKey?: string;
  /** The prototype's `heroChip`: the record's lifecycle state, at the band's leading edge. */
  chip?: { label: string; tone: Tone; dot: string };
  /** The prototype's `heroActions`, inside the band at its trailing edge. */
  actions?: ReactNode;
  children?: ReactNode;
}) {
  usePageHeader({
    crumbs: [{ label: backLabel, to: backTo }, { label: title }],
    title,
    mono,
    description,
    badges,
    code,
    pageId,
    actions: headerActions,
    actionsKey,
  });

  if (!children && !chip && !actions) return null;

  return (
    <div className={styles.hero}>
      {chip ? <Chip tone={chip.tone} dot={chip.dot} size="hero">{chip.label}</Chip> : null}
      {children ? <div className={styles.facts}>{children}</div> : null}
      {actions ? <div className={styles.heroActions}>{actions}</div> : null}
    </div>
  );
}

export function HeaderFact({ label, value, sub, mono }: {
  label: string;
  value: ReactNode;
  sub?: string | null;
  mono?: boolean;
}) {
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factBody}>
        <span className={mono ? styles.factMono : styles.factValue}>{value}</span>
        {sub ? <span className={styles.factSub}>{sub}</span> : null}
      </span>
    </div>
  );
}
