import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registrations } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { Button } from '@/ui/Button';
import { Field, fieldStyles, invalidProps } from '@/ui/Field';
import { AccountAlert, accountStyles as styles } from './AccountLayout';
import { NO_FAILURE, toAccountFailure, type AccountFailure } from './failure';

/**
 * Sending the confirmation email again. The API answers 202 whatever the account's state, so the
 * outcome is the same neutral sentence either way — it never says whether an address is known.
 * The password proves the request comes from the person who registered.
 */
export function ResendConfirmation({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [sent, setSent] = useState(false);

  const resend = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => registrations.resendEmailConfirmation({ email: email.trim(), password }),
    onSuccess: () => {
      setFailure(NO_FAILURE);
      setSent(true);
    },
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!resend.isPending) resend.mutate();
  };

  if (sent) {
    return (
      <AccountAlert tone="ok">
        If the account is waiting for confirmation, a new link is on its way to that address.
      </AccountAlert>
    );
  }

  return (
    <>
      {failure.message ? <AccountAlert tone="bad">{failure.message}</AccountAlert> : null}
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label="Email" required error={failure.fields.email}>
          <input
            className={fieldStyles.control}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...invalidProps(failure.fields.email)}
          />
        </Field>
        <Field
          label="Password"
          required
          hint="The password you chose when registering."
          error={failure.fields.password}
        >
          <input
            className={fieldStyles.control}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...invalidProps(failure.fields.password)}
          />
        </Field>
        <div className={styles.actions}>
          <Button label="Send the link again" type="submit" busy={resend.isPending} />
        </div>
      </form>
    </>
  );
}
