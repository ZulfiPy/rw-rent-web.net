import { describe, expect, test } from 'vitest';
import { deletedRecord, diffRows } from './auditPayload';
import { formatLocalStamp } from './datetime';
import { rentalEntry, vehicleEntry } from '@/pages/followup8.support';
import {
  customerWithRentalsEntry, driverWithLinksEntry, removedWithDriverEntry, vehicleWithRentalsEntry,
} from '@/pages/followup9.support';

/**
 * Follow-ups 8 and 9: the audit entry of a deletion shows the copy of the record it removed. The
 * payload reader learns these shapes — the six `*.Deleted` events, with round 8's rentals of a
 * vehicle or a customer and a driver's authorizations and cleared links, and round 8's copy of an
 * authorization that went with its driver — and every other payload, a malformed one included,
 * renders exactly as before.
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

describe('the copies round 8 writes (Follow-up 9)', () => {
  test('a vehicle’s entry carries each rental that went with it, with its own label and parts', () => {
    const copy = deletedRecord(vehicleWithRentalsEntry.eventType, vehicleWithRentalsEntry.beforeJson)!;
    expect(copy.recordLabel).toMatch(/ · Toyota Yaris 2021$/);
    expect(copy.facts.map((fact) => fact.key)).not.toContain('RentalAssignments');
    expect(copy.rentals).toHaveLength(2);
    const labels = copy.rentals.map((rental) => rental.recordLabel);
    expect(labels.some((label) => /Riga Bakery/.test(label ?? ''))).toBe(true);
    expect(labels.some((label) => /Sea Tours/.test(label ?? ''))).toBe(true);
    // Each rental's facts leave its label out, as the record's own do; its parts are groups of their own.
    expect(copy.rentals.every((rental) => !rental.facts.some((fact) => fact.key === 'RecordLabel'))).toBe(true);
    expect(copy.rentals.reduce((n, rental) => n + rental.authorizations.length, 0)).toBe(2);
    expect(copy.rentals.reduce((n, rental) => n + rental.interruptions.length, 0)).toBe(1);
    expect(copy.authorizations).toEqual([]);
    expect(copy.clearedLinks).toEqual([]);
    expect(copy.removedWith).toBeNull();
  });

  test('a customer’s entry does the same', () => {
    const copy = deletedRecord(customerWithRentalsEntry.eventType, customerWithRentalsEntry.beforeJson)!;
    expect(copy.rentals.map((rental) => rental.facts.find((fact) => fact.key === 'Status')?.value).sort())
      .toEqual(['Ended', 'Planned']);
  });

  test('a driver’s entry carries their authorizations, each naming its rental, and the cleared links', () => {
    const copy = deletedRecord(driverWithLinksEntry.eventType, driverWithLinksEntry.beforeJson)!;
    expect(copy.recordLabel).toMatch(/^Arta Skuja · /);
    expect(copy.authorizations).toHaveLength(2);
    expect(copy.authorizations.every((group) => group.some((fact) => fact.key === 'RentalAssignmentLabel' && fact.value !== '—')))
      .toBe(true);
    expect(copy.clearedLinks).toEqual([
      { customerId: JSON.parse(driverWithLinksEntry.beforeJson!).ClearedCustomerLinks[0].CustomerId, displayName: 'Arta Skuja' },
    ]);
    expect(copy.rentals).toEqual([]);
  });

  test('an authorization that went with its driver names that driver, and its copy is the deleted record', () => {
    const copy = deletedRecord(removedWithDriverEntry.eventType, removedWithDriverEntry.beforeJson)!;
    expect(copy.removedWith).toMatch(/^Arta Skuja · /);
    expect(copy.recordLabel).toMatch(/^Arta Skuja · F9G /);
    expect(copy.facts.map((fact) => fact.key)).not.toContain('DeletedWithRecordLabel');
    expect(copy.facts.map((fact) => fact.key)).toEqual(expect.arrayContaining(['AuthorizationType', 'RentalAssignmentLabel']));
  });

  test('a round-8 copy the reader does not recognise falls back as before', () => {
    for (const [eventType, malformed] of [
      ['Vehicle.Deleted', '{"RecordLabel":"x","RentalAssignments":[1]}'],
      ['Vehicle.Deleted', '{"RecordLabel":"x","RentalAssignments":{"a":1}}'],
      ['Customer.Deleted', '{"RecordLabel":"x","RentalAssignments":[{"RecordLabel":"y","Other":[1]}]}'],
      ['Customer.Deleted', '{"RecordLabel":"x","RentalAssignments":[{"RecordLabel":"y","Authorizations":[2]}]}'],
      ['Driver.Deleted', '{"RecordLabel":"x","ClearedCustomerLinks":[{"CustomerId":"c"}]}'],
      ['Driver.Deleted', '{"RecordLabel":"x","ClearedCustomerLinks":"none"}'],
      ['DriverAuthorization.RemovedWithDriver', '{"RecordLabel":"x"}'],
      ['DriverAuthorization.RemovedWithDriver', '{"RecordLabel":"x","DeletedWithRecordLabel":"d","Authorizations":[]}'],
    ] as const) {
      expect(deletedRecord(eventType, malformed), `${eventType} ${malformed}`).toBeNull();
    }
  });
});
