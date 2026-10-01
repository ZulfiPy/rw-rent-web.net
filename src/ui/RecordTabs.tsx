import { useLayoutEffect, useRef, useState } from 'react';
import styles from './record.module.css';
import { tabStrip, type Fade, type TabStrip } from './tabStrip';

export interface RecordTab<T extends string> {
  id: T;
  label: string;
  icon: string;
  count?: number | undefined;
}

/**
 * The record tab strip. The selected tab lives in the URL, so a deep link opens the same view.
 * On the phone tier the strip is wider than the screen: it scrolls with no scrollbar, the active
 * tab is always brought fully into view, also once its counts have widened the tabs, and the clipped
 * edge fades so what is cut off reads as more rather than as the end of the strip.
 */
export function RecordTabs<T extends string>({ tabs, active, onSelect, compact }: {
  tabs: Array<RecordTab<T>>;
  active: T;
  onSelect: (next: T) => void;
  /**
   * A short strip that fits the phone whole (Follow-up 12, Tasks): below 640 its tabs drop their
   * icons and tighten, so nothing scrolls; below 768 it spans the width it stands in, its tabs sharing
   * what is left over (Follow-up 16).
   */
  compact?: boolean;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const control = useRef<TabStrip | null>(null);
  const opened = useRef(false);
  const [fade, setFade] = useState<Fade>('none');

  // What the strip does in the browser (`tabStrip`): the active tab whole, the cut edge faded. It starts
  // before the first seat below, which effects of one component run in the order they are written.
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const started = tabStrip(el, setFade);
    control.current = started;
    return () => {
      started.stop();
      control.current = null;
    };
  }, []);

  // The active tab, whole: the first paint of a deep link lands on it without a slide, a later change
  // slides. When the tabs change width afterwards, their counts arriving among them, `tabStrip` seats
  // it again without a slide, unless the person has scrolled the strip (Follow-up 20, F20-2).
  useLayoutEffect(() => {
    control.current?.seat(opened.current);
    opened.current = true;
  }, [active, tabs.length]);

  return (
    <div ref={strip} className={styles.tabs} role="tablist" data-fade={fade} data-compact={compact ? 'true' : undefined}>
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

/**
 * The record-level state banner: an open interruption, a protected account, a blocked lifecycle. A
 * finished task's is `ok` and a cancelled one's `mute`, and a finished task's has no body
 * (Follow-up 12).
 */
export function RecordBanner({ icon, title, body, tone }: {
  icon: string;
  title: string;
  body?: string | null;
  tone?: 'warn' | 'bad' | 'info' | 'ok' | 'mute';
}) {
  return (
    <div className={styles.banner} data-tone={tone}>
      <span data-icon aria-hidden="true" className={styles.bannerIcon}>{icon}</span>
      <div>
        <p className={styles.bannerTitle}>{title}</p>
        {body ? <p className={styles.bannerBody}>{body}</p> : null}
      </div>
    </div>
  );
}

export { styles as recordStyles };
