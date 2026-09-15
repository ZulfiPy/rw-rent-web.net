import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/api';
import { OWNS_UNAUTHORIZED, beginSignOut, endSignOut } from './session';

/**
 * Sign out (§6.5): the API clears the cookie — 204 even for a stale one — then the cache goes and
 * the app moves to the front door. No page reload: the app keeps its theme and rail preferences.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => {
      // The page's own queries refetch in a moment and answer 401. That is this sign-out, not a
      // session ending under the user, so the session-end signal stays down until we are away.
      beginSignOut();
      return auth.logout();
    },
    onSettled: async () => {
      // A reset empties every query and refetches the watched ones: the me probe answers 401 and
      // the app is signed out. Clearing the cache here would remove this mutation mid-callback.
      await queryClient.resetQueries();
      navigate('/sign-in', { replace: true });
      endSignOut();
    },
  });
}
