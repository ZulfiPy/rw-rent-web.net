import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { ApiError } from '@/api/problem';
import { AccessProvider } from '@/permissions/usePermissions';
import { App, Unreachable } from '@/App';
import { Register } from './account/Register';
import { AuditEntry } from './audit/AuditEntry';
import { AssignmentRecord } from './fleet/AssignmentRecord';
import { UserRecord } from './users/UserRecord';
import { assignment, clearRenders, renderPage } from './followup7b.support';
import { rentalEntry } from './followup8.support';
import { directoryPrincipal, historyHolder, tomsBefore } from './followup10.support';

/**
 * Follow-up 22: the app speaks to a person, and to an Estonian company. Each changed place is
 * rendered to markup as the browser receives it, from what the API answered in earlier rounds: the
 * phone number's example (F22-1), the screen shown when the server cannot be reached (F22-2), the
 * record pages without the two facts only a developer reads and the audit entry's last panel
 * (F22-3). The sentences of F22-4 are rendered in `followup22.sentences.render.test.ts`, and
 * `followup22.words.test.ts` reads every text of the app.
 */
const clients: QueryClient[] = [];
afterEach(() => {
  clearRenders();
  clients.splice(0).forEach((client) => client.clear());
});

/** Something the API or the browser says of itself, which no screen of this follow-up may show. */
const TECHNICAL = /\bAPI\b|backend|endpoint|payload|\bHTTP\b|Failed to fetch|Bad Gateway|Unknown error/i;

describe('F22-1: the phone number’s example is Estonian', () => {
  test('Create account shows +372 5000 0000', () => {
    const client = new QueryClient();
    clients.push(client);
    const markup = renderToStaticMarkup(h(QueryClientProvider, { client }, h(MemoryRouter, { initialEntries: ['/register'] }, h(Register))));
    expect(markup).toMatch(/<input[^>]*type="tel"[^>]*placeholder="\+372 5000 0000"/);
    expect(markup).not.toContain('+371');
  });
});

describe('F22-2: the screen shown when the server cannot be reached', () => {
  const SCREEN = /<h1 class="_title_[^"]*">RW-Rent cannot be reached right now<\/h1><p class="_body_[^"]*">Check your internet connection and reload this page\. If it stays like this, try again in a few minutes\.<\/p><\/div><\/main>$/;

  test('it speaks to a person: the title, the body, and nothing under them', () => {
    const markup = renderToStaticMarkup(h(Unreachable));
    expect(markup).toMatch(SCREEN);
    expect(markup).not.toMatch(TECHNICAL);
    expect(markup).not.toMatch(/_mail_/);
  });

  /** The app as it starts when asking who is signed in fails. */
  const started = (error: unknown) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false, staleTime: Infinity } } });
    clients.push(client);
    const query = client.getQueryCache().build(client, { queryKey: qk.me });
    query.setState({ ...query.state, status: 'error', error: error as Error, errorUpdateCount: 1, errorUpdatedAt: Date.now() });
    return renderToStaticMarkup(
      h(QueryClientProvider, { client }, h(AccessProvider, null, h(MemoryRouter, { initialEntries: ['/vehicles'] }, h(App)))));
  };

  test('the app shows it, without the error’s own text, when the request never arrived', () => {
    const markup = started(new TypeError('Failed to fetch'));
    expect(markup).toMatch(SCREEN);
    expect(markup).not.toMatch(TECHNICAL);
  });

  test('and when a server on the way answered for the API, with no sentence of its own', () => {
    const markup = started(new ApiError(502, { status: 502, title: 'Bad Gateway' }));
    expect(markup).toMatch(SCREEN);
    expect(markup).not.toMatch(TECHNICAL);
    expect(markup).not.toContain('502');
  });
});

describe('F22-3: facts only a developer reads leave the record pages', () => {
  test('the rental’s Privileged corrections panel shows no concurrency token, and keeps who last changed it', () => {
    const markup = renderPage(h(AssignmentRecord), {
      at: `/rental-assignments/${assignment.id}?tab=corrections`,
      route: '/rental-assignments/:assignmentId',
      permissions: ['PrivilegedCorrections.Execute', 'RentalAssignments.Read'],
      data: [[qk.assignments.detail(assignment.id), assignment]],
    });
    expect(markup).toContain('Privileged corrections');
    expect(markup).toContain('>Last changed<');
    expect(markup).not.toContain('Concurrency token');
    expect(markup).not.toContain(assignment.concurrencyToken);
    expect(markup).not.toMatch(/stale token|409|Conflict/);
  });

  test('what the app sends with a correction does not change: both corrections still carry the token', () => {
    const dialogs = readFileSync(new URL('./fleet/AssignmentDialogs.tsx', import.meta.url), 'utf8');
    for (const correction of ['function CorrectParties', 'function CorrectTimeline']) {
      const at = dialogs.indexOf(correction);
      expect(at, correction).toBeGreaterThan(-1);
      const body = dialogs.slice(at, dialogs.indexOf('\nfunction ', at + 10));
      expect(body, correction).toContain('concurrencyToken: a.concurrencyToken,');
    }
    expect(assignment.concurrencyToken).toMatch(/[0-9a-f-]{36}/);
  });

  test('the user’s page shows no security version', () => {
    const markup = renderPage(h(UserRecord), {
      at: `/users/${tomsBefore.id}`,
      route: '/users/:userId',
      permissions: ['Users.ReadDirectory', 'Roles.ReadHistory'],
      data: [
        [qk.users.detail(tomsBefore.id), tomsBefore],
        [qk.roles.history(tomsBefore.id, { PageSize: 100 }), historyHolder],
        [qk.users.list({ PageSize: 100 }), directoryPrincipal],
      ],
    });
    expect(markup).toContain('>Email ownership<');
    expect(markup).toContain('>Company<');
    expect(markup).not.toContain('Security version');
    expect(markup).not.toContain('Increments on credential');
    // Six facts are left, three to a row, so the panel shows no empty place where the seventh stood.
    const account = /<div class="_grid_[^"]* (_cols\d_)[^"]*"><div[^>]*><span[^>]*>First name<\/span>.*?<\/div><\/div>(?=<\/section>|<\/div>)/s.exec(markup);
    expect(account?.[1]).toBe('_cols3_');
    expect(markup.slice(markup.lastIndexOf('<div class="_grid_', markup.indexOf('>First name<')), markup.indexOf('>Lifecycle<')).match(/_label_/g)).toHaveLength(6);
  });

  const entry = (value: typeof rentalEntry) => renderPage(h(AuditEntry), {
    at: `/security-audit/${value.id}`,
    route: '/security-audit/:entryId',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[qk.audit.entry(value.id), value]],
  });

  test('the audit entry’s last panel is titled "The entry as stored", its stored content as it was', () => {
    const markup = entry(rentalEntry);
    expect(markup).toContain('>The entry as stored</');
    expect(markup).not.toContain('Raw payload');
    expect(markup).toContain('Audit history is append-only; entries cannot be edited or deleted.');
    // The stored content itself stays as it is stored.
    expect(markup).toContain('RecordLabel');
  });

  test('an entry whose values cannot be set out says so in a person’s words and points at that panel', () => {
    const markup = entry({ ...rentalEntry, beforeJson: '{"RecordLabel":"x","Other":[1]}' });
    expect(markup).toMatch(/>Recorded values<\/[^>]+>.*>Reading<\/[^>]+>.*These values could not be set out here\. See the entry as stored, below\./s);
    expect(markup).not.toMatch(/Unrecognised|payload shape|raw values|>Payload<|>Parsing</);
  });
});
