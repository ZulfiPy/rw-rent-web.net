import styles from './EmptyState.module.css';

/**
 * The empty and problem states share one shell: icon, one line, one paragraph, optional retry.
 * `variant` picks the prototype's rule for the context: 'page' when the block owns the page area,
 * 'panel' when it sits inside a panel.
 */
export function EmptyState({ icon, title, body, code, onRetry, variant = 'page' }: {
  icon: string;
  title: string;
  body: string;
  code?: string | undefined;
  onRetry?: (() => void) | undefined;
  variant?: 'page' | 'panel';
}) {
  return (
    <div className={`${styles.state} ${variant === 'panel' ? styles.panel : ''}`}>
      <span data-icon aria-hidden="true" className={styles.icon}>{icon}</span>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      {code ? <p className={styles.code}>{code}</p> : null}
      {onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          <span data-icon aria-hidden="true" className={styles.retryIcon}>refresh</span>
          Try again
        </button>
      ) : null}
    </div>
  );
}
