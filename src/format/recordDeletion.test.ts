import { describe, expect, test } from 'vitest';
import {
  RecordDeletionBlockReason, RecordDeletionReason, RecordKind, type RecordDeletionBlockResponse,
} from '@/api/dto';
import {
  AUDIT_CONSEQUENCE, blockSentence, candidateDescription, deletionConsequences, deletionPeriod,
  deletionReasonText, deletionRefusal, partsText,
} from './recordDeletion';
import { formatLocal } from './datetime';
import {
  authorizationCollective, authorizationReady, customerReady, driverReady, interruptionEnded,
  rentalActive, rentalCancelled, rentalEnded, vehicleReady,
} from '@/pages/followup8.support';

/**
 * Follow-up 8: the page words the server's verdict, it never makes one. These are the handover's
 * sentences, built from what the API answered: the block reasons with their counts, the dialog's
 * description and consequences, and the refusals that come back with Refresh.
 */

const block = (reason: RecordDeletionBlockResponse['reason'], count: number): RecordDeletionBlockResponse =>
  ({ reason, count, records: [] });

describe('each block reason, in singular and plural', () => {
  test('rental assignments that refer to a vehicle, or to a customer', () => {
    const one = block(RecordDeletionBlockReason.ReferencedByRentalAssignments, 1);
    const two = block(RecordDeletionBlockReason.ReferencedByRentalAssignments, 2);
    expect(blockSentence(RecordKind.Vehicle, [one])).toBe('1 rental assignment refers to this vehicle');
    expect(blockSentence(RecordKind.Vehicle, [two])).toBe('2 rental assignments refer to this vehicle');
    expect(blockSentence(RecordKind.Customer, [one])).toBe('1 rental assignment refers to this customer');
    expect(blockSentence(RecordKind.Customer, [two])).toBe('2 rental assignments refer to this customer');
  });

  test('driver authorizations that refer to a driver', () => {
    expect(blockSentence(RecordKind.Driver, [block(RecordDeletionBlockReason.ReferencedByDriverAuthorizations, 1)]))
      .toBe('1 driver authorization refers to this driver');
    expect(blockSentence(RecordKind.Driver, [block(RecordDeletionBlockReason.ReferencedByDriverAuthorizations, 3)]))
      .toBe('3 driver authorizations refer to this driver');
  });

  test('a customer record linked to a driver', () => {
    expect(blockSentence(RecordKind.Driver, [block(RecordDeletionBlockReason.LinkedFromCustomer, 1)]))
      .toBe('A customer record is linked to this driver record');
    expect(blockSentence(RecordKind.Driver, [block(RecordDeletionBlockReason.LinkedFromCustomer, 2)]))
      .toBe('2 customer records are linked to this driver record');
  });

  test('the two driver reasons at once make one sentence joined with "and"', () => {
    expect(blockSentence(RecordKind.Driver, [
      block(RecordDeletionBlockReason.ReferencedByDriverAuthorizations, 1),
      block(RecordDeletionBlockReason.LinkedFromCustomer, 1),
    ])).toBe('1 driver authorization refers to this driver and a customer record is linked to this driver record');
  });

  test('the last open authorization of an active rental', () => {
    expect(blockSentence(RecordKind.DriverAuthorization, [
      block(RecordDeletionBlockReason.OnlyOpenAuthorizationOfActiveRental, 1),
    ])).toBe('An active rental must keep at least one authorization');
  });
});

describe('the list cells', () => {
  test('a period, with "open" while there is no end', () => {
    expect(deletionPeriod('2026-08-12T06:16:39Z', '2026-09-11T06:16:39Z'))
      .toBe(`${formatLocal('2026-08-12T06:16:39Z', 'dateShort')} → ${formatLocal('2026-09-11T06:16:39Z', 'dateShort')}`);
    expect(deletionPeriod('2026-08-12T06:16:39Z', null)).toMatch(/ → open$/);
  });

  test('a rental’s parts, and none', () => {
    expect(partsText(2, 1)).toBe('2 authorizations · 1 interruption');
    expect(partsText(1, 0)).toBe('1 authorization');
    expect(partsText(0, 2)).toBe('2 interruptions');
    expect(partsText(0, 0)).toBe('');
  });
});

describe('the dialog', () => {
  test('its description names the record and where it stands, from the row the API sent', () => {
    expect(candidateDescription({ kind: RecordKind.RentalAssignment, value: rentalEnded }))
      .toBe(`400 NDP · Roberts Liepins · Ended ${formatLocal(rentalEnded.closedAtUtc, 'dateShort')}`);
    expect(candidateDescription({ kind: RecordKind.RentalAssignment, value: rentalActive }))
      .toBe(`204 JLM · Anete Kalnina · Active since ${formatLocal(rentalActive.startedAtUtc, 'dateShort')}`);
    expect(candidateDescription({ kind: RecordKind.RentalAssignment, value: rentalCancelled }))
      .toMatch(/^660 BYH · Ventspils Marine Services · Cancelled /);
    expect(candidateDescription({ kind: RecordKind.DriverAuthorization, value: authorizationReady }))
      .toBe(`Laura Ozola · 400 NDP · Roberts Liepins · Stopped ${formatLocal(authorizationReady.stoppedAtUtc, 'dateShort')}`);
    expect(candidateDescription({ kind: RecordKind.DriverAuthorization, value: authorizationCollective }))
      .toMatch(/^Business customer drivers · 552 KLM · Nordwind Logistics · Open since /);
    expect(candidateDescription({ kind: RecordKind.Interruption, value: interruptionEnded }))
      .toMatch(/^Vacation or leave · 400 NDP · Roberts Liepins · \d{2} \w{3} → \d{2} \w{3}$/);
    expect(candidateDescription({ kind: RecordKind.Vehicle, value: vehicleReady }))
      .toBe(`${vehicleReady.plateNumber} · Citroen Berlingo 2019 · Inactive`);
    expect(candidateDescription({ kind: RecordKind.Customer, value: customerReady }))
      .toBe(`${customerReady.displayName} · Private · Inactive`);
    expect(candidateDescription({ kind: RecordKind.Driver, value: driverReady }))
      .toBe('Normunds Zarins · LV-AA-004471 · Inactive');
  });

  test('a rental’s consequences count its own parts, in the singular and the plural', () => {
    expect(deletionConsequences(RecordKind.RentalAssignment, { authorizations: 2, interruptions: 1 })).toEqual([
      'The rental assignment is removed permanently.',
      'Its 2 driver authorizations and 1 interruption are removed with it.',
      'The customer, the vehicle and the drivers stay as they are.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.RentalAssignment, { authorizations: 1, interruptions: 0 })[1])
      .toBe('Its 1 driver authorization is removed with it.');
    expect(deletionConsequences(RecordKind.RentalAssignment, { authorizations: 0, interruptions: 0 }))
      .not.toContainEqual(expect.stringMatching(/removed with it/));
  });

  test('every kind ends with the audit line, and the others say what stays', () => {
    for (const kind of Object.values(RecordKind)) {
      expect(deletionConsequences(kind).at(-1)).toBe(AUDIT_CONSEQUENCE);
    }
    expect(deletionConsequences(RecordKind.Vehicle)).toEqual([
      'The vehicle is removed permanently.',
      'No rental assignment refers to this vehicle, so nothing else changes.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.Driver)[1])
      .toBe('No driver authorization and no customer record refer to this driver, so nothing else changes.');
  });

  test('a record that became blocked, or left the list, is refused with its own sentence and Refresh', () => {
    expect(deletionRefusal(RecordKind.Vehicle, 'record_deletions.blocked'))
      .toEqual({ title: 'This vehicle now has a rental assignment.', detail: 'Refresh the list.' });
    expect(deletionRefusal(RecordKind.Customer, 'record_deletions.blocked')?.title)
      .toBe('This customer now has a rental assignment.');
    expect(deletionRefusal(RecordKind.Driver, 'record_deletions.blocked')?.title)
      .toBe('This driver is now referenced by another record.');
    expect(deletionRefusal(RecordKind.DriverAuthorization, 'record_deletions.blocked')?.title)
      .toBe('This is now the only open authorization of an active rental.');
    expect(deletionRefusal(RecordKind.Interruption, 'record_deletions.not_found'))
      .toEqual({ title: 'This record is no longer in the list.', detail: 'Refresh the list.' });
    // Any other refusal is the shared one's to word.
    expect(deletionRefusal(RecordKind.Vehicle, 'record_deletions.note_required')).toBeNull();
    expect(deletionRefusal(RecordKind.Vehicle, undefined)).toBeNull();
  });

  test('the reason is read back with its note after a dash', () => {
    expect(deletionReasonText(RecordDeletionReason.PracticeOrTestRecord, 'made while teaching a new colleague.'))
      .toBe('Practice or test record — made while teaching a new colleague.');
    expect(deletionReasonText(RecordDeletionReason.EnteredByMistake, null)).toBe('Entered by mistake');
    expect(deletionReasonText(null, null)).toBe('No reason recorded');
  });
});
