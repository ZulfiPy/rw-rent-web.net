import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registrations } from '@/api';
import { OWNS_UNAUTHORIZED } from '@/app/session';
import { useSubmitGate } from '@/app/submitOnce';
import {
  AuthAlert, AuthField, AuthHeading, AuthLayout, AuthOutcome, AuthSubmit, AuthSwitch,
  PasswordChecklist, authStyles as styles,
} from './AuthLayout';
import { OUTCOMES } from './outcomes';
import { EMAIL_INVALID, PASSWORD_NOT_MET, emailLooksValid, passwordMeetsRules } from './password';
import { NO_FAILURE, toAccountFailure, type AccountFailure } from './failure';

/**
 * The prototype's `register` screen. It checks the address and the password rules before it sends,
 * exactly as the prototype does, and answers with the registration-submitted screen whatever the
 * API knows about the address — the endpoint never says whether one is already registered.
 */
export function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [local, setLocal] = useState<{ email?: string; password?: string }>({});
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

  const gate = useSubmitGate();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (register.isPending) return;
    const errors: { email?: string; password?: string } = {};
    if (!emailLooksValid(email.trim())) errors.email = EMAIL_INVALID;
    if (!passwordMeetsRules(password)) errors.password = PASSWORD_NOT_MET;
    setLocal(errors);
    if (errors.email || errors.password) return;
    setFailure(NO_FAILURE);
    // The gate, not `isPending`, is what stops a second Enter inside the same tick (T-004).
    gate.attempt(() => register.mutate());
  };

  if (submitted) {
    return (
      <AuthLayout documentTitle="Confirm your email">
        <AuthOutcome outcome={OUTCOMES['register-submitted']} />
      </AuthLayout>
    );
  }

  const emailError = local.email ?? failure.fields['email'];
  const passwordError = local.password ?? failure.fields['password'];

  return (
    <AuthLayout documentTitle="Create account">
      <form className={styles.stack} data-gap="24" onSubmit={submit} noValidate>
        <AuthHeading
          title="Create account"
          body="Registration confirms your email first. An administrator then activates your access."
        />

        {failure.message ? <AuthAlert>{failure.message}</AuthAlert> : null}

        <div className={styles.fields} data-gap="15">
          <div className={styles.names}>
            <AuthField label="First name" required error={failure.fields['firstName']}>
              <input
                className={styles.input}
                autoComplete="given-name"
                maxLength={100}
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-invalid={!!failure.fields['firstName']}
                aria-invalid={failure.fields['firstName'] ? true : undefined}
              />
            </AuthField>
            <AuthField label="Last name" required error={failure.fields['lastName']}>
              <input
                className={styles.input}
                autoComplete="family-name"
                maxLength={100}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-invalid={!!failure.fields['lastName']}
                aria-invalid={failure.fields['lastName'] ? true : undefined}
              />
            </AuthField>
          </div>

          <AuthField label="Phone number" required error={failure.fields['phoneNumber']}>
            <input
              className={styles.input}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={30}
              placeholder="+371 20 000 000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              data-invalid={!!failure.fields['phoneNumber']}
              aria-invalid={failure.fields['phoneNumber'] ? true : undefined}
            />
          </AuthField>

          <AuthField label="Email address" required error={emailError}>
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-invalid={!!emailError}
              aria-invalid={emailError ? true : undefined}
            />
          </AuthField>

          <AuthField label="Password" required error={passwordError}>
            <input
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-invalid={!!passwordError}
              aria-invalid={passwordError ? true : undefined}
            />
            <PasswordChecklist value={password} />
          </AuthField>
        </div>

        <div className={styles.actions}>
          <AuthSubmit label="Create account" busy={register.isPending} />
          <AuthSwitch text="Already registered?" label="Sign in" to="/sign-in" />
        </div>
      </form>
    </AuthLayout>
  );
}
