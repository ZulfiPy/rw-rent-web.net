import { describe, expect, it } from 'vitest';
import { emailLooksValid, passwordMeetsRules, passwordRules } from './password';

const met = (value: string) => passwordRules(value).filter((r) => r.ok).map((r) => r.key);

describe('passwordRules', () => {
  it('lists the four rules the API enforces, in the prototype’s order', () => {
    // The prototype's fifth line asked for a lowercase letter, which Identity does not require;
    // the owner dropped it on 2026-09-16 so the checklist cannot refuse what the server accepts.
    expect(passwordRules('').map((r) => r.label)).toEqual([
      'At least 12 characters',
      'One uppercase letter',
      'One digit',
      'One symbol',
    ]);
  });

  it('accepts a password with no lowercase letter, as the API does', () => {
    expect(passwordMeetsRules('HARBOUR-LANE-2026!')).toBe(true);
  });

  it('meets nothing on an empty password', () => {
    expect(met('')).toEqual([]);
    expect(passwordMeetsRules('')).toBe(false);
  });

  it('checks each rule on its own', () => {
    expect(met('aaaaaaaaaaaa')).toEqual(['len']);
    expect(met('AAAAAAAAAAAA')).toEqual(['len', 'upper']);
    expect(met('Aa1!')).toEqual(['upper', 'digit', 'sym']);
  });

  it('does not count a space as the symbol, because the API does not', () => {
    expect(met('Abcdefgh 123')).toEqual(['len', 'upper', 'digit']);
    expect(passwordMeetsRules('Abcdefgh 123')).toBe(false);
  });

  it('accepts a password that satisfies all five', () => {
    expect(passwordMeetsRules('Fleet-Ops-2026!')).toBe(true);
    expect(passwordRules('Fleet-Ops-2026!').every((r) => r.icon === 'check_circle')).toBe(true);
  });

  it('marks an unmet rule with the empty glyph', () => {
    expect(passwordRules('abc').map((r) => r.icon)).toContain('radio_button_unchecked');
  });
});

describe('emailLooksValid', () => {
  it('is the prototype’s own check: an address needs an at sign', () => {
    expect(emailLooksValid('someone@rwrent.example')).toBe(true);
    expect(emailLooksValid('someone')).toBe(false);
    expect(emailLooksValid('')).toBe(false);
  });
});
