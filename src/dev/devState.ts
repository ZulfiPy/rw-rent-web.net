/**
 * The PROTOTYPE panel's state. Dev-only: guard every import site with import.meta.env.DEV so the
 * production bundle drops it. Read by the mock transport, never by a component.
 */
import type { FailureMode } from '@/mock/failures';

export interface DevState {
  /** Mock persona id — swaps the /me response and nothing else. */
  personaId: string;
  /** How the NEXT mutation fails. Consumed once. */
  nextFailure: FailureMode;
}

const KEY = 'rwrent.dev';
const initial: DevState = { personaId: 'u1', nextFailure: 'none' };

let state: DevState = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...(JSON.parse(raw) as Partial<DevState>) } : initial;
  } catch {
    return initial;
  }
})();

const listeners = new Set<() => void>();

export const getDevState = () => state;

export function setDevState(patch: Partial<DevState>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

export function subscribeDevState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reads and clears the one-shot failure mode. */
export function consumeNextFailure(): FailureMode {
  const mode = state.nextFailure;
  if (mode !== 'none') setDevState({ nextFailure: 'none' });
  return mode;
}
