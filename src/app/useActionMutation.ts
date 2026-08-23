import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldMessages, toFailure, type Failure } from '@/api/problem';

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
    /** The stale banner's Refresh: reload what the dialog is editing, keep the dialog open. */
    refresh: () => {
      setFailure(null);
      void Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  };
}
