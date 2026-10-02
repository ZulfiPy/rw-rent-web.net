import { describe, expect, it } from 'vitest';
import { OUTCOMES, RESEND_ROUTE, signInOutcome, type OutcomeName } from './outcomes';

/** Every destination the ported screens navigate to. A typo here is a dead button. */
const ROUTES = new Set(['/sign-in', '/register', '/reset-password', '/profile', RESEND_ROUTE]);

describe('signInOutcome', () => {
  it('sends each coded lifecycle refusal to its own screen', () => {
    expect(signInOutcome(403, 'authentication.account_pending_activation')).toBe('pending');
    expect(signInOutcome(403, 'authentication.registration_rejected')).toBe('rejected');
    expect(signInOutcome(403, 'authentication.registration_expired')).toBe('expired');
    expect(signInOutcome(403, 'authentication.account_suspended')).toBe('suspended');
  });

  it('answers a paused location before it looks at the code', () => {
    expect(signInOutcome(429, undefined)).toBe('rate-limited');
    expect(signInOutcome(429, 'authentication.account_suspended')).toBe('rate-limited');
  });

  it('keeps the form for a refusal the family has no screen for', () => {
    // A wrong password, an unconfirmed email and the catch-all are answered in the form's alert.
    expect(signInOutcome(401, 'authentication.invalid_credentials')).toBeNull();
    expect(signInOutcome(403, 'authentication.email_confirmation_required')).toBeNull();
    expect(signInOutcome(403, 'authentication.account_access_unavailable')).toBeNull();
    expect(signInOutcome(500, undefined)).toBeNull();
  });
});

describe('the outcome screens', () => {
  const names = Object.keys(OUTCOMES) as OutcomeName[];

  it('all carry a glyph, a title and a body', () => {
    for (const name of names) {
      const o = OUTCOMES[name];
      expect(o.icon, name).not.toBe('');
      expect(o.title, name).not.toBe('');
      expect(o.body, name).not.toBe('');
    }
  });

  it('offer a way onward unless they are still working', () => {
    for (const name of names) {
      const waiting = name === 'confirm-checking' || name === 'email-change-checking';
      expect(OUTCOMES[name].actions.length === 0, name).toBe(waiting);
    }
  });

  it('only ever send a person to a route the app serves', () => {
    for (const name of names) {
      for (const action of OUTCOMES[name].actions) {
        expect(ROUTES.has(action.to), `${name} → ${action.to}`).toBe(true);
      }
    }
  });

  it('carries no technical line on any screen (Follow-up 21, F21-4)', () => {
    for (const name of Object.keys(OUTCOMES) as OutcomeName[]) {
      const outcome = OUTCOMES[name];
      expect(Object.keys(outcome).sort(), name).toEqual(['actions', 'body', 'facts', 'icon', 'title', 'tone']);
      const words = [outcome.title, outcome.body, ...outcome.facts.map((fact) => fact.text)].join(' ');
      expect(words, name).not.toMatch(/code:|HTTP \d|retry-after|_token_|\b\w+\.\w+_\w+/);
    }
    // "Too many attempts" keeps its body, which already says the pause is short.
    expect(OUTCOMES['rate-limited'].body).toBe('For security, further attempts from this location are paused for a short time. Nothing is wrong with your account.');
  });

  it('keeps the prototype’s copy for the screen a registration lands on', () => {
    expect(OUTCOMES['register-submitted'].title).toBe('Confirm your email');
    expect(OUTCOMES['register-submitted'].body).toBe(
      'If the address can be registered, a confirmation link is on its way. The link works once and expires after 24 hours.',
    );
    expect(OUTCOMES['register-submitted'].actions.map((a) => a.label))
      .toEqual(['Back to sign in', 'Resend confirmation']);
  });
});
