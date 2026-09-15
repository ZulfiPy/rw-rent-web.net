import { useSyncExternalStore } from 'react';

/**
 * The prototype's `theme` state, lifted out of the shell so a public page has it too: the toggle
 * sits in the authentication header, and a cold load of `/sign-in` must already be in the theme the
 * person chose. One store, one `rwrent.theme` key, `data-theme` on the document element.
 */
export type Theme = 'dark' | 'light';

const KEY = 'rwrent.theme';

const stored = (): Theme => {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    // Private mode, or no storage at all: the prototype's default.
    return 'dark';
  }
};

let current: Theme = typeof window === 'undefined' ? 'dark' : stored();
const listeners = new Set<() => void>();

const paint = (theme: Theme) => {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
};

/** Called once at start-up, before the first render, whichever page the address bar opens. */
export function applyStoredTheme(): void {
  paint(current);
}

export function setTheme(next: Theme): void {
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode */
  }
  paint(next);
  listeners.forEach((notify) => notify());
}

export function toggleTheme(): void {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => current, () => 'dark' as Theme);
}

/** The prototype's `themeIcon` / `themeLabel` / `themeTip`, in one place for both toggles. */
export const themeIcon = (theme: Theme) => (theme === 'dark' ? 'light_mode' : 'dark_mode');
export const themeLabel = (theme: Theme) => (theme === 'dark' ? 'Light theme' : 'Dark theme');
export const themeTip = (theme: Theme) =>
  theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
