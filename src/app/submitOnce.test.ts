import { describe, expect, it, vi } from 'vitest';
import { createSubmitGate } from './submitOnce';

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
