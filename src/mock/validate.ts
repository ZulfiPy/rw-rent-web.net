import { ApiError } from '@/api/problem';

/** FluentValidation keys `errors` by PascalCase property path; handlers pass the UI's camelCase path. */
export const toWireKey = (k: string) =>
  k.split('.').map((part) => part.replace(/^[a-z]/, (c) => c.toUpperCase())).join('.');

/** Field errors in the envelope shape ValidationProblemDetails uses, keyed as the backend keys them. */
export const fieldError = (errors: Record<string, string[]>) =>
  new ApiError(400, {
    status: 400,
    title: 'One or more validation errors occurred.',
    errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [toWireKey(k), v])),
  });

export const conflict = (detail: string, code: string) =>
  new ApiError(409, { status: 409, title: 'Conflict', detail, code });

/**
 * The optimistic-concurrency refusal. Contractual on every audited resource — users, roles,
 * customers, drivers, vehicles, companies, profile, corrections, rental_assignments,
 * assignment_authorizations, assignment_interruptions, system_administrator — whether or not the
 * request carried a token.
 */
export const staleConflict = (resource: string) =>
  new ApiError(409, {
    status: 409,
    title: 'Conflict',
    detail: 'The record was modified by someone else.',
    code: `${resource}.concurrency_conflict`,
  });

export const codedValidation = (detail: string, code: string) =>
  new ApiError(400, { status: 400, title: 'Bad Request', detail, code });

/** The backend's exact messages, measured after trimming. */
export function reasonErrors(value: unknown, field = 'reason'): Record<string, string[]> | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < 3) return { [field]: ['Reason must be at least 3 characters.'] };
  if (text.length > 1000) return { [field]: ['Reason must be at most 1000 characters.'] };
  return null;
}

export function requireReason(value: unknown, field = 'reason'): string {
  const errors = reasonErrors(value, field);
  if (errors) throw fieldError(errors);
  return (value as string).trim();
}

export function requireText(
  value: unknown,
  field: string,
  label: string,
  max: number,
): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw fieldError({ [field]: [`'${label}' must not be empty.`] });
  if (text.length > max) {
    throw fieldError({ [field]: [`The length of '${label}' must be ${max} characters or fewer.`] });
  }
  return text;
}
