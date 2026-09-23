import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { AssignmentStatus, RecordDeletionShow, RecordKind } from '@/api/dto';
import { outOfUseEmpty } from '@/format';
import { DeleteRecords } from './admin/DeleteRecords';
import { NewAssignment, vehicleInUse, type NewAssignmentForm } from './fleet/NewAssignment';
import { clearRenders, page, renderPage } from './followup7b.support';
import {
  countsEverything, countsOutOfUse, customersEverything, customersOutOfUse, customersPick, deletionsMade,
  driversActive, inUseRental, meAdmin, meManager, vehiclesPick,
} from './followup11.support';

/**
 * Follow-up 11, F11-2 and F11-3, rendered to markup from the scratch stack's answers
 * (`followup11.support.ts`): the new-rental dialog's warning about a vehicle in use, and the Delete
 * records page opening on Everything with an Out of use that points back to it.
 */
afterEach(clearRenders);

const PICK = { PageSize: 100 } as const;
const inUse = vehiclesPick.items.find((v) => v.plateNumber === '204 JLM')!;
const available = vehiclesPick.items.find((v) => v.plateNumber === '119 MPR')!;
const customer = customersPick.items.find((c) => c.displayName === 'Roberts Liepins')!;
const driver = driversActive.items[0]!;

/* F11-2 ---------------------------------------------------------------------------------------- */

/** The new-rental dialog as the Fleet Manager opens it, the three lists it reads in the cache. */
const newRental = (initial: Partial<NewAssignmentForm>) => renderPage(h(NewAssignment, { onClose: () => {}, initial }), {
  at: '/rental-assignments', route: '/rental-assignments', permissions: meManager.permissions, me: meManager,
  data: [
    [qk.customers.list(PICK), customersPick],
    [qk.vehicles.list(PICK), vehiclesPick],
    [qk.drivers.list({ ...PICK, IsActive: true }), driversActive],
  ],
});

/** The markup of one field, from its label to the next field's. */
const field = (markup: string, label: string) => {
  const at = markup.indexOf(`<span>${label}</span>`);
  expect(at, `no field ${label}`).toBeGreaterThan(-1);
  const next = markup.indexOf('<label', at);
  return markup.slice(at, next > -1 ? next : undefined);
};

/** The opening tag of the dialog's submit. */
const submit = (markup: string) => {
  const at = markup.indexOf('Create assignment</button>');
  return markup.slice(markup.lastIndexOf('<button', at), markup.indexOf('>', markup.lastIndexOf('<button', at)) + 1);
};

/** The warning's sentence, its link to the rental that holds the vehicle included. */
const WARNING = new RegExp(
  `This vehicle is in use by ${inUse.currentCustomerDisplayName}\\. End <a href="/rental-assignments/${inUse.currentAssignmentId}"[^>]*>that rental</a> first, or plan this one\\.`,
);

describe('the new-rental dialog warns about a vehicle in use (F11-2)', () => {
  test('Active on a vehicle in use: an amber line under Vehicle names the customer and links to that rental', () => {
    // The list the dialog picks from names who has 204 JLM, and the link opens that Active rental.
    expect(inUse.availability).toBe(2);
    expect(inUse.currentCustomerDisplayName).toBe('Anete Kalnina');
    expect(inUse.currentAssignmentId).toBe(inUseRental.id);
    expect(inUseRental.status).toBe(AssignmentStatus.Active);
    expect(inUseRental.customerDisplayName).toBe(inUse.currentCustomerDisplayName);

    const markup = newRental({ customerId: customer.id, vehicleId: inUse.id, initialStatus: AssignmentStatus.Active });
    const vehicle = field(markup, 'Vehicle');
    expect(vehicle).toMatch(WARNING);
    expect(vehicle).toMatch(/<span class="_warning_[^"]*"><span data-icon="true" aria-hidden="true" class="_warningIcon_[^"]*">warning<\/span>/);
    // It is a warning, not the API's refusal: the select is not marked invalid.
    expect(vehicle).not.toContain('aria-invalid="true"');
    expect(field(markup, 'Customer')).not.toContain('in use');
  });

  test('the warning blocks nothing: with a driver named, Create assignment stays enabled', () => {
    const markup = newRental({
      customerId: customer.id, vehicleId: inUse.id, initialStatus: AssignmentStatus.Active, mode: 'named', named: [driver.id],
    });
    expect(markup).toMatch(WARNING);
    expect(submit(markup)).not.toContain('disabled');
  });

  test('no warning for a Planned rental of the same vehicle, nor for an Active one on a free vehicle', () => {
    const planned = newRental({ customerId: customer.id, vehicleId: inUse.id, initialStatus: AssignmentStatus.Planned });
    expect(planned).not.toContain('This vehicle is in use');
    const free = newRental({ customerId: customer.id, vehicleId: available.id, initialStatus: AssignmentStatus.Active });
    expect(free).not.toContain('This vehicle is in use');
    const none = newRental({ initialStatus: AssignmentStatus.Active });
    expect(none).not.toContain('This vehicle is in use');
  });

  test('it reads only the server’s availability, and words a vehicle without a named rental plainly', () => {
    expect(vehicleInUse(inUse, AssignmentStatus.Active)).toBe(inUse);
    expect(vehicleInUse(inUse, AssignmentStatus.Planned)).toBeNull();
    expect(vehicleInUse(available, AssignmentStatus.Active)).toBeNull();
    expect(vehicleInUse(undefined, AssignmentStatus.Active)).toBeNull();
    // Reserved (3) is a planned rental's, not a running one's: no warning either.
    const reserved = vehiclesPick.items.find((v) => v.availability === 3)!;
    expect(vehicleInUse(reserved, AssignmentStatus.Active)).toBeNull();

    const unnamed = { ...inUse, id: 'no-rental', currentAssignmentId: null, currentCustomerDisplayName: null };
    const markup = renderPage(h(NewAssignment, { onClose: () => {}, initial: { vehicleId: unnamed.id, initialStatus: AssignmentStatus.Active } }), {
      at: '/x', route: '/x', permissions: meManager.permissions,
      data: [[qk.vehicles.list(PICK), { ...vehiclesPick, items: [unnamed] }], [qk.customers.list(PICK), customersPick]],
    });
    expect(markup).toContain('This vehicle is in use. End that rental first, or plan this one.');
    expect(field(markup, 'Vehicle')).not.toContain('<a ');
  });
});

/* F11-3 ---------------------------------------------------------------------------------------- */

/** The page at an address, as the administrator, with the customers' lists and both filters' counts. */
const deleteRecords = (at: string, items = customersEverything, show: RecordDeletionShow = RecordDeletionShow.Everything, counts = {
  out: countsOutOfUse, every: countsEverything,
}) => renderPage(h(DeleteRecords), {
  at, route: '/delete-records', permissions: meAdmin.permissions, me: meAdmin,
  data: [
    [qk.recordDeletions.candidates(RecordKind.Customer, { PageNumber: 1, PageSize: 20, Show: show }), items],
    [qk.recordDeletions.counts(RecordDeletionShow.OutOfUse), counts.out],
    [qk.recordDeletions.counts(RecordDeletionShow.Everything), counts.every],
    [qk.recordDeletions.made({ PageSize: 20 }), deletionsMade],
  ],
});

/** The page's list, without Recently deleted below it. */
const listOf = (markup: string) => markup.slice(0, markup.indexOf('Recently deleted'));

describe('Delete records opens on Everything (F11-3)', () => {
  test('the owner’s case: an active customer with a planned rental is there at once, Ready, taking it', () => {
    const markup = deleteRecords('/delete-records?kind=customers');
    expect(markup).toMatch(/_selectValue_[^"]*">Everything<\/span>/);
    expect(markup).toMatch(new RegExp(`Customers<span[^>]*>${countsEverything.customers}</span>`));
    expect(markup).not.toContain('Clear filters');
    const martins = customersEverything.items.find((c) => c.displayName === 'Martins Ozols')!;
    expect(martins.isActive).toBe(true);
    expect(martins.deletion.takes.rentalAssignments).toBe(1);
    const at = markup.indexOf(martins.displayName);
    const row = markup.slice(markup.lastIndexOf('<tr', at), markup.indexOf('</tr>', at));
    expect(row).toContain('>Active<');
    expect(row).toContain('>Ready<');
    expect(row).toContain('Takes 1 rental assignment with it');
    for (const c of customersEverything.items) expect(listOf(markup)).toContain(c.displayName);
  });

  test('"Out of use" stays as a filter, which Clear filters undoes', () => {
    const markup = deleteRecords('/delete-records?kind=customers&show=out-of-use', customersOutOfUse, RecordDeletionShow.OutOfUse);
    expect(markup).toMatch(/_selectValue_[^"]*">Out of use<\/span>/);
    expect(markup).toContain('<option value="">Everything</option><option value="out-of-use" selected="">Out of use</option>');
    expect(markup).toContain('Clear filters');
    expect(markup).toMatch(/Customers<span[^>]*>0<\/span>/);
  });

  test('its empty list says how many records Everything holds, with the button that switches to it', () => {
    expect(customersOutOfUse.totalCount).toBe(0);
    const markup = deleteRecords('/delete-records?kind=customers&show=out-of-use', customersOutOfUse, RecordDeletionShow.OutOfUse);
    expect(markup).toContain('Nothing out of use here');
    expect(markup).toContain(`${countsEverything.customers} active customers are under Everything.`);
    expect(markup).toMatch(/<button type="button"[^>]*><span[^>]*>visibility<\/span>Show everything<\/button>/);
    expect(listOf(markup)).not.toContain('<table');
  });

  test('when Everything holds none either, it says so and offers no switch; Everything’s own empty list', () => {
    const none = { out: { ...countsOutOfUse, customers: 0 }, every: { ...countsEverything, customers: 0 } };
    const outOfUse = deleteRecords('/delete-records?kind=customers&show=out-of-use', customersOutOfUse, RecordDeletionShow.OutOfUse, none);
    expect(outOfUse).toContain('Nothing out of use here');
    expect(outOfUse).toContain('There are no customers under Everything either.');
    expect(outOfUse).not.toContain('Show everything');
    const everything = deleteRecords('/delete-records?kind=customers', page([]) as typeof customersEverything, RecordDeletionShow.Everything, none);
    expect(everything).toContain('Nothing to delete');
    expect(everything).toContain('There are no customers.');
    expect(everything).not.toContain('Nothing out of use here');
  });

  test('an address from before Follow-up 11, `show=all`, still opens on Everything', () => {
    const markup = deleteRecords('/delete-records?kind=customers&show=all');
    expect(markup).toMatch(/_selectValue_[^"]*">Everything<\/span>/);
    expect(markup).toContain('Martins Ozols');
  });

  test('each kind is worded as the API’s filter counts it, one and many', () => {
    expect(outOfUseEmpty(RecordKind.Customer, 1)).toBe('1 active customer is under Everything.');
    expect(outOfUseEmpty(RecordKind.Customer, 7)).toBe('7 active customers are under Everything.');
    expect(outOfUseEmpty(RecordKind.RentalAssignment, 2)).toBe('2 planned or active rental assignments are under Everything.');
    expect(outOfUseEmpty(RecordKind.DriverAuthorization, 1)).toBe('1 open driver authorization is under Everything.');
    expect(outOfUseEmpty(RecordKind.Interruption, 3)).toBe('3 open interruptions are under Everything.');
    expect(outOfUseEmpty(RecordKind.Vehicle, 4)).toBe('4 active vehicles are under Everything.');
    expect(outOfUseEmpty(RecordKind.Driver, 1)).toBe('1 active driver is under Everything.');
    // Counts not known yet: the switch is still offered, without a number.
    expect(outOfUseEmpty(RecordKind.Driver, undefined)).toBe('Everything lists the records still in use.');
    expect(outOfUseEmpty(RecordKind.Driver, 0)).toBeNull();
  });
});
