import { useSyncExternalStore } from 'react';

/**
 * The prototype's three tiers, as media queries rather than a resize listener:
 *
 *   phone   < 768   cards instead of tables, sidebar behind a menu button
 *   tablet  768–1279 (both orientations) icon rail, folded columns
 *   desktop ≥ 1280  expanded rail, every column
 *
 * Column folding itself is CSS (`@media`); this hook is only for the structural switches React has
 * to make — a table becoming cards, a rail becoming a drawer.
 */
export type Tier = 'phone' | 'tablet' | 'desktop';

const PHONE = '(max-width: 767px)';
const DESKTOP = '(min-width: 1280px)';

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
