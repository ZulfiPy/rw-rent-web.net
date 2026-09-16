import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { auth } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { AuthAlert, AuthLayout, AuthOutcome, ResetScreen } from './AuthLayout';
import { OUTCOMES } from './outcomes';
import { NO_FAILURE, isExpiredLink, toAccountFailure, type AccountFailure } from './failure';
import { readTokenFromHash, stripHash } from './token';

/** The prototype's note under the address, on these two screens only (owner decision, 2026-09-16). */
const RESET_NOTE = 'The reset must be completed with the address the link was sent to.';

/**
 * The prototype's `forgot` and `reset` screens behind one route, as the emailed link expects:
 * without a token it asks for the address, with one it sets the new password. The prototype's
 * reset screen asks for the address on both halves, which is also what the API requires of the
 * completing call.
 */
export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [requested, setRequested] = useState(false);
  const [changed, setChanged] = useState(false);

  /*
   * The token is read from the fragment whenever one arrives, not only on the first render: a
   * person who asked for the link with this tab open and then clicked it lands on the same page.
   */
  const { hash } = useLocation();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const found = readTokenFromHash(hash || window.location.hash);
    if (!found) return;
    setToken(found);
    setRequested(false);
    stripHash();
  }, [hash]);

  const request = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => auth.requestPasswordReset({ email: email.trim() }),
    onSuccess: () => {
      setFailure(NO_FAILURE);
      setRequested(true);
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const complete = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => auth.completePasswordReset({
      email: email.trim(),
      token: token ?? '',
      newPassword: password,
    }),
    onSuccess: () => {
      setFailure(NO_FAILURE);
      setChanged(true);
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  if (changed) {
    return (
      <AuthLayout documentTitle="Password changed">
        <AuthOutcome outcome={OUTCOMES['password-changed']} />
      </AuthLayout>
    );
  }

  if (requested) {
    return (
      <AuthLayout documentTitle="Check your email">
        <AuthOutcome outcome={OUTCOMES['forgot-sent']} />
      </AuthLayout>
    );
  }

  // A refused token is the prototype's `reset-bad`; its first action comes back to this page.
  if (token && isExpiredLink(failure)) {
    return (
      <AuthLayout documentTitle="Reset link">
        <AuthOutcome
          outcome={OUTCOMES['reset-bad']}
          {...(failure.code ? { meta: `code: ${failure.code}` } : {})}
          onAction={(to) => {
            if (to !== '/reset-password') return false;
            setToken(null);
            setPassword('');
            setFailure(NO_FAILURE);
            return true;
          }}
        />
      </AuthLayout>
    );
  }

  if (token) {
    return (
      <AuthLayout documentTitle="Set a new password">
        <ResetScreen
          title="Set a new password"
          body="Completing the reset needs the account email, the link token and your new password."
          {...(failure.message ? { alert: <AuthAlert>{failure.message}</AuthAlert> } : {})}
          email={{ value: email, onChange: setEmail, error: failure.fields['email'], note: RESET_NOTE }}
          newPassword={{
            value: password,
            onChange: setPassword,
            error: failure.fields['newPassword'],
          }}
          hasToken
          cta="Change password"
          busy={complete.isPending}
          onSubmit={() => complete.mutate()}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout documentTitle="Reset your password">
      <ResetScreen
        title="Reset your password"
        body="Enter the email address on your account. We will send a single-use reset link."
        {...(failure.message ? { alert: <AuthAlert>{failure.message}</AuthAlert> } : {})}
        email={{ value: email, onChange: setEmail, error: failure.fields['email'], note: RESET_NOTE }}
        cta="Send reset link"
        busy={request.isPending}
        onSubmit={() => request.mutate()}
      />
    </AuthLayout>
  );
}
