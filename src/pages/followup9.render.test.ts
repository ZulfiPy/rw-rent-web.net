import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind } from '@/api/dto';
import { AuditEntry } from './audit/AuditEntry';
import { SecurityAudit } from './audit/SecurityAudit';
import { DeleteRecordDialog } from './admin/DeleteRecordDialog';
import { Confirmation, DeleteRecords } from './admin/DeleteRecords';
import { clearRenders, fact, page, renderPage as render } from './followup7b.support';
import {
  authorizationBlocked, countsEverything, deletionsMade, rentalActive, rentalCancelled, vehicleDeleted,
} from './followup8.support';
import {
  customerTwoRunning, customerWithRentals, customerWithRentalsEntry, driverTwoRunning, driverWithLinks,
  driverWithLinksDeleted, driverWithLinksEntry, removedWithDriverEntry, vehicleWithRentals,
  vehicleWithRentalsDeleted,
} from './followup9.support';

/**
 * Follow-up 9, the Delete records page after the backend's round 8, rendered to markup from what
 * the API answered on the scratch stack (`followup9.support.ts`, and Follow-up 8's fixtures
 * re-captured from the same build). Nothing is fetched. The server decides what is Ready or Blocked
 * and what a deletion takes along; these tests hold the page to wording exactly that.
 */
afterEach(clearRenders);

const ADMIN = ['Records.Delete', 'SecurityAudit.ReadCompany', 'RentalAssignments.Read'];
const EVERYTHING = { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything };

/** One kind's list under Everything, with the counts and Recently deleted in the cache. */
const list = (kind: RecordKind, slug: string, items: unknown[]) => render(h(DeleteRecords), {
  at: `/delete-records?kind=${slug}&show=all`,
  route: '/delete-records',
  permissions: ADMIN,
  data: [
    [qk.recordDeletions.candidates(kind, EVERYTHING), page(items)],
    [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything],
    [qk.recordDeletions.made({ PageSize: 20 }), page(deletionsMade)],
  ],
});

/** The markup of the table row that carries a text. */
const row = (markup: string, text: string): string => {
  const at = markup.indexOf(text);
  expect(at, `no row carries ${text}`).toBeGreaterThan(-1);
  return markup.slice(markup.lastIndexOf('<tr', at), markup.indexOf('</tr>', at));
};

/** The opening tag of the button that carries a label. */
const button = (markup: string, label: string): string => {
  const at = markup.indexOf(`${label}</button>`);
  expect(at, `no button ${label}`).toBeGreaterThan(-1);
  return markup.slice(markup.lastIndexOf('<button', at), markup.indexOf('>', markup.lastIndexOf('<button', at)) + 1);
};

/** Every record a row's block names links to its running rental, by the rental's own label. */
const linksEachRunningRental = (markup: string, records: { id: string; label: string }[]) => {
  for (const record of records) {
    expect(markup).toMatch(new RegExp(`<a [^>]*href="/rental-assignments/${record.id}"[^>]*>${record.label}</a>`));
  }
};

describe('the Deletion cell says what a deletion takes along', () => {
  test('a Ready vehicle that takes its rentals names the numbers the server counted', () => {
    const markup = list(RecordKind.Vehicle, 'vehicles', [vehicleWithRentals]);
    const ready = row(markup, vehicleWithRentals.plateNumber);
    expect(ready).toContain('>Ready<');
    expect(ready).toContain('Takes 2 rental assignments, 2 driver authorizations and 1 interruption with it');
    expect(button(ready, 'Delete')).not.toContain('disabled');
  });

  test('a Ready driver says which authorizations go and which customer link is cleared', () => {
    const markup = list(RecordKind.Driver, 'drivers', [driverWithLinks]);
    const ready = row(markup, driverWithLinks.driverLicenseNumber);
    expect(ready).toContain('>Ready<');
    expect(ready).toContain('Takes 2 driver authorizations with it. Clears the driver link of 1 customer record');
  });
});

describe('a Blocked row of each reason names the running rental in the way, and links it', () => {
  test('a running rental: it has to be ended first, and it is the rental in its own way', () => {
    const markup = list(RecordKind.RentalAssignment, 'rental-assignments', [rentalActive, rentalCancelled]);
    const running = row(markup, '204 JLM');
    expect(running).toContain('>Blocked<');
    expect(running).toContain('This rental is running. End it first; then it can be deleted');
    linksEachRunningRental(running, rentalActive.deletion.blocks[0]!.records);
    expect(running).toContain('Takes 1 driver authorization and 1 interruption with it');
    expect(button(running, 'Delete')).toContain('disabled');
    expect(button(running, 'Delete')).toContain('title="This rental is running. End it first; then it can be deleted."');
    // A Cancelled rental with no parts is Ready and takes nothing else.
    expect(row(markup, '660 BYH')).toContain('Nothing else goes with it');
  });

  test('the only open authorization of a running rental', () => {
    const markup = list(RecordKind.DriverAuthorization, 'driver-authorizations', [authorizationBlocked]);
    const blocked = row(markup, authorizationBlocked.rentalAssignmentLabel);
    expect(blocked).toContain('An active rental must keep at least one authorization');
    // The row's Rental column links the same rental, so the link is looked for in the Deletion cell.
    const cell = blocked.slice(blocked.indexOf('An active rental must keep at least one authorization'));
    linksEachRunningRental(cell, authorizationBlocked.deletion.blocks[0]!.records);
  });

  test('a customer with two running rentals: the plural, and both rentals linked', () => {
    const markup = list(RecordKind.Customer, 'customers', [customerTwoRunning]);
    const blocked = row(markup, customerTwoRunning.displayName);
    expect(blocked).toContain('2 running rentals refer to this customer. End them first');
    const running = customerTwoRunning.deletion.blocks[0]!.records;
    expect(running).toHaveLength(2);
    linksEachRunningRental(blocked, running);
    expect(blocked).toContain('Takes 2 rental assignments and 2 driver authorizations with it');
    expect(button(blocked, 'Delete')).toContain('title="2 running rentals refer to this customer. End them first."');
  });

  test('a driver who holds the only open authorization of two running rentals', () => {
    const markup = list(RecordKind.Driver, 'drivers', [driverTwoRunning]);
    const blocked = row(markup, driverTwoRunning.driverLicenseNumber);
    expect(blocked).toContain('This driver holds the only open authorization of 2 running rentals');
    linksEachRunningRental(blocked, driverTwoRunning.deletion.blocks[0]!.records);
  });
});

describe('the delete dialog names the numbers', () => {
  const dialog = (target: Parameters<typeof DeleteRecordDialog>[0]['target']) => render(
    h(DeleteRecordDialog, { target, onClose: () => {}, onDeleted: () => {}, onRefresh: () => {} }),
    { at: '/x', route: '/x', permissions: ADMIN },
  );

  test('a vehicle: its rentals with their parts go, the other sides of those rentals stay, and the tick counts them', () => {
    const markup = dialog({ kind: RecordKind.Vehicle, value: vehicleWithRentals });
    expect(markup).toContain('Delete vehicle');
    expect(markup).toContain('Its 2 rental assignments, with 2 driver authorizations and 1 interruption, are removed with it.');
    expect(markup).toContain('The customers and drivers of those rentals stay as they are.');
    expect(markup).toContain('This vehicle and the 2 rental assignments, 2 driver authorizations and 1 interruption cannot be restored from the app.');
    expect(markup).toContain('One entry stays in the security audit');
  });

  test('a customer names its rentals the same way', () => {
    const markup = dialog({ kind: RecordKind.Customer, value: customerWithRentals });
    expect(markup).toContain('Its 2 rental assignments, with 2 driver authorizations and 1 interruption, are removed with it.');
    expect(markup).toContain('The vehicles and drivers of those rentals stay as they are.');
  });

  test('a driver: their authorizations leave the rentals, which stay, and the customer link is cleared', () => {
    const markup = dialog({ kind: RecordKind.Driver, value: driverWithLinks });
    expect(markup).toContain('Delete driver');
    expect(markup).toContain('Their 2 driver authorizations are removed from the rentals they were on; those rentals stay.');
    expect(markup).toContain('The link of 1 customer record to this driver is cleared; the customer stays.');
    expect(markup).toContain('This driver and the 2 driver authorizations cannot be restored from the app.');
    expect(markup).not.toContain('This rental is active');
  });
});

describe('after a deletion', () => {
  test('the confirmation line reports what went with the record, by the deletion’s own answer', () => {
    const vehicle = render(h(Confirmation, { done: vehicleWithRentalsDeleted, canAudit: true }), { at: '/x', route: '/x' });
    expect(vehicle).toContain(
      `Vehicle deleted:</span> ${vehicleWithRentalsDeleted.recordLabel}. 2 rental assignments, 2 driver authorizations and 1 interruption went with it. `,
    );
    expect(vehicle).toContain(`href="/security-audit/${vehicleWithRentalsDeleted.auditEntryId}"`);
    const driver = render(h(Confirmation, { done: driverWithLinksDeleted, canAudit: false }), { at: '/x', route: '/x' });
    expect(driver).toContain('2 driver authorizations went with it. The driver link of 1 customer record was cleared. Written to the security audit.');
    // Nothing went with it: no middle sentence.
    const lone = render(h(Confirmation, { done: vehicleDeleted, canAudit: false }), { at: '/x', route: '/x' });
    expect(lone).toContain(`${vehicleDeleted.recordLabel}. Written to the security audit.`);
  });
});

describe('the security audit reads round 8’s entries', () => {
  const entry = (value: typeof customerWithRentalsEntry) => render(h(AuditEntry), {
    at: `/security-audit/${value.id}`,
    route: '/security-audit/:entryId',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[qk.audit.entry(value.id), value]],
  });

  test('the event filter offers an authorization that went with its driver', () => {
    const markup = render(h(SecurityAudit), {
      at: '/security-audit', route: '/security-audit', permissions: ['SecurityAudit.ReadCompany'],
    });
    expect(markup).toContain('>Driver authorisation · Removed with driver</option>');
  });

  test('a customer’s entry shows each rental that went with them, titled by its label, with its parts', () => {
    const markup = entry(customerWithRentalsEntry);
    expect(fact(markup, 'Record')).toContain(customerWithRentalsDeleted());
    expect(markup).toContain('Deleted rental assignments');
    const copy = JSON.parse(customerWithRentalsEntry.beforeJson!) as { RentalAssignments: { RecordLabel: string }[] };
    copy.RentalAssignments.forEach((rental, index) => {
      expect(markup).toContain(`Rental assignment ${index + 1} · ${rental.RecordLabel}`);
    });
    expect(markup).not.toContain('Rental assignment 3');
    // The Ended rental's authorization and interruption, and the Planned one's authorization.
    expect(markup.match(/>Authorization \d</g)).toHaveLength(2);
    expect(markup.match(/>Interruption \d</g)).toHaveLength(1);
    expect(markup).not.toContain('Unrecognised payload shape');
  });

  test('a driver’s entry shows their authorizations and the cleared customer link', () => {
    const markup = entry(driverWithLinksEntry);
    expect(fact(markup, 'Record')).toMatch(/Arta Skuja · /);
    expect(markup).toContain('Deleted authorizations');
    expect(markup).toContain('Authorization 2');
    expect(markup).toContain('Cleared customer links');
    expect(fact(markup, 'Customer record')).toContain('Arta Skuja');
    expect(markup).not.toContain('Deleted rental assignments');
  });

  test('an authorization that went with its driver names that driver and shows its copy as the deleted record', () => {
    const markup = entry(removedWithDriverEntry);
    expect(markup).toContain('Driver authorisation · Removed with driver');
    const driver = JSON.parse(removedWithDriverEntry.beforeJson!).DeletedWithRecordLabel as string;
    expect(fact(markup, 'Removed with driver')).toContain(driver);
    expect(fact(markup, 'Record')).toMatch(/Arta Skuja · F9G /);
    expect(markup).toContain('Deleted record');
    expect(markup).not.toContain('Unrecognised payload shape');
  });
});

/** The customer's label, as the deletion answered it: the copy's own RecordLabel. */
function customerWithRentalsDeleted(): string {
  return (JSON.parse(customerWithRentalsEntry.beforeJson!) as { RecordLabel: string }).RecordLabel;
}
