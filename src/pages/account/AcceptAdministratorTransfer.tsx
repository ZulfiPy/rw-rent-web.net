import { useState } from 'react';
import { systemAdministrator } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { useGatedMutation } from '@/app/submitOnce';
import { AuthAlert, AuthLayout, AuthOutcome, ResetScreen } from './AuthLayout';
import { OUTCOMES } from './outcomes';
import { NO_FAILURE, isExpiredLink, toAccountFailure, type AccountFailure } from './failure';
import { useLinkToken } from './useLinkToken';

/**
 * The prototype's `transfer-accept` screen. The link's token proves the invitation and the
 * account's own password proves the person; accepting ends the previous administrator's hold on
 * the role, so the screen sends them to sign in afterwards.
 *
 * The prototype's state also carries an email and a new-password field. The endpoint takes the
 * token and the existing password and nothing else, so neither is shown here.
 *
 * Another link arriving in this same tab starts the screen over rather than leaving its old
 * outcome in place (T-005); the password is cleared with it, because a second invitation may well
 * be for a different account.
 */
export function AcceptAdministratorTransfer() {
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [done, setDone] = useState(false);
  const { token } = useLinkToken(() => {
    setPassword('');
    setFailure(NO_FAILURE);
    setDone(false);
  });

  // A wrong password must leave the screen ready for the right one (T-008).
  const accept = useGatedMutation({
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
      <AuthLayout documentTitle="Transfer accepted">
        <AuthOutcome outcome={OUTCOMES['transfer-accepted']} />
      </AuthLayout>
    );
  }

  if (!token || isExpiredLink(failure)) {
    return (
      <AuthLayout documentTitle="Administrator transfer">
        <AuthOutcome
          outcome={OUTCOMES['transfer-bad']}
          {...(failure.code ? { meta: `code: ${failure.code}` } : {})}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout documentTitle="Accept System Administrator role">
      <ResetScreen
        title="Accept System Administrator role"
        body="You have been named as the next System Administrator. Confirm with your existing account password."
        {...(failure.message ? { alert: <AuthAlert>{failure.message}</AuthAlert> } : {})}
        currentPassword={{
          label: 'Your existing account password',
          hint: 'Accepting the transfer requires the password of the account named in the invitation email.',
          value: password,
          onChange: setPassword,
          error: failure.fields['password'],
        }}
        hasToken
        cta="Accept transfer"
        busy={accept.isPending}
        onSubmit={() => accept.submit()}
      />
    </AuthLayout>
  );
}
