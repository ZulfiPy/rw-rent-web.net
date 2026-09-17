import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NO_LINK_TOKEN, readLinkToken, stripHash } from './token';

export interface LinkToken {
  /** The token to send, or `null` when the page was opened without one. */
  token: string | null;
  /**
   * Changes on every fragment that arrives, whether or not the token changed. An effect that sends
   * the token must depend on this and not on the token alone — see the note on `LinkTokenState`.
   */
  arrival: number;
  /** Put the page back to having no token, for a screen that starts again from the beginning. */
  discard: () => void;
}

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
 *    router's own `hash` cannot be relied on for it.
 *
 * Both paths read the live fragment rather than the value that triggered them, and both strip it
 * immediately, which makes a duplicate trigger a no-op without having to remember which token was
 * seen last. That matters, because **the same token arriving again is a real event**: only the API
 * knows whether a single-use token is still good, so the page must send it and let the refusal
 * produce the unusable-link screen.
 *
 * `restart` is called for every arrival after the first read, and never for the fragment the page
 * was opened with: the page is already fresh then, and resetting would undo the work of the very
 * request it is about to make. A later arrival includes the case where the page had no fragment at
 * all — someone asked for the link with this tab open and then clicked it — which is why the reset
 * is not conditional on a token having been used before.
 */
export function useLinkToken(restart: () => void): LinkToken {
  const { hash } = useLocation();
  // Read before the first paint, so a screen never flashes its unusable state on the way in.
  const [state, setState] = useState(() => readLinkToken(NO_LINK_TOKEN, window.location.hash)
    ?? NO_LINK_TOKEN);
  const restartRef = useRef(restart);
  restartRef.current = restart;
  // The state mirrored, so `take` can read the current one without being rebuilt on every change —
  // and without a side effect inside a state updater, which React is free to run twice.
  const stateRef = useRef(state);
  stateRef.current = state;

  // The fragment the page was opened with leaves the address bar as it always did.
  useEffect(stripHash, []);

  const take = useCallback(() => {
    const next = readLinkToken(stateRef.current, window.location.hash);
    if (!next) return;
    stripHash();
    stateRef.current = next;
    setState(next);
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

  const discard = useCallback(() => {
    stateRef.current = { ...stateRef.current, token: null };
    setState(stateRef.current);
  }, []);

  return { token: state.token, arrival: state.arrival, discard };
}
