import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiError, fieldMessages, toFailure } from '@/api/problem';
import type { ProblemDetails } from '@/api/dto';
import { endOfDayLocal } from '@/format';
import { EmailDialog } from './account/Profile';
import { UserDialogs, recordDeleterGrant } from './users/UserDialogs';
import { clearRenders, renderPage } from './followup7b.support';
import {
  emailRefusal, grantedWithExpiry, historyHolder, meAdmin, meTomsHolder, notConfiguredRefusal, outsideRefusal,
  tomsBefore, tomsHolder,
} from './followup10.support';

/**
 * Follow-up 10's dialogs, rendered to markup. A server render cannot submit, so the one hook every
 * dialog submits through is replaced here: it records what the dialog passed it and answers with the
 * refusal a test names, turned into a failure by the app's own `toFailure` under the dialog's own
 * `op` — exactly what the real hook does with the API's answer. Everything else is the real dialog.
 */
const hook = vi.hoisted(() => ({
  refusal: null as unknown,
  calls: [] as Array<{ op: string; invalidate: readonly (readonly unknown[])[] }>,
}));

vi.mock('@/app/useActionMutation', () => ({
  useActionMutation: ({ op, invalidate }: { op: string; invalidate: readonly (readonly unknown[])[] }) => {
    hook.calls.push({ op, invalidate });
    const failure = hook.refusal ? toFailure(hook.refusal, op) : null;
    return {
      submit: () => true,
      busy: false,
      failure,
      fields: failure ? fieldMessages(failure) : {},
      refresh: () => {},
    };
  },
}));

afterEach(() => {
  clearRenders();
  hook.refusal = null;
  hook.calls.length = 0;
});

const refusal = (body: ProblemDetails) => new ApiError(body.status ?? 0, body as never);

const dialog = (state: Parameters<typeof UserDialogs>[0]['state'], user = tomsBefore) => renderPage(
  h(UserDialogs, { state, user, roles: historyHolder.items, sessions: [], onClose: () => {} }),
  { at: '/x', route: '/x', permissions: meAdmin.permissions, me: meAdmin },
);

describe('Give the delete right', () => {
  test('the dialog of its own: title, who it makes a Record deleter, the warning, the address, the expiry', () => {
    const markup = dialog({ kind: 'record-deleter-grant' });
    expect(markup).toContain('Give the delete right</h2>');
    expect(markup).toContain(
      'Makes Toms Rudzitis a Record deleter, who may delete records for good on the Delete records page.',
    );
    expect(markup).toMatch(/data-tone="warn"(?:(?!<\/div>).)*Every deletion they make is written to the security audit with their name and reason\. Only an\s+address in the company(?:'|&#x27;)s email domain can hold the right\./s);
    expect(markup).toContain('>Login email</span>');
    expect(markup).toContain(tomsBefore.email);
    expect(markup).toContain('Leave empty for no expiry. The chosen date is the last valid day.');
    expect(markup).toMatch(/<input type="date"/);
    expect(markup).toMatch(/<button[^>]*data-tone="primary"[^>]*>(?:(?!<\/button>).)*Give the delete right<\/button>/);
  });

  test('it submits as its own operation and reloads the history and the person’s record', () => {
    dialog({ kind: 'record-deleter-grant' });
    const call = hook.calls.at(-1)!;
    expect(call.op).toBe('record-deleter-grant');
    expect(call.invalidate).toContainEqual(['users']);
    expect(call.invalidate).toContainEqual(['roles']);
  });

  test('without an expiry it asks for none; with one, the chosen date is the last valid day', () => {
    expect(recordDeleterGrant('')).toEqual({ role: 5, expiresAtUtc: null });
    const dated = recordDeleterGrant('2026-12-21');
    expect(dated).toEqual({ role: 5, expiresAtUtc: endOfDayLocal('2026-12-21') });
    // The same instant the API stored for the live grant with an expiry.
    expect(Date.parse(dated.expiresAtUtc!)).toBe(Date.parse(grantedWithExpiry.expiresAtUtc!));
  });

  test('an address outside the domain is refused in a banner, in the API’s own sentence', () => {
    hook.refusal = refusal(outsideRefusal);
    const markup = dialog({ kind: 'record-deleter-grant' });
    expect(markup).toMatch(/data-tone="bad"/);
    expect(markup).toContain('The change was refused');
    expect(markup).toContain(outsideRefusal.detail!.replace("'", '&#x27;'));
  });

  test('an installation without a domain is refused the same way, naming the setting', () => {
    hook.refusal = refusal(notConfiguredRefusal);
    const markup = dialog({ kind: 'record-deleter-grant' });
    expect(markup).toContain('The change was refused');
    expect(markup).toContain('ApiSecurity:RecordDeleterEmailDomain is empty on this installation.');
  });

  test('Grant role keeps offering Viewer, Fleet Manager and Company Principal only', () => {
    const markup = dialog({ kind: 'role-grant' });
    const options = [...markup.matchAll(/<option value="(\d)"[^>]*>([^<]+)<\/option>/g)].map((m) => [m[1], m[2]]);
    expect(options).toEqual([['4', 'Viewer'], ['3', 'Fleet Manager'], ['2', 'Company Principal']]);
  });

  test('the row actions name the Record deleter assignment they change', () => {
    const assignment = historyHolder.items[0]!;
    expect(dialog({ kind: 'role-expiry', assignmentId: assignment.id }, tomsHolder))
      .toContain('Record deleter · granted to Toms Rudzitis');
    expect(dialog({ kind: 'role-revoke', assignmentId: assignment.id }, tomsHolder))
      .toContain('Record deleter · granted to Toms Rudzitis');
  });
});

describe('the email change of a holder', () => {
  const email = (me = meTomsHolder) => renderPage(h(EmailDialog, { onClose: () => {} }), {
    at: '/profile', route: '/profile', permissions: me.permissions, me,
  });

  test('tells a holder beforehand that the new address must stay in the domain', () => {
    expect(email()).toContain(
      'A confirmation link is sent to the new address. The change applies only after you confirm it. Because you hold the delete right, the new address must stay in the company&#x27;s email domain.',
    );
  });

  test('says nothing of it to someone who does not hold the role', () => {
    const markup = email({ ...meTomsHolder, roles: [4], permissions: ['Company.Read'] });
    expect(markup).toContain('The change applies only after you confirm it.');
    expect(markup).not.toContain('delete right');
  });

  /** The markup of one field, from its label to the next field. */
  const field = (markup: string, label: string) => {
    const at = markup.indexOf(`${label}</`);
    return markup.slice(at, markup.indexOf('<label', at + 1));
  };

  test('the refusal lands on the new address, in the API’s own words, and not as a banner', () => {
    hook.refusal = refusal(emailRefusal);
    const markup = email();
    const newAddress = field(markup, 'New email address');
    expect(newAddress).toContain(emailRefusal.detail!.replace("'", '&#x27;'));
    expect(newAddress).toContain('aria-invalid="true"');
    expect(field(markup, 'Current password')).not.toContain('aria-invalid="true"');
    expect(markup).not.toContain('The change was refused');
  });

  test('a refusal carrying only its code lands on the same field (the code table’s own entry)', () => {
    const { errors: _ignored, ...codeOnly } = emailRefusal;
    hook.refusal = refusal(codeOnly);
    expect(field(email(), 'New email address')).toContain(emailRefusal.detail!.replace("'", '&#x27;'));
  });
});
