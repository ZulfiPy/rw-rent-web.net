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

/**
 * The transfer acceptance answers a wrong password with the same code as a dead link, on purpose:
 * the answer never says which of the two was wrong. The page used to read that code as a dead link
 * and replace the form with "This transfer link cannot be used", so a person who had only mistyped
 * their password was told to ask for a new link they did not need (F7-5, the owner's decision on the
 * Follow-up 6 report).
 */
export const TRANSFER_NOT_USABLE = 'system_administrator.transfer_not_usable';

/** The message in the form's alert slot for that code: both causes, and what to do about each. */
export const PASSWORD_OR_DEAD_LINK =
  'The password did not match, or this link can no longer be used. Check the password and try again; '
  + 'if it keeps failing, ask the administrator for a new link.';

export type TransferAcceptView =
  | { screen: 'form'; message: string | undefined }
  | { screen: 'dead-link' };

/**
 * What the transfer-acceptance page shows: the form, with the message for its alert slot, or the
 * dead-link screen. The ambiguous code keeps the form; the dead-link screen stays for a link with no
 * token and for the codes that can only mean a dead link.
 */
export function transferAcceptView(hasToken: boolean, failure: AccountFailure): TransferAcceptView {
  if (!hasToken) return { screen: 'dead-link' };
  if (failure.code === TRANSFER_NOT_USABLE) return { screen: 'form', message: PASSWORD_OR_DEAD_LINK };
  if (isExpiredLink(failure)) return { screen: 'dead-link' };
  return { screen: 'form', message: failure.message };
}

/** Sign-in refused because the email was never confirmed: the page offers to send it again. */
export const NEEDS_EMAIL_CONFIRMATION = 'authentication.email_confirmation_required';
