import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './record.module.css';

export interface RecordTab<T extends string> {
  id: T;
  label: string;
  icon: string;
  count?: number | undefined;
}

type Fade = 'none' | 'start' | 'end' | 'both';

/**
 * The record tab strip. The selected tab lives in the URL, so a deep link opens the same view.
 * On the phone tier the strip is wider than the screen: it scrolls with no scrollbar, the active
 * tab is always brought fully into view, and the clipped edge fades so what is cut off reads as
 * more rather than as the end of the strip.
 */
export function RecordTabs<T extends string>({ tabs, active, onSelect }: {
  tabs: Array<RecordTab<T>>;
  active: T;
  onSelect: (next: T) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const [fade, setFade] = useState<Fade>('none');

  const syncFade = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollWidth - el.clientWidth - el.scrollLeft > 1;
    setFade(start && end ? 'both' : start ? 'start' : end ? 'end' : 'none');
  }, []);

  // The active tab, whole: the first paint of a deep link lands on it without a slide, a later
  // change slides. Measured against the strip's own box, which `offsetLeft` would not give us.
  useLayoutEffect(() => {
    const el = strip.current;
    const tab = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (el && tab) {
      const pad = 22;
      const box = el.getBoundingClientRect();
      const seat = tab.getBoundingClientRect();
      const delta = seat.left < box.left + pad
        ? seat.left - box.left - pad
        : seat.right > box.right - pad
          ? seat.right - box.right + pad
          : 0;
      if (delta) {
        const next = Math.max(0, Math.min(el.scrollLeft + delta, el.scrollWidth - el.clientWidth));
        if (typeof el.scrollTo === 'function') {
          el.scrollTo({ left: next, behavior: opened.current ? 'smooth' : 'auto' });
        } else {
          el.scrollLeft = next;
        }
      }
    }
    opened.current = true;
    syncFade();
  }, [active, tabs.length, syncFade]);

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    el.addEventListener('scroll', syncFade, { passive: true });
    window.addEventListener('resize', syncFade);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncFade);
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', syncFade);
      window.removeEventListener('resize', syncFade);
      observer?.disconnect();
    };
  }, [syncFade]);

  return (
    <div ref={strip} className={styles.tabs} role="tablist" data-fade={fade}>
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
