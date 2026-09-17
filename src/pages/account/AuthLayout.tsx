import { useEffect, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { themeIcon, themeLabel, themeTip, toggleTheme, useTheme } from '@/app/theme';
import { useSubmitGate } from '@/app/submitOnce';
import { passwordRules } from './password';
import type { Outcome } from './outcomes';
import styles from './Auth.module.css';

export { styles as authStyles };

const LOGO_UPPER = 'M936.6,846.6l-68.2-58.4l62.6-11.9c5.8-1.1,10-6.2,10-12V204.1c0-4.9-2.9-9.3-7.4-11.3c-4.5-1.9-9.7-1-13.3,2.4l-442.3,424c-2.4,2.3-3.8,5.5-3.8,8.8v367.1c0,3.3,1.3,6.3,3.6,8.6l70.1,70.4c3.5,3.5,8.7,4.6,13.3,2.7c4.6-1.9,7.6-6.3,7.6-11.3l0.3-416.6l282.7-268.4v310.8L698,747.7c-4.2,1.5-7.2,5.2-7.9,9.6s1,8.8,4.5,11.5l151.7,120v344.4c0,3.5,1.5,6.8,4.1,9.2l70.1,62.1c2.3,2,5.2,3.1,8.1,3.1c1.7,0,3.4-0.4,5.1-1.1c4.4-2,7.2-6.3,7.2-11.2l0-439.5C940.9,852.3,939.3,848.9,936.6,846.6z';
const LOGO_LOWER = 'M1521.1,595.6c-3.9-3-9-3.4-13.3-1.1l-76.5,41.3c-3,1.6-5.2,4.4-6,7.7l-60,227.9l-140.7-194.2c-2.6-3.5-6.7-5.4-11-5c-4.3,0.4-8,3-9.9,6.9l-138.7,288.6V283c0-2.8-1-5.5-2.7-7.7l-59.3-73.2c-3.3-4.1-8.6-5.6-13.6-3.8c-5,1.8-8.2,6.3-8.2,11.5v1086.2c0,5.8,4,10.7,9.6,11.9c0.9,0.2,1.8,0.3,2.7,0.3c4.7,0,9-2.7,11.1-7.1l221.3-479l171.1,239c2.8,4,7.5,5.8,12.3,4.9c4.8-0.9,8.4-4.5,9.5-9.2l106.8-448.6C1526.7,603.4,1525,598.6,1521.1,595.6z';

const MONOGRAM = (x: number, y: number) => (
  <g transform={`translate(${x},${y}) scale(0.0258) translate(-470,-187)`}>
    <path d={LOGO_UPPER} />
    <path d={LOGO_LOWER} />
  </g>
);

/** The art panel's pattern: the monogram twice per 84×74 tile, at a fifth opacity. */
function MonogramPattern() {
  return (
    <svg aria-hidden="true" className={styles.pattern}>
      <defs>
        <pattern id="rwMonogram" width="84" height="74" patternUnits="userSpaceOnUse">
          <g style={{ fill: 'var(--fg-3)' }}>
            {MONOGRAM(11, 7)}
            {MONOGRAM(53, 44)}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rwMonogram)" />
    </svg>
  );
}

/**
 * The split page of the prototype's authentication family: the form column on the rail's grid,
 * with the wordmark and the theme toggle above it and the platform line below, and the monogram
 * art beside it from 1024 up. Every public screen renders inside it.
 */
export function AuthLayout({ documentTitle, children }: { documentTitle: string; children: ReactNode }) {
  const theme = useTheme();

  useEffect(() => {
    const previous = document.title;
    document.title = `${documentTitle} · RW-Rent`;
    return () => { document.title = previous; };
  }, [documentTitle]);

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <div className={styles.head}>
          <div className={styles.brand}>
            <svg viewBox="470 187 1060 1125" role="img" aria-label="RW-Rent" className={styles.logo}>
              <path d={LOGO_UPPER} />
              <path d={LOGO_LOWER} />
            </svg>
            <span className={styles.mark}>RW-Rent</span>
          </div>
          <button
            type="button"
            className={styles.theme}
            onClick={toggleTheme}
            aria-label={themeTip(theme)}
            title={themeTip(theme)}
          >
            <span data-icon aria-hidden="true" className={styles.themeIcon}>{themeIcon(theme)}</span>
            <span className={styles.themeLabel}>{themeLabel(theme)}</span>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.screen}>{children}</div>
        </div>

        <div className={styles.foot}>
          <span>RW-Rent operations platform</span>
          <span aria-hidden="true" className={styles.footDot} />
          <span className={styles.footVersion}>v1.0.0</span>
          <span aria-hidden="true" className={styles.footDot} />
          <span>Sessions expire after 2 h idle, 12 h absolute</span>
        </div>
      </div>

      <div className={styles.art} aria-hidden="true">
        <MonogramPattern />
        <div className={styles.artFade} />
        <div className={styles.artText}>
          <div className={styles.artKicker}>
            <div className={styles.artRule} />
            <span className={styles.artLabel}>Track · Manage · Grow</span>
          </div>
          <p className={styles.artLine}>Control at every turn.</p>
        </div>
      </div>
    </main>
  );
}

/** The screen's title and its one explanatory line. The prototype sizes it per screen. */
export function AuthHeading({ title, body, size }: { title: string; body: string; size?: '21' | '22' }) {
  return (
    <div className={styles.heading} data-gap={size === '21' ? '10' : undefined}>
      <h1 className={styles.title} data-size={size}>{title}</h1>
      <p className={styles.intro}>{body}</p>
    </div>
  );
}

/**
 * The refusal shown beside the form. The prototype's block has a bold line and an explanation; the
 * API answers with one sentence, so a screen that has only that renders it as the explanation.
 */
export function AuthAlert({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div role="alert" className={styles.alert}>
      <span data-icon aria-hidden="true" className={styles.alertIcon}>error</span>
      <div className={styles.alertBody}>
        {title ? <div className={styles.alertTitle}>{title}</div> : null}
        <div className={styles.alertText}>{children}</div>
      </div>
    </div>
  );
}

/** Label, control and — when the API refused this input — its message underneath. */
export function AuthField({ label, required, hint, error, action, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | undefined;
  /** The prototype's "Forgot password?" button, on the label's own row. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const head = (
    <>
      <span>{label}</span>
      {required ? <span className={styles.required}> · required</span> : null}
    </>
  );
  return (
    <label className={styles.field}>
      {action ? (
        <span className={styles.labelRow}><span>{head}</span>{action}</span>
      ) : (
        <span className={styles.label}>{head}</span>
      )}
      {children}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      {error ? (
        <span role="alert" className={styles.fieldError}>
          <span data-icon aria-hidden="true" className={styles.fieldErrorIcon}>error</span>
          <span>{error}</span>
        </span>
      ) : null}
    </label>
  );
}

/** The live checklist under a new-password field. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <div className={styles.rules}>
      {passwordRules(value).map((r) => (
        <span key={r.key} className={styles.rule} data-ok={r.ok}>
          <span data-icon aria-hidden="true" className={styles.ruleIcon}>{r.icon}</span>
          <span>{r.label}</span>
        </span>
      ))}
    </div>
  );
}

/** The screen's one primary action, filling the column. */
export function AuthSubmit({ label, icon, busy }: { label: string; icon?: string; busy?: boolean }) {
  return (
    <button type="submit" className={styles.submit} disabled={busy}>
      <span>{label}</span>
      {icon ? <span data-icon aria-hidden="true" className={styles.submitIcon}>{icon}</span> : null}
    </button>
  );
}

/** The way off a form: the prototype's bordered, quiet button under the primary one. */
export function AuthGhostLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className={styles.ghost}>{label}</Link>;
}

/** "No account yet? Create one" — the line under the actions. */
export function AuthSwitch({ text, label, to }: { text: string; label: string; to: string }) {
  return (
    <p className={styles.switch}>
      {text}{' '}
      <Link to={to} className={styles.textLink} data-size="13">{label}</Link>
    </p>
  );
}

/** The note that says what happened to the token in the address bar. */
export function TokenNote() {
  return (
    <div className={styles.token}>
      <span data-icon aria-hidden="true" className={styles.tokenIcon}>key</span>
      <span className={styles.tokenText}>
        Single-use token read from the link and removed from this page&rsquo;s address. It is never
        stored.
      </span>
    </div>
  );
}

const TONE_CLASS: Record<string, string> = {
  info: styles.toneInfo ?? '',
  ok: styles.toneOk ?? '',
  warn: styles.toneWarn ?? '',
  bad: styles.toneBad ?? '',
  mute: styles.toneMute ?? '',
  accent: styles.toneAccent ?? '',
  muted: styles.toneMuted ?? '',
};

/**
 * One of the prototype's message screens: the state's glyph, its title and body, the facts it
 * lists, the mono line naming the refusal, and its way onward. `meta` replaces the prototype's
 * fixed code line with the code the API actually returned; `onAction` lets a page that is already
 * on the action's route answer it itself instead of navigating to where it stands.
 */
export function AuthOutcome({ outcome, meta, onAction }: {
  outcome: Outcome;
  meta?: string | undefined;
  onAction?: (to: string) => boolean;
}) {
  const line = meta ?? outcome.meta;
  return (
    <div className={styles.stack} data-gap="22">
      <span data-icon aria-hidden="true" className={`${styles.outcomeIcon} ${TONE_CLASS[outcome.tone] ?? ''}`}>
        {outcome.icon}
      </span>
      <AuthHeading title={outcome.title} body={outcome.body} size="21" />
      {outcome.facts.length ? (
        <ul className={styles.facts}>
          {outcome.facts.map((f) => (
            <li key={f.text} className={styles.fact}>
              <span data-icon aria-hidden="true" className={`${styles.factIcon} ${TONE_CLASS[f.tone] ?? ''}`}>
                {f.icon}
              </span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {line ? <div className={styles.meta}>{line}</div> : null}
      {outcome.actions.length ? (
        <div className={styles.outcomeActions}>
          {outcome.actions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className={styles.action}
              data-kind={a.kind}
              onClick={(e) => { if (onAction?.(a.to)) e.preventDefault(); }}
            >
              {a.icon ? <span data-icon aria-hidden="true" className={styles.actionIcon}>{a.icon}</span> : null}
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The prototype's `scReset`: one screen behind four states — the forgotten-password request, the
 * new password behind a reset link, the confirmation resend and the administrator transfer. The
 * password fields, the token note and the email field's own note appear as the state needs them.
 */
export function ResetScreen({
  title, body, alert, email, newPassword, currentPassword, hasToken, cta, busy, onSubmit,
}: {
  title: string;
  body: string;
  alert?: ReactNode;
  /** Absent on the transfer acceptance, whose endpoint takes the token and a password only. */
  email?: {
    value: string;
    onChange: (next: string) => void;
    error?: string | undefined;
    /** The prototype's note under the field. Only the two password-reset screens carry it. */
    note?: string;
  };
  newPassword?: { value: string; onChange: (next: string) => void; error?: string | undefined };
  currentPassword?: {
    label: string;
    hint?: string;
    value: string;
    onChange: (next: string) => void;
    error?: string | undefined;
  };
  hasToken?: boolean;
  cta: string;
  busy?: boolean;
  onSubmit: () => void;
}) {
  /*
   * `busy` is a rendered prop, so on its own it cannot stop a second Enter that arrives before the
   * first has re-rendered (the tester's T-004, on the dialogs). The gate decides synchronously; the
   * `busy` check stays as the readable statement of intent.
   */
  const gate = useSubmitGate();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    gate.attempt(onSubmit);
  };
  return (
    <form className={styles.stack} data-gap="24" onSubmit={submit} noValidate>
      <AuthHeading title={title} body={body} size="22" />
      {alert}
      <div className={styles.fields} data-gap="15">
        {email ? (
          <AuthField
            label="Email address"
            {...(email.note ? { hint: email.note } : {})}
            error={email.error}
          >
            <input
              className={styles.input}
              type="email"
              autoComplete="username"
              maxLength={254}
              value={email.value}
              onChange={(e) => email.onChange(e.target.value)}
              data-invalid={!!email.error}
              aria-invalid={email.error ? true : undefined}
            />
          </AuthField>
        ) : null}
        {newPassword ? (
          <AuthField label="New password" error={newPassword.error}>
            <input
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={newPassword.value}
              onChange={(e) => newPassword.onChange(e.target.value)}
              data-invalid={!!newPassword.error}
              aria-invalid={newPassword.error ? true : undefined}
            />
            <PasswordChecklist value={newPassword.value} />
          </AuthField>
        ) : null}
        {currentPassword ? (
          <AuthField
            label={currentPassword.label}
            {...(currentPassword.hint ? { hint: currentPassword.hint } : {})}
            error={currentPassword.error}
          >
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={currentPassword.value}
              onChange={(e) => currentPassword.onChange(e.target.value)}
              data-invalid={!!currentPassword.error}
              aria-invalid={currentPassword.error ? true : undefined}
            />
          </AuthField>
        ) : null}
      </div>
      {hasToken ? <TokenNote /> : null}
      <div className={styles.actions}>
        <AuthSubmit label={cta} busy={busy} />
        <AuthGhostLink to="/sign-in" label="Back to sign in" />
      </div>
    </form>
  );
}
