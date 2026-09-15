import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { me as meApi, qk } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { useAccess } from '@/permissions/usePermissions';
import { AccountAlert, AccountLayout, accountStyles as styles } from './AccountLayout';
import { isExpiredLink, toAccountFailure, type AccountFailure } from './failure';
import { readTokenFromHash, stripHash } from './token';

/**
 * The link in the email-change confirmation. The endpoint lives under /api/me, so a signed-out
 * visitor is sent to the front door with this page as the return path — and the token, already
 * taken out of the address bar, is held in memory until they are back.
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

  if (done) {
    return (
      <AccountLayout
        title="Your email is changed"
        documentTitle="Email changed"
        links={<Link className={styles.link} to="/profile">Go to your profile</Link>}
      >
        <div className={styles.outcome}>
          <span data-icon aria-hidden="true" className={styles.outcomeIcon} data-tone="ok">mark_email_read</span>
          <p className={styles.outcomeBody}>
            Sign in with the new address from now on. Every other session was signed out.
          </p>
        </div>
      </AccountLayout>
    );
  }

  if (!token || (failure && isExpiredLink(failure))) {
    return (
      <AccountLayout
        title="That link cannot be used"
        intro="A confirmation link is valid once and for a limited time. Request the change again from your profile."
        documentTitle="Email change"
        links={<Link className={styles.link} to="/profile">Go to your profile</Link>}
      />
    );
  }

  return (
    <AccountLayout
      title="Confirming your new email"
      documentTitle="Confirming your new email"
      links={<Link className={styles.link} to="/profile">Go to your profile</Link>}
    >
      {failure?.message ? (
        <AccountAlert tone="bad">{failure.message}</AccountAlert>
      ) : (
        <p className={styles.outcomeBody}>One moment…</p>
      )}
    </AccountLayout>
  );
}
