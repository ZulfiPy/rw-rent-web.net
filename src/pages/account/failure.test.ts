import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api';
import {
  isExpiredLink, NEEDS_EMAIL_CONFIRMATION, NO_FAILURE, PASSWORD_OR_DEAD_LINK, RATE_LIMITED,
  toAccountFailure, transferAcceptView, TRANSFER_NOT_USABLE, UNREACHABLE,
} from './failure';

describe('account failures', () => {
  it('puts validator messages under their fields', () => {
    const failure = toAccountFailure(new ApiError(400, {
      status: 400,
      title: 'One or more validation errors occurred.',
      errors: { Email: ['The email is not valid.'], Password: ['Too short.'] },
    }));
    expect(failure.fields).toEqual({ email: 'The email is not valid.', password: 'Too short.' });
    expect(failure.message).toBeUndefined();
  });

  it('shows the API detail above the form for a refused sign-in', () => {
    const failure = toAccountFailure(new ApiError(401, {
      status: 401,
      title: 'Unauthorized',
      detail: 'The email or password is invalid.',
      code: 'authentication.invalid_credentials',
    }));
    expect(failure.message).toBe('The email or password is invalid.');
    expect(failure.code).toBe('authentication.invalid_credentials');
    expect(failure.status).toBe(401);
  });

  it('names the unconfirmed-email outcome so the page can offer a resend', () => {
    const failure = toAccountFailure(new ApiError(403, {
      status: 403,
      title: 'Forbidden',
      detail: 'Email confirmation is required before this account can sign in.',
      code: NEEDS_EMAIL_CONFIRMATION,
    }));
    expect(failure.code).toBe(NEEDS_EMAIL_CONFIRMATION);
    expect(failure.message).toContain('Email confirmation is required');
  });

  it('uses its own copy for rate limiting', () => {
    expect(toAccountFailure(new ApiError(429, { status: 429, title: 'Too Many Requests' })).message)
      .toBe(RATE_LIMITED);
  });

  it('recognises an expired or invalid link from its code', () => {
    const expired = toAccountFailure(new ApiError(400, {
      status: 400,
      title: 'Bad Request',
      detail: 'The confirmation link is no longer usable.',
      code: 'registrations.email_confirmation_not_usable',
    }));
    expect(isExpiredLink(expired)).toBe(true);
    expect(isExpiredLink(toAccountFailure(new ApiError(400, { status: 400, title: 'x', code: 'other.code' })))).toBe(false);
  });

  it('says so when the API did not answer at all', () => {
    expect(toAccountFailure(new TypeError('Failed to fetch')).message).toBe('Failed to fetch');
    expect(toAccountFailure('nonsense').message).toBe(UNREACHABLE);
  });
});

describe('the transfer-acceptance page after a refusal (F7-5)', () => {
  /** The API's answer to a wrong password and to a dead link alike, as it arrives live. */
  const notUsable = toAccountFailure(new ApiError(400, {
    status: 400,
    title: 'Bad Request',
    detail: 'The administrator transfer is invalid, expired, cancelled, or already accepted.',
    code: 'system_administrator.transfer_not_usable',
  }));

  it('keeps the form on the ambiguous code and names both causes in the alert slot', () => {
    expect(notUsable.code).toBe(TRANSFER_NOT_USABLE);
    expect(transferAcceptView(true, notUsable)).toEqual({ screen: 'form', message: PASSWORD_OR_DEAD_LINK });
    expect(PASSWORD_OR_DEAD_LINK).toBe(
      'The password did not match, or this link can no longer be used. Check the password and try again; '
      + 'if it keeps failing, ask the administrator for a new link.',
    );
  });

  it('still counts the code as a dead link for the pages that read it that way', () => {
    expect(isExpiredLink(notUsable)).toBe(true);
  });

  it('shows the dead-link screen for a code that can only mean a dead link', () => {
    const notFound = toAccountFailure(new ApiError(404, {
      status: 404,
      title: 'Not Found',
      code: 'system_administrator.transfer_not_found',
    }));
    expect(transferAcceptView(true, notFound)).toEqual({ screen: 'dead-link' });
  });

  it('shows the dead-link screen for a link that carries no token', () => {
    expect(transferAcceptView(false, NO_FAILURE)).toEqual({ screen: 'dead-link' });
    expect(transferAcceptView(false, notUsable)).toEqual({ screen: 'dead-link' });
  });

  it('keeps the form with its own message for every other answer', () => {
    expect(transferAcceptView(true, NO_FAILURE)).toEqual({ screen: 'form', message: undefined });
    const limited = toAccountFailure(new ApiError(429, { status: 429, title: 'Too Many Requests' }));
    expect(transferAcceptView(true, limited)).toEqual({ screen: 'form', message: RATE_LIMITED });
    const tooShort = toAccountFailure(new ApiError(400, {
      status: 400,
      title: 'One or more validation errors occurred.',
      errors: { Password: ['The length of \'Password\' must be at least 12 characters.'] },
    }));
    expect(transferAcceptView(true, tooShort)).toEqual({ screen: 'form', message: undefined });
    expect(tooShort.fields.password).toMatch(/at least 12 characters/);
  });
});
