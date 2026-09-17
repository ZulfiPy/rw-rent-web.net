import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { registrations } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { AuthAlert, AuthLayout, AuthOutcome, ResetScreen } from './AuthLayout';
import { OUTCOMES } from './outcomes';
import { NO_FAILURE, toAccountFailure, type AccountFailure } from './failure';
import { useLinkToken } from './useLinkToken';

/**
 * The link in the registration email — the prototype's `confirm-checking`, `confirm-done` and
 * `confirm-bad` screens — and, under `?resend=1`, its `resend` screen, which is where the other
 * two send a person whose link no longer works.
 *
 * The token is read from the fragment and taken out of the address bar before anything is sent, so
 * a shared screenshot or a back-button visit no longer carries it. Another link arriving in this
 * same tab starts the screen over rather than leaving its old outcome in place (T-005).
 */
export function ConfirmRegistrationEmail() {
  const [params] = useSearchParams();
  const resending = params.get('resend') !== null;

  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState(false);
  const started = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Everything a finished screen is made of, so the next link is answered on its own merits.
  const [token] = useLinkToken(() => {
    setFailure(null);
    setDone(false);
    setSent(false);
    started.current = false;
  });

  const confirm = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: (value: string) => registrations.completeEmailConfirmation({ token: value }),
    onSuccess: () => setDone(true),
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const resend = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => registrations.resendEmailConfirmation({ email: email.trim(), password }),
    onSuccess: () => {
      setFailure(NO_FAILURE);
      setSent(true);
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const { mutate } = confirm;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (token && !resending) mutate(token);
  }, [token, resending, mutate]);

  // The prototype's resend screen answers with the registration-submitted screen.
  if (sent || done) {
    const outcome = done ? OUTCOMES['confirm-done'] : OUTCOMES['register-submitted'];
    return (
      <AuthLayout documentTitle={outcome.title}>
        <AuthOutcome outcome={outcome} />
      </AuthLayout>
    );
  }

  if (resending) {
    return (
      <AuthLayout documentTitle="Resend confirmation email">
        <ResetScreen
          title="Resend confirmation email"
          body="Enter the email and password you registered with. If the registration still needs confirming, a fresh link is sent."
          {...(failure?.message ? { alert: <AuthAlert>{failure.message}</AuthAlert> } : {})}
          email={{ value: email, onChange: setEmail, error: failure?.fields['email'] }}
          currentPassword={{
            label: 'Password',
            value: password,
            onChange: setPassword,
            error: failure?.fields['password'],
          }}
          cta="Resend link"
          busy={resend.isPending}
          onSubmit={() => resend.mutate()}
        />
      </AuthLayout>
    );
  }

  if (!token || failure) {
    return (
      <AuthLayout documentTitle="Confirmation link">
        <AuthOutcome
          outcome={OUTCOMES['confirm-bad']}
          {...(failure?.code ? { meta: `code: ${failure.code}` } : {})}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout documentTitle="Confirming your email">
      <AuthOutcome outcome={OUTCOMES['confirm-checking']} />
    </AuthLayout>
  );
}
