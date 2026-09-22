/**
 * code → input mapping for a coded refusal.
 *
 * Two 400 shapes reach here. A filter-level rejection carries `errors` and no `code`; a service-level
 * validation refusal carries `code` + `detail` and no `errors`. Both end up as field errors when the
 * path or code names an input, and as the form-level validation message when it does not.
 *
 * A 409 conflict is looked up the same way: a refusal that names one input belongs under that
 * input, whatever status carried it.
 *
 * **Every key below is a code the backend really returns.** That was not true until Follow-up 5:
 * sixteen of the thirty-eight entries named codes that do not exist in the backend's catalogues, so
 * those refusals could only ever appear in the dialog's banner, never under the field they are
 * about. Each key here was checked against the `*Errors.cs` and `*Conflicts.cs` files of
 * `RWRentApi.Application` and the codes its services raise inline; `Context/wiring_report.md` lists
 * what changed. Add nothing here without finding it in that catalogue first — a guessed code is
 * silently dead, which is exactly how the sixteen survived a review and a test suite.
 *
 * Keys are the field paths the dialogs use for their inputs. `roles[].expiresAtUtc` addresses every
 * role-expiry input in the activation dialog: the backend does not say which grant failed. Indexed
 * paths from `errors` resolve against the same key through fieldMessages().
 *
 * A value that is simply missing needs no entry: the request validators refuse it with an `errors`
 * entry keyed by its own property name, which already lands under the input. That is why no
 * `*_required` key for `startedAtUtc`, `stoppedAtUtc` or `closedAtUtc` appears here — the five that
 * did were dead twice over.
 */
const GLOBAL: Record<string, string> = {
  // The role's expiry input; the activation dialog highlights every role-expiry field.
  'users.activation_role_expiry_invalid': 'roles[].expiresAtUtc',
};

/** Per-operation overrides, keyed by the `op` passed to toFailure(). */
const PARTIES: Record<string, string> = {
  'rental_assignments.customer_not_found': 'customerId',
  'rental_assignments.customer_inactive': 'customerId',
  'rental_assignments.vehicle_not_found': 'vehicleId',
  'rental_assignments.vehicle_inactive': 'vehicleId',
  'rental_assignments.vehicle_already_active': 'vehicleId',
};

const PLANNED_DATES: Record<string, string> = {
  'rental_assignments.planned_start_required': 'plannedStartAtUtc',
  'rental_assignments.planned_range_overlap': 'plannedStartAtUtc',
  // "PlannedEndAtUtc must be later than PlannedStartAtUtc."
  'rental_assignments.planned_range_invalid': 'plannedEndAtUtc',
};

/** AUTH-002/003/006/009/011 name an input; the coverage refusal is form-level by design. */
const AUTH_SHAPE: Record<string, string> = {
  'assignment_authorizations.driver_required': 'driverId',
  'assignment_authorizations.driver_not_found': 'driverId',
  'assignment_authorizations.driver_inactive': 'driverId',
  // AUTH-011, the backend's round 3: both refusals are about the driver who was named.
  'assignment_authorizations.driver_birth_date_required': 'driverId',
  'assignment_authorizations.driver_underage': 'driverId',
  // AUTH-006: "This driver already has an open authorization on the assignment."
  'assignment_authorizations.duplicate_open_named': 'driverId',
  // AUTH-009 and AUTH-003: these four are about which kind of coverage was chosen.
  'assignment_authorizations.collective_requires_business_customer': 'authorizationType',
  'assignment_authorizations.duplicate_open_collective': 'authorizationType',
  'assignment_authorizations.mixed_open_modes': 'authorizationType',
  'assignment_authorizations.driver_forbidden': 'authorizationType',
};

const INTERRUPTION: Record<string, string> = {
  // INTERRUPT-012: "The interruption period must remain inside the assignment's actual rental
  // period." One code covers both ends of the period, so it is shown on the start, beside the
  // duplicate refusal.
  'assignment_interruptions.period_outside_rental': 'startedAtUtc',
  // INTERRUPT-014, the backend's round 3: the start is what makes one interruption another's twin.
  'assignment_interruptions.duplicate': 'startedAtUtc',
  // INTERRUPT-003: "EndedAtUtc must be later than StartedAtUtc."
  'assignment_interruptions.end_time_invalid': 'endedAtUtc',
  // "An ended assignment accepts only closed historical interruptions."
  'assignment_interruptions.ended_assignment_requires_closed_period': 'endedAtUtc',
  // INTERRUPT-006 and INTERRUPT-013.
  'assignment_interruptions.note_required': 'note',
};

/** DRIVER-012, the backend's round 3: the date of birth is the field the refusal is about. */
const DRIVER: Record<string, string> = {
  'drivers.birth_date_breaks_open_authorization': 'dateOfBirth',
};

/**
 * The Delete records dialog (the backend's round 7). The four refusals name the dialog's own inputs;
 * `kind_invalid` and `record_id_required` name nothing a person types, so they stay form-level.
 */
const RECORD_DELETE: Record<string, string> = {
  'record_deletions.reason_required': 'reason',
  'record_deletions.note_required': 'note',
  'record_deletions.note_too_long': 'note',
  'record_deletions.confirmation_required': 'confirmed',
};

/**
 * The profile's email change (the backend's round 9, PROFILE-004): a holder of the Record deleter
 * role may not move their address out of the company's domain. The refusal names the new address.
 */
const EMAIL_CHANGE: Record<string, string> = {
  'email_change.outside_company_domain': 'newEmail',
};

/**
 * Refusals the app knows and deliberately keeps form-level: they name no input, so they arrive as the
 * dialog's banner in the API's own sentence. The grant of the Record deleter role (round 9) is
 * refused for an address outside the company's domain, naming the domain, and on an installation
 * that has not set its domain, naming the setting. Listed so the catalogue test checks them too.
 */
const FORM_LEVEL: readonly string[] = [
  'roles.email_domain_not_allowed',
  'roles.email_domain_not_configured',
];

const BY_OP: Record<string, Record<string, string>> = {
  'assignment-create': {
    ...PARTIES,
    ...PLANNED_DATES,
    ...AUTH_SHAPE,
    'rental_assignments.started_at_required': 'startedAtUtc',
  },
  'assignment-edit': { ...PARTIES, ...PLANNED_DATES },
  'assignment-activate': { 'rental_assignments.started_at_required': 'startedAtUtc' },
  'assignment-end': {
    // "The return time must be later than the actual handover time."
    'rental_assignments.return_time_invalid': 'closedAtUtc',
    // "The return time must include every recorded interruption period."
    'rental_assignments.interruption_outside_closure': 'closedAtUtc',
  },
  'assignment-cancel': {
    // ASSIGN-013: cancelling a mistaken activation needs its explanatory note.
    'rental_assignments.correction_note_required': 'cancellationNote',
  },
  'auth-start': AUTH_SHAPE,
  'auth-stop': {
    ...AUTH_SHAPE,
    // AUTH-004: "The stop time must be later than the authorization start time."
    'assignment_authorizations.stop_time_invalid': 'stoppedAtUtc',
    'assignment_authorizations.invalid_stop_reason': 'stopReason',
    // AUTH-010: selecting Other requires a note.
    'assignment_authorizations.stop_note_required': 'note',
  },
  'auth-correct': {
    ...AUTH_SHAPE,
    'assignment_authorizations.stop_time_invalid': 'stoppedAtUtc',
    'assignment_authorizations.invalid_stop_reason': 'stopReason',
    'assignment_authorizations.stop_note_required': 'note',
  },
  'interruption-create': INTERRUPTION,
  'interruption-edit': INTERRUPTION,
  'interruption-end': INTERRUPTION,
  'interruption-correct': INTERRUPTION,
  'driver-create': DRIVER,
  'driver-edit': DRIVER,
  'correct-parties': PARTIES,
  'record-delete': RECORD_DELETE,
  'profile-email': EMAIL_CHANGE,
  'correct-timeline': {
    ...PLANNED_DATES,
    'rental_assignments.return_time_invalid': 'closedAtUtc',
    'rental_assignments.interruption_outside_closure': 'closedAtUtc',
  },
};

export function codeToField(code: string, op?: string): string | undefined {
  if (op && BY_OP[op] && BY_OP[op][code]) return BY_OP[op][code];
  return GLOBAL[code];
}

/** Every code the table knows, for the test that checks them against the backend's catalogue. */
export const KNOWN_CODES: readonly string[] = [
  ...new Set([
    ...Object.keys(GLOBAL),
    ...Object.values(BY_OP).flatMap((t) => Object.keys(t)),
    ...FORM_LEVEL,
  ]),
];

/** The codes that stay form-level on purpose; none of them resolves to an input. */
export const FORM_LEVEL_CODES: readonly string[] = FORM_LEVEL;
