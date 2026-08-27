import { Link } from 'react-router-dom';
import type { Tone } from '@/ui/status';
import styles from './SimpleQueue.module.css';

export interface SimpleRow {
  id: string;
  icon: string;
  tone: Tone | 'plain';
  title: string;
  sub: string;
  when: string;
  to?: string | undefined;
}

/**
 * The prototype's `pgSimple` layout — a centred 1000px column with an optional "Under development"
 * notice and one panel of rows. Needs attention, Tasks and Insurance cases all render through it.
 */
export function SimpleQueue({ notice, heading, sub, count, rows, emptyIcon, emptyTitle, emptyBody }: {
  notice?: string;
  heading: string;
  sub: string;
  count: string;
  rows: SimpleRow[];
  emptyIcon: string;
  emptyTitle: string;
  emptyBody?: string;
}) {
  return (
    <div className={styles.page}>
      {notice ? (
        <div role="status" className={styles.notice}>
          <span data-icon aria-hidden="true" className={styles.noticeIcon}>construction</span>
          <div>
            <div className={styles.noticeTitle}>Under development</div>
            <p className={styles.noticeBody}>{notice}</p>
          </div>
        </div>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.head}>
          <div className={styles.heading}>
            <h2 className={styles.title}>{heading}</h2>
            <p className={styles.sub}>{sub}</p>
          </div>
          <span className={styles.count}>{count}</span>
        </div>

        {rows.length === 0 ? (
          <div className={styles.empty}>
            <span data-icon aria-hidden="true" className={styles.emptyIcon}>{emptyIcon}</span>
            <div className={styles.emptyTitle}>{emptyTitle}</div>
            {emptyBody ? <p className={styles.emptyBody}>{emptyBody}</p> : null}
          </div>
        ) : rows.map((r) => {
          const body = (
            <>
              <span className={styles.tile} data-tone={r.tone === 'plain' ? undefined : r.tone}>
                <span data-icon aria-hidden="true">{r.icon}</span>
              </span>
              <span className={styles.text}>
                <span className={styles.rowTitle}>{r.title}</span>
                <span className={styles.rowSub}>{r.sub}</span>
              </span>
              <span className={styles.meta}>
                <span className={styles.when}>{r.when}</span>
                {r.to ? <span data-icon aria-hidden="true" className={styles.chevron}>chevron_right</span> : null}
              </span>
            </>
          );
          return r.to
            ? <Link key={r.id} to={r.to} className={`${styles.row} ${styles.link}`}>{body}</Link>
            : <div key={r.id} className={styles.row}>{body}</div>;
        })}
      </section>
    </div>
  );
}
