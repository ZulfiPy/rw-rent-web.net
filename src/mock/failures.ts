import { ApiError } from '@/api/problem';
import type { Method } from '@/api/transport';
import { toWireKey } from './validate';

/**
 * The PROTOTYPE panel's "next action fails as" control, living at the mock api boundary. Components
 * never see it. Every mode throws the same envelope shape the real API returns.
 */
export type FailureMode = 'none' | 'fields' | 'conflict' | 'stale';

export const FAILURE_MODES: Array<[FailureMode, string]> = [
  ['none', 'None — succeed'],
  ['fields', 'Field errors'],
  ['conflict', 'Conflict'],
  ['stale', 'Stale record'],
];

export const GENERIC_REFUSAL = 'The API refused this change because the record no longer accepts it.';

interface Sim {
  /** Keyed by the request-body property the message belongs under. */
  fields?: Record<string, string>;
  conflict?: string;
}

/** Simulated refusals, carried over verbatim from the reviewed prototype. */
export const FAIL_SIM: Record<string, Sim> = {
  'me-password': { fields: { currentPassword: 'That is not your current password.', newPassword: 'Needs an upper case letter, a lower case letter, a digit and a symbol.' }, conflict: 'Your password was changed from another session. Sign in again before changing it here.' },
  'me-phone': { fields: { phoneNumber: 'Enter the number in international format, for example +371 29 000 001.' }, conflict: 'Another session updated your phone number a moment ago.' },
  'me-email': { fields: { newEmail: 'That address is already registered to another account.', currentPassword: 'That is not your current password.' }, conflict: 'A confirmation for a different address is already pending. Cancel it before starting another change.' },
  'role-expiry': { fields: { expiresAtUtc: 'Expiry must be after the date the role was granted.' }, conflict: 'An expired role assignment is historical and cannot be changed.' },
  'role-grant': { fields: { expiresAtUtc: 'The expiry must be a future date.' }, conflict: 'The user already holds this role under an effective assignment.' },
  'role-revoke': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'That role assignment is no longer effective.' },
  'session-revoke': { conflict: 'That session has already ended.' },
  'session-revoke-all': { conflict: 'Another administrator is already revoking this user\u2019s sessions.' },
  'user-activate': { conflict: 'The registration was rejected while you had this open.' },
  'user-reject': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The registration is no longer awaiting a decision.' },
  'user-reopen': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The registration is no longer in a state that can be reopened.' },
  'user-correct-name': { fields: { lastName: 'The corrected name must differ from the recorded one.' }, conflict: 'The user record changed while you had this open.' },
  'user-suspend': { conflict: 'The user is already suspended.' },
  'user-restore': { conflict: 'The user is not suspended.' },
  'company-create': { fields: { registrationNumber: 'That registration number belongs to another Company.' }, conflict: 'The operating Company already exists.' },
  'company-edit': { fields: { registrationNumber: 'That registration number belongs to another Company.' }, conflict: 'The Company profile changed while you had this open.' },
  'company-delete': { conflict: 'The Company is still referenced and cannot be deleted.' },
  'transfer-initiate': { fields: { targetEmail: 'That account cannot receive the transfer.', currentPassword: 'That is not your current password.' }, conflict: 'A transfer is already pending. Cancel it before starting another.' },
  'transfer-resend': { fields: { currentPassword: 'That is not your current password.' }, conflict: 'The transfer was accepted moments ago and can no longer be resent.' },
  'transfer-cancel': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The transfer was accepted moments ago and can no longer be cancelled.' },
  'vehicle-create': { fields: { vinCode: 'Another vehicle is already registered with this VIN code.' }, conflict: 'A vehicle with this plate number was created moments ago.' },
  'vehicle-edit': { fields: { vinCode: 'Another vehicle is already registered with this VIN code.' }, conflict: 'The vehicle was changed by someone else while you had this open.' },
  'vehicle-toggle': { conflict: 'The vehicle is on a planned or active assignment and cannot be deactivated.' },
  'customer-create': { fields: { email: 'That email address is already used by another customer.' }, conflict: 'A customer with these details was created moments ago.' },
  'customer-edit': { fields: { email: 'That email address is already used by another customer.' }, conflict: 'The customer was changed by someone else while you had this open.' },
  'customer-toggle': { conflict: 'The customer has a planned or active assignment and cannot be deactivated.' },
  'driver-create': { fields: { driverLicenseNumber: 'Another driver already holds this licence number.' }, conflict: 'A driver with this licence number was created moments ago.' },
  'driver-edit': { fields: { driverLicenseNumber: 'Another driver already holds this licence number.' }, conflict: 'The driver was changed by someone else while you had this open.' },
  'driver-toggle': { conflict: 'The driver holds an open authorization on an active assignment and cannot be deactivated.' },
  'assignment-create': { fields: { vehicleId: 'The vehicle is already booked for part of this period.' }, conflict: 'The vehicle was assigned to another customer moments ago.' },
  'assignment-edit': { fields: { plannedEndAtUtc: 'The vehicle is already booked for part of this period.' }, conflict: 'The assignment changed while you had this open.' },
  'assignment-activate': { fields: { startedAtUtc: 'The actual start cannot be in the future.' }, conflict: 'The assignment was cancelled while you had this open.' },
  'assignment-end': { fields: { closedAtUtc: 'The return time cannot be earlier than the actual start.' }, conflict: 'The assignment was already ended by someone else.' },
  'assignment-cancel': { fields: { note: 'A cancellation reason is required.' }, conflict: 'The assignment was activated while you had this open and can no longer be cancelled.' },
  'correct-parties': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The assignment changed while you had this open.' },
  'correct-timeline': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The assignment changed while you had this open.' },
  'auth-start': { fields: { authorizedFromUtc: 'The authorization cannot start before the assignment does.' }, conflict: 'The assignment was ended while you had this open.' },
  'auth-stop': { fields: { stoppedAtUtc: 'The stop time cannot be earlier than the authorization start.' }, conflict: 'That authorization was already stopped.' },
  'auth-correct': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The authorization was stopped while you had this open.' },
  'interruption-create': { fields: { startedAtUtc: 'The interruption must fall inside the assignment period.' }, conflict: 'An open interruption already exists on this assignment.' },
  'interruption-edit': { fields: { startedAtUtc: 'The interruption must fall inside the assignment period.' }, conflict: 'The interruption changed while you had this open.' },
  'interruption-end': { fields: { endedAtUtc: 'The end cannot be earlier than the interruption start.' }, conflict: 'That interruption was already ended.' },
  'interruption-correct': { fields: { reason: 'Reason must be at least 3 characters.' }, conflict: 'The interruption changed while you had this open.' },
};

/** method + path template → the FAIL_SIM key, so the simulator needs nothing from the caller. */
const OPS: Array<[Method, string, string]> = [
  ['POST', '/api/me/password', 'me-password'],
  ['PUT', '/api/me/phone', 'me-phone'],
  ['POST', '/api/me/email-change', 'me-email'],
  ['POST', '/api/users/{userId}/activate', 'user-activate'],
  ['POST', '/api/users/{userId}/reject-registration', 'user-reject'],
  ['POST', '/api/users/{userId}/reopen-registration', 'user-reopen'],
  ['PUT', '/api/users/{userId}/name', 'user-correct-name'],
  ['POST', '/api/users/{userId}/suspend', 'user-suspend'],
  ['POST', '/api/users/{userId}/restore', 'user-restore'],
  ['POST', '/api/users/{userId}/roles', 'role-grant'],
  ['PUT', '/api/users/{userId}/roles/{assignmentId}/expiry', 'role-expiry'],
  ['POST', '/api/users/{userId}/roles/{assignmentId}/revoke', 'role-revoke'],
  ['DELETE', '/api/users/{userId}/sessions/{sessionId}', 'session-revoke'],
  ['POST', '/api/users/{userId}/sessions/revoke-all', 'session-revoke-all'],
  ['POST', '/api/companies', 'company-create'],
  ['PUT', '/api/companies/{id}', 'company-edit'],
  ['DELETE', '/api/companies/{id}', 'company-delete'],
  ['POST', '/api/system-administrator/transfers', 'transfer-initiate'],
  ['POST', '/api/system-administrator/transfers/{transferId}/resend', 'transfer-resend'],
  ['POST', '/api/system-administrator/transfers/{transferId}/cancel', 'transfer-cancel'],
  ['POST', '/api/vehicles', 'vehicle-create'],
  ['PUT', '/api/vehicles/{id}', 'vehicle-edit'],
  ['POST', '/api/vehicles/{id}/activate', 'vehicle-toggle'],
  ['POST', '/api/vehicles/{id}/deactivate', 'vehicle-toggle'],
  ['POST', '/api/customers', 'customer-create'],
  ['PUT', '/api/customers/{id}', 'customer-edit'],
  ['POST', '/api/customers/{id}/activate', 'customer-toggle'],
  ['POST', '/api/customers/{id}/deactivate', 'customer-toggle'],
  ['POST', '/api/drivers', 'driver-create'],
  ['PUT', '/api/drivers/{id}', 'driver-edit'],
  ['POST', '/api/drivers/{id}/activate', 'driver-toggle'],
  ['POST', '/api/drivers/{id}/deactivate', 'driver-toggle'],
  ['POST', '/api/rental-assignments', 'assignment-create'],
  ['PUT', '/api/rental-assignments/{id}', 'assignment-edit'],
  ['POST', '/api/rental-assignments/{id}/activate', 'assignment-activate'],
  ['POST', '/api/rental-assignments/{id}/end', 'assignment-end'],
  ['POST', '/api/rental-assignments/{id}/cancel', 'assignment-cancel'],
  ['PUT', '/api/rental-assignments/{id}/corrections/parties', 'correct-parties'],
  ['PUT', '/api/rental-assignments/{id}/corrections/timeline', 'correct-timeline'],
  ['POST', '/api/rental-assignments/{assignmentId}/authorizations', 'auth-start'],
  ['POST', '/api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/stop', 'auth-stop'],
  ['PUT', '/api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/correction', 'auth-correct'],
  ['POST', '/api/rental-assignments/{assignmentId}/interruptions', 'interruption-create'],
  ['PUT', '/api/rental-assignments/{assignmentId}/interruptions/{interruptionId}', 'interruption-edit'],
  ['POST', '/api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/end', 'interruption-end'],
  ['PUT', '/api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/correction', 'interruption-correct'],
];

export const opFor = (method: Method, template: string): string | undefined =>
  OPS.find(([m, t]) => m === method && t === template)?.[2];

/** The resource prefix used by the backend's concurrency code, e.g. rental_assignments. */
const conflictCodeFor = (template: string) => {
  const segment = template.split('/')[2] ?? 'resource';
  return segment.replace(/-/g, '_');
};

/** Throws the simulated envelope, or returns when the mode is none. */
export function simulateFailure(mode: FailureMode, method: Method, template: string): void {
  if (mode === 'none') return;
  const op = opFor(method, template);
  const sim = op ? FAIL_SIM[op] : undefined;
  const resource = conflictCodeFor(template);

  if (mode === 'fields' && sim?.fields) {
    const errors: Record<string, string[]> = {};
    for (const [field, message] of Object.entries(sim.fields)) errors[toWireKey(field)] = [message];
    throw new ApiError(400, {
      status: 400,
      title: 'One or more validation errors occurred.',
      errors,
    });
  }
  if (mode === 'stale') {
    throw new ApiError(409, {
      status: 409,
      title: 'Conflict',
      detail: 'The record was modified by someone else.',
      code: `${resource}.concurrency_conflict`,
    });
  }
  // fields with no simulated field messages degrades to the conflict banner, as in the prototype.
  throw new ApiError(409, {
    status: 409,
    title: 'Conflict',
    detail: sim?.conflict ?? GENERIC_REFUSAL,
    code: `${resource}.conflict`,
  });
}
