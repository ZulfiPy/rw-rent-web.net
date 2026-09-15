import { fieldMessages, isApiError, toFailure, type Failure } from '@/api';

/**
 * What a public account form renders. The shell's dialogs have their own envelope (stale,
 * conflict, forbidden); a sign-in or a reset has three outcomes only: messages under fields, one
 * message above the form, and the coded reason the page may want to act on.
 */
export interface AccountFailure {
  /** Keyed by the input's JSON name, as the dialogs key theirs. */
  fields: Record<string, string>;
  /** The message above the form, when the failure is not about one input. */
  message: string | undefined;
  code: string | undefined;
  status: number | undefined;
}

export const RATE_LIMITED = 'Too many attempts. Try again in a minute.';
export const UNREACHABLE = 'The service did not answer. Check your connection and try again.';

export const NO_FAILURE: AccountFailure = {
  fields: {},
  message: undefined,
  code: undefined,
  status: undefined,
};

export function toAccountFailure(error: unknown): AccountFailure {
  if (!isApiError(error)) {
    return { ...NO_FAILURE, message: error instanceof Error ? error.message || UNREACHABLE : UNREACHABLE };
  }

  const { status, problem } = error;
  const detail = problem.detail || problem.title;

  // 429 has no useful body: the API answers with the rate limiter's own problem.
  if (status === 429) return { fields: {}, message: RATE_LIMITED, code: error.code, status };

  const failure: Failure = toFailure(error);
  if (failure.kind === 'field' || failure.kind === 'field-code') {
    return { fields: fieldMessages(failure), message: undefined, code: error.code, status };
  }

  return { fields: {}, message: detail || 'The request was refused.', code: error.code, status };
}

/** A link that has expired or was never valid: every token endpoint has its own code for it. */
const EXPIRED_CODES = new Set([
  'registrations.email_confirmation_not_usable',
  'authentication.password_reset_invalid',
  'profile.email_change_invalid',
  'system_administrator.transfer_not_found',
  'system_administrator.transfer_not_usable',
]);

export const isExpiredLink = (failure: AccountFailure): boolean =>
  !!failure.code && EXPIRED_CODES.has(failure.code);

/** Sign-in refused because the email was never confirmed: the page offers to send it again. */
export const NEEDS_EMAIL_CONFIRMATION = 'authentication.email_confirmation_required';
