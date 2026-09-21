import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionReason, RecordDeletionShow, RecordKind } from '@/api/dto';
import { AuditEntry } from './audit/AuditEntry';
import { SecurityAudit } from './audit/SecurityAudit';
import { STALE_MESSAGE } from '@/api/problem';
import { Dialog } from '@/ui/Dialog';
import { DeleteRecordDialog } from './admin/DeleteRecordDialog';
import { Confirmation, DeleteRecords, RecentlyDeleted } from './admin/DeleteRecords';
import { clearRenders, fact, page, renderPage as render } from './followup7b.support';
import {
  authorizationBlocked, authorizationCollective, authorizationReady, countsEverything, countsOutOfUse,
  customerBlocked, customerReady, deletionsMade, driverBlocked, driverBlockedTwice, driverReady,
  interruptionEnded, interruptionOpen, rentalActive, rentalCancelled, rentalEnded, rentalEntry,
  vehicleBlocked, vehicleDeleted, vehicleEntry, vehicleReady,
} from './followup8.support';

/**
 * Follow-up 8, the Delete records page, rendered to markup from what the round-7 API answered on
 * the scratch stack (`followup8.support.ts`). Nothing is fetched. The run that builds this may not
 * sign in to the app in a browser, so this is how the signed-in page is checked; the reviewer's
 * browser steps are in `Context/wiring_report.md`.
 */
afterEach(clearRenders);

const ADMIN = ['Records.Delete', 'SecurityAudit.ReadCompany', 'RentalAssignments.Read'];

const listQuery = (show: RecordDeletionShow, search?: string) => ({
  PageNumber: 1, PageSize: 20, Show: show, ...(search ? { Search: search } : {}),
});

/** The page at an address, with the kind's list, the counts and Recently deleted in the cache. */
function renderPage(kind: RecordKind, items: unknown[], {
  at = '/delete-records', show = RecordDeletionShow.OutOfUse, search, permissions = ADMIN, made = deletionsMade,
}: {
  at?: string;
  show?: RecordDeletionShow;
  search?: string;
  permissions?: string[];
  made?: unknown[];
} = {}): string {
  return render(h(DeleteRecords), {
    at,
    route: '/delete-records',
    permissions,
    data: [
      [qk.recordDeletions.candidates(kind, listQuery(show, search)), page(items)],
      [qk.recordDeletions.counts(show), show === RecordDeletionShow.Everything ? countsEverything : countsOutOfUse],
      [qk.recordDeletions.made({ PageSize: 20 }), page(made)],
    ],
  });
}

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

/** The page's list, without Recently deleted below it. */
const listOf = (markup: string) => markup.slice(0, markup.indexOf('Recently deleted'));

/** The list table's column headers; the Actions column has none. */
const headers = (markup: string) =>
  [...listOf(markup).matchAll(/<th scope="col"[^>]*>([^<]*)</g)].map((m) => m[1]).filter(Boolean);

describe('the page frame', () => {
  const markup = renderPage(RecordKind.RentalAssignment, [rentalEnded, rentalCancelled]);

  test('the bad-tone banner, the six kinds with their counts, and the Show filter', () => {
    expect(markup).toContain('Deleted means gone');
    expect(markup).toContain('The record leaves the database. What stays is one entry in the security audit');
    for (const label of ['Rental assignments', 'Driver authorizations', 'Interruptions', 'Vehicles', 'Customers', 'Drivers']) {
      expect(markup).toContain(`${label}<span`);
    }
    expect(markup).toMatch(new RegExp(`Rental assignments<span[^>]*>${countsOutOfUse.rentalAssignments}</span>`));
    expect(markup).toMatch(new RegExp(`Vehicles<span[^>]*>${countsOutOfUse.vehicles}</span>`));
    expect(markup).toContain('>Show<');
    expect(markup).toContain('>Out of use<');
    expect(markup).toContain('placeholder="Plate, VIN or customer name"');
  });

  test('Recently deleted lists what went, by its kind, newest first, with the reason read back', () => {
    expect(markup).toContain('Recently deleted');
    expect(markup).toContain('Times in Tallinn time.');
    const [newest, older] = deletionsMade;
    expect(markup).toContain(`Rental assignment · ${newest!.recordLabel}`);
    expect(markup).toContain(`Vehicle · ${older!.recordLabel}`);
    expect(markup).toContain('Practice or test record — Made while teaching a new colleague.');
    expect(markup.indexOf(newest!.recordLabel)).toBeLessThan(markup.lastIndexOf(older!.recordLabel));
  });
});

describe('each kind’s table, with the server’s verdict on every row', () => {
  test('rental assignments: an Ended rental with its parts, and a Cancelled one with none', () => {
    const markup = renderPage(RecordKind.RentalAssignment, [rentalEnded, rentalCancelled]);
    expect(headers(markup)).toEqual(['Vehicle', 'Customer', 'Status', 'Period', 'Parts', 'Deletion']);
    const ended = row(markup, '400 NDP');
    expect(ended).toContain('Roberts Liepins');
    expect(ended).toContain('>Ended<');
    expect(ended).toContain('1 authorization · 1 interruption');
    expect(ended).toContain('>Ready<');
    expect(button(ended, 'Delete…')).not.toContain('disabled');
    expect(button(ended, 'Delete…')).toContain('title="Delete this rental assignment"');
    expect(row(markup, '660 BYH')).toContain('No parts');
  });

  test('driver authorizations: a stopped one is Ready, the last open cover of an Active rental is Blocked', () => {
    const markup = renderPage(RecordKind.DriverAuthorization, [authorizationReady, authorizationBlocked, authorizationCollective], {
      at: '/delete-records?kind=driver-authorizations&show=all', show: RecordDeletionShow.Everything,
    });
    expect(headers(markup)).toEqual(['Driver', 'Rental', 'Period', 'State', 'Deletion']);
    const ready = row(markup, 'Laura Ozola');
    expect(ready).toContain('>Stopped<');
    expect(ready).toContain('>Ready<');
    const blocked = row(markup, `href="/drivers/${authorizationBlocked.driverId}"`);
    expect(blocked).toContain('>Blocked<');
    expect(blocked).toContain('An active rental must keep at least one authorization');
    expect(blocked).toContain(`href="/rental-assignments/${authorizationBlocked.rentalAssignmentId}"`);
    expect(button(blocked, 'Delete…')).toContain('disabled');
    expect(button(blocked, 'Delete…')).toContain('title="An active rental must keep at least one authorization."');
    expect(row(markup, 'Business customer drivers')).toContain('552 KLM · Nordwind Logistics');
  });

  test('interruptions: the reason as a chip, the rental, the period and the billing impact', () => {
    const markup = renderPage(RecordKind.Interruption, [interruptionEnded, interruptionOpen], {
      at: '/delete-records?kind=interruptions&show=all', show: RecordDeletionShow.Everything,
    });
    expect(headers(markup)).toEqual(['Reason', 'Rental', 'Period', 'Billing impact', 'Deletion']);
    const ended = row(markup, 'Vacation or leave');
    expect(ended).toContain('400 NDP · Roberts Liepins');
    expect(ended).toContain('Fully billable');
    expect(ended).toContain('>Ready<');
    expect(markup).toContain('placeholder="Note, plate or customer"');
  });

  test('vehicles: an inactive one nothing refers to is Ready, one two rentals refer to is Blocked and names them', () => {
    const markup = renderPage(RecordKind.Vehicle, [vehicleReady, vehicleBlocked], {
      at: '/delete-records?kind=vehicles&show=all', show: RecordDeletionShow.Everything,
    });
    expect(headers(markup)).toEqual(['Plate', 'Make, model, year', 'Status', 'Deletion']);
    const ready = row(markup, vehicleReady.plateNumber);
    expect(ready).toContain('Citroen Berlingo · 2019');
    expect(ready).toContain(vehicleReady.vinCode);
    expect(ready).toContain('>Inactive<');
    expect(ready).toContain('>Ready<');
    const blocked = row(markup, '482 TKL');
    expect(blocked).toContain('>Blocked<');
    expect(blocked).toContain('2 rental assignments refer to this vehicle');
    for (const record of vehicleBlocked.deletion.blocks[0]!.records) {
      expect(blocked).toContain(`href="/rental-assignments/${record.id}"`);
      expect(blocked).toContain(record.label);
    }
    expect(button(blocked, 'Delete…')).toContain('disabled');
    expect(button(blocked, 'Delete…')).toContain('title="2 rental assignments refer to this vehicle."');
  });

  test('customers: the type, the identifier, and a rental that blocks a business customer', () => {
    const markup = renderPage(RecordKind.Customer, [customerReady, customerBlocked], {
      at: '/delete-records?kind=customers&show=all', show: RecordDeletionShow.Everything,
    });
    expect(headers(markup)).toEqual(['Customer', 'Type', 'Status', 'Deletion']);
    const ready = row(markup, customerReady.displayName);
    expect(ready).toContain('>Private<');
    expect(ready).toContain(customerReady.identifier!);
    expect(ready).toContain('>Ready<');
    const blocked = row(markup, 'Daugava Construction');
    expect(blocked).toContain('>Business<');
    expect(blocked).toContain(`Reg. ${customerBlocked.identifier}`);
    expect(blocked).toMatch(/\d rental assignments? refers? to this customer/);
  });

  test('drivers: both of a driver’s blocks in one sentence, the linked customer and the authorization named', () => {
    const markup = renderPage(RecordKind.Driver, [driverReady, driverBlockedTwice, driverBlocked], {
      at: '/delete-records?kind=drivers&show=all', show: RecordDeletionShow.Everything,
    });
    expect(headers(markup)).toEqual(['Driver', 'Licence', 'Status', 'Deletion']);
    expect(row(markup, 'Normunds Zarins')).toContain('>Ready<');
    const twice = row(markup, 'LV-AE-118440');
    expect(twice).toContain('1 driver authorization refers to this driver and a customer record is linked to this driver record');
    const customer = driverBlockedTwice.deletion.blocks[1]!.records[0]!;
    expect(twice).toContain(`href="/customers/${customer.id}"`);
    // The authorization in the way opens the driver's own page, which lists their authorizations.
    const authorization = driverBlockedTwice.deletion.blocks[0]!.records[0]!;
    expect(twice).toMatch(new RegExp(`<a [^>]*href="/drivers/${driverBlockedTwice.id}"[^>]*>${authorization.label}</a>`));
    expect(row(markup, 'LV-AG-772013')).toContain('1 driver authorization refers to this driver<');
  });
});

describe('when there is nothing, and when the page is not yours', () => {
  test('nothing out of use of a kind is the empty state; a search that finds nothing says so', () => {
    const empty = renderPage(RecordKind.Interruption, [], { at: '/delete-records?kind=interruptions' });
    expect(empty).toContain('Nothing to clean up');
    expect(empty).toContain('No out-of-use records of this kind. Switch Show to Everything to see the rest.');
    expect(listOf(empty)).not.toContain('<table');
    const searched = renderPage(RecordKind.Vehicle, [], {
      at: '/delete-records?kind=vehicles&search=zzz', search: 'zzz',
    });
    expect(searched).toContain('No results for these filters');
  });

  test('a persona without Records.Delete meets the lock and no list', () => {
    const refused = renderPage(RecordKind.RentalAssignment, [rentalEnded], {
      permissions: ['SecurityAudit.ReadCompany', 'RentalAssignments.Read'],
    });
    expect(refused).toContain('Not available to you');
    expect(refused).toContain('Opening this page needs Records.Delete.');
    expect(refused).not.toContain('400 NDP');
    expect(refused).not.toContain('Recently deleted');
  });
});

describe('the delete dialog', () => {
  const dialog = (props: Partial<Parameters<typeof DeleteRecordDialog>[0]>) => render(
    h(DeleteRecordDialog, {
      target: { kind: RecordKind.Vehicle, value: vehicleReady },
      onClose: () => {}, onDeleted: () => {}, onRefresh: () => {},
      ...props,
    }),
    { at: '/x', route: '/x', permissions: ADMIN },
  );

  test('names the record, warns that it cannot be undone, and says what it does', () => {
    const markup = dialog({});
    expect(markup).toContain('Delete vehicle');
    expect(markup).toContain(`${vehicleReady.plateNumber} · Citroen Berlingo 2019 · Inactive`);
    expect(markup).toContain('This cannot be undone');
    expect(markup).toContain('The record is removed from the database for good.');
    expect(markup).toContain('No rental assignment refers to this vehicle, so nothing else changes.');
    expect(markup).toContain('One entry stays in the security audit');
    expect(markup).toContain('Select a reason');
    expect(markup).toContain('Practice or test record');
    expect(markup).toContain('Stored with the audit entry.');
    expect(markup).toContain('I understand this cannot be undone');
  });

  test('keeps Delete permanently blocked until a reason, a note for Other, and the tick', () => {
    expect(button(dialog({}), 'Delete permanently')).toContain('title="A reason is required."');
    expect(button(dialog({ initial: { reason: RecordDeletionReason.Other, confirmed: true } }), 'Delete permanently'))
      .toContain('title="A note is required when the reason is Other."');
    expect(button(dialog({ initial: { reason: RecordDeletionReason.NoLongerNeeded } }), 'Delete permanently'))
      .toContain('disabled');
    const ready = button(dialog({ initial: { reason: RecordDeletionReason.NoLongerNeeded, confirmed: true } }), 'Delete permanently');
    expect(ready).not.toContain('disabled');
    expect(button(dialog({ initial: { reason: RecordDeletionReason.Other, note: 'Duplicate', confirmed: true } }), 'Delete permanently'))
      .not.toContain('disabled');
  });

  test('opens with the bad-tone banner', () => {
    expect(dialog({})).toMatch(/<p class="[^"]*" data-tone="bad"><span[^>]*>error<\/span><span[^>]*><strong[^>]*>This cannot be undone<\/strong>/);
  });

  test('a record that became blocked is refused with its own sentence and Refresh; the conflict keeps its words', () => {
    const shell = (failure: Parameters<typeof Dialog>[0]['failure']) => render(
      h(Dialog, {
        title: 'Delete vehicle', submitLabel: 'Delete permanently', busy: false, failure,
        onClose: () => {}, onSubmit: () => {}, onRefresh: () => {},
      }),
      { at: '/x', route: '/x' },
    );
    const blocked = shell({ kind: 'stale', message: 'This vehicle now has a rental assignment.', detail: 'Refresh the list.' });
    expect(blocked).toContain('This vehicle now has a rental assignment.</strong>Refresh the list.');
    expect(blocked).toContain('Refresh</button>');
    expect(button(blocked, 'Delete permanently')).toContain('disabled');
    const conflict = shell({ kind: 'stale', message: STALE_MESSAGE });
    expect(conflict).toContain(`${STALE_MESSAGE}</strong>Refresh to load the current values, then try again.`);
  });

  test('an Active rental says so instead, and counts the parts that go with it', () => {
    const markup = dialog({ target: { kind: RecordKind.RentalAssignment, value: rentalActive } });
    expect(markup).toContain('Delete rental assignment');
    expect(markup).toContain('This rental is active');
    expect(markup).toContain('Delete it only if this rental never happened.');
    expect(markup).not.toContain('This cannot be undone<');
    expect(markup).toContain('Its 1 driver authorization and 1 interruption are removed with it.');
  });
});

describe('after a deletion', () => {
  test('one confirmation line names what went, linking to its entry for a reader of the audit', () => {
    const withAudit = render(h(Confirmation, { done: vehicleDeleted, canAudit: true }), { at: '/x', route: '/x' });
    expect(withAudit).toContain(`Vehicle deleted:</span> ${vehicleDeleted.recordLabel}.`);
    expect(withAudit).toContain(`href="/security-audit/${vehicleDeleted.auditEntryId}"`);
    expect(withAudit).toContain('Written to the security audit.');
    const without = render(h(Confirmation, { done: vehicleDeleted, canAudit: false }), { at: '/x', route: '/x' });
    expect(without).toContain('Written to the security audit.');
    expect(without).not.toContain('href=');
  });

  test('Recently deleted links each entry only for a reader who may read the audit', () => {
    const withAudit = renderPage(RecordKind.RentalAssignment, [rentalEnded]);
    for (const item of deletionsMade) {
      expect(withAudit).toContain(`href="/security-audit/${item.auditEntryId}"`);
    }
    const without = renderPage(RecordKind.RentalAssignment, [rentalEnded], { permissions: ['Records.Delete'] });
    expect(without).toContain(`Vehicle · ${deletionsMade[1]!.recordLabel}`);
    for (const item of deletionsMade) {
      expect(without).not.toContain(`href="/security-audit/${item.auditEntryId}"`);
    }
  });

  test('Recently deleted says when nothing has been deleted yet', () => {
    const markup = render(h(RecentlyDeleted, { items: [], canAudit: true, phone: false }), { at: '/x', route: '/x' });
    expect(markup).toContain('Nothing has been deleted yet');
    expect(markup).toContain('each one linked to its security-audit entry.');
  });
});

describe('the two additions to the security audit', () => {
  test('the six deletion events are offered in the audit’s event filter', () => {
    const markup = render(h(SecurityAudit), {
      at: '/security-audit', route: '/security-audit', permissions: ['SecurityAudit.ReadCompany'],
    });
    for (const label of [
      'Rental assignment · Deleted', 'Driver authorisation · Deleted', 'Interruption · Deleted',
      'Vehicle · Deleted', 'Customer · Deleted', 'Driver · Deleted',
    ]) {
      expect(markup, label).toContain(`>${label}</option>`);
    }
  });

  const entry = (value: typeof vehicleEntry) => render(h(AuditEntry), {
    at: `/security-audit/${value.id}`,
    route: '/security-audit/:entryId',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[qk.audit.entry(value.id), value]],
  });

  test('the entry of a deleted vehicle shows the record it named and the copy it keeps', () => {
    const markup = entry(vehicleEntry);
    expect(fact(markup, 'Record')).toContain(vehicleDeleted.recordLabel);
    expect(fact(markup, 'Record')).toContain('The record was deleted, so there is nothing to open.');
    expect(markup).toContain('Deleted record');
    expect(markup).toContain('The values the record held when it was deleted.');
    expect(fact(markup, 'Plate Number')).toContain(vehicleReady.plateNumber);
    expect(markup).not.toContain('Recorded values');
    expect(markup).not.toContain('Before → after');
    expect(markup).not.toContain('Deleted authorizations');
    // The reason stays where it always is.
    expect(fact(markup, 'Recorded reason')).toContain('Practice or test record: Made while teaching a new colleague.');
  });

  test('the entry of a deleted rental adds one group per part that went with it', () => {
    const markup = entry(rentalEntry);
    expect(fact(markup, 'Record')).toContain('400 NDP · Roberts Liepins');
    expect(markup).toContain('Deleted authorizations');
    expect(markup).toContain('Authorization 1');
    expect(markup).toContain('Deleted interruptions');
    expect(markup).toContain('Interruption 1');
    expect(markup).not.toContain('Authorization 2');
  });

  test('a copy the reader does not recognise falls back to the ordinary payload views', () => {
    const markup = entry({ ...rentalEntry, beforeJson: '{"RecordLabel":"x","Other":[1]}' });
    expect(markup).not.toContain('Deleted record');
    expect(markup).not.toContain('>Record<');
    expect(markup).toContain('Unrecognised payload shape');
  });
});
