import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, registrations } from '@/api';
import { OWNS_UNAUTHORIZED, samePathOnly } from '@/app/session';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Field, fieldStyles, invalidProps } from '@/ui/Field';
import { AccountAlert, AccountLayout, AccountLink, accountStyles as styles } from './AccountLayout';
import { NEEDS_EMAIL_CONFIRMATION, NO_FAILURE, toAccountFailure, type AccountFailure } from './failure';

export const SESSION_ENDED = 'Your session has ended. Sign in again to continue.';

interface SignInState {
  from?: string;
  sessionEnded?: boolean;
}

export function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = (location.state ?? {}) as SignInState;
  const returnTo = samePathOnly(state.from) ?? '/overview';

  const { status } = useAccess();

  // The session, not the login response, decides when the app is in: the me request has to have
  // answered before a protected route will render. Arriving here with a session does the same.
  useEffect(() => {
    if (status === 'signed-in') navigate(returnTo, { replace: true });
  }, [status, navigate, returnTo]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [resent, setResent] = useState(false);

  const signIn = useMutation({
    // A 401 here is a wrong password, not an ended session: this request owns it.
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => auth.login({ email: email.trim(), password }),
    onSuccess: async () => {
      setFailure(NO_FAILURE);
      // Reset, not clear: clearing the whole cache from inside a mutation callback removes the
      // running mutation with it, and removing the me query orphans the observer the session
      // state reads. A reset empties every query and refetches the ones that are being watched,
      // so the provider learns about the new session through its own subscription.
      await queryClient.resetQueries();
    },
    onError: (error) => {
      setResent(false);
      setFailure(toAccountFailure(error));
    },
  });

  const resend = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => registrations.resendEmailConfirmation({ email: email.trim(), password }),
    onSuccess: () => setResent(true),
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (signIn.isPending) return;
    signIn.mutate();
  };

  const busy = signIn.isPending;

  return (
    <AccountLayout
      title="Sign in"
      intro="Use the email and password of your RW-Rent account."
      links={
        <>
          <AccountLink to="/reset-password" label="Forgot your password" />
          <AccountLink to="/register" label="Create an account" />
        </>
      }
    >
      {state.sessionEnded && !failure.message ? (
        <AccountAlert tone="warn">{SESSION_ENDED}</AccountAlert>
      ) : null}
      {resent ? (
        <AccountAlert tone="ok">
          If the account is waiting for confirmation, a new link is on its way to that address.
        </AccountAlert>
      ) : null}
      {failure.message ? (
        <AccountAlert tone="bad">
          {failure.message}
          {failure.code === NEEDS_EMAIL_CONFIRMATION ? (
            <>
              {' '}
              <button
                type="button"
                className={styles.linkButton}
                disabled={resend.isPending}
                onClick={() => resend.mutate()}
              >
                {resend.isPending ? 'Sending…' : 'Resend the confirmation email'}
              </button>
            </>
          ) : null}
        </AccountAlert>
      ) : null}

      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label="Email" required error={failure.fields.email}>
          <input
            className={fieldStyles.control}
            type="email"
            name="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...invalidProps(failure.fields.email)}
          />
        </Field>
        <Field label="Password" required error={failure.fields.password}>
          <input
            className={fieldStyles.control}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...invalidProps(failure.fields.password)}
          />
        </Field>
        <div className={styles.actions}>
          <Button label="Sign in" tone="primary" type="submit" block busy={busy} />
        </div>
      </form>
    </AccountLayout>
  );
}
