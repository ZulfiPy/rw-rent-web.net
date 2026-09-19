import { describe, expect, test } from 'vitest';
import { NOT_CHANGED, createdByName, lastChangedByName, recordedBy } from './recordNames';

/**
 * F7-6: who created a record and who last changed it, as the record names them (the backend's
 * AUDIT-010). "System" is the technical actor alone, exactly as on the audit pages.
 */
describe('who created a record', () => {
  test('is the person the record names', () => {
    expect(createdByName({ createdByDisplayName: 'Karlis Zvaigzne' })).toBe('Karlis Zvaigzne');
  });

  test('is "System" when the record names nobody: every record has a creator, so it was the technical actor', () => {
    expect(createdByName({ createdByDisplayName: null })).toBe('System');
  });
});

describe('who last changed a record', () => {
  test('is the person the record names, beside the instant of the change', () => {
    expect(lastChangedByName({
      updatedAtUtc: '2026-09-19T06:25:01.519419+00:00',
      updatedByDisplayName: 'Signe Priede',
    })).toBe('Signe Priede');
  });

  test('is nobody while the record was never changed', () => {
    expect(lastChangedByName({ updatedAtUtc: null, updatedByDisplayName: null })).toBe(NOT_CHANGED);
    expect(NOT_CHANGED).toBe('Not changed since it was created');
  });

  test('is "System" when a change is recorded without a name: the technical actor made it', () => {
    expect(lastChangedByName({ updatedAtUtc: '2026-09-19T06:25:01Z', updatedByDisplayName: null })).toBe('System');
  });

  test('never names anyone when there is no change, whatever the name says', () => {
    expect(lastChangedByName({ updatedAtUtc: null, updatedByDisplayName: 'Signe Priede' })).toBe(NOT_CHANGED);
  });
});

describe('the row line of an authorization or an interruption', () => {
  test('says who recorded it', () => {
    expect(recordedBy({ createdByDisplayName: 'Karlis Zvaigzne' })).toBe('Recorded by Karlis Zvaigzne');
    expect(recordedBy({ createdByDisplayName: null })).toBe('Recorded by System');
  });
});
