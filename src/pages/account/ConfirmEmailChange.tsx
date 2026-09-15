import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { me as meApi, qk } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { useAccess } from '@/permissions/usePermissions';
import { AuthLayout, AuthOutcome } from './AuthLayout';
import { OUTCOMES } from './outcomes';
import { toAccountFailure, type AccountFailure } from './failure';
import { readTokenFromHash, stripHash } from './token';

/**
 * The link in the email-change confirmation. The endpoint lives under /api/me, so a signed-out
 * visitor is sent to the front door with this page as the return path — and the token, already
 * taken out of the address bar, is held in memory until they are back.
 *
 * The prototype's authentication family has no screen for this route; the three states below are
 * built from the vocabulary of its registration-confirmation screens.
 */
export function ConfirmEmailChange() {
  const { status } = useAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [done, setDone] = useState(false);
  const [token] = useState(() => readTokenFromHash(window.location.hash));
  const started = useRef(false);

  const confirm = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: (value: string) => meApi.confirmOwnEmailChange({ token: value }),
    onSuccess: async () => {
      setDone(true);
      await queryClient.invalidateQueries({ queryKey: qk.me });
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const { mutate } = confirm;
  useEffect(() => {
    stripHash();
    if (status !== 'signed-in' || started.current) return;
    started.current = true;
    if (token) mutate(token);
  }, [status, token, mutate]);

  useEffect(() => {
    if (status === 'signed-out') {
      navigate('/sign-in', { state: { from: '/confirm-email-change' }, replace: true });
    }
  }, [status, navigate]);

  const outcome = done
    ? OUTCOMES['email-change-done']
    : !token || failure
      ? OUTCOMES['email-change-bad']
      : OUTCOMES['email-change-checking'];

  return (
    <AuthLayout documentTitle={outcome.title}>
      <AuthOutcome
        outcome={outcome}
        {...(!done && failure?.code ? { meta: `code: ${failure.code}` } : {})}
      />
    </AuthLayout>
  );
}
