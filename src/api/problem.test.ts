import { describe, expect, test } from 'vitest';
import { ApiError, fieldMessages, STALE_MESSAGE, toFailure } from './problem';

describe('400', () => {
  test('an errors dictionary becomes per-field messages', () => {
    const failure = toFailure(
      new ApiError(400, { status: 400, errors: { reason: ['Reason must be at least 3 characters.'] } }),
    );
    expect(failure).toEqual({ kind: 'field', errors: { reason: ['Reason must be at least 3 characters.'] } });
    expect(fieldMessages(failure)).toEqual({ reason: 'Reason must be at least 3 characters.' });
  });

  test('FluentValidation PascalCase keys are matched to the JSON field names the inputs use', () => {
    const failure = toFailure(
      new ApiError(400, { status: 400, errors: { FirstName: ["'First Name' must not be empty."] } }),
    );
    expect(failure).toEqual({ kind: 'field', errors: { firstName: ["'First Name' must not be empty."] } });
  });

  test('an indexed property path keeps its index and resolves collapsed too', () => {
    const failure = toFailure(
      new ApiError(400, {
        status: 400,
        errors: {
          'Roles[0].Role': ['Role values must be unique.'],
          'Roles[1].ExpiresAtUtc': ['The expiry must be a future date.'],
        },
      }),
    );
    expect(failure).toEqual({
      kind: 'field',
      errors: {
        'roles[0].role': ['Role values must be unique.'],
        'roles[1].expiresAtUtc': ['The expiry must be a future date.'],
      },
    });
    expect(fieldMessages(failure)).toEqual({
      'roles[0].role': 'Role values must be unique.',
      'roles[].role': 'Role values must be unique.',
      'roles[1].expiresAtUtc': 'The expiry must be a future date.',
      'roles[].expiresAtUtc': 'The expiry must be a future date.',
    });
  });

  test('two messages on the same collapsed path keep the first for the index-less input', () => {
    const failure = toFailure(
      new ApiError(400, {
        status: 400,
        errors: {
          'Roles[0].ExpiresAtUtc': ['The expiry must be a future date.'],
          'Roles[2].ExpiresAtUtc': ['The expiry must be after the grant date.'],
        },
      }),
    );
    expect(fieldMessages(failure)['roles[].expiresAtUtc']).toBe('The expiry must be a future date.');
  });

  test('a mapped code addresses one input', () => {
    const failure = toFailure(
      new ApiError(400, {
        status: 400,
        detail: 'The expiry must be a future date.',
        code: 'users.activation_role_expiry_invalid',
      }),
    );
    expect(failure).toEqual({
      kind: 'field-code',
      field: 'roles[].expiresAtUtc',
      message: 'The expiry must be a future date.',
      code: 'users.activation_role_expiry_invalid',
    });
    expect(fieldMessages(failure)).toEqual({ 'roles[].expiresAtUtc': 'The expiry must be a future date.' });
  });

  test('an unmapped code becomes a form-level message rather than a guessed field', () => {
    const failure = toFailure(
      new ApiError(400, { status: 400, detail: 'Role values must be unique.', code: 'users.activation_roles_duplicate' }),
    );
    expect(failure).toEqual({
      kind: 'form',
      message: 'Role values must be unique.',
      code: 'users.activation_roles_duplicate',
    });
    expect(fieldMessages(failure)).toEqual({});
  });
});

describe('409', () => {
  test('a concurrency code raises the stale banner', () => {
    const failure = toFailure(
      new ApiError(409, { status: 409, detail: 'Modified elsewhere.', code: 'rental_assignments.concurrency_conflict' }),
    );
    expect(failure).toEqual({ kind: 'stale', message: STALE_MESSAGE });
  });

  test('the suffix carries the stale banner on every audited resource, tokens or not', () => {
    const resources = [
      'users', 'roles', 'customers', 'drivers', 'vehicles', 'companies', 'profile', 'corrections',
      'rental_assignments', 'assignment_authorizations', 'assignment_interruptions',
      'system_administrator',
    ];
    for (const resource of resources) {
      const failure = toFailure(
        new ApiError(409, { status: 409, detail: 'Modified elsewhere.', code: `${resource}.concurrency_conflict` }),
      );
      expect(failure).toEqual({ kind: 'stale', message: STALE_MESSAGE });
    }
  });

  test('a conflict whose code names no input keeps the server explanation', () => {
    const failure = toFailure(
      new ApiError(409, { status: 409, detail: 'The user is already suspended.', code: 'users.suspend_invalid_state' }),
    );
    expect(failure).toEqual({
      kind: 'conflict',
      message: 'The user is already suspended.',
      code: 'users.suspend_invalid_state',
    });
  });

  /*
   * The three refusals the backend's round 3 added. All three are conflicts, and all three are
   * about one field the operator filled in, so they belong under that field rather than in a banner
   * at the foot of the dialog.
   */
  test('a named driver refused for age sits under the driver field, on every path', () => {
    for (const code of [
      'assignment_authorizations.driver_birth_date_required',
      'assignment_authorizations.driver_underage',
    ]) {
      for (const op of ['assignment-create', 'auth-start', 'auth-stop', 'auth-correct']) {
        const failure = toFailure(
          new ApiError(409, { status: 409, detail: 'A named authorization requires the driver.', code }),
          op,
        );
        expect(failure, `${code} / ${op}`).toEqual({
          kind: 'field-code',
          field: 'driverId',
          message: 'A named authorization requires the driver.',
          code,
        });
        expect(fieldMessages(failure).driverId).toBe('A named authorization requires the driver.');
      }
    }
  });

  test('a protected date of birth sits under the date of birth', () => {
    for (const op of ['driver-create', 'driver-edit']) {
      const failure = toFailure(
        new ApiError(409, {
          status: 409,
          detail: 'The date of birth cannot be changed while an open authorization depends on it.',
          code: 'drivers.birth_date_breaks_open_authorization',
        }),
        op,
      );
      expect(failure.kind, op).toBe('field-code');
      expect(fieldMessages(failure).dateOfBirth)
        .toBe('The date of birth cannot be changed while an open authorization depends on it.');
    }
  });

  test('a duplicate interruption sits under the start, on create, update and correction', () => {
    for (const op of ['interruption-create', 'interruption-edit', 'interruption-correct']) {
      const failure = toFailure(
        new ApiError(409, {
          status: 409,
          detail: 'This interruption already exists on the assignment.',
          code: 'assignment_interruptions.duplicate',
        }),
        op,
      );
      expect(failure.kind, op).toBe('field-code');
      expect(fieldMessages(failure).startedAtUtc)
        .toBe('This interruption already exists on the assignment.');
    }
  });

  test('the same conflict without an op stays a banner, because no table was selected', () => {
    const failure = toFailure(
      new ApiError(409, { status: 409, detail: 'Too young.', code: 'assignment_authorizations.driver_underage' }),
    );
    expect(failure.kind).toBe('conflict');
  });

  test('a concurrency conflict is still the stale banner, whatever table is selected', () => {
    const failure = toFailure(
      new ApiError(409, { status: 409, code: 'assignment_interruptions.concurrency_conflict' }),
      'interruption-edit',
    );
    expect(failure.kind).toBe('stale');
  });
});

describe('401 and 403', () => {
  test('401 routes to sign-in', () => {
    expect(toFailure(new ApiError(401, { status: 401 }))).toEqual({ kind: 'unauthorized' });
  });

  test('403 means the action should never have been offered', () => {
    const failure = toFailure(new ApiError(403, { status: 403, detail: 'You are not permitted to do this.' }));
    expect(failure.kind).toBe('forbidden');
  });
});

test('a non-ApiError rejection still produces a renderable failure', () => {
  expect(toFailure(new Error('network down'))).toEqual({ kind: 'unknown', message: 'network down' });
});
