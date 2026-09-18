import { describe, expect, test } from 'vitest';
import { auditFieldLabel, diffRows } from './auditPayload';

describe('audit payloads read in Tallinn time (F7-1)', () => {
  test('an instant in a payload is shown as the local stamp, in both seasons', () => {
    // The seeded timeline correction's own values, one of them moved into winter.
    const rows = diffRows(
      '{"StartedAtUtc":"2026-01-23T10:15:00+00:00"}',
      '{"StartedAtUtc":"2026-07-23T08:30:00+00:00"}',
    );
    expect(rows).toEqual([
      { label: 'Started At', value: '2026-01-23 12:15  →  2026-07-23 11:30', unchanged: false },
    ]);
  });

  test('a role grant\'s expiry in an activation is local', () => {
    const rows = diffRows(null, JSON.stringify({
      Roles: [
        { Role: 'FleetManager', ExpiresAtUtc: '2026-12-31T21:59:59.999Z' },
        { Role: 'Viewer', ExpiresAtUtc: null },
      ],
    }));
    expect(rows).toEqual([
      { label: 'Roles', value: 'Fleet Manager — expires 2026-12-31 23:59\nViewer — no expiry', unchanged: false },
    ]);
  });

  test('a field label no longer claims UTC for a value shown in local time', () => {
    expect(auditFieldLabel('RegistrationExpiresAtUtc')).toBe('Registration Expires At');
    expect(auditFieldLabel('ExpiresAtUtc')).toBe('Expires At');
    expect(auditFieldLabel('PhoneNumber')).toBe('Phone Number');
  });

  test('a value that is not an instant is shown as it is', () => {
    expect(diffRows('{"LastName":"Krumina"}', '{"LastName":"Smite"}')).toEqual([
      { label: 'Last Name', value: 'Krumina  →  Smite', unchanged: false },
    ]);
  });
});
