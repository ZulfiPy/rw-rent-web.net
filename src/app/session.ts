import { isApiError } from '@/api';

/**
 * The one place that knows a signed-in session has ended. A 401 from any request except the
 * sign-in request itself raises the signal below; the App consumes it, clears the cache and opens
 * the sign-in page with the session-ended message and the path to come back to.
 *
 * It lives outside React because the query client's cache handlers run outside React.
 */
export interface SessionEndSignal {
  /** Same-origin path the user was on, including its query string. Never a full URL. */
  readonly returnTo: string;
}

let signal: SessionEndSignal | null = null;
let signingOut = false;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

/** A same-origin path, never an absolute URL, so the return can only land inside the app. */
export function samePathOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith('/') || value.startsWith('//')) return undefined;
  return value;
}

export function currentPath(): string {
  const { pathname, search } = window.location;
  return `${pathname}${search}`;
}

/**
 * Raises the signal once. Repeated 401s while one is pending — a page with several queries in
 * flight — collapse into that first one, and a 401 that arrives once the sign-in page is already
 * open raises nothing: the door is open and the first signal's path is the one worth keeping.
 *
 * A deliberate sign-out raises nothing at all: emptying the cache refetches the page's watched
 * queries, and the 401s they come back with are the expected answer to the sign-out, not a
 * session that ended under someone.
 */
export function endSession(returnTo: string | undefined): void {
  if (signal || signingOut) return;
  const path = samePathOnly(returnTo);
  if (path?.startsWith('/sign-in')) return;
  signal = { returnTo: path ?? '/overview' };
  emit();
}

/** Signing out on purpose: nothing between here and `endSignOut()` is an ended session. */
export function beginSignOut(): void {
  signingOut = true;
}

export function endSignOut(): void {
  signingOut = false;
}

export function consumeSessionEnd(): void {
  if (!signal) return;
  signal = null;
  emit();
}

export function getSessionEnd(): SessionEndSignal | null {
  return signal;
}

export function subscribeSessionEnd(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam: forget any pending signal between cases. */
export function resetSessionEnd(): void {
  signal = null;
  signingOut = false;
  listeners.clear();
}

/**
 * True when a rejection means "this session is no longer valid". The sign-in request's own 401 is
 * a wrong password, not an ended session, so its caller marks itself exempt.
 */
export function isSessionEnded(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

/** Mutations and queries that own their 401 (the sign-in form, the transfer acceptance). */
export const OWNS_UNAUTHORIZED = { ownsUnauthorized: true } as const;

export function ownsUnauthorized(meta: Record<string, unknown> | undefined): boolean {
  return meta?.ownsUnauthorized === true;
}
