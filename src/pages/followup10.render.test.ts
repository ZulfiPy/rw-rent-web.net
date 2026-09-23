import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind, type ApplicationUserResponse, type PagedResponse, type RoleAssignmentResponse } from '@/api/dto';
import { Profile } from './account/Profile';
import { DeleteRecords } from './admin/DeleteRecords';
import { Overview } from './overview/Overview';
import { UserDirectory } from './users/UserDirectory';
import { UserRecord } from './users/UserRecord';
import { clearRenders, fact, renderPage } from './followup7b.support';
import {
  candidatesVehiclesBare, countsBare, deletionsBare, directoryAdmin, directoryPrincipal, historyAfterRevoke,
  historyHolder, meAdmin, meTomsBare, meTomsHolder, overviewBare, tomsBefore, tomsHolder,
} from './followup10.support';

/**
 * Follow-up 10, the Record deleter role in the app, rendered to markup from the backend's round-9
 * answers captured on the scratch stack: the Roles tab where the administrator gives the right and a
 * Principal only reads it, the role's name in the directory, the record and the profile, and the
 * Delete records page and the Overview as a person who holds the role alone sees them.
 */
afterEach(clearRenders);

const TOMS = tomsHolder.id;

/** The Principal's permissions as GET /api/me lists them (the same list as `routes.test.ts`). */
const PRINCIPAL = [
  'Company.Read', 'Users.ReadDirectory', 'Drivers.Read', 'Customers.Read', 'Vehicles.Read',
  'RentalAssignments.Read', 'DriverAuthorizations.Read', 'Interruptions.Read',
  'Company.Update', 'Users.ReviewRegistrations', 'Users.ManageRegistrations', 'Users.ActivateViewer',
  'Drivers.Manage', 'Customers.Manage', 'Vehicles.Manage', 'RentalAssignments.Manage',
  'DriverAuthorizations.Manage', 'Interruptions.Manage',
  'Users.ActivateFleetManager', 'Users.CorrectName', 'Users.SuspendRestoreOrdinary',
  'Roles.ReadHistory', 'Roles.ManageViewerFleetManager', 'Sessions.ManageOrdinaryCompanyUsers',
  'SecurityAudit.ReadCompany',
];

const rolesTab = (user: ApplicationUserResponse, history: PagedResponse<RoleAssignmentResponse>, permissions: string[]) =>
  renderPage(h(UserRecord), {
    at: `/users/${TOMS}?tab=roles`,
    route: '/users/:userId',
    permissions,
    data: [
      [qk.users.detail(TOMS), user],
      [qk.roles.history(TOMS, { PageSize: 100 }), history],
      [qk.users.list({ PageSize: 100 }), permissions.includes('Roles.ManageRecordDeleter') ? directoryAdmin : directoryPrincipal],
    ],
  });

/** The table row of one assignment, from its revocation text or its place in the history. */
const row = (markup: string, index: number) => {
  const body = markup.slice(markup.indexOf('<tbody>'), markup.indexOf('</tbody>'));
  return body.split('<tr').slice(1)[index] ?? '';
};

describe('the Roles tab, for the administrator', () => {
  test('beside Grant role, "Give the delete right" for a person who does not hold it', () => {
    const markup = rolesTab(tomsBefore, historyAfterRevoke, meAdmin.permissions);
    expect(markup).toContain('Grant role</button>');
    expect(markup).toMatch(/<button[^>]*>(?:(?!<\/button>).)*delete_sweep(?:(?!<\/button>).)*Give the delete right<\/button>/);
    expect(markup).toContain(
      'Viewer, Fleet Manager and Company Principal can be granted after activation. System Administrator is never grantable. The delete right is given with its own action.',
    );
  });

  test('no second offer to someone who holds it; their Record deleter row has Expiry and Revoke', () => {
    const markup = rolesTab(tomsHolder, historyHolder, meAdmin.permissions);
    expect(markup).not.toContain('Give the delete right');
    expect(markup).toContain('Grant role</button>');

    const effective = row(markup, 0);
    expect(historyHolder.items[0]!.role).toBe(5);
    expect(effective).toContain('>Record deleter<');
    expect(effective).toContain('>Effective<');
    expect(effective).toContain('Expiry</button>');
    expect(effective).toContain('Revoke</button>');

    // A revoked Record deleter row is history: no actions.
    const revoked = row(markup, 1);
    expect(revoked).toContain('>Record deleter<');
    expect(revoked).toContain('>Revoked<');
    expect(revoked).toContain(historyHolder.items[1]!.revocationReason!);
    expect(revoked).not.toContain('Revoke</button>');
  });

  test('not offered for a suspended account, nor on the protected administrator’s own record', () => {
    const suspended = rolesTab({ ...tomsBefore, status: 3 }, historyAfterRevoke, meAdmin.permissions);
    expect(suspended).not.toContain('Give the delete right');
    const administrator = rolesTab({ ...tomsBefore, effectiveRoles: [1], companyId: null }, historyAfterRevoke, meAdmin.permissions);
    expect(administrator).not.toContain('Give the delete right');
  });

  test('the history at the end names the revocation and its reason', () => {
    const markup = rolesTab(tomsBefore, historyAfterRevoke, meAdmin.permissions);
    const revoked = row(markup, 1);
    expect(revoked).toContain('>Record deleter<');
    expect(revoked).toContain('Follow-up 10 check: the practice is over.');
    expect(revoked).not.toContain('Expiry</button>');
  });
});

describe('the Roles tab, for a Company Principal', () => {
  const markup = rolesTab(tomsHolder, historyHolder, PRINCIPAL);

  test('reads the Record deleter row, without Expiry or Revoke, and is not offered the right', () => {
    expect(markup).not.toContain('Give the delete right');
    expect(markup).not.toContain('The delete right is given with its own action.');
    const effective = row(markup, 0);
    expect(effective).toContain('>Record deleter<');
    expect(effective).toContain('>Effective<');
    expect(effective).not.toContain('Expiry</button>');
    expect(effective).not.toContain('Revoke</button>');
  });

  test('is not offered the right for a person who does not hold it either, and keeps Grant role', () => {
    const before = rolesTab(tomsBefore, historyAfterRevoke, PRINCIPAL);
    expect(before).not.toContain('Give the delete right');
    expect(before).toContain('Grant role</button>');
  });

  test('still manages the Viewer role it may manage', () => {
    const viewer = row(markup, historyHolder.items.findIndex((item) => item.role === 4 && item.isEffective));
    expect(viewer).toContain('>Viewer<');
    expect(viewer).toContain('Expiry</button>');
    expect(viewer).toContain('Revoke</button>');
    expect(markup).toContain('Grant role</button>');
  });
});

describe('the role’s name wherever roles are named', () => {
  test('the directory lists it on the person and offers it in the role filter', () => {
    const markup = renderPage(h(UserDirectory), {
      at: '/users',
      route: '/users',
      permissions: meAdmin.permissions,
      data: [[qk.users.list({ PageNumber: 1, PageSize: 20 }), directoryAdmin]],
    });
    expect(markup).toContain('Record deleter, Viewer');
    expect(markup).toContain('<option value="5">Record deleter</option>');
  });

  test('the user record names both roles in its header', () => {
    const markup = rolesTab(tomsHolder, historyHolder, meAdmin.permissions);
    expect(markup).toContain('Record deleter, Viewer');
  });

  test('the profile names the holder’s roles', () => {
    const markup = renderPage(h(Profile), {
      at: '/profile', route: '/profile', permissions: meTomsHolder.permissions, me: meTomsHolder,
    });
    // In the order the API lists them.
    expect(meTomsHolder.roles).toEqual([5, 4]);
    expect(fact(markup, 'Roles')).toContain('Record deleter, Viewer');
  });
});

describe('a person who holds the Record deleter role alone', () => {
  test('reads the Delete records page, its rows with their Delete, and Recently deleted without audit links', () => {
    const markup = renderPage(h(DeleteRecords), {
      // The captured lists are the Out of use ones, which the page no longer opens on (Follow-up 11).
      at: '/delete-records?kind=vehicles&show=out-of-use',
      route: '/delete-records',
      permissions: meTomsBare.permissions,
      me: meTomsBare,
      data: [
        [qk.recordDeletions.candidates(RecordKind.Vehicle, { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.OutOfUse }), candidatesVehiclesBare],
        [qk.recordDeletions.counts(RecordDeletionShow.OutOfUse), countsBare],
        [qk.recordDeletions.made({ PageSize: 20 }), deletionsBare],
      ],
    });
    for (const candidate of candidatesVehiclesBare.items) expect(markup).toContain(candidate.plateNumber);
    expect(markup.match(/>Delete<\/button>/g)).toHaveLength(candidatesVehiclesBare.items.length);
    expect(markup).not.toContain('Delete…');
    expect(markup).toContain(deletionsBare.items[0]!.recordLabel);
    expect(markup).not.toContain('href="/security-audit/');
  });

  test('sees the Overview’s restricted states, as for any missing permission', () => {
    const markup = renderPage(h(Overview), {
      at: '/overview',
      route: '/overview',
      permissions: meTomsBare.permissions,
      me: meTomsBare,
      data: [[qk.overview, overviewBare]],
    });
    expect(markup).not.toContain('Active assignments');
    expect(markup).not.toContain('Vehicles available');
    expect(markup).not.toContain('Registrations to review');
    expect(markup).not.toContain('Open interruptions');
    expect(markup).toContain('Open tasks');
    expect(markup).toContain('Your role does not include audit access.');
  });
});
