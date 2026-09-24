import styles from './EmptyState.module.css';

/**
 * The empty and problem states share one shell: icon, one line, one paragraph, optional retry.
 * `variant` picks the prototype's rule for the context: 'page' when the block owns the page area,
 * 'panel' when it sits inside a panel. `action` is the one step that leads out of an empty state
 * (Follow-up 11: Delete records' "Show everything"), in the retry button's form. A state may have no
 * paragraph (Follow-up 12: Tasks' "Nothing finished yet").
 */
export function EmptyState({ icon, title, body, code, onRetry, action, variant = 'page' }: {
  icon: string;
  title: string;
  body?: string | undefined;
  code?: string | undefined;
  onRetry?: (() => void) | undefined;
  action?: { label: string; icon: string; onClick: () => void } | undefined;
  variant?: 'page' | 'panel';
}) {
  return (
    <div className={`${styles.state} ${variant === 'panel' ? styles.panel : ''}`}>
      <span data-icon aria-hidden="true" className={styles.icon}>{icon}</span>
      <p className={styles.title}>{title}</p>
      {body ? <p className={styles.body}>{body}</p> : null}
      {code ? <p className={styles.code}>{code}</p> : null}
      {onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          <span data-icon aria-hidden="true" className={styles.retryIcon}>refresh</span>
          Try again
        </button>
      ) : null}
      {action ? (
        <button type="button" className={styles.retry} onClick={action.onClick}>
          <span data-icon aria-hidden="true" className={styles.retryIcon}>{action.icon}</span>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
