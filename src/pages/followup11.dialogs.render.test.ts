import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { ApiError, fieldMessages, toFailure } from '@/api/problem';
import { AssignmentStatus, RecordDeletionReason, RecordKind, type ProblemDetails } from '@/api/dto';
import { revealFirstInvalid, INVALID_CONTROL } from '@/ui/Dialog';
import { ResetScreen } from './account/AuthLayout';
import { EMAIL_INVALID } from './account/password';
import { CompanyForm } from './admin/CompanyProfile';
import { DeleteRecordDialog } from './admin/DeleteRecordDialog';
import { Initiate } from './admin/SystemAdministrator';
import { AssignmentDialogs, type AssignmentDialogState } from './fleet/AssignmentDialogs';
import { FleetDialogs } from './fleet/FleetDialogs';
import { NewAssignment } from './fleet/NewAssignment';
import { UserDialogs } from './users/UserDialogs';
import { clearRenders, renderPage } from './followup7b.support';
import {
  activationRolesRefusal, authorizationDriverRefusal, cancelNoteRefusal, cancelRental, company, companyEmailRefusal,
  confirmationRefusal, customerAddressRefusal, customersEverything, customersPick, driverInactiveRefusal, driversActive,
  inUseRental, interruptionEndRefusal, meAdmin, meManager, pendingUser, plannedEndRefusal, plannedRental, roleRefusal,
  toms, tomsRoles, transferEmailRefusal, vehicleInUseRefusal, vehiclesPick,
} from './followup11.support';

/**
 * Follow-up 11, F11-1: every form control marks itself invalid through `invalidProps`, so a dialog
 * finds the refused field by `aria-invalid`, brings it into view and focuses it. Before, 46 controls
 * set `data-invalid` alone — painted red, never found — and five marked nothing at all.
 *
 * Each dialog file is rendered with a refusal the scratch API really gave (`followup11.support.ts`).
 * A server render cannot submit, so the one hook every dialog submits through is replaced, as in
 * Follow-up 10's dialog tests: it answers with the refusal a test names, turned into a failure by the
 * app's own `toFailure` under the dialog's own `op`, which is what the real hook does with the API's
 * answer. Everything else is the real dialog.
 */
const hook = vi.hoisted(() => ({ refusal: null as unknown }));

vi.mock('@/app/useActionMutation', () => ({
  useActionMutation: ({ op }: { op: string }) => {
    const failure = hook.refusal ? toFailure(hook.refusal, op) : null;
    return { submit: () => true, busy: false, failure, fields: failure ? fieldMessages(failure) : {}, refresh: () => {} };
  },
}));

afterEach(() => {
  clearRenders();
  hook.refusal = null;
});

const refusal = (body: ProblemDetails) => new ApiError(body.status ?? 0, body as never);
const PICK = { PageSize: 100 } as const;
const LISTS: Array<[readonly unknown[], unknown]> = [
  [qk.customers.list(PICK), customersPick],
  [qk.vehicles.list(PICK), vehiclesPick],
  [qk.drivers.list({ ...PICK, IsActive: true }), driversActive],
];

/** A dialog rendered with a refusal, as the administrator unless another reader is named. */
const withRefusal = (body: ProblemDetails | null, element: ReturnType<typeof h>, me = meAdmin) => {
  hook.refusal = body ? refusal(body) : null;
  return renderPage(element, { at: '/x', route: '/x', permissions: me.permissions, me, data: LISTS as never });
};

/** The markup of one field, from its label to the end of that field. */
const field = (markup: string, label: string) => {
  const at = markup.indexOf(`<span>${label}</span>`);
  expect(at, `no field ${label}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<label', at);
  return markup.slice(start, markup.indexOf('</label>', at) + '</label>'.length);
};

/** How many controls carry the mark a dialog looks for. */
const marked = (markup: string) => markup.match(/aria-invalid="true"/g)?.length ?? 0;

/** The API's first message for a key, as the field shows it. */
const message = (body: ProblemDetails, key: string) =>
  ((body as { errors?: Record<string, string[]> }).errors?.[key]?.[0] ?? body.detail ?? '').replace(/'/g, '&#x27;');

/** Exactly one control is marked, inside the field that shows the API's message. */
function refusedAt(markup: string, label: string, text: string) {
  const one = field(markup, label);
  expect(one).toContain(text);
  expect(one).toMatch(/<(?:input|select|textarea)[^>]*aria-invalid="true"/);
  expect(marked(markup), `only ${label} is marked`).toBe(1);
}

describe('the new-rental dialog (NewAssignment.tsx)', () => {
  const base = { customerId: customersPick.items[4]!.id, initialStatus: AssignmentStatus.Active } as const;
  const inUse = vehiclesPick.items.find((v) => v.plateNumber === '204 JLM')!;

  test('the owner’s refusal: the vehicle already has an active assignment, marked on the Vehicle select', () => {
    const markup = withRefusal(vehicleInUseRefusal, h(NewAssignment, { onClose: () => {}, initial: { ...base, vehicleId: inUse.id } }), meManager);
    refusedAt(markup, 'Vehicle', 'The vehicle already has an active assignment.');
    expect(field(markup, 'Vehicle')).toMatch(/<select[^>]*data-invalid="true" aria-invalid="true"/);
  });

  test('a refused driver marks the chosen coverage, whose block shows the API’s sentence', () => {
    const markup = withRefusal(driverInactiveRefusal, h(NewAssignment, {
      onClose: () => {},
      initial: { ...base, vehicleId: vehiclesPick.items.find((v) => v.plateNumber === '119 MPR')!.id, mode: 'named', named: [driversActive.items[0]!.id] },
    }), meManager);
    expect(markup).toContain(driverInactiveRefusal.detail!);
    expect(marked(markup)).toBe(1);
    const choice = markup.slice(markup.lastIndexOf('<label', markup.indexOf('Select another driver')), markup.indexOf('Select another driver'));
    expect(choice).toMatch(/<input type="radio"[^>]*aria-invalid="true"[^>]*checked=""/);
  });
});

describe('the dialog brings the refused field into view and focuses it (Dialog.tsx)', () => {
  /**
   * The dialog's body as a browser would hold the rendered markup: `querySelector` answers the first
   * element carrying the attribute the selector names, at its place in the markup. Where it sits on
   * screen is given, so the scroll that centres it can be checked.
   */
  const bodyOf = (markup: string) => {
    const focus = vi.fn();
    const body = {
      scrollTop: 40,
      getBoundingClientRect: () => ({ top: 100, height: 400 }),
      querySelector: (selector: string) => {
        const [, name, value] = /^\[([\w-]+)="([^"]*)"\]$/.exec(selector) ?? [];
        const at = markup.search(new RegExp(`<\\w+[^>]*\\s${name}="${value}"`));
        return at < 0 ? null : { at, focus, getBoundingClientRect: () => ({ top: 700, height: 36 }) };
      },
    };
    return { body, focus };
  };

  test('after the owner’s refusal it finds the Vehicle select, centres it in the body and focuses it', () => {
    const inUse = vehiclesPick.items.find((v) => v.plateNumber === '204 JLM')!;
    const markup = withRefusal(vehicleInUseRefusal, h(NewAssignment, {
      onClose: () => {}, initial: { customerId: customersPick.items[4]!.id, vehicleId: inUse.id, initialStatus: AssignmentStatus.Active },
    }), meManager);
    const { body, focus } = bodyOf(markup);
    const found = revealFirstInvalid(body as unknown as HTMLElement) as unknown as { at: number } | null;
    expect(found).not.toBeNull();
    expect(markup.slice(found!.at, found!.at + 7)).toBe('<select');
    expect(markup.slice(markup.lastIndexOf('<label', found!.at), found!.at)).toContain('<span>Vehicle</span>');
    // 40 + (700 − 100) − (400 − 36) / 2: the control's middle at the body's middle.
    expect(body.scrollTop).toBe(458);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  test('it looks for what invalidProps sets, and moves nothing when no control is marked', () => {
    expect(INVALID_CONTROL).toBe('[aria-invalid="true"]');
    const markup = withRefusal(null, h(NewAssignment, { onClose: () => {} }), meManager);
    const { body, focus } = bodyOf(markup);
    expect(revealFirstInvalid(body as unknown as HTMLElement)).toBeNull();
    expect(body.scrollTop).toBe(40);
    expect(focus).not.toHaveBeenCalled();
  });
});

describe('the rental’s own dialogs (AssignmentDialogs.tsx)', () => {
  const dialog = (state: AssignmentDialogState, assignment = inUseRental) =>
    h(AssignmentDialogs, { state, assignment, customerType: assignment.customerType, onClose: () => {} });

  test('Edit: a planned end before the planned start is marked on Planned end', () => {
    const markup = withRefusal(plannedEndRefusal, dialog({ kind: 'edit' }, plannedRental), meManager);
    refusedAt(markup, 'Planned end', message(plannedEndRefusal, 'PlannedEndAtUtc'));
  });

  test('Cancel: an Active rental’s missing note is marked on What happened', () => {
    expect(cancelRental.status).toBe(AssignmentStatus.Active);
    const markup = withRefusal(cancelNoteRefusal, dialog({ kind: 'cancel' }, cancelRental), meManager);
    refusedAt(markup, 'What happened', message(cancelNoteRefusal, 'CancellationNote'));
  });

  test('Record interruption: an end before the start is marked on Ended at', () => {
    const markup = withRefusal(interruptionEndRefusal, dialog({ kind: 'interruption-create' }), meManager);
    refusedAt(markup, 'Ended at', message(interruptionEndRefusal, 'EndedAtUtc'));
  });

  test('Add authorized driver: a named authorization without its driver is marked on Driver', () => {
    const markup = withRefusal(authorizationDriverRefusal, dialog({ kind: 'auth-start' }), meManager);
    refusedAt(markup, 'Driver', message(authorizationDriverRefusal, 'DriverId'));
  });

  test('the two assignment notes that marked nothing before mark themselves too, in Edit and in Correct timeline', () => {
    // No rule of the API refuses these notes today; the envelope is the live validation answer's,
    // keyed to the field the notes read, so the marking itself is what is held here.
    const onNote = { ...plannedEndRefusal, errors: { Note: ['The note was refused.'] } };
    refusedAt(withRefusal(onNote, dialog({ kind: 'edit' }, plannedRental)), 'Assignment note', 'The note was refused.');
    refusedAt(withRefusal(onNote, dialog({ kind: 'correct-timeline' })), 'Assignment note', 'The note was refused.');
  });
});

describe('the fleet records’ dialogs (FleetDialogs.tsx)', () => {
  test('New customer: a blank address is marked on Address', () => {
    const markup = withRefusal(customerAddressRefusal, h(FleetDialogs, { state: { kind: 'customer-create' }, onClose: () => {} }), meManager);
    refusedAt(markup, 'Address', message(customerAddressRefusal, 'Address'));
  });
});

describe('the Company profile (CompanyProfile.tsx)', () => {
  test('Edit Company profile: an email that is no address is marked on Email', () => {
    const markup = withRefusal(companyEmailRefusal, h(CompanyForm, { company, onClose: () => {} }));
    refusedAt(markup, 'Email', message(companyEmailRefusal, 'Email'));
  });
});

describe('the System Administrator page (SystemAdministrator.tsx)', () => {
  test('Transfer: a target that is no address is marked on Target account email', () => {
    const markup = withRefusal(transferEmailRefusal, h(Initiate, { onClose: () => {} }));
    refusedAt(markup, 'Target account email', message(transferEmailRefusal, 'TargetEmail'));
  });
});

describe('the user dialogs (UserDialogs.tsx)', () => {
  test('Grant role: a role that does not exist is marked on the Role select, which marked nothing before', () => {
    const markup = withRefusal(roleRefusal, h(UserDialogs, { state: { kind: 'role-grant' }, user: toms, roles: tomsRoles.items, sessions: [], onClose: () => {} }));
    refusedAt(markup, 'Role', message(roleRefusal, 'Role'));
  });

  test('Activate: an activation without a role marks every role it offers', () => {
    const markup = withRefusal(activationRolesRefusal, h(UserDialogs, { state: { kind: 'activate' }, user: pendingUser, roles: [], sessions: [], onClose: () => {} }));
    const group = markup.slice(markup.indexOf('aria-label="Initial roles"'), markup.indexOf('</div>', markup.indexOf('aria-label="Initial roles"')));
    expect(group).toContain(message(activationRolesRefusal, 'Roles'));
    const boxes = group.match(/<input type="checkbox"[^>]*>/g) ?? [];
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) expect(box).toContain('aria-invalid="true"');
    expect(marked(markup)).toBe(boxes.length);
  });
});

describe('the delete dialog (DeleteRecordDialog.tsx)', () => {
  test('a deletion without the tick marks the tick itself, under which the API’s sentence stands', () => {
    const ready = customersEverything.items.find((c) => c.deletion.state === 1)!;
    const markup = withRefusal(confirmationRefusal, h(DeleteRecordDialog, {
      target: { kind: RecordKind.Customer, value: ready }, onClose: () => {}, onDeleted: () => {}, onRefresh: () => {},
      initial: { reason: RecordDeletionReason.PracticeOrTestRecord },
    }));
    expect(marked(markup)).toBe(1);
    const tick = markup.slice(markup.lastIndexOf('<label', markup.indexOf('I understand this cannot be undone')));
    expect(tick).toMatch(/^<label[^>]*><input type="checkbox"[^>]*aria-invalid="true"/);
    expect(tick).toContain(confirmationRefusal.detail!);
  });
});

describe('the account screens (AuthLayout.tsx, SignIn.tsx, Register.tsx)', () => {
  test('they already set aria-invalid by hand and now do it through invalidProps, with the same markup', () => {
    const markup = renderPage(h(ResetScreen, {
      title: 'Reset password', body: 'x', cta: 'Send', onSubmit: () => {},
      email: { value: 'nobody', onChange: () => {}, error: EMAIL_INVALID },
      newPassword: { value: '', onChange: () => {} },
    }), { at: '/x', route: '/x' });
    expect(markup).toMatch(/<input[^>]*type="email"[^>]*data-invalid="true" aria-invalid="true"/);
    expect(markup).toMatch(/<input[^>]*type="password"[^>]*data-invalid="false" value=""\/>/);
    expect(marked(markup)).toBe(1);
  });
});

describe('no control marks itself any other way (read from the sources)', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const sources = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
  const screens = [...sources(join(root, 'pages')), ...sources(join(root, 'ui'))]
    .filter((path) => !path.endsWith(join('ui', 'Field.tsx')));

  test('outside invalidProps, no control sets data-invalid or aria-invalid by hand', () => {
    expect(screens.length).toBeGreaterThan(40);
    const offenders = screens
      .filter((path) => /\b(?:data|aria)-invalid=\{/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(root, path));
    expect(offenders).toEqual([]);
  });
});
