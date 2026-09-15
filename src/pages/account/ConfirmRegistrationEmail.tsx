import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registrations } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { AccountAlert, AccountLayout, AccountLink, accountStyles as styles } from './AccountLayout';
import { isExpiredLink, toAccountFailure, type AccountFailure } from './failure';
import { readTokenFromHash, stripHash } from './token';
import { ResendConfirmation } from './ResendConfirmation';

/**
 * The link in the registration email. The token is read once from the fragment and taken out of
 * the address bar; the page then confirms with it and shows what happened.
 */
export function ConfirmRegistrationEmail() {
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  const [token] = useState(() => readTokenFromHash(window.location.hash));

  const confirm = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: (value: string) => registrations.completeEmailConfirmation({ token: value }),
    onSuccess: () => setDone(true),
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const { mutate } = confirm;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    stripHash();
    if (token) mutate(token);
  }, [token, mutate]);

  if (done) {
    return (
      <AccountLayout
        title="Your email is confirmed"
        documentTitle="Email confirmed"
        links={<AccountLink to="/sign-in" label="Go to sign in" />}
      >
        <div className={styles.outcome}>
          <span data-icon aria-hidden="true" className={styles.outcomeIcon} data-tone="ok">mark_email_read</span>
          <p className={styles.outcomeBody}>
            An administrator activates the account before the workspace opens. You will be able to
            sign in once that is done.
          </p>
        </div>
      </AccountLayout>
    );
  }

  const unusable = !token || (failure && isExpiredLink(failure));

  if (unusable) {
    return (
      <AccountLayout
        title="That link cannot be used"
        intro="A confirmation link is valid once and for 24 hours. Ask for a new one below."
        documentTitle="Confirmation link"
        links={<AccountLink to="/sign-in" label="Back to sign in" />}
      >
        <ResendConfirmation />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="Confirming your email"
      documentTitle="Confirming your email"
      links={<AccountLink to="/sign-in" label="Back to sign in" />}
    >
      {failure?.message ? (
        <AccountAlert tone="bad">{failure.message}</AccountAlert>
      ) : (
        <p className={styles.outcomeBody}>One moment…</p>
      )}
    </AccountLayout>
  );
}
