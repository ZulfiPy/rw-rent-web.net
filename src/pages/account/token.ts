/**
 * Every emailed link carries its single-use token after the `#`, so it never reaches the API's
 * logs or a proxy. The page reads it once, then takes it out of the address bar: the token stays
 * in memory for the request, and a shared screenshot or a back-button visit no longer carries it.
 */
export function readTokenFromHash(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.trim() ? decoded : null;
  } catch {
    // A malformed escape is not a token; the page shows its expired-or-invalid state.
    return raw.trim() ? raw : null;
  }
}

/**
 * What a link page should do with the fragment it can see.
 *
 * `consumed` says whether the page has already taken a token from the address bar. The distinction
 * is the whole of the tester's T-005: the first fragment is simply the page's own reason for
 * existing, while a later one means a second link was opened in a tab that is already finished —
 * and a page that ignores it keeps showing the old outcome and sends nothing. The second link may
 * be a fresh, valid one, or the same spent one again; either way the page must start over and let
 * the API answer, because only the API knows whether a single-use token is still good.
 */
export type TokenArrival =
  /** No token in the fragment: the page shows whatever its own state says. */
  | { kind: 'none' }
  /** The fragment the page was opened with. */
  | { kind: 'first'; token: string }
  /** A fragment that arrived later, in a tab that already used one: start over with it. */
  | { kind: 'again'; token: string };

export function tokenArrival(hash: string, consumed: boolean): TokenArrival {
  const token = readTokenFromHash(hash);
  if (!token) return { kind: 'none' };
  return consumed ? { kind: 'again', token } : { kind: 'first', token };
}

/**
 * What a link page is looking at: the token it holds, and how many fragments have arrived.
 *
 * The counter is the point. A page that only remembers the token cannot tell the same link arriving
 * again from nothing happening at all, because the value it would store is identical — and React
 * bails out of a state update that changes nothing, so the effect that sends the token never runs
 * again. The page then sits on its "consuming the token" state for ever. `arrival` changes on every
 * fragment whether the token changed or not, which is what makes the second visit a real event.
 */
export interface LinkTokenState {
  token: string | null;
  arrival: number;
}

export const NO_LINK_TOKEN: LinkTokenState = { token: null, arrival: 0 };

/**
 * The state after reading `hash`, or `null` when the fragment holds no token and the page should be
 * left exactly as it is.
 */
export function readLinkToken(state: LinkTokenState, hash: string): LinkTokenState | null {
  const token = readTokenFromHash(hash);
  if (!token) return null;
  return { token, arrival: state.arrival + 1 };
}

/** Removes the fragment without adding a history entry and without reloading the page. */
export function stripHash(): void {
  if (typeof window === 'undefined' || !window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}`);
}
