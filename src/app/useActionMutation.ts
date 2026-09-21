import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fieldMessages, toFailure, type Failure } from '@/api/problem';
import { useReseed } from './reseed';
import { useGatedMutation } from './submitOnce';

/**
 * One mutation, wired the way every dialog needs it: the rejection becomes a Failure (with the op's
 * code→field table applied), field messages are ready to hang under inputs, and a success
 * invalidates the affected caches before the dialog closes.
 *
 * Every dialog submission in the app comes through here, so this is where one submission at a time
 * is enforced (the tester's T-004), through the same `useGatedMutation` every other form uses.
 * `busy` is still what the dialog renders; the gate is what actually decides, because it closes
 * before React re-renders and `isPending` does not.
 */
export function useActionMutation<TVars>({ op, mutationFn, invalidate, onDone, refusal }: {
  op: string;
  mutationFn: (vars: TVars) => Promise<unknown>;
  invalidate: readonly (readonly unknown[])[];
  onDone: () => void;
  /**
   * A dialog's own reading of a refusal, tried before the shared one. The Delete records dialog
   * shows a record that became blocked or left the list the way a concurrency conflict is shown,
   * with Refresh (Follow-up 8); null leaves the refusal to `toFailure`.
   */
  refusal?: (error: unknown) => Failure | null;
}) {
  const queryClient = useQueryClient();
  const reseed = useReseed();
  const [failure, setFailure] = useState<Failure | null>(null);

  // The gate reopens in the hook's own onSettled, a refusal as much as a success, or the dialog
  // could never retry.
  const mutation = useGatedMutation({
    mutationFn,
    onError: (error: unknown) => setFailure(refusal?.(error) ?? toFailure(error, op)),
    onSuccess: async () => {
      setFailure(null);
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      onDone();
    },
  });

  return {
    submit: (vars: TVars) => {
      const sent = mutation.submit(vars);
      // Batched with the send's own render, exactly as when it was cleared before it.
      if (sent) setFailure(null);
      return sent;
    },
    busy: mutation.isPending,
    failure,
    fields: failure ? fieldMessages(failure) : {},
    /**
     * The stale banner's Refresh: reload what the dialog is editing, keep the dialog open, and
     * re-seed it from what came back. The refetch is awaited before the remount, so the inputs are
     * built from the fresh record rather than the copy the refusal was raised against.
     */
    refresh: () => {
      void (async () => {
        // allSettled, not all: a refetch that itself fails must not leave the dialog stuck on the
        // stale banner with the typed values still in place.
        await Promise.allSettled(invalidate.map((queryKey) => queryClient.refetchQueries({ queryKey })));
        setFailure(null);
        reseed();
      })();
    },
  };
}
