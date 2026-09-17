import { useRef } from 'react';

/**
 * One submission at a time, decided synchronously.
 *
 * The tester's T-004: Enter pressed twice in quick succession sent the same phone update twice.
 * Every guard the app had was a rendered one — a disabled button, a `busy` prop, an `isPending`
 * check — and all of them read state that React has not re-rendered yet when the second key press
 * arrives. The window between the two is real and the second submit walks straight through it.
 *
 * So the gate is a ref, not state: it closes inside the first call, before anything re-renders, and
 * opens again when that submission settles. Nothing here is rendered, which is the point — a
 * rendered flag cannot close a gap that exists because rendering has not happened.
 *
 * The reviewer rated the finding Major rather than Minor for one reason: the interruption dialog
 * created two identical permanent records, and an interruption is never deleted. The API refuses
 * that pair as of round 3 (INTERRUPT-014), so this is now the first of two locks rather than the
 * only one.
 */
export interface SubmitGate {
  /**
   * Runs `action` unless a submission is already in flight. Returns whether it ran, so a caller can
   * tell a blocked submit from a performed one.
   */
  attempt(action: () => void): boolean;
  /** The submission finished, successfully or not: the next one may go. */
  settle(): void;
  /** Whether a submission is in flight. Not rendered — read it for decisions, not for display. */
  readonly busy: boolean;
}

export function createSubmitGate(): SubmitGate {
  let busy = false;
  return {
    attempt(action) {
      if (busy) return false;
      busy = true;
      try {
        action();
      } catch (error) {
        // A synchronous throw never happened, so the gate must not stay shut on it.
        busy = false;
        throw error;
      }
      return true;
    },
    settle() {
      busy = false;
    },
    get busy() {
      return busy;
    },
  };
}

/** The same gate, one per component, stable across renders. */
export function useSubmitGate(): SubmitGate {
  const gate = useRef<SubmitGate>(undefined);
  gate.current ??= createSubmitGate();
  return gate.current;
}
