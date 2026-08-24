import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldMessages, toFailure, type Failure } from '@/api/problem';
import { useReseed } from './reseed';

/**
 * One mutation, wired the way every dialog needs it: the rejection becomes a Failure (with the op's
 * code→field table applied), field messages are ready to hang under inputs, and a success
 * invalidates the affected caches before the dialog closes.
 */
export function useActionMutation<TVars>({ op, mutationFn, invalidate, onDone }: {
  op: string;
  mutationFn: (vars: TVars) => Promise<unknown>;
  invalidate: readonly (readonly unknown[])[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const reseed = useReseed();
  const [failure, setFailure] = useState<Failure | null>(null);

  const mutation = useMutation({
    mutationFn,
    onError: (error: unknown) => setFailure(toFailure(error, op)),
    onSuccess: async () => {
      setFailure(null);
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      onDone();
    },
  });

  return {
    submit: (vars: TVars) => {
      setFailure(null);
      mutation.mutate(vars);
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
