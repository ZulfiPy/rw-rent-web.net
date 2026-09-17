import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { stripHash, tokenArrival } from './token';

/**
 * The token of an emailed link, kept current when another link arrives in the same tab.
 *
 * The tester's T-005: all four of these pages read the fragment once, at mount, and kept whatever
 * outcome they had reached. Opening another link in that tab changed the address bar and nothing
 * else — no request, no new state — so a second, perfectly valid link was silently ignored, while
 * the same link in a fresh tab worked. The result must not depend on which tab it lands in.
 *
 * Two signals are needed, because a fragment can change in two different ways:
 *
 *  - the router's `location.hash`, for a change the app itself navigated;
 *  - the window's `hashchange`, for a link opened into the address bar of a tab that is already
 *    here. `stripHash` uses `history.replaceState`, which the router never hears about, so the
 *    router's own `hash` cannot be relied on for this one.
 *
 * Both paths read the live fragment rather than the value that triggered them, and both strip it
 * immediately. That makes a duplicate trigger a no-op on its own, with no need to remember which
 * token was seen last — which matters, because the same token arriving again is a real event the
 * API has to answer, not a repeat to be filtered out. Only the API knows whether a single-use
 * token is still good.
 *
 * `restart` is called for every arrival after the first read, and never for the fragment the page
 * was opened with: the page is already fresh then, and resetting would undo the work of the very
 * request it is about to make. A later arrival includes the case where the page had no fragment at
 * all — someone asked for the link with this tab open and then clicked it — which is why the reset
 * is not conditional on a token having been used before.
 *
 * `discard` puts the page back to having no token, for a screen that offers to start again from
 * the beginning rather than from another link.
 */
export function useLinkToken(restart: () => void): readonly [string | null, () => void] {
  const { hash } = useLocation();
  // Read before the first paint, so a screen never flashes its unusable state on the way in.
  const [token, setToken] = useState<string | null>(() => {
    const arrival = tokenArrival(window.location.hash, false);
    return arrival.kind === 'none' ? null : arrival.token;
  });
  const restartRef = useRef(restart);
  restartRef.current = restart;

  // The fragment the page was opened with leaves the address bar as it always did.
  useEffect(stripHash, []);

  const take = useCallback(() => {
    // Every call here happens after the first read, so any token it finds is a later arrival.
    const arrival = tokenArrival(window.location.hash, true);
    if (arrival.kind === 'none') return;
    stripHash();
    setToken(arrival.token);
    restartRef.current();
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', take);
    return () => window.removeEventListener('hashchange', take);
  }, [take]);

  // A change the router saw. The live fragment is the source of truth; `hash` is only the trigger.
  useEffect(() => {
    take();
  }, [hash, take]);

  const discard = useCallback(() => setToken(null), []);

  return [token, discard] as const;
}
