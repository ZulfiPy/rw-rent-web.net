import { describe, expect, test } from 'vitest';
import {
  RecordDeletionBlockReason, RecordDeletionReason, RecordKind, type RecordDeletionBlockResponse,
  type RecordDeletionTakes,
} from '@/api/dto';
import {
  AUDIT_CONSEQUENCE, blockSentence, candidateDescription, cannotBeRestored, deletionConsequences,
  deletionPeriod, deletionReasonText, deletionRefusal, partsText, takesSentence, wentWith,
} from './recordDeletion';
import { formatLocal } from './datetime';
import {
  authorizationCollective, authorizationReady, customerReady, driverReady, interruptionEnded,
  rentalActive, rentalCancelled, rentalEnded, vehicleReady,
} from '@/pages/followup8.support';
import {
  customerTwoRunning, driverTwoRunning, driverWithLinks, driverWithLinksDeleted, runningRentalRefusal,
  vehicleWithRentals, vehicleWithRentalsDeleted,
} from '@/pages/followup9.support';

/**
 * Follow-ups 8 and 9: the page words the server's verdict, it never makes one. These are the
 * handover's and the ledger's §9 sentences, built from what the API answered: the block reasons
 * with their counts, what a deletion takes along, the dialog's description and consequences, and
 * the refusals that come back with Refresh.
 */

const block = (reason: RecordDeletionBlockResponse['reason'], count: number): RecordDeletionBlockResponse =>
  ({ reason, count, records: [] });

const takes = (rentalAssignments: number, driverAuthorizations: number, interruptions: number, customerLinksCleared = 0): RecordDeletionTakes =>
  ({ rentalAssignments, driverAuthorizations, interruptions, customerLinksCleared });

describe('each block reason, in singular and plural', () => {
  test('a running rental that refers to a vehicle, or to a customer', () => {
    const one = block(RecordDeletionBlockReason.HasRunningRental, 1);
    const two = block(RecordDeletionBlockReason.HasRunningRental, 2);
    expect(blockSentence(RecordKind.Vehicle, [one])).toBe('A running rental refers to this vehicle. End it first');
    expect(blockSentence(RecordKind.Vehicle, [two])).toBe('2 running rentals refer to this vehicle. End them first');
    expect(blockSentence(RecordKind.Customer, [one])).toBe('A running rental refers to this customer. End it first');
    // The count the API sent for a customer with two running rentals.
    expect(blockSentence(RecordKind.Customer, customerTwoRunning.deletion.blocks))
      .toBe('2 running rentals refer to this customer. End them first');
  });

  test('a driver who holds the only open authorization of a running rental, or of several', () => {
    expect(blockSentence(RecordKind.Driver, [block(RecordDeletionBlockReason.DriverHoldsOnlyOpenAuthorizationOfRunningRental, 1)]))
      .toBe('This driver holds the only open authorization of a running rental');
    expect(blockSentence(RecordKind.Driver, driverTwoRunning.deletion.blocks))
      .toBe('This driver holds the only open authorization of 2 running rentals');
  });

  test('a customer record linked to a driver blocks nothing: its link is what the deletion clears', () => {
    expect(takesSentence(takes(0, 0, 0, 1))).toBe('Clears the driver link of 1 customer record');
    expect(takesSentence(takes(0, 0, 0, 2))).toBe('Clears the driver link of 2 customer records');
    expect(takesSentence(driverWithLinks.deletion.takes))
      .toBe('Takes 2 driver authorizations with it. Clears the driver link of 1 customer record');
  });

  test('a running rental is refused by its own reason: it has to be ended first', () => {
    expect(blockSentence(RecordKind.RentalAssignment, [block(RecordDeletionBlockReason.RentalIsRunning, 1)]))
      .toBe('This rental is running. End it first; then it can be deleted');
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
    expect(deletionConsequences(RecordKind.RentalAssignment, takes(0, 2, 1))).toEqual([
      'The rental assignment is removed permanently.',
      'Its 2 driver authorizations and 1 interruption are removed with it.',
      'The customer, the vehicle and the drivers stay as they are.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.RentalAssignment, takes(0, 1, 0))[1])
      .toBe('Its 1 driver authorization is removed with it.');
    expect(deletionConsequences(RecordKind.RentalAssignment, takes(0, 0, 0)))
      .not.toContainEqual(expect.stringMatching(/removed with it/));
  });

  test('every kind ends with the audit line; a vehicle, a customer and a driver say what they take along', () => {
    for (const kind of Object.values(RecordKind)) {
      expect(deletionConsequences(kind, takes(0, 0, 0)).at(-1)).toBe(AUDIT_CONSEQUENCE);
    }
    expect(deletionConsequences(RecordKind.Vehicle, vehicleWithRentals.deletion.takes)).toEqual([
      'The vehicle is removed permanently.',
      'Its 2 rental assignments, with 2 driver authorizations and 1 interruption, are removed with it.',
      'The customers and drivers of those rentals stay as they are.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.Customer, takes(1, 0, 0)).slice(1, 3)).toEqual([
      'Its 1 rental assignment is removed with it.',
      'The vehicles and drivers of that rental stay as they are.',
    ]);
    expect(deletionConsequences(RecordKind.Vehicle, takes(0, 0, 0))[1]).toBe('Nothing else goes with it.');
    expect(deletionConsequences(RecordKind.Driver, driverWithLinks.deletion.takes)).toEqual([
      'The driver is removed permanently.',
      'Their 2 driver authorizations are removed from the rentals they were on; those rentals stay.',
      'The link of 1 customer record to this driver is cleared; the customer stays.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.Driver, takes(0, 1, 0, 2)).slice(1, 3)).toEqual([
      'Their 1 driver authorization is removed from the rental it was on; that rental stays.',
      'The links of 2 customer records to this driver are cleared; the customers stay.',
    ]);
    expect(deletionConsequences(RecordKind.Driver, takes(0, 0, 0))[1]).toBe('Nothing else goes with it.');
  });

  test('a record that became blocked is refused in the API’s own words; one that left the list in the app’s', () => {
    expect(deletionRefusal('record_deletions.blocked', runningRentalRefusal.detail)).toEqual({
      title: 'This rental assignment is running (Active). End it first; then it can be deleted.',
      detail: 'Refresh the list.',
    });
    expect(deletionRefusal('record_deletions.not_found', 'Vehicle \'…\' was not found.'))
      .toEqual({ title: 'This record is no longer in the list.', detail: 'Refresh the list.' });
    // Any other refusal is the shared one's to word.
    expect(deletionRefusal('record_deletions.note_required', 'A note is required.')).toBeNull();
    expect(deletionRefusal(undefined)).toBeNull();
  });

  test('the reason is read back with its note after a dash', () => {
    expect(deletionReasonText(RecordDeletionReason.PracticeOrTestRecord, 'made while teaching a new colleague.'))
      .toBe('Practice or test record — made while teaching a new colleague.');
    expect(deletionReasonText(RecordDeletionReason.EnteredByMistake, null)).toBe('Entered by mistake');
    expect(deletionReasonText(null, null)).toBe('No reason recorded');
  });
});

describe('what a deletion takes along (Follow-up 9)', () => {
  test('the records that go, in their order, only the parts that are not zero, singular and plural', () => {
    expect(takesSentence(vehicleWithRentals.deletion.takes))
      .toBe('Takes 2 rental assignments, 2 driver authorizations and 1 interruption with it');
    expect(takesSentence(takes(1, 1, 1))).toBe('Takes 1 rental assignment, 1 driver authorization and 1 interruption with it');
    expect(takesSentence(takes(3, 0, 2))).toBe('Takes 3 rental assignments and 2 interruptions with it');
    expect(takesSentence(takes(0, 1, 0))).toBe('Takes 1 driver authorization with it');
    expect(takesSentence(takes(0, 0, 0))).toBe('Nothing else goes with it');
  });

  test('the tick names what cannot be restored, or only the record when nothing goes', () => {
    expect(cannotBeRestored(RecordKind.Vehicle, vehicleWithRentals.deletion.takes))
      .toBe('This vehicle and the 2 rental assignments, 2 driver authorizations and 1 interruption cannot be restored from the app.');
    expect(cannotBeRestored(RecordKind.Driver, driverWithLinks.deletion.takes))
      .toBe('This driver and the 2 driver authorizations cannot be restored from the app.');
    expect(cannotBeRestored(RecordKind.Customer, takes(0, 0, 0))).toBe('This customer cannot be restored from the app.');
    // A cleared link is not a record: nothing to restore.
    expect(cannotBeRestored(RecordKind.Driver, takes(0, 0, 0, 1))).toBe('This driver cannot be restored from the app.');
  });

  test('after a deletion, what went with it by the deletion’s own answer, or nothing when nothing went', () => {
    expect(wentWith(vehicleWithRentalsDeleted))
      .toBe('2 rental assignments, 2 driver authorizations and 1 interruption went with it.');
    expect(wentWith(driverWithLinksDeleted))
      .toBe('2 driver authorizations went with it. The driver link of 1 customer record was cleared.');
    expect(wentWith({ ...driverWithLinksDeleted, deletedAuthorizationCount: 0, clearedCustomerLinkCount: 0 })).toBeNull();
  });
});
