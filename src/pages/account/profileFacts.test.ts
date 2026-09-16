import { describe, expect, it } from 'vitest';
import { ApplicationUserStatus, type CurrentUserResponse } from '@/api/dto';
import { passwordChangedFact, pendingEmailFact } from './profileFacts';

const me = (over: Partial<CurrentUserResponse> = {}): CurrentUserResponse => ({
  id: '11111111-1111-1111-1111-111111111111',
  email: 'signe.priede@rwrent.example',
  firstName: 'Signe',
  lastName: 'Priede',
  phoneNumber: '+371 29 000 002',
  status: ApplicationUserStatus.Active,
  passwordChangedAtUtc: '2026-08-23T11:57:00Z',
  roles: [],
  permissions: [],
  ...over,
});

describe('the Sign-in & security facts', () => {
  it('names the address that is waiting for confirmation', () => {
    expect(pendingEmailFact('new.address@rwrent.example'))
      .toBe('new.address@rwrent.example — awaiting confirmation');
  });

  it('says None when no change is open', () => {
    expect(pendingEmailFact(null)).toBe('None');
    expect(pendingEmailFact(undefined)).toBe('None');
    expect(pendingEmailFact('')).toBe('None');
  });

  it('renders the instant the password was set', () => {
    // formatLocal's own shape: Europe/Tallinn, and the year only when it is not the current one.
    expect(passwordChangedFact(me())).toBe('23 Aug, 14:57');
    expect(passwordChangedFact(me({ passwordChangedAtUtc: '2025-08-11T09:07:28Z' })))
      .toBe('11 Aug 2025, 12:07');
  });

  it('falls back to the dash while the session has not answered', () => {
    expect(passwordChangedFact(undefined)).toBe('—');
    expect(passwordChangedFact(me({ passwordChangedAtUtc: '' }))).toBe('—');
  });
});
