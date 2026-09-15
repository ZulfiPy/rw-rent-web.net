import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api';
import {
  isExpiredLink, NEEDS_EMAIL_CONFIRMATION, RATE_LIMITED, toAccountFailure, UNREACHABLE,
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
