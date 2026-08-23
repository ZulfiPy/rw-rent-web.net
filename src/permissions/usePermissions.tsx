import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { getCurrentUser } from '@/api/me';
import type { CurrentUserResponse } from '@/api/dto';
import { CAN_NOTHING, createCan, type Can } from './can';

interface Access {
  me: CurrentUserResponse | undefined;
  can: Can;
  isLoading: boolean;
}

const AccessContext = createContext<Access>({ me: undefined, can: CAN_NOTHING, isLoading: true });

export function AccessProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({ queryKey: qk.me, queryFn: getCurrentUser, staleTime: 60_000 });
  const value = useMemo<Access>(
    () => ({ me: data, can: data ? createCan(data.permissions) : CAN_NOTHING, isLoading }),
    [data, isLoading],
  );
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export const useAccess = () => useContext(AccessContext);
export const useCan = () => useContext(AccessContext).can;
