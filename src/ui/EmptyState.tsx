import styles from './EmptyState.module.css';

/** The empty and problem states share one shell: icon, one line, one paragraph, optional retry. */
export function EmptyState({ icon, title, body, code, onRetry }: {
  icon: string;
  title: string;
  body: string;
  code?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div className={styles.state}>
      <span data-icon aria-hidden="true" className={styles.icon}>{icon}</span>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      {code ? <p className={styles.code}>{code}</p> : null}
      {onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>Try again</button>
      ) : null}
    </div>
  );
}
