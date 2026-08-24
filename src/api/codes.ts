/**
 * code → input mapping for the coded 400 shape.
 *
 * Two 400 shapes reach here. A filter-level rejection carries `errors` and no `code`; a service-level
 * validation refusal carries `code` + `detail` and no `errors`. Both end up as field errors when the
 * path or code names an input, and as the form-level validation message when it does not.
 *
 * Entries are added only for codes the backend actually returns — never a guessed field.
 *
 * Keys are the field paths the dialogs use for their inputs. `roles[].expiresAtUtc` addresses every
 * role-expiry input in the activation dialog: the backend does not say which grant failed. Indexed
 * paths from `errors` resolve against the same key through fieldMessages().
 */
const GLOBAL: Record<string, string> = {
  // The role's expiry input; the activation dialog highlights every role-expiry field.
  'users.activation_role_expiry_invalid': 'roles[].expiresAtUtc',
};

/** Per-operation overrides, keyed by the `op` passed to toFailure(). */
const PARTIES: Record<string, string> = {
  'rental_assignments.customer_not_found': 'customerId',
  'rental_assignments.customer_inactive': 'customerId',
  'rental_assignments.collective_not_valid_for_customer': 'customerId',
  'rental_assignments.vehicle_not_found': 'vehicleId',
  'rental_assignments.vehicle_inactive': 'vehicleId',
  'rental_assignments.vehicle_already_active': 'vehicleId',
};

const PLANNED_DATES: Record<string, string> = {
  'rental_assignments.planned_start_required': 'plannedStartAtUtc',
  'rental_assignments.planned_range_overlap': 'plannedStartAtUtc',
  'rental_assignments.planned_end_before_start': 'plannedEndAtUtc',
};

/** AUTH-002/003/006/009 name an input; the coverage refusal is form-level by design. */
const AUTH_SHAPE: Record<string, string> = {
  'assignment_authorizations.driver_required': 'driverId',
  'assignment_authorizations.driver_not_found': 'driverId',
  'assignment_authorizations.driver_inactive': 'driverId',
  'assignment_authorizations.driver_already_open': 'driverId',
  'assignment_authorizations.collective_requires_business': 'authorizationType',
  'assignment_authorizations.collective_already_open': 'authorizationType',
  'assignment_authorizations.named_and_collective_exclusive': 'authorizationType',
  'assignment_authorizations.from_required': 'authorizedFromUtc',
};

const INTERRUPTION: Record<string, string> = {
  'assignment_interruptions.started_at_required': 'startedAtUtc',
  'assignment_interruptions.before_assignment_start': 'startedAtUtc',
  'assignment_interruptions.ended_at_required': 'endedAtUtc',
  'assignment_interruptions.ended_before_start': 'endedAtUtc',
  'assignment_interruptions.after_assignment_close': 'endedAtUtc',
  'assignment_interruptions.reason_required': 'reason',
  'assignment_interruptions.billing_impact_required': 'billingImpact',
};

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
    'rental_assignments.closed_at_required': 'closedAtUtc',
    'rental_assignments.closed_before_start': 'closedAtUtc',
  },
  'assignment-cancel': { 'rental_assignments.closed_at_required': 'closedAtUtc' },
  'auth-start': AUTH_SHAPE,
  'auth-stop': {
    ...AUTH_SHAPE,
    'assignment_authorizations.stopped_at_required': 'stoppedAtUtc',
    'assignment_authorizations.stopped_before_start': 'stoppedAtUtc',
    'assignment_authorizations.stop_reason_required': 'stopReason',
  },
  'auth-correct': {
    ...AUTH_SHAPE,
    'assignment_authorizations.stopped_before_start': 'stoppedAtUtc',
    'assignment_authorizations.stop_reason_required': 'stopReason',
  },
  'interruption-create': INTERRUPTION,
  'interruption-edit': INTERRUPTION,
  'interruption-end': INTERRUPTION,
  'interruption-correct': INTERRUPTION,
  'correct-parties': PARTIES,
  'correct-timeline': {
    ...PLANNED_DATES,
    'rental_assignments.closed_before_start': 'closedAtUtc',
  },
};

export function codeToField(code: string, op?: string): string | undefined {
  if (op && BY_OP[op] && BY_OP[op][code]) return BY_OP[op][code];
  return GLOBAL[code];
}
