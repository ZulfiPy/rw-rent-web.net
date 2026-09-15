import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { systemAdministrator } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { Button } from '@/ui/Button';
import { Field, fieldStyles, invalidProps } from '@/ui/Field';
import { AccountAlert, AccountLayout, AccountLink, accountStyles as styles } from './AccountLayout';
import { NO_FAILURE, isExpiredLink, toAccountFailure, type AccountFailure } from './failure';
import { readTokenFromHash, stripHash } from './token';

/**
 * Accepting the System Administrator role. The link's token proves the invitation; the account's
 * own password proves the person. Accepting activates the account and ends the previous
 * administrator's hold on the role, so the page sends them to sign in afterwards.
 */
export function AcceptAdministratorTransfer() {
  const [token, setToken] = useState<string | null>(null);
  const read = useRef(false);
  useEffect(() => {
    if (read.current) return;
    read.current = true;
    setToken(readTokenFromHash(window.location.hash));
    stripHash();
  }, []);

  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [done, setDone] = useState(false);

  const accept = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => systemAdministrator.acceptTransfer({ token: token ?? '', password }),
    onSuccess: () => {
      setFailure(NO_FAILURE);
      setDone(true);
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  if (done) {
    return (
      <AccountLayout
        title="You are now the System Administrator"
        documentTitle="Transfer accepted"
        links={<AccountLink to="/sign-in" label="Go to sign in" />}
      >
        <div className={styles.outcome}>
          <span data-icon aria-hidden="true" className={styles.outcomeIcon} data-tone="ok">admin_panel_settings</span>
          <p className={styles.outcomeBody}>
            Sign in to continue. The account that held the role before no longer has it.
          </p>
        </div>
      </AccountLayout>
    );
  }

  if (!token || isExpiredLink(failure)) {
    return (
      <AccountLayout
        title="That link cannot be used"
        intro="A transfer link is valid once and for a limited time. The administrator who sent it can issue a new one."
        documentTitle="Administrator transfer"
        links={<AccountLink to="/sign-in" label="Back to sign in" />}
      />
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!accept.isPending) accept.mutate();
  };

  return (
    <AccountLayout
      title="Accept the administrator role"
      intro="Confirm with your own password. Accepting makes this account the System Administrator."
      documentTitle="Accept the administrator role"
      links={<AccountLink to="/sign-in" label="Back to sign in" />}
    >
      {failure.message ? <AccountAlert tone="bad">{failure.message}</AccountAlert> : null}
      <AccountAlert tone="warn">
        The role belongs to one account at a time. The administrator who sent this link loses it the
        moment you accept.
      </AccountAlert>
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label="Your password" required error={failure.fields.password}>
          <input
            className={fieldStyles.control}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...invalidProps(failure.fields.password)}
          />
        </Field>
        <div className={styles.actions}>
          <Button label="Accept the role" tone="primary" type="submit" busy={accept.isPending} />
        </div>
      </form>
    </AccountLayout>
  );
}
