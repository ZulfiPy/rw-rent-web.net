import styles from './record.module.css';

export interface RecordTab<T extends string> {
  id: T;
  label: string;
  icon: string;
  count?: number | undefined;
}

/** The record tab strip. The selected tab lives in the URL, so a deep link opens the same view. */
export function RecordTabs<T extends string>({ tabs, active, onSelect }: {
  tabs: Array<RecordTab<T>>;
  active: T;
  onSelect: (next: T) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={styles.tab}
          onClick={() => onSelect(t.id)}
        >
          <span data-icon aria-hidden="true" className={styles.tabIcon}>{t.icon}</span>
          {t.label}
          {t.count === undefined ? null : <span className={styles.count}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** The record-level state banner: an open interruption, a protected account, a blocked lifecycle. */
export function RecordBanner({ icon, title, body, tone }: {
  icon: string;
  title: string;
  body: string;
  tone?: 'warn' | 'bad' | 'info';
}) {
  return (
    <div className={styles.banner} data-tone={tone}>
      <span data-icon aria-hidden="true" className={styles.bannerIcon}>{icon}</span>
      <div>
        <p className={styles.bannerTitle}>{title}</p>
        <p className={styles.bannerBody}>{body}</p>
      </div>
    </div>
  );
}

export { styles as recordStyles };
