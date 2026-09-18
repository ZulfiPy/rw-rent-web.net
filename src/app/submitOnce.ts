import { useRef } from 'react';
import { useMutation, type DefaultError, type UseMutationOptions } from '@tanstack/react-query';

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

/**
 * The same gate, one per component, stable across renders. Deliberately not exported: the only
 * way to get a gate is {@link useGatedMutation}, which also reopens it.
 */
function useSubmitGate(): SubmitGate {
  const gate = useRef<SubmitGate>(undefined);
  gate.current ??= createSubmitGate();
  return gate.current;
}

/**
 * The mutation options with the gate's reopening appended to `onSettled`: after the caller's own
 * `onSettled` has finished, and even if it throws. TanStack runs `onSettled` for a success and for
 * every kind of failure alike — a refusal, a rate limit, a request that never reached the API — so
 * nothing a request can answer leaves the gate shut.
 *
 * Kept apart from the hook so its lifecycle can be tested against TanStack's own observer, without
 * rendering anything.
 */
export function settlingGate<TData, TError, TVariables, TOnMutateResult>(
  gate: SubmitGate,
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): UseMutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return {
    ...options,
    onSettled: async (...args) => {
      try {
        await options.onSettled?.(...args);
      } finally {
        gate.settle();
      }
    },
  };
}

/** The other half of {@link settlingGate}: close the gate, then send. Returns whether it sent. */
export function gatedSubmit<TVariables>(
  gate: SubmitGate,
  mutate: (variables: TVariables) => void,
): (variables: TVariables) => boolean {
  return (variables) => gate.attempt(() => mutate(variables));
}

/**
 * A mutation that a form submits through: one submission at a time, and the next one allowed as
 * soon as this one has finished, whatever it was answered.
 *
 * The tester's T-008. Follow-up 4 gave every form the synchronous gate above and left each page to
 * reopen its own. The dialogs' hook and sign-out did; sign-in, registration and the shared reset
 * screen closed theirs on the first request and never opened them again, so a wrong password
 * followed by the right one sent nothing until the page was reloaded. The gate's tests proved that
 * it closes and never that anything opens it.
 *
 * So no form holds a gate any more. This hook creates it, closes it in `submit` and reopens it in
 * `onSettled`. A page cannot forget to reopen what it is never given. Every form in the app — the
 * public account forms, every dialog through `useActionMutation`, and sign-out — submits here.
 */
export function useGatedMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>) {
  const gate = useSubmitGate();
  const mutation = useMutation(settlingGate(gate, options));
  return {
    ...mutation,
    /** Sends unless this form's previous submission is still in flight; returns whether it sent. */
    submit: gatedSubmit<TVariables>(gate, (variables) => mutation.mutate(variables)),
  };
}
