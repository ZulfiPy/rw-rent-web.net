import { readdirSync, readFileSync } from 'node:fs';
import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AcceptAdministratorTransfer } from './account/AcceptAdministratorTransfer';
import { AuthLayout, AuthOutcome, ResetScreen } from './account/AuthLayout';
import { ConfirmEmailChange } from './account/ConfirmEmailChange';
import { ConfirmRegistrationEmail } from './account/ConfirmRegistrationEmail';
import { OUTCOMES, type OutcomeName } from './account/outcomes';
import { Register } from './account/Register';
import { ResetPassword } from './account/ResetPassword';
import { SignIn } from './account/SignIn';

/**
 * Follow-up 21, F21-2 to F21-4: what a stranger reads on the public pages. The foot names the
 * platform and its version and says nothing of sessions; the sign-in page introduces the app in one
 * sentence; no message screen shows a technical line, whatever the API answered; and the note under a
 * link's form speaks of the link, not of a token. The pages are rendered to markup as the browser
 * first receives them; a page that reads its link from the address is given one.
 */
const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
});

/** A public page at an address, with the link's token after the `#` when it has one. */
function page(element: ReactElement, at: string, hash = ''): string {
  vi.stubGlobal('window', { location: { hash } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return renderToStaticMarkup(h(QueryClientProvider, { client }, h(MemoryRouter, { initialEntries: [`${at}${hash}`] }, element)));
}

const PUBLIC_PAGES: Array<[string, () => string]> = [
  ['sign-in', () => page(h(SignIn), '/sign-in')],
  ['register', () => page(h(Register), '/register')],
  ['reset-password, asking for a link', () => page(h(ResetPassword), '/reset-password')],
  ['reset-password, from a link', () => page(h(ResetPassword), '/reset-password', '#CfDJ8-reset')],
  ['confirm-registration-email, no link', () => page(h(ConfirmRegistrationEmail), '/confirm-registration-email')],
  ['confirm-registration-email, from a link', () => page(h(ConfirmRegistrationEmail), '/confirm-registration-email', '#CfDJ8-confirm')],
  ['confirm-email-change, no link', () => page(h(ConfirmEmailChange), '/confirm-email-change')],
  ['accept-administrator-transfer, no link', () => page(h(AcceptAdministratorTransfer), '/accept-administrator-transfer')],
  ['accept-administrator-transfer, from a link', () => page(h(AcceptAdministratorTransfer), '/accept-administrator-transfer', '#CfDJ8-transfer')],
];

/** The foot of a rendered public page: its texts in order, and how many dots stand between them. */
const foot = (markup: string) => {
  const found = /<div class="_foot_[^"]*">(.*?)<\/div>/s.exec(markup);
  expect(found, 'no foot').not.toBeNull();
  return {
    texts: [...found![1]!.matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map((span) => span[1]),
    dots: (found![1]!.match(/_footDot_/g) ?? []).length,
  };
};

const TECHNICAL = /code:|HTTP \d|retry-after|_token_unusable|registration_confirmation|password_reset_token|Single-use token|single-use token read/;

describe('F21-2: the public pages’ foot', () => {
  test('every public page’s foot reads "RW-Rent operations platform · v1.0.0", with nothing of sessions', () => {
    for (const [name, render] of PUBLIC_PAGES) {
      const markup = render();
      expect(foot(markup), name).toEqual({ texts: ['RW-Rent operations platform', 'v1.0.0'], dots: 1 });
      expect(markup, name).not.toContain('Sessions expire');
      expect(markup, name).not.toMatch(/2 h idle|12 h absolute/);
    }
  });

  test('the version keeps its mono type, and the art keeps its two lines', () => {
    const markup = page(h(SignIn), '/sign-in');
    expect(markup).toMatch(/<span class="_footVersion_[^"]*">v1\.0\.0<\/span>/);
    expect(markup).toContain('Track · Manage · Grow');
    expect(markup).toMatch(/<p class="_artLine_[^"]*">Control at every turn\.<\/p>/);
  });
});

describe('F21-3: the sign-in page’s introduction', () => {
  test('it is "Fleet and rental operations for RW-Rent." and nothing about the session', () => {
    const markup = page(h(SignIn), '/sign-in');
    expect(markup).toMatch(/<h1[^>]*>Sign in<\/h1><p class="_intro_[^"]*">Fleet and rental operations for RW-Rent\.<\/p>/);
    expect(markup).not.toContain('stays signed in');
    expect(markup).not.toContain('until it expires');
  });
});

describe('F21-4: no technical line on the public message screens', () => {
  test('every message screen keeps its title, body, facts and actions, and shows no mono line', () => {
    for (const name of Object.keys(OUTCOMES) as OutcomeName[]) {
      const outcome = OUTCOMES[name];
      const markup = page(h(AuthLayout, { documentTitle: outcome.title, children: h(AuthOutcome, { outcome }) }), '/sign-in');
      expect(markup, name).toContain(`>${outcome.title}</h1>`);
      for (const fact of outcome.facts) expect(markup, name).toContain(`<span>${fact.text}</span>`);
      for (const action of outcome.actions) expect(markup, name).toContain(`<span>${action.label}</span>`);
      expect(markup, name).not.toMatch(/_meta_/);
      expect(markup, name).not.toMatch(TECHNICAL);
    }
  });

  test('the three screens that carried one: a dead confirmation link, a dead reset link, too many attempts', () => {
    for (const name of ['confirm-bad', 'reset-bad', 'rate-limited'] as const) {
      const outcome = OUTCOMES[name];
      expect(Object.keys(outcome), name).not.toContain('meta');
      const markup = renderToStaticMarkup(h(MemoryRouter, null, h(AuthOutcome, { outcome })));
      // The body is followed by the facts or the actions, never by a line of its own.
      expect(markup, name).toMatch(/<\/p><\/div>(?:<ul class="_facts_|<div class="_outcomeActions_)/);
    }
    expect(OUTCOMES['rate-limited'].body).toContain('paused for a short time');
  });

  test('a link that cannot be used reads in a person’s words on each link page', () => {
    const confirmation = page(h(ConfirmRegistrationEmail), '/confirm-registration-email');
    expect(confirmation).toContain('>This confirmation link cannot be used</h1>');
    expect(confirmation).toContain('Confirmation links are valid for 24 hours and work once.');
    expect(confirmation).not.toMatch(TECHNICAL);
    const change = page(h(ConfirmEmailChange), '/confirm-email-change');
    expect(change).toContain('>This confirmation link cannot be used</h1>');
    expect(change).not.toMatch(TECHNICAL);
    const transfer = page(h(AcceptAdministratorTransfer), '/accept-administrator-transfer');
    expect(transfer).toContain('>This transfer link cannot be used</h1>');
    expect(transfer).not.toMatch(TECHNICAL);
  });

  test('no public page hands a message screen a line of the API’s: the screen takes none', () => {
    const folder = new URL('./account/', import.meta.url);
    for (const name of readdirSync(folder).filter((one) => one.endsWith('.tsx'))) {
      const source = readFileSync(new URL(name, folder), 'utf8');
      // `meta: OWNS_UNAUTHORIZED` is a request's own note for the session guard, not a screen's line.
      expect(source.replace(/meta: OWNS_UNAUTHORIZED/g, ''), name).not.toMatch(/\bmeta\b/);
      expect(source, name).not.toMatch(/code: \$\{|`code:/);
    }
    expect(readFileSync(new URL('./account/Auth.module.css', import.meta.url), 'utf8')).not.toMatch(/\.meta\b/);
  });

  test('the note under a link’s form speaks of the link', () => {
    const NOTE = 'This link works once. It has been removed from this page’s address.';
    const reset = page(h(ResetPassword), '/reset-password', '#CfDJ8-reset');
    expect(reset).toMatch(new RegExp(`<span class="_tokenText_[^"]*">${NOTE}</span>`));
    expect(reset).not.toMatch(TECHNICAL);
    const transfer = page(h(AcceptAdministratorTransfer), '/accept-administrator-transfer', '#CfDJ8-transfer');
    expect(transfer).toContain(NOTE);
    // A form without a link carries no note.
    expect(page(h(ResetPassword), '/reset-password')).not.toContain('This link works once.');
    const screen = renderToStaticMarkup(h(MemoryRouter, null, h(ResetScreen, { title: 'A form', body: 'From a link.', hasToken: true, cta: 'Go', onSubmit: () => {} })));
    expect(screen).toContain(NOTE);
    expect(screen).not.toContain('never stored');
  });
});

describe('what stays as it is', () => {
  test('the Profile page and the user record still explain sessions beside their lists, and the expired-session screen still says why', () => {
    expect(readFileSync(new URL('./account/Profile.tsx', import.meta.url), 'utf8')).toContain('Sessions end after two hours idle or twelve hours in total.');
    expect(readFileSync(new URL('./users/UserRecord.tsx', import.meta.url), 'utf8')).toContain('Two-hour idle timeout, twelve-hour absolute lifetime.');
    expect(OUTCOMES['session-expired'].body).toBe('Sessions end after two hours of inactivity and twelve hours in total. Sign in again to continue where you left off.');
  });
});
