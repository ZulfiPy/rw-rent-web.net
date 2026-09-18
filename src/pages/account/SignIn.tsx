import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, registrations } from '@/api';
import { OWNS_UNAUTHORIZED, samePathOnly } from '@/app/session';
import { useGatedMutation } from '@/app/submitOnce';
import { useAccess } from '@/permissions/usePermissions';
import {
  AuthAlert, AuthField, AuthHeading, AuthLayout, AuthOutcome, AuthSubmit, AuthSwitch,
  authStyles as styles,
} from './AuthLayout';
import { OUTCOMES, signInOutcome, type OutcomeName } from './outcomes';
import { NEEDS_EMAIL_CONFIRMATION, NO_FAILURE, toAccountFailure, type AccountFailure } from './failure';

/** The prototype's own refusal when the form is submitted empty. */
const EMPTY_FORM: [string, string] = [
  'Enter your email and password',
  'Both fields are required before signing in.',
];

interface SignInState {
  from?: string;
  sessionEnded?: boolean;
}

/**
 * The prototype's `signin` screen, and the message screens the API's own refusals land on: an
 * account awaiting activation, a rejected or expired registration, a suspended account, a paused
 * location, and the session that ended while the person was working. A wrong password and an
 * unconfirmed email keep the form and are answered in its alert.
 */
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
  const [empty, setEmpty] = useState(false);
  const [outcome, setOutcome] = useState<OutcomeName | null>(
    state.sessionEnded ? 'session-expired' : null,
  );

  /*
   * Through the gated mutation, whose gate reopens when the request settles: a wrong password must
   * leave the form ready for the right one (the tester's T-008).
   */
  const signIn = useGatedMutation({
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
      const next = toAccountFailure(error);
      const screen = signInOutcome(next.status, next.code);
      if (screen) {
        setFailure(NO_FAILURE);
        setOutcome(screen);
        return;
      }
      setFailure(next);
    },
  });

  const resend = useGatedMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => registrations.resendEmailConfirmation({ email: email.trim(), password }),
    // What the prototype does when the resend screen succeeds: the registration-submitted screen.
    onSuccess: () => {
      setFailure(NO_FAILURE);
      setOutcome('register-submitted');
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (signIn.isPending) return;
    if (!email.trim() || !password) {
      setFailure(NO_FAILURE);
      setEmpty(true);
      return;
    }
    setEmpty(false);
    // The gate, not `isPending`, is what stops a second Enter inside the same tick (T-004).
    signIn.submit();
  };

  if (outcome) {
    return (
      <AuthLayout documentTitle={OUTCOMES[outcome].title}>
        <AuthOutcome
          outcome={OUTCOMES[outcome]}
          onAction={(to) => {
            if (to !== '/sign-in') return false;
            setOutcome(null);
            return true;
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout documentTitle="Sign in">
      <form className={styles.stack} onSubmit={submit} noValidate>
        <AuthHeading
          title="Sign in"
          body="Fleet and rental operations for RW-Rent. Your session stays signed in on this browser until it expires."
        />

        {empty ? <AuthAlert title={EMPTY_FORM[0]}>{EMPTY_FORM[1]}</AuthAlert> : null}
        {failure.message ? (
          <AuthAlert>
            {failure.message}
            {failure.code === NEEDS_EMAIL_CONFIRMATION ? (
              <>
                {' '}
                <button
                  type="button"
                  className={styles.textLink}
                  disabled={resend.isPending}
                  onClick={() => resend.submit()}
                >
                  {resend.isPending ? 'Sending…' : 'Resend the confirmation email'}
                </button>
              </>
            ) : null}
          </AuthAlert>
        ) : null}

        <div className={styles.fields}>
          <AuthField label="Email address" error={failure.fields['email']}>
            <input
              className={styles.input}
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-invalid={!!failure.fields['email']}
              aria-invalid={failure.fields['email'] ? true : undefined}
            />
          </AuthField>
          <AuthField
            label="Password"
            error={failure.fields['password']}
            action={<Link to="/reset-password" className={styles.textLink}>Forgot password?</Link>}
          >
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-invalid={!!failure.fields['password']}
              aria-invalid={failure.fields['password'] ? true : undefined}
            />
          </AuthField>
        </div>

        <div className={styles.actions}>
          <AuthSubmit
            label={signIn.isPending ? 'Signing in…' : 'Sign in'}
            icon="arrow_forward"
            busy={signIn.isPending}
          />
          <AuthSwitch text="No account yet?" label="Create one" to="/register" />
        </div>
      </form>
    </AuthLayout>
  );
}
