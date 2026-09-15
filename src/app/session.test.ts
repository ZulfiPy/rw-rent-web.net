import { afterEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api';
import {
  beginSignOut, consumeSessionEnd, endSession, endSignOut, getSessionEnd, isSessionEnded,
  ownsUnauthorized, resetSessionEnd, samePathOnly, subscribeSessionEnd,
} from './session';

afterEach(() => resetSessionEnd());

describe('session end signal', () => {
  it('raises once and carries the path to come back to', () => {
    let notified = 0;
    subscribeSessionEnd(() => { notified += 1; });

    endSession('/rental-assignments/abc?tab=history');
    expect(getSessionEnd()).toEqual({ returnTo: '/rental-assignments/abc?tab=history' });
    expect(notified).toBe(1);

    // A second 401 while the first is pending collapses into it.
    endSession('/vehicles');
    expect(getSessionEnd()).toEqual({ returnTo: '/rental-assignments/abc?tab=history' });
    expect(notified).toBe(1);

    consumeSessionEnd();
    expect(getSessionEnd()).toBeNull();
    expect(notified).toBe(2);
  });

  it('raises nothing once the sign-in page is already open', () => {
    endSession('/sign-in');
    expect(getSessionEnd()).toBeNull();
    endSession('/sign-in?next=/vehicles');
    expect(getSessionEnd()).toBeNull();
  });

  it('raises nothing while the user is signing out on purpose', () => {
    beginSignOut();
    endSession('/profile');
    expect(getSessionEnd()).toBeNull();

    endSignOut();
    endSession('/profile');
    expect(getSessionEnd()).toEqual({ returnTo: '/profile' });
  });

  it('refuses anything that is not a same-origin path', () => {
    expect(samePathOnly('https://evil.example/steal')).toBeUndefined();
    expect(samePathOnly('//evil.example/steal')).toBeUndefined();
    expect(samePathOnly('drivers')).toBeUndefined();
    expect(samePathOnly('/drivers')).toBe('/drivers');
    expect(samePathOnly(undefined)).toBeUndefined();

    endSession('https://evil.example/steal');
    expect(getSessionEnd()?.returnTo).toBe('/overview');
  });

  it('recognises only a 401 as an ended session', () => {
    expect(isSessionEnded(new ApiError(401, { title: 'Unauthorized' }))).toBe(true);
    expect(isSessionEnded(new ApiError(403, { title: 'Forbidden' }))).toBe(false);
    expect(isSessionEnded(new Error('offline'))).toBe(false);
  });

  it('lets a request own its own 401', () => {
    expect(ownsUnauthorized({ ownsUnauthorized: true })).toBe(true);
    expect(ownsUnauthorized({})).toBe(false);
    expect(ownsUnauthorized(undefined)).toBe(false);
  });
});
