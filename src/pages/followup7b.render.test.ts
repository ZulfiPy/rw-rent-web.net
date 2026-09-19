import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import type { SecurityAuditResponse } from '@/api/dto';
import { formatLocal } from '@/format';
import { CompanyProfile } from './admin/CompanyProfile';
import { AuditEntry } from './audit/AuditEntry';
import { SecurityAudit } from './audit/SecurityAudit';
import { AssignmentRecord } from './fleet/AssignmentRecord';
import { CustomerRecord } from './fleet/CustomerRecord';
import { DriverRecord } from './fleet/DriverRecord';
import { VehicleRecord } from './fleet/VehicleRecord';
import { Overview } from './overview/Overview';
import {
  assignment, clearRenders, company, customer, driver, fact, othersRevoked, page, renderPage as render,
  revoked, seededVehicle, vehicle,
} from './followup7b.support';

/**
 * Follow-up 7's second batch on the screens themselves, rendered to markup from what the round-6
 * API answered (`followup7b.support.ts`). Nothing is fetched. The run that builds this may not sign
 * in to the app in a browser, so this is how the signed-in surfaces are checked; the reviewer's
 * browser steps are in `Context/wiring_report.md`.
 */
afterEach(clearRenders);

describe('who created and who last changed a record (F7-6)', () => {
  const vehicleMarkup = render(h(VehicleRecord), {
    at: `/vehicles/${vehicle.id}`,
    route: '/vehicles/:vehicleId',
    permissions: ['Vehicles.Read'],
    data: [[qk.vehicles.detail(vehicle.id), vehicle]],
  });

  test('the vehicle names its creator and its last changer, each with the local time', () => {
    const created = fact(vehicleMarkup, 'Created');
    expect(created).toContain('Karlis Zvaigzne');
    expect(created).toContain(formatLocal(vehicle.createdAtUtc));
    const changed = fact(vehicleMarkup, 'Last changed');
    expect(changed).toContain('Signe Priede');
    expect(changed).toContain(formatLocal(vehicle.updatedAtUtc));
    expect(vehicleMarkup).not.toContain('Last updated');
    expect(vehicleMarkup).not.toContain('>Never<');
  });

  test('a record nobody changed says so, and names its creator', () => {
    const markup = render(h(VehicleRecord), {
      at: `/vehicles/${seededVehicle.id}`,
      route: '/vehicles/:vehicleId',
      permissions: ['Vehicles.Read'],
      data: [[qk.vehicles.detail(seededVehicle.id), seededVehicle]],
    });
    expect(fact(markup, 'Created')).toContain('Karlis Zvaigzne');
    const changed = fact(markup, 'Last changed');
    expect(changed).toContain('Not changed since it was created');
    expect(changed).not.toContain('Karlis');
  });

  test('the customer, the driver and the company name theirs', () => {
    const customerMarkup = render(h(CustomerRecord), {
      at: `/customers/${customer.id}`,
      route: '/customers/:customerId',
      permissions: ['Customers.Read'],
      data: [[qk.customers.detail(customer.id), customer]],
    });
    const driverMarkup = render(h(DriverRecord), {
      at: `/drivers/${driver.id}`,
      route: '/drivers/:driverId',
      permissions: ['Drivers.Read'],
      data: [[qk.drivers.detail(driver.id), driver]],
    });
    const companyMarkup = render(h(CompanyProfile), {
      at: '/company',
      route: '/company',
      permissions: ['Company.Read'],
      data: [[qk.company, company]],
    });
    for (const [markup, record] of [
      [customerMarkup, customer], [driverMarkup, driver], [companyMarkup, company],
    ] as const) {
      expect(fact(markup, 'Created')).toContain(record.createdByDisplayName as string);
      expect(fact(markup, 'Created')).toContain(formatLocal(record.createdAtUtc));
      expect(fact(markup, 'Last changed')).toContain('Signe Priede');
      expect(fact(markup, 'Last changed')).toContain(formatLocal(record.updatedAtUtc));
      expect(markup).not.toContain('Last updated');
    }
    expect(fact(companyMarkup, 'Created')).toContain('Arturs Veidenbaums');
  });

  test('"System" names the technical actor, and only a record it created or changed last', () => {
    const bySystem = render(h(VehicleRecord), {
      at: `/vehicles/${vehicle.id}`,
      route: '/vehicles/:vehicleId',
      permissions: ['Vehicles.Read'],
      data: [[qk.vehicles.detail(vehicle.id), { ...vehicle, createdByDisplayName: null, updatedByDisplayName: null }]],
    });
    expect(fact(bySystem, 'Created')).toMatch(/>System</);
    expect(fact(bySystem, 'Last changed')).toMatch(/>System</);
    expect(vehicleMarkup).not.toMatch(/>System</);
  });

  test('the driver\'s history names the creator on its Created row, where it said "Not recorded"', () => {
    const markup = render(h(DriverRecord), {
      at: `/drivers/${driver.id}`,
      route: '/drivers/:driverId',
      permissions: ['Drivers.Read', 'SecurityAudit.ReadCompany'],
      data: [
        [qk.drivers.detail(driver.id), driver],
        [qk.audit.list({ EntityType: 'Driver', EntityId: driver.id, PageSize: 100 }), page<SecurityAuditResponse>([])],
      ],
    });
    expect(markup).toContain('Record created');
    expect(markup).not.toContain('Not recorded');
    expect(markup.match(/Karlis Zvaigzne/g)).toHaveLength(2);
  });
});

describe('the assignment record (F7-6)', () => {
  const read = (tab: string, permissions: string[] = ['RentalAssignments.Read']) =>
    render(h(AssignmentRecord), {
      at: `/rental-assignments/${assignment.id}${tab ? `?tab=${tab}` : ''}`,
      route: '/rental-assignments/:assignmentId',
      permissions,
      data: [
        [qk.assignments.detail(assignment.id), assignment],
        [qk.audit.list({ RentalAssignmentId: assignment.id, PageSize: 100 }), page<SecurityAuditResponse>([])],
      ],
    });

  test('the summary names who created it and who last changed it', () => {
    const markup = read('');
    expect(fact(markup, 'Created')).toContain('Karlis Zvaigzne');
    expect(fact(markup, 'Created')).toContain(formatLocal(assignment.createdAtUtc));
    expect(fact(markup, 'Last changed')).toContain('Signe Priede');
    expect(fact(markup, 'Last changed')).toContain(formatLocal(assignment.updatedAtUtc));
    expect(markup).not.toContain('Last updated');
  });

  test('each authorization row says who recorded it', () => {
    const markup = read('coverage');
    expect(assignment.driverAuthorizations).toHaveLength(2);
    expect(markup.match(/>Recorded by Karlis Zvaigzne</g)).toHaveLength(2);
  });

  test('each interruption row says who recorded it', () => {
    const markup = read('interruptions');
    expect(assignment.interruptions).toHaveLength(1);
    expect(markup.match(/>Recorded by Karlis Zvaigzne</g)).toHaveLength(1);
  });

  test('a row the technical actor recorded says "Recorded by System"', () => {
    const markup = render(h(AssignmentRecord), {
      at: `/rental-assignments/${assignment.id}?tab=coverage`,
      route: '/rental-assignments/:assignmentId',
      permissions: ['RentalAssignments.Read'],
      data: [[qk.assignments.detail(assignment.id), {
        ...assignment,
        driverAuthorizations: assignment.driverAuthorizations.map((z, n) =>
          (n === 0 ? { ...z, createdByDisplayName: null } : z)),
      }]],
    });
    expect(markup.match(/>Recorded by System</g)).toHaveLength(1);
    expect(markup.match(/>Recorded by Karlis Zvaigzne</g)).toHaveLength(1);
  });

  test('the corrections tab names the last changer beside the concurrency token', () => {
    const markup = read('corrections', ['RentalAssignments.Read', 'PrivilegedCorrections.Execute']);
    expect(fact(markup, 'Last changed')).toContain('Signe Priede');
    expect(markup).not.toContain('Last updated');
  });
});

describe('the Overview\'s activity card names the person on each row (F7-7)', () => {
  const thisYear = new Date().getUTCFullYear();
  const at = `${thisYear}-09-19T06:25:01Z`;
  const markup = render(h(Overview), {
    at: '/',
    route: '/',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[qk.audit.list({ PageNumber: 1, PageSize: 25 }), page<SecurityAuditResponse>([
      { ...othersRevoked, occurredAtUtc: at },
      { ...revoked, occurredAtUtc: at, actorUserId: '00000000-0000-0000-0000-000000000001', actorDisplayName: null },
    ])]],
  });

  test('the name comes first on the row\'s small line, then the local time', () => {
    expect(markup).toContain(`Dita Smite · ${formatLocal(at)}`);
    expect(markup).toContain('Session · Others revoked');
  });

  test('"System" when the entry has no human actor', () => {
    expect(markup).toContain(`System · ${formatLocal(at)}`);
  });
});

describe('a person\'s own session revocations (F7-8)', () => {
  const entryPage = (e: SecurityAuditResponse) => render(h(AuditEntry), {
    at: `/security-audit/${e.id}`,
    route: '/security-audit/:entryId',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[qk.audit.entry(e.id), e]],
  });

  test('the entry page labels the revoke-others entry and shows how many sessions ended', () => {
    const markup = entryPage(othersRevoked);
    expect(markup).toContain('Session · Others revoked');
    expect(fact(markup, 'Sessions ended')).toContain('>3<');
    expect(markup).not.toContain('Revoked Count');
    expect(markup).toContain('Dita Smite');
  });

  test('the entry page labels the one-session revocation', () => {
    const markup = entryPage(revoked);
    expect(markup).toContain('Session · Revoked');
    expect(markup).toContain('Dita Smite');
  });

  test('the audit list labels both, never as raw event types', () => {
    const markup = render(h(SecurityAudit), {
      at: '/security-audit',
      route: '/security-audit',
      permissions: ['SecurityAudit.ReadCompany'],
      data: [[qk.audit.list({ PageNumber: 1, PageSize: 20 }), page([othersRevoked, revoked])]],
    });
    expect(markup).toContain('>Session · Others revoked</a>');
    expect(markup).toContain('>Session · Revoked</a>');
    expect(markup).not.toMatch(/>Session\.(Others)?Revoked</);
    // The event filter offers both, by label, with the API's type as the value it sends.
    expect(markup).toContain('<option value="Session.Revoked">Session · Revoked</option>');
    expect(markup).toContain('<option value="Session.OthersRevoked">Session · Others revoked</option>');
  });
});
