/**
 * The prototype's `messageModel()` as data (`Context/prototype/RW-Rent.dc.html`). Every icon,
 * tone, title, body, fact, meta line and action label below is transcribed from that function;
 * the prototype's state changes become the app's routes.
 *
 * Two entries have no state of their own in the prototype, which answers a completed reset and an
 * accepted transfer with a toast. The app has no toast surface, so each is rendered as the
 * outcome screen of its own flow, carrying the toast's copy word for word.
 */
export type OutcomeTone = 'info' | 'ok' | 'warn' | 'bad' | 'mute' | 'accent';

/** The prototype's fact colours: `var(--ok)`, `var(--warn)` and the muted `var(--fg-3)`. */
export type FactTone = 'ok' | 'warn' | 'muted';

export interface OutcomeFact {
  icon: string;
  tone: FactTone;
  text: string;
}

export interface OutcomeAction {
  label: string;
  icon?: string;
  kind: 'primary' | 'ghost';
  /** Where the prototype's `setState({ authScreen })` lands in the app. */
  to: string;
}

export interface Outcome {
  icon: string;
  tone: OutcomeTone;
  title: string;
  body: string;
  facts: OutcomeFact[];
  /** The mono line under the body: the prototype prints the refusal's code there. */
  meta?: string;
  actions: OutcomeAction[];
}

export type OutcomeName =
  | 'register-submitted' | 'confirm-checking' | 'confirm-done' | 'confirm-bad' | 'pending'
  | 'forgot-sent' | 'reset-bad' | 'rejected' | 'expired' | 'suspended' | 'session-expired'
  | 'rate-limited' | 'password-changed' | 'transfer-accepted' | 'transfer-bad'
  | 'email-change-checking' | 'email-change-done' | 'email-change-bad';

export const RESEND_ROUTE = '/confirm-registration-email?resend=1';

const SIGN_IN: OutcomeAction = { label: 'Back to sign in', kind: 'primary', to: '/sign-in' };
const BACK_TO_SIGN_IN: OutcomeAction = { label: 'Back to sign in', kind: 'ghost', to: '/sign-in' };
const F = (icon: string, tone: FactTone, text: string): OutcomeFact => ({ icon, tone, text });

export const OUTCOMES: Record<OutcomeName, Outcome> = {
  'register-submitted': {
    icon: 'mark_email_unread',
    tone: 'info',
    title: 'Confirm your email',
    body: 'If the address can be registered, a confirmation link is on its way. The link works once and expires after 24 hours.',
    facts: [
      F('schedule', 'muted', 'Unconfirmed registrations expire after seven days.'),
      F('lock', 'muted', 'No session or access has been created yet.'),
    ],
    actions: [
      SIGN_IN,
      { label: 'Resend confirmation', kind: 'ghost', icon: 'forward_to_inbox', to: RESEND_ROUTE },
    ],
  },
  'confirm-checking': {
    icon: 'progress_activity',
    tone: 'accent',
    title: 'Confirming your email',
    body: 'Consuming the single-use token from your link. This takes a moment.',
    facts: [],
    actions: [],
  },
  'confirm-done': {
    icon: 'mark_email_read',
    tone: 'ok',
    title: 'Email confirmed',
    body: 'Thank you. Your email ownership is confirmed and your registration is now with an administrator.',
    facts: [
      F('check_circle', 'ok', 'Registration received.'),
      F('check_circle', 'ok', 'Email ownership confirmed.'),
      F('hourglass_top', 'warn', 'Access is awaiting administrator approval.'),
      F('block', 'muted', 'You do not need to register again.'),
    ],
    actions: [SIGN_IN],
  },
  'confirm-bad': {
    icon: 'link_off',
    tone: 'bad',
    title: 'This confirmation link cannot be used',
    body: 'The link was already used, has expired, or does not match a registration awaiting confirmation. Nothing has changed on your account.',
    facts: [F('schedule', 'muted', 'Confirmation links are valid for 24 hours and work once.')],
    meta: 'code: registration_confirmation_token_unusable',
    actions: [
      { label: 'Request a new link', kind: 'primary', icon: 'forward_to_inbox', to: RESEND_ROUTE },
      BACK_TO_SIGN_IN,
    ],
  },
  pending: {
    icon: 'hourglass_top',
    tone: 'warn',
    title: 'Awaiting activation',
    body: 'Your registration is complete and your email is confirmed. An administrator still has to grant your access.',
    facts: [
      F('check_circle', 'ok', 'Registration was successful.'),
      F('check_circle', 'ok', 'Email ownership was confirmed.'),
      F('hourglass_top', 'warn', 'Access is awaiting administrator approval.'),
      F('block', 'muted', 'You do not need to register again.'),
      F('lock', 'muted', 'No business session has been created.'),
    ],
    actions: [SIGN_IN],
  },
  'forgot-sent': {
    icon: 'outgoing_mail',
    tone: 'info',
    title: 'Check your email',
    body: 'If an account exists for that address, a reset link is on its way. For your security we do not confirm whether the address is registered.',
    facts: [F('schedule', 'muted', 'The reset link works once and expires.')],
    actions: [SIGN_IN],
  },
  'reset-bad': {
    icon: 'link_off',
    tone: 'bad',
    title: 'This reset link cannot be used',
    body: 'It may already have been used, expired, or been issued for a different address. Your current password is unchanged.',
    facts: [],
    meta: 'code: password_reset_token_unusable',
    actions: [
      { label: 'Request a new link', kind: 'primary', icon: 'lock_reset', to: '/reset-password' },
      BACK_TO_SIGN_IN,
    ],
  },
  rejected: {
    icon: 'person_off',
    tone: 'bad',
    title: 'Registration not approved',
    body: 'Your registration for RW-Rent was not approved, so no access was created. If you believe this is a mistake, contact your Company administrator directly.',
    facts: [F('mail', 'muted', 'We cannot share the internal review notes.')],
    actions: [SIGN_IN],
  },
  expired: {
    icon: 'timer_off',
    tone: 'mute',
    title: 'Registration expired',
    body: 'This registration was never confirmed and has passed its seven-day window. You can register again with the same email address.',
    facts: [],
    actions: [
      { label: 'Register again', kind: 'primary', icon: 'person_add', to: '/register' },
      BACK_TO_SIGN_IN,
    ],
  },
  suspended: {
    icon: 'lock_person',
    tone: 'bad',
    title: 'Account suspended',
    body: 'Your account exists but access is currently suspended, so no session was created. A Company Principal can restore it.',
    facts: [F('info', 'muted', 'Your data and history are untouched.')],
    actions: [SIGN_IN],
  },
  'session-expired': {
    icon: 'schedule',
    tone: 'warn',
    title: 'Session expired',
    body: 'Sessions end after two hours of inactivity and twelve hours in total. Sign in again to continue where you left off.',
    facts: [F('shield', 'muted', 'Unsaved form input was kept in this browser tab only.')],
    actions: [{ label: 'Sign in again', kind: 'primary', icon: 'login', to: '/sign-in' }],
  },
  'rate-limited': {
    icon: 'speed',
    tone: 'warn',
    title: 'Too many attempts',
    body: 'For security, further attempts from this location are paused for a short time. Nothing is wrong with your account.',
    facts: [],
    meta: 'HTTP 429 · retry-after: 60 s',
    actions: [SIGN_IN],
  },

  /* The prototype answers these two with a toast; the copy is the toast's. */
  'password-changed': {
    icon: 'lock_reset',
    tone: 'ok',
    title: 'Password changed',
    body: 'All other sessions were signed out.',
    facts: [],
    actions: [SIGN_IN],
  },
  'transfer-accepted': {
    icon: 'admin_panel_settings',
    tone: 'ok',
    title: 'Administrator transfer accepted',
    body: 'Sign in to continue with the new access.',
    facts: [],
    actions: [SIGN_IN],
  },

  /*
   * Three states the prototype's family does not cover: a transfer link that cannot be used, and
   * the two halves of `/confirm-email-change`, which the design has no screen for. Each is built
   * from the vocabulary of the states the prototype does define.
   */
  'transfer-bad': {
    icon: 'link_off',
    tone: 'bad',
    title: 'This transfer link cannot be used',
    body: 'It may already have been used, expired, or been withdrawn by the administrator who sent it. Nothing has changed on your account.',
    facts: [F('admin_panel_settings', 'muted', 'The administrator who sent it can issue a new one.')],
    actions: [SIGN_IN],
  },
  'email-change-checking': {
    icon: 'progress_activity',
    tone: 'accent',
    title: 'Confirming your new email',
    body: 'Consuming the single-use token from your link. This takes a moment.',
    facts: [],
    actions: [],
  },
  'email-change-done': {
    icon: 'mark_email_read',
    tone: 'ok',
    title: 'Email changed',
    body: 'Sign in with the new address from now on. Every other session was signed out.',
    facts: [],
    actions: [{ label: 'Your account', kind: 'primary', icon: 'person', to: '/profile' }],
  },
  'email-change-bad': {
    icon: 'link_off',
    tone: 'bad',
    title: 'This confirmation link cannot be used',
    body: 'The link was already used, has expired, or does not match a pending change. Your current address still works.',
    facts: [],
    actions: [{ label: 'Your account', kind: 'primary', icon: 'person', to: '/profile' }],
  },
};

/**
 * What `POST /api/auth/login` answered, as one of the prototype's screens. A refusal with no screen
 * of its own — wrong password, an unconfirmed email, an account the API will not talk about —
 * stays on the form and is shown in its alert instead.
 */
export function signInOutcome(status: number | undefined, code: string | undefined): OutcomeName | null {
  if (status === 429) return 'rate-limited';
  switch (code) {
    case 'authentication.account_pending_activation': return 'pending';
    case 'authentication.registration_rejected': return 'rejected';
    case 'authentication.registration_expired': return 'expired';
    case 'authentication.account_suspended': return 'suspended';
    default: return null;
  }
}
