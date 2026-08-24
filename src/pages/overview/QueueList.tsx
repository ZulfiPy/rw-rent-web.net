import { Link } from 'react-router-dom';
import type { QueueItem } from './useOpenWork';
import styles from './QueueList.module.css';

/**
 * The open queue's row. A row links only where the record it names already has a screen; the rest
 * state their case and wait, rather than offering a dead link.
 */
export function QueueList({ items }: { items: QueueItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((q) => {
        const body = (
          <>
            <span className={styles.tile} data-tone={q.tone}>
              <span data-icon aria-hidden="true">{q.icon}</span>
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{q.title}</span>
              <span className={styles.sub}>{q.sub}</span>
            </span>
            <span className={styles.when}>{q.when}</span>
            {q.to ? <span data-icon aria-hidden="true" className={styles.chevron}>chevron_right</span> : null}
          </>
        );
        return (
          <li key={q.id} className={styles.row}>
            {q.to
              ? <Link to={q.to} className={styles.link}>{body}</Link>
              : <span className={styles.static}>{body}</span>}
          </li>
        );
      })}
    </ul>
  );
}
