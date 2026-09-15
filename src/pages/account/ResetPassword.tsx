import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { auth } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { Button } from '@/ui/Button';
import { Field, fieldStyles, invalidProps } from '@/ui/Field';
import { AccountAlert, AccountLayout, AccountLink, accountStyles as styles } from './AccountLayout';
import { PASSWORD_POLICY } from './Register';
import { NO_FAILURE, isExpiredLink, toAccountFailure, type AccountFailure } from './failure';
import { readTokenFromHash, stripHash } from './token';

/**
 * Two screens behind one route, as the emailed link expects: without a token it asks for the
 * address; with one it sets the new password. The API takes the address on both halves, so the
 * second form asks for it as well rather than guessing it from the token.
 */
export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [mismatch, setMismatch] = useState<string | undefined>(undefined);
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [requested, setRequested] = useState(false);

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

  const [changed, setChanged] = useState(false);

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
      <AccountLayout
        title="Your password is changed"
        documentTitle="Password changed"
        links={<AccountLink to="/sign-in" label="Go to sign in" />}
      >
        <div className={styles.outcome}>
          <span data-icon aria-hidden="true" className={styles.outcomeIcon} data-tone="ok">lock_reset</span>
          <p className={styles.outcomeBody}>
            Every other session was signed out. Sign in again with the new password.
          </p>
        </div>
      </AccountLayout>
    );
  }

  if (requested) {
    return (
      <AccountLayout
        title="Check your email"
        intro="If the address is known, an email with a link is on its way. The link is valid for one hour."
        documentTitle="Check your email"
        links={<AccountLink to="/sign-in" label="Back to sign in" />}
      >
        <AccountAlert tone="info">
          Nothing changes until the link is opened and a new password is set.
        </AccountAlert>
      </AccountLayout>
    );
  }

  const expired = isExpiredLink(failure);

  // With a usable token: the new password. Without one, or once it is refused: the request form.
  if (token && !expired) {
    const submit = (event: FormEvent) => {
      event.preventDefault();
      if (complete.isPending) return;
      if (password !== confirmation) {
        setMismatch('The two passwords are different.');
        return;
      }
      setMismatch(undefined);
      setFailure(NO_FAILURE);
      complete.mutate();
    };

    return (
      <AccountLayout
        title="Set a new password"
        intro="Use the address the link was sent to, then choose the new password."
        documentTitle="Set a new password"
        links={<AccountLink to="/sign-in" label="Back to sign in" />}
      >
        {failure.message ? <AccountAlert tone="bad">{failure.message}</AccountAlert> : null}
        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label="Email" required error={failure.fields.email}>
            <input
              className={fieldStyles.control}
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              {...invalidProps(failure.fields.email)}
            />
          </Field>
          <Field label="New password" required hint={PASSWORD_POLICY} error={failure.fields.newPassword}>
            <input
              className={fieldStyles.control}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...invalidProps(failure.fields.newPassword)}
            />
          </Field>
          <Field label="Repeat the new password" required error={mismatch}>
            <input
              className={fieldStyles.control}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              {...invalidProps(mismatch)}
            />
          </Field>
          <div className={styles.actions}>
            <Button label="Change the password" tone="primary" type="submit" busy={complete.isPending} />
          </div>
        </form>
      </AccountLayout>
    );
  }

  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    if (!request.isPending) request.mutate();
  };

  return (
    <AccountLayout
      title="Reset your password"
      intro="Give the address of your account and we will send a link for setting a new password."
      documentTitle="Reset your password"
      links={<AccountLink to="/sign-in" label="Back to sign in" />}
    >
      {expired ? (
        <AccountAlert tone="warn" title="That link cannot be used">
          A reset link is valid once and for one hour. Ask for a new one below.
        </AccountAlert>
      ) : failure.message ? (
        <AccountAlert tone="bad">{failure.message}</AccountAlert>
      ) : null}
      <form className={styles.form} onSubmit={submitRequest} noValidate>
        <Field label="Email" required error={failure.fields.email}>
          <input
            className={fieldStyles.control}
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...invalidProps(failure.fields.email)}
          />
        </Field>
        <div className={styles.actions}>
          <Button label="Send the link" tone="primary" type="submit" busy={request.isPending} />
        </div>
      </form>
    </AccountLayout>
  );
}
