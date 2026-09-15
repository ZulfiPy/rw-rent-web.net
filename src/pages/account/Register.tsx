import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registrations } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { Button } from '@/ui/Button';
import { Field, fieldStyles, invalidProps } from '@/ui/Field';
import { AccountAlert, AccountLayout, AccountLink, accountStyles as styles } from './AccountLayout';
import { NO_FAILURE, toAccountFailure, type AccountFailure } from './failure';
import { ResendConfirmation } from './ResendConfirmation';

/**
 * What the API enforces: twelve characters, an uppercase letter, a digit and a symbol, and the
 * password must not be a commonly used one. Spaces are allowed but do not count as the symbol.
 */
export const PASSWORD_POLICY =
  'At least 12 characters with an uppercase letter, a digit and a symbol. Spaces are allowed.';

export function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [mismatch, setMismatch] = useState<string | undefined>(undefined);
  const [failure, setFailure] = useState<AccountFailure>(NO_FAILURE);
  const [submitted, setSubmitted] = useState(false);

  const register = useMutation({
    meta: OWNS_UNAUTHORIZED,
    mutationFn: () => registrations.register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      password,
    }),
    onSuccess: () => setSubmitted(true),
    onError: (error) => setFailure(toAccountFailure(error)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (register.isPending) return;
    if (password !== confirmation) {
      setMismatch('The two passwords are different.');
      return;
    }
    setMismatch(undefined);
    setFailure(NO_FAILURE);
    register.mutate();
  };

  if (submitted) {
    return (
      <AccountLayout
        title="Check your email"
        intro={`If ${email.trim()} can be registered, a confirmation link is on its way. The link is valid for 24 hours.`}
        documentTitle="Check your email"
        links={<AccountLink to="/sign-in" label="Back to sign in" />}
      >
        <AccountAlert tone="info">
          Confirming your email does not open the workspace on its own. An administrator activates
          the account afterwards.
        </AccountAlert>
        <ResendConfirmation initialEmail={email.trim()} />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="Create an account"
      intro="Register with your work details. An administrator reviews the account before it opens."
      links={<AccountLink to="/sign-in" label="Back to sign in" />}
    >
      {failure.message ? <AccountAlert tone="bad">{failure.message}</AccountAlert> : null}

      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label="First name" required error={failure.fields.firstName}>
          <input
            className={fieldStyles.control}
            name="given-name"
            autoComplete="given-name"
            autoFocus
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            {...invalidProps(failure.fields.firstName)}
          />
        </Field>
        <Field label="Last name" required error={failure.fields.lastName}>
          <input
            className={fieldStyles.control}
            name="family-name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            {...invalidProps(failure.fields.lastName)}
          />
        </Field>
        <Field label="Phone number" required error={failure.fields.phoneNumber}>
          <input
            className={fieldStyles.control}
            name="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            {...invalidProps(failure.fields.phoneNumber)}
          />
        </Field>
        <Field label="Email" required error={failure.fields.email}>
          <input
            className={fieldStyles.control}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...invalidProps(failure.fields.email)}
          />
        </Field>
        <Field label="Password" required hint={PASSWORD_POLICY} error={failure.fields.password}>
          <input
            className={fieldStyles.control}
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...invalidProps(failure.fields.password)}
          />
        </Field>
        <Field label="Repeat the password" required error={mismatch}>
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
          <Button label="Create account" tone="primary" type="submit" busy={register.isPending} />
        </div>
      </form>
    </AccountLayout>
  );
}
