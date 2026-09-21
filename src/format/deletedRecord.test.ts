import { describe, expect, test } from 'vitest';
import { deletedRecord, diffRows } from './auditPayload';
import { formatLocalStamp } from './datetime';
import { rentalEntry, vehicleEntry } from '@/pages/followup8.support';

/**
 * Follow-up 8: the audit entry of a deletion shows the copy of the record it removed. The payload
 * reader learns this one shape — the six `*.Deleted` events of the backend's round 7 — and every
 * other payload, a malformed one included, renders exactly as before.
 */

describe('the copy of a deleted vehicle', () => {
  const copy = deletedRecord(vehicleEntry.eventType, vehicleEntry.beforeJson);

  test('names the record by the label the page showed, and keeps the label, reason and note out of the facts', () => {
    expect(copy?.recordLabel).toMatch(/^913 R.. · Citroen Berlingo 2019$/);
    const keys = copy!.facts.map((fact) => fact.key);
    expect(keys).not.toContain('RecordLabel');
    expect(keys).not.toContain('DeletionReason');
    expect(keys).not.toContain('DeletionNote');
    expect(keys).toEqual(expect.arrayContaining(['PlateNumber', 'VinCode', 'Make', 'Model', 'Year', 'IsActive']));
    expect(copy!.authorizations).toEqual([]);
    expect(copy!.interruptions).toEqual([]);
  });

  test('reads the record first, then who made and changed it, then the identifiers', () => {
    const keys = copy!.facts.map((fact) => fact.key);
    const at = (key: string) => keys.indexOf(key);
    expect(at('Make')).toBeLessThan(at('PlateNumber'));
    expect(at('Year')).toBeLessThan(at('CreatedAtUtc'));
    expect(keys.slice(keys.indexOf('CreatedAtUtc'), keys.indexOf('CreatedAtUtc') + 4))
      .toEqual(['CreatedAtUtc', 'CreatedByDisplayName', 'UpdatedAtUtc', 'UpdatedByDisplayName']);
    expect(at('UpdatedByDisplayName')).toBeLessThan(at('Id'));
  });

  test('shows an instant in local time and a machine value in the mono face', () => {
    const created = copy!.facts.find((fact) => fact.key === 'CreatedAtUtc')!;
    const raw = JSON.parse(vehicleEntry.beforeJson!).CreatedAtUtc as string;
    expect(created).toMatchObject({ label: 'Created At', value: formatLocalStamp(raw), mono: true });
    expect(copy!.facts.find((fact) => fact.key === 'Id')?.mono).toBe(true);
    expect(copy!.facts.find((fact) => fact.key === 'Make')).toMatchObject({ value: 'Citroen', mono: false });
  });
});

describe('the copy of a deleted rental', () => {
  const copy = deletedRecord(rentalEntry.eventType, rentalEntry.beforeJson);

  test('holds its own members, and one group per part that went with it', () => {
    expect(copy?.recordLabel).toBe('400 NDP · Roberts Liepins');
    expect(copy!.facts.map((fact) => fact.key)).toEqual(expect.arrayContaining(['Status', 'CustomerDisplayName', 'VehiclePlateNumber']));
    expect(copy!.facts.map((fact) => fact.key)).not.toContain('Authorizations');
    expect(copy!.authorizations).toHaveLength(1);
    expect(copy!.interruptions).toHaveLength(1);
    expect(copy!.authorizations[0]!.find((fact) => fact.key === 'DriverDisplayName')?.value).toBe('Laura Ozola');
    expect(copy!.interruptions[0]!.find((fact) => fact.key === 'Reason')?.value).toBe('VacationOrLeave');
  });
});

describe('everything else renders as it did', () => {
  test('another event, the Company’s own deletion included, is not read as a deleted record', () => {
    expect(deletedRecord('Company.Deleted', '{"Name":"RW-Rent","RegistrationNumber":"1","VatNumber":null}')).toBeNull();
    expect(deletedRecord('RentalAssignment.Cancelled', rentalEntry.beforeJson)).toBeNull();
    expect(deletedRecord(null, vehicleEntry.beforeJson)).toBeNull();
  });

  test('a malformed copy falls back, and the ordinary views take it exactly as before', () => {
    for (const malformed of [null, '', 'not json', '[]', '{}', '{"RecordLabel":"x","Nested":{"a":1}}',
      '{"RecordLabel":"x","Other":[1,2]}', '{"RecordLabel":"x","Authorizations":[1]}',
      '{"RecordLabel":"x","Interruptions":{"a":1}}']) {
      expect(deletedRecord('Vehicle.Deleted', malformed), String(malformed)).toBeNull();
    }
    // What the page then shows is the unchanged reader's answer: a flat copy as before → after, and
    // anything else as the unrecognised-shape fallback.
    expect(diffRows('{"RecordLabel":"x","Nested":{"a":1}}', null)).toBeNull();
    expect(diffRows('{"Make":"Citroen"}', null)).toEqual([{ label: 'Make', value: 'Citroen  →  —', unchanged: false }]);
  });
});
