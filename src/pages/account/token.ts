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

/** Removes the fragment without adding a history entry and without reloading the page. */
export function stripHash(): void {
  if (typeof window === 'undefined' || !window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}`);
}
