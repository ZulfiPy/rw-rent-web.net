import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isApiError, qk } from '@/api';
import { getCurrentUser } from '@/api/me';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import type { CurrentUserResponse } from '@/api/dto';
import { CAN_NOTHING, createCan, type Can } from './can';

/**
 * `loading` while the me request is in flight, `signed-in` once it answers, `signed-out` when it
 * answers 401. `unreachable` is the fourth honest outcome: the API did not answer at all, which is
 * neither a session nor the absence of one.
 */
export type SessionStatus = 'loading' | 'signed-in' | 'signed-out' | 'unreachable';

interface Access {
  me: CurrentUserResponse | undefined;
  can: Can;
  status: SessionStatus;
  /** What went wrong when the status is `unreachable`. */
  error: string | undefined;
}

const AccessContext = createContext<Access>({
  me: undefined,
  can: CAN_NOTHING,
  status: 'loading',
  error: undefined,
});

export function AccessProvider({ children }: { children: ReactNode }) {
  // The me request owns its 401: it is how the app learns it is signed out, not a session ending.
  const { data, error, isPending } = useQuery({
    queryKey: qk.me,
    queryFn: getCurrentUser,
    staleTime: 60_000,
    retry: false,
    meta: OWNS_UNAUTHORIZED,
  });

  const value = useMemo<Access>(() => {
    const status: SessionStatus = isPending
      ? 'loading'
      : data
        ? 'signed-in'
        : isApiError(error) && error.status === 401
          ? 'signed-out'
          : error
            ? 'unreachable'
            : 'signed-out';
    return {
      me: data,
      can: data ? createCan(data.permissions) : CAN_NOTHING,
      status,
      error: status === 'unreachable' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
    };
  }, [data, error, isPending]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export const useAccess = () => useContext(AccessContext);
export const useCan = () => useContext(AccessContext).can;
