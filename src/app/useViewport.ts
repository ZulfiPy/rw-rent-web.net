import { useSyncExternalStore } from 'react';

/**
 * The prototype's three tiers, as media queries rather than a resize listener:
 *
 *   phone   < 768   cards instead of tables, sidebar behind a menu button
 *   tablet  768–1279 (both orientations) icon rail, folded columns
 *   desktop ≥ 1280  expanded rail, every column
 *
 * Inside the phone tier sits the prototype's own `isPhone()` edge at 640 (`useSheetTier`): dialogs
 * become bottom sheets, and a panel's table becomes stacked blocks.
 *
 * Column folding itself is CSS (`@media`); this hook is only for the structural switches React has
 * to make — a table becoming cards, a rail becoming a drawer.
 */
export type Tier = 'phone' | 'tablet' | 'desktop';

const PHONE = '(max-width: 767px)';
const DESKTOP = '(min-width: 1280px)';
const NARROW = '(max-width: 1023px)';
const SHEET = '(max-width: 639px)';

/** The prototype's rail states: overlay below 1024, icons to 1279, expanded from 1280. */
export type RailMode = 'drawer' | 'collapsed' | 'expanded';

const subscribe = (onChange: () => void) => {
  const queries = [window.matchMedia(PHONE), window.matchMedia(DESKTOP)];
  queries.forEach((q) => q.addEventListener('change', onChange));
  return () => queries.forEach((q) => q.removeEventListener('change', onChange));
};

const read = (): Tier => {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia(PHONE).matches) return 'phone';
  return window.matchMedia(DESKTOP).matches ? 'desktop' : 'tablet';
};

export function useTier(): Tier {
  return useSyncExternalStore(subscribe, read, () => 'desktop' as Tier);
}

const subscribeNarrow = (onChange: () => void) => {
  const q = window.matchMedia(NARROW);
  q.addEventListener('change', onChange);
  return () => q.removeEventListener('change', onChange);
};
const readNarrow = () => typeof window !== 'undefined' && window.matchMedia(NARROW).matches;

/**
 * Portrait and below (< 1024): the band where a table has room for four columns, not seven. Only
 * for the parts CSS cannot fold — a row's buttons dropping their labels for their icons.
 */
export function useNarrow(): boolean {
  return useSyncExternalStore(subscribeNarrow, readNarrow, () => false);
}

const subscribeSheet = (onChange: () => void) => {
  const q = window.matchMedia(SHEET);
  q.addEventListener('change', onChange);
  return () => q.removeEventListener('change', onChange);
};
const readSheet = () => typeof window !== 'undefined' && window.matchMedia(SHEET).matches;

/**
 * The prototype's `isPhone()` (< 640) — narrower than the card tier, and the edge the dialog sheet
 * already uses in CSS. Only for the structures React switches at it: a panel's table becoming
 * stacked blocks.
 */
export function useSheetTier(): boolean {
  return useSyncExternalStore(subscribeSheet, readSheet, () => false);
}

export function useRailMode(): RailMode {
  const narrow = useNarrow();
  const tier = useTier();
  return narrow ? 'drawer' : tier === 'desktop' ? 'expanded' : 'collapsed';
}
