import { useEffect, useState, type ReactNode } from 'react';
import styles from './Filters.module.css';

/** Types locally, commits after a pause, so a keystroke is not a request. */
export function SearchInput({ value, placeholder, onChange, delay = 250 }: {
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
  delay?: number;
}) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(timer);
    // The committed value is what schedules the next commit; onChange is fresh every render.
  }, [text, delay]);

  return (
    <label className={styles.search}>
      <span data-icon aria-hidden="true" className={styles.searchIcon}>search</span>
      <input
        type="search"
        className={styles.input}
        value={text}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setText(e.target.value)}
      />
      {text ? (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => setText('')}>
          <span data-icon aria-hidden="true">close</span>
        </button>
      ) : null}
    </label>
  );
}

export interface FilterOption { value: string; label: string }

/**
 * The prototype's filter control: the label sits beside the chosen value, so the control says what
 * it filters even when nothing is set. The native select sits transparent on top, which keeps
 * the platform picker on touch devices.
 */
export function SelectFilter({ value, options, label, onChange }: {
  value: string;
  options: FilterOption[];
  label: string;
  onChange: (next: string) => void;
}) {
  const current = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? '';
  return (
    <span className={styles.select}>
      <span className={styles.selectLabel}>{label}</span>
      <span className={styles.selectValue}>{current}</span>
      <span data-icon aria-hidden="true" className={styles.selectIcon}>expand_more</span>
      <select
        className={styles.nativeSelect}
        value={value}
        aria-label={`Filter by ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  );
}

/**
 * The prototype offers clearing only while something is filtered, and clearing resets the search
 * and every filter at once — the sort, the page size and the open extra-filters row are kept.
 */
export function ClearFilters({ onClear }: { onClear: () => void }) {
  return (
    <button type="button" className={styles.clearFilters} onClick={onClear}>
      <span data-icon aria-hidden="true" className={styles.clearFiltersIcon}>filter_alt_off</span>
      <span>Clear filters</span>
    </button>
  );
}

/** The shaded grid the More filters button opens, directly below the toolbar. */
export function MoreFiltersRow({ children }: { children: ReactNode }) {
  return <div className={styles.moreRow}>{children}</div>;
}

/** A labelled select inside the extra-filters grid. */
export function MoreSelect({ label, value, options, hint, onChange }: {
  value: string;
  options: FilterOption[];
  label: string;
  hint?: string;
  onChange: (next: string) => void;
}) {
  const current = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? '';
  return (
    <label className={styles.moreField}>
      <span className={styles.moreLabel}>{label}</span>
      <span className={styles.moreControl}>
        <span className={styles.moreValue}>{current}</span>
        <span data-icon aria-hidden="true" className={styles.moreCaret}>expand_more</span>
        <select
          className={styles.nativeSelect}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </span>
      {hint ? <span className={styles.moreHint}>{hint}</span> : null}
    </label>
  );
}

/** A labelled date bound inside the extra-filters grid. */
export function MoreDate({ label, value, hint, onChange }: {
  label: string;
  value: string;
  hint?: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className={styles.moreField}>
      <span className={styles.moreLabel}>{label}</span>
      <input
        type="date"
        className={styles.moreDate}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className={styles.moreHint}>{hint}</span> : null}
    </label>
  );
}
