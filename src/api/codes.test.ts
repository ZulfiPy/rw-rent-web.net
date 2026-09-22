import { describe, expect, test } from 'vitest';
import { FORM_LEVEL_CODES, KNOWN_CODES, codeToField } from './codes';

/**
 * The refusal codes the app knows must be codes the API actually sends.
 *
 * Sixteen of the thirty-eight were not, until Follow-up 5. A guessed code is silently dead: the
 * refusal simply appears in the dialog's banner instead of under its field, and nothing anywhere
 * complains — which is how they survived a review and a green test suite. This test is the thing
 * that complains.
 *
 * The list below is the backend's own, for the five resources this table touches, taken from the
 * `*Errors.cs` and `*Conflicts.cs` files of `RWRentApi.Application` plus the codes its services
 * raise inline. It is a snapshot on purpose: if the backend renames a code, this test fails, which
 * is exactly when someone should look.
 */
const BACKEND_CODES: readonly string[] = [
  // users (11)
  'users.activation_role_expiry_invalid',
  'users.activation_roles_invalid',
  'users.concurrency_conflict',
  'users.final_company_principal',
  'users.forbidden',
  'users.invalid_status_transition',
  'users.not_found',
  'users.protected',
  'users.reason_invalid',
  'users.registration_email_confirmation_required',
  'users.registration_reserved_for_administrator_transfer',
  // rental_assignments (22)
  'rental_assignments.active_parties_fixed',
  'rental_assignments.authorization_stop_time_invalid',
  'rental_assignments.concurrency_conflict',
  'rental_assignments.correction_note_required',
  'rental_assignments.customer_inactive',
  'rental_assignments.customer_not_found',
  'rental_assignments.final_assignment_read_only',
  'rental_assignments.interruption_history_blocks_correction',
  'rental_assignments.interruption_outside_closure',
  'rental_assignments.invalid_initial_status',
  'rental_assignments.invalid_transition',
  'rental_assignments.no_handover_confirmation_required',
  'rental_assignments.not_found',
  'rental_assignments.open_interruptions_exist',
  'rental_assignments.planned_range_invalid',
  'rental_assignments.planned_range_overlap',
  'rental_assignments.planned_start_required',
  'rental_assignments.return_time_invalid',
  'rental_assignments.started_at_required',
  'rental_assignments.vehicle_already_active',
  'rental_assignments.vehicle_inactive',
  'rental_assignments.vehicle_not_found',
  // assignment_authorizations (22)
  'assignment_authorizations.already_stopped',
  'assignment_authorizations.assignment_not_found',
  'assignment_authorizations.collective_note_required',
  'assignment_authorizations.collective_requires_business_customer',
  'assignment_authorizations.concurrency_conflict',
  'assignment_authorizations.coverage_required',
  'assignment_authorizations.driver_birth_date_required',
  'assignment_authorizations.driver_forbidden',
  'assignment_authorizations.driver_inactive',
  'assignment_authorizations.driver_not_found',
  'assignment_authorizations.driver_required',
  'assignment_authorizations.driver_underage',
  'assignment_authorizations.duplicate_open_collective',
  'assignment_authorizations.duplicate_open_named',
  'assignment_authorizations.final_coverage_requires_replacement',
  'assignment_authorizations.invalid_stop_reason',
  'assignment_authorizations.invalid_type',
  'assignment_authorizations.mixed_open_modes',
  'assignment_authorizations.not_found',
  'assignment_authorizations.parent_status_does_not_allow_start',
  'assignment_authorizations.stop_note_required',
  'assignment_authorizations.stop_time_invalid',
  // assignment_interruptions (12)
  'assignment_interruptions.already_ended',
  'assignment_interruptions.assignment_not_found',
  'assignment_interruptions.assignment_status_not_allowed',
  'assignment_interruptions.concurrency_conflict',
  'assignment_interruptions.duplicate',
  'assignment_interruptions.end_requires_active_assignment',
  'assignment_interruptions.end_time_invalid',
  'assignment_interruptions.ended_assignment_requires_closed_period',
  'assignment_interruptions.invalid_enum',
  'assignment_interruptions.not_found',
  'assignment_interruptions.note_required',
  'assignment_interruptions.period_outside_rental',
  // drivers (8)
  'drivers.active_assignments_exist',
  'drivers.birth_date_breaks_open_authorization',
  'drivers.concurrency_conflict',
  'drivers.driver_license_number_conflict',
  'drivers.email_conflict',
  'drivers.not_found',
  'drivers.personal_id_conflict',
  'drivers.phone_number_conflict',
  // record_deletions (10) — the backend's round 7, RecordDeletionErrors.cs (Follow-up 8)
  'record_deletions.blocked',
  'record_deletions.concurrency_conflict',
  'record_deletions.confirmation_required',
  'record_deletions.forbidden',
  'record_deletions.kind_invalid',
  'record_deletions.not_found',
  'record_deletions.note_required',
  'record_deletions.note_too_long',
  'record_deletions.reason_required',
  'record_deletions.record_id_required',
  // roles (13) — RoleAssignmentErrors.cs, with the backend's round 9 (Follow-up 10)
  'roles.already_revoked',
  'roles.assignment_not_found',
  'roles.concurrency_conflict',
  'roles.duplicate_effective',
  'roles.email_domain_not_allowed',
  'roles.email_domain_not_configured',
  'roles.expired_assignment_historical',
  'roles.final_company_principal',
  'roles.forbidden',
  'roles.invalid',
  'roles.invalid_expiry',
  'roles.temporary_only_principal',
  'roles.user_not_found',
  // email_change (1) — SelfProfileErrors.cs, the backend's round 9 (Follow-up 10)
  'email_change.outside_company_domain',
];

describe('every code the app knows is one the API sends', () => {
  test('no entry names a code the backend does not have', () => {
    const unknown = KNOWN_CODES.filter((code) => !BACKEND_CODES.includes(code));
    expect(unknown, `these are not in the backend's catalogue: ${unknown.join(', ')}`).toEqual([]);
  });

  test('the table is not empty and every key looks like a code', () => {
    expect(KNOWN_CODES.length).toBeGreaterThan(20);
    for (const code of KNOWN_CODES) {
      expect(code, code).toMatch(/^[a-z0-9_]+\.[a-z0-9_]+$/);
    }
  });
});

describe('the codes corrected in Follow-up 5 reach their field', () => {
  /*
   * One assertion per code that was wrong, naming the operation it arrives on. Each of these used
   * to resolve to nothing.
   */
  test.each([
    ['assignment_authorizations.duplicate_open_named', 'auth-start', 'driverId'],
    ['assignment_authorizations.collective_requires_business_customer', 'auth-start', 'authorizationType'],
    ['assignment_authorizations.duplicate_open_collective', 'auth-start', 'authorizationType'],
    ['assignment_authorizations.mixed_open_modes', 'auth-start', 'authorizationType'],
    ['assignment_authorizations.stop_time_invalid', 'auth-stop', 'stoppedAtUtc'],
    ['assignment_authorizations.invalid_stop_reason', 'auth-stop', 'stopReason'],
    ['assignment_interruptions.period_outside_rental', 'interruption-create', 'startedAtUtc'],
    ['assignment_interruptions.end_time_invalid', 'interruption-create', 'endedAtUtc'],
    ['assignment_interruptions.ended_assignment_requires_closed_period', 'interruption-edit', 'endedAtUtc'],
    ['rental_assignments.planned_range_invalid', 'assignment-create', 'plannedEndAtUtc'],
    ['rental_assignments.return_time_invalid', 'assignment-end', 'closedAtUtc'],
    ['rental_assignments.correction_note_required', 'assignment-cancel', 'cancellationNote'],
  ])('%s on %s lands on %s', (code, op, field) => {
    expect(codeToField(code, op)).toBe(field);
  });

  test('the codes that were removed resolve to nothing, and nothing pretends otherwise', () => {
    // They named no real refusal. A missing value arrives as an `errors` entry keyed by its own
    // property instead, which already lands under the input.
    for (const dead of [
      'assignment_authorizations.driver_already_open',
      'assignment_authorizations.collective_requires_business',
      'assignment_authorizations.collective_already_open',
      'assignment_authorizations.named_and_collective_exclusive',
      'assignment_authorizations.from_required',
      'assignment_authorizations.stopped_at_required',
      'assignment_authorizations.stopped_before_start',
      'assignment_authorizations.stop_reason_required',
      'assignment_interruptions.started_at_required',
      'assignment_interruptions.before_assignment_start',
      'assignment_interruptions.ended_at_required',
      'assignment_interruptions.ended_before_start',
      'assignment_interruptions.after_assignment_close',
      'assignment_interruptions.reason_required',
      'assignment_interruptions.billing_impact_required',
      'rental_assignments.closed_at_required',
      'rental_assignments.closed_before_start',
      'rental_assignments.planned_end_before_start',
      'rental_assignments.collective_not_valid_for_customer',
    ]) {
      expect(codeToField(dead, 'auth-stop'), dead).toBeUndefined();
      expect(codeToField(dead, 'interruption-create'), dead).toBeUndefined();
      expect(codeToField(dead, 'assignment-create'), dead).toBeUndefined();
    }
  });
});

describe('the refusals of the delete right (Follow-up 10)', () => {
  test('a holder leaving the company domain is refused on the new address of the email change', () => {
    expect(codeToField('email_change.outside_company_domain', 'profile-email')).toBe('newEmail');
  });

  test('the two refusals of the grant name no input: they stay the dialog banner, in the API’s words', () => {
    expect(FORM_LEVEL_CODES).toEqual(['roles.email_domain_not_allowed', 'roles.email_domain_not_configured']);
    for (const code of FORM_LEVEL_CODES) {
      expect(KNOWN_CODES).toContain(code);
      expect(codeToField(code, 'record-deleter-grant'), code).toBeUndefined();
      expect(codeToField(code, 'role-grant'), code).toBeUndefined();
    }
  });
});
