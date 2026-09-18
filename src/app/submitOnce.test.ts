import { describe, expect, it, vi } from 'vitest';
import { MutationObserver, QueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { ApiError } from '@/api';
import * as submitOnce from './submitOnce';
import { createSubmitGate, gatedSubmit, settlingGate } from './submitOnce';

describe('one submission at a time', () => {
  it('runs the first submit and turns the second away', () => {
    // The tester's T-004, in one tick: two Enter presses arrive before anything re-renders, so
    // nothing the app renders can tell them apart. Exactly one request must go out.
    const send = vi.fn();
    const gate = createSubmitGate();

    expect(gate.attempt(send)).toBe(true);
    expect(gate.attempt(send)).toBe(false);
    expect(gate.attempt(send)).toBe(false);

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('closes inside the first call, before the first action returns', () => {
    // Why a ref and not state: the gate has to be shut while the first submission is still being
    // started, which is the only moment the second key press can arrive in.
    const gate = createSubmitGate();
    let busyDuringAction: boolean | null = null;

    gate.attempt(() => {
      busyDuringAction = gate.busy;
    });

    expect(busyDuringAction).toBe(true);
  });

  it('opens again once the submission settles, so the next one may go', () => {
    const send = vi.fn();
    const gate = createSubmitGate();

    gate.attempt(send);
    gate.settle();
    expect(gate.attempt(send)).toBe(true);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('settles after a refusal too, or a dialog could never retry', () => {
    const gate = createSubmitGate();
    gate.attempt(() => {});
    expect(gate.busy).toBe(true);

    // The mutation's onSettled runs for a rejection as much as for a success.
    gate.settle();
    expect(gate.busy).toBe(false);
  });

  it('settling without a submission in flight is harmless', () => {
    const gate = createSubmitGate();
    gate.settle();
    gate.settle();
    expect(gate.busy).toBe(false);
    expect(gate.attempt(() => {})).toBe(true);
  });

  it('does not stay shut when the action throws synchronously', () => {
    const gate = createSubmitGate();

    expect(() => gate.attempt(() => { throw new Error('nothing was sent'); }))
      .toThrow('nothing was sent');
    expect(gate.busy).toBe(false);

    const send = vi.fn();
    expect(gate.attempt(send)).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('gives each gate its own state, so two dialogs never block each other', () => {
    const first = createSubmitGate();
    const second = createSubmitGate();

    first.attempt(() => {});
    expect(first.busy).toBe(true);
    expect(second.busy).toBe(false);
    expect(second.attempt(() => {})).toBe(true);
  });
});

/*
 * The tester's T-008, and the lesson of it. Every test above proves the gate closes; the one that
 * says it opens calls `settle()` by hand. Nothing checked that anything in the app ever called it,
 * and on sign-in, registration and the reset screen nothing did: one refusal left the form dead
 * until a reload. The tests below drive the gate through TanStack's own mutation observer — the
 * machinery `useGatedMutation` is built on — so what reopens it is the library's `onSettled`, not
 * the test.
 */
describe('a gated mutation reopens when its request settles', () => {
  /** What `useGatedMutation` assembles, without React: one gate, one observer, one submit. */
  function form(options: UseMutationOptions<unknown, unknown, void, unknown>) {
    const gate = createSubmitGate();
    const observer = new MutationObserver(new QueryClient(), settlingGate(gate, options));
    let settled: Promise<unknown> = Promise.resolve();
    // As useMutation's own mutate: fire and forget, the outcome is the callbacks' business.
    const submit = gatedSubmit<void>(gate, (variables) => {
      settled = observer.mutate(variables).catch(() => undefined);
    });
    return { gate, submit, settled: () => settled };
  }

  const refusal = (status: number, code: string) =>
    new ApiError(status, { status, title: 'Refused', code });

  it('a wrong password, then the right one: two requests', async () => {
    // The tester's own steps on /sign-in: 401, correct the password, submit again.
    const login = vi.fn()
      .mockRejectedValueOnce(refusal(401, 'authentication.invalid_credentials'))
      .mockResolvedValueOnce({});
    const signIn = form({ mutationFn: login });

    expect(signIn.submit()).toBe(true);
    await signIn.settled();
    expect(signIn.gate.busy).toBe(false);

    expect(signIn.submit()).toBe(true);
    await signIn.settled();
    expect(login).toHaveBeenCalledTimes(2);
  });

  it('a refused weak password, then a strong one: two requests', async () => {
    // The tester's second reproduction, on the reset link: a field-level 400, then the correction.
    const complete = vi.fn()
      .mockRejectedValueOnce(new ApiError(400, {
        status: 400,
        errors: { NewPassword: ['The password must be at least 12 characters.'] },
      }))
      .mockResolvedValueOnce(undefined);
    const reset = form({ mutationFn: complete });

    reset.submit();
    await reset.settled();
    expect(reset.submit()).toBe(true);
    await reset.settled();

    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('a rate-limited answer reopens it too', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(refusal(429, 'rate_limited'))
      .mockResolvedValueOnce(undefined);
    const forgot = form({ mutationFn: request });

    forgot.submit();
    await forgot.settled();
    expect(forgot.submit()).toBe(true);
    await forgot.settled();

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('so does a request that never reached the API', async () => {
    const register = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(undefined);
    const registration = form({ mutationFn: register });

    registration.submit();
    await registration.settled();
    expect(registration.submit()).toBe(true);
    await registration.settled();

    expect(register).toHaveBeenCalledTimes(2);
  });

  it('a success keeps it shut only until it settles', async () => {
    let answer!: () => void;
    const accept = vi.fn(() => new Promise<void>((resolve) => { answer = resolve; }));
    const transfer = form({ mutationFn: accept });

    expect(transfer.submit()).toBe(true);
    // In flight: a second Enter is still turned away (T-004 is not given back).
    expect(transfer.submit()).toBe(false);
    expect(transfer.gate.busy).toBe(true);
    // TanStack starts the request a tick later; the gate was shut before it did.
    await vi.waitFor(() => expect(accept).toHaveBeenCalledTimes(1));
    expect(transfer.submit()).toBe(false);

    answer();
    await transfer.settled();
    expect(transfer.gate.busy).toBe(false);
    expect(transfer.submit()).toBe(true);
    await vi.waitFor(() => expect(accept).toHaveBeenCalledTimes(2));
    answer();
    await transfer.settled();
  });

  it("stays shut through the form's own onSettled", async () => {
    // Sign-out moves to the front door in its onSettled: a click during the move is still turned
    // away, and the button works again once the move is done.
    const busyDuringOwnSettle: boolean[] = [];
    const signOut = form({
      mutationFn: async () => undefined,
      onSettled: async () => {
        busyDuringOwnSettle.push(signOut.gate.busy);
        await Promise.resolve();
        busyDuringOwnSettle.push(signOut.gate.busy);
      },
    });

    signOut.submit();
    await signOut.settled();

    expect(busyDuringOwnSettle).toEqual([true, true]);
    expect(signOut.gate.busy).toBe(false);
  });

  it("opens even when the form's own onSettled throws", async () => {
    // TanStack then treats the mutation as failed and runs onSettled once more; either way the
    // form must not be left dead by its own callback.
    const onSettled = vi.fn()
      .mockImplementationOnce(() => { throw new Error('navigation failed'); });
    const signOut = form({ mutationFn: async () => undefined, onSettled });

    signOut.submit();
    await signOut.settled();

    expect(signOut.gate.busy).toBe(false);
    expect(signOut.submit()).toBe(true);
    await signOut.settled();
  });

  it('no form can hold a gate of its own: the hook is the only way to get one', () => {
    // A page that cannot get a gate cannot forget to reopen it. The pure factory stays exported
    // for these tests; the hook that hands a gate to a component does not.
    expect(Object.keys(submitOnce)).toContain('useGatedMutation');
    expect(Object.keys(submitOnce)).not.toContain('useSubmitGate');
  });
});
