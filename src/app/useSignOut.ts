import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/api';
import { OWNS_UNAUTHORIZED } from './session';

/**
 * Sign out (§6.5): the API clears the cookie — 204 even for a stale one — then the cache goes and
 * the app moves to the front door. No page reload: the app keeps its theme and rail preferences.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => auth.logout(),
    onSettled: async () => {
      // A reset empties every query and refetches the watched ones: the me probe answers 401 and
      // the app is signed out. Clearing the cache here would remove this mutation mid-callback.
      await queryClient.resetQueries();
      navigate('/sign-in', { replace: true });
    },
  });
}
