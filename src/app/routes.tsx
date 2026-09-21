import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Permission } from '@/permissions/permissions';
import { UserDirectory } from '@/pages/users/UserDirectory';
import { UserRecord } from '@/pages/users/UserRecord';
import { Registrations } from '@/pages/registrations/Registrations';
import { SecurityAudit } from '@/pages/audit/SecurityAudit';
import { AuditEntry } from '@/pages/audit/AuditEntry';
import { Overview } from '@/pages/overview/Overview';
import { NeedsAttention } from '@/pages/overview/NeedsAttention';
import { InsuranceCases, Tasks } from '@/pages/simple/Placeholders';
import { Assignments } from '@/pages/fleet/Assignments';
import { AssignmentRecord } from '@/pages/fleet/AssignmentRecord';
import { Vehicles } from '@/pages/fleet/Vehicles';
import { VehicleRecord } from '@/pages/fleet/VehicleRecord';
import { Customers } from '@/pages/fleet/Customers';
import { CustomerRecord } from '@/pages/fleet/CustomerRecord';
import { Drivers } from '@/pages/fleet/Drivers';
import { DriverRecord } from '@/pages/fleet/DriverRecord';
import { CompanyProfile } from '@/pages/admin/CompanyProfile';
import { SystemAdministrator } from '@/pages/admin/SystemAdministrator';
import { DeleteRecords } from '@/pages/admin/DeleteRecords';
import { Profile } from '@/pages/account/Profile';

/** What the navigation shows for a destination it offers. Absent for a route it does not. */
export interface NavEntry {
  /** The prototype's group heading; groups appear in the order the table first mentions them. */
  group: string;
  label: string;
  icon: string;
  badge?: 'queue' | 'registrations';
}

export interface AppRoute {
  /** The router's own path pattern. The router decides what matches it, not this app. */
  path: string;
  element: ReactNode;
  /**
   * The permission the page needs. `null` is written out rather than left off, so a route cannot
   * reach the table without someone having decided.
   */
  permission: Permission | null;
  nav?: NavEntry;
}

/**
 * Every route behind the shell, with the permission it needs and the navigation entry it offers.
 *
 * One table, because two were the defect. Follow-up 4 kept the permissions in their own list and
 * looked them up from the text of the address — the raw first path segment, exactly as typed. The
 * router does not match that way: it ignores letter case and matches after decoding. So
 * `/System-Administrator`, `/SYSTEM-ADMINISTRATOR` and `/%73ystem-administrator` all reached the
 * System Administrator page while the lookup found no entry for them, returned "no permission
 * needed", and let a Viewer through to an enabled Initiate transfer. `/REGISTRATIONS` and
 * `/Security-Audit` went the same way.
 *
 * The fix is not a better lookup. The permission now travels with the route's element, so the guard
 * is handed the permission of **the route the router actually matched** and never reads the address
 * at all. Whatever spelling the router resolves to a page gets that page's permission, including
 * spellings nobody has thought of yet.
 *
 * Table order is route order and navigation order. A record route sits beside its list and carries
 * the same permission, because a record is the list's own row.
 */
export const ROUTES: readonly AppRoute[] = [
  {
    path: '/overview',
    element: <Overview />,
    permission: null,
    nav: { group: 'Overview', label: 'Overview', icon: 'space_dashboard' },
  },
  {
    path: '/needs-attention',
    element: <NeedsAttention />,
    permission: null,
    nav: { group: 'Overview', label: 'Needs attention', icon: 'flag', badge: 'queue' },
  },
  {
    path: '/rental-assignments',
    element: <Assignments />,
    permission: 'RentalAssignments.Read',
    nav: { group: 'Operations', label: 'Rental assignments', icon: 'assignment' },
  },
  {
    path: '/rental-assignments/:assignmentId',
    element: <AssignmentRecord />,
    permission: 'RentalAssignments.Read',
  },
  {
    path: '/tasks',
    element: <Tasks />,
    permission: null,
    nav: { group: 'Operations', label: 'Tasks', icon: 'checklist' },
  },
  {
    path: '/insurance-cases',
    element: <InsuranceCases />,
    permission: null,
    nav: { group: 'Operations', label: 'Insurance cases', icon: 'shield' },
  },
  {
    path: '/vehicles',
    element: <Vehicles />,
    permission: 'Vehicles.Read',
    nav: { group: 'Fleet', label: 'Vehicles', icon: 'directions_car' },
  },
  {
    path: '/vehicles/:vehicleId',
    element: <VehicleRecord />,
    permission: 'Vehicles.Read',
  },
  {
    path: '/customers',
    element: <Customers />,
    permission: 'Customers.Read',
    nav: { group: 'Business relationships', label: 'Customers', icon: 'contacts' },
  },
  {
    path: '/customers/:customerId',
    element: <CustomerRecord />,
    permission: 'Customers.Read',
  },
  {
    path: '/drivers',
    element: <Drivers />,
    permission: 'Drivers.Read',
    nav: { group: 'Business relationships', label: 'Drivers', icon: 'badge' },
  },
  {
    path: '/drivers/:driverId',
    element: <DriverRecord />,
    permission: 'Drivers.Read',
  },
  {
    path: '/users',
    element: <UserDirectory />,
    permission: 'Users.ReadDirectory',
    nav: { group: 'Users & access', label: 'User directory', icon: 'group' },
  },
  {
    path: '/users/:userId',
    element: <UserRecord />,
    permission: 'Users.ReadDirectory',
  },
  {
    path: '/registrations',
    element: <Registrations />,
    permission: 'Users.ReviewRegistrations',
    nav: {
      group: 'Users & access',
      label: 'Registrations',
      icon: 'how_to_reg',
      badge: 'registrations',
    },
  },
  {
    path: '/security-audit',
    element: <SecurityAudit />,
    permission: 'SecurityAudit.ReadCompany',
    nav: { group: 'Users & access', label: 'Security audit', icon: 'policy' },
  },
  {
    path: '/security-audit/:entryId',
    element: <AuditEntry />,
    permission: 'SecurityAudit.ReadCompany',
  },
  {
    path: '/company',
    element: <CompanyProfile />,
    permission: 'Company.Read',
    nav: { group: 'Administration', label: 'Company profile', icon: 'apartment' },
  },
  {
    path: '/system-administrator',
    element: <SystemAdministrator />,
    permission: 'SystemAdministration.Transfer',
    nav: {
      group: 'Administration',
      label: 'System Administrator',
      icon: 'admin_panel_settings',
    },
  },
  {
    path: '/delete-records',
    element: <DeleteRecords />,
    permission: 'Records.Delete',
    nav: { group: 'Administration', label: 'Delete records', icon: 'delete_sweep' },
  },
  {
    path: '/profile',
    element: <Profile />,
    permission: null,
  },
  /*
   * The catch-all. It needs no permission because it renders no page: an address that resolves to
   * nothing goes to the Overview, and a lock here would replace that redirect with something nobody
   * can act on.
   */
  {
    path: '*',
    element: <Navigate to="/overview" replace />,
    permission: null,
  },
];

/** What the navigation offers, grouped in the order the table first mentions each group. */
export interface NavItem {
  to: string;
  label: string;
  icon: string;
  permission: Permission | null;
  badge?: 'queue' | 'registrations';
}

export const NAV_GROUPS: ReadonlyArray<{ label: string; items: readonly NavItem[] }> = (() => {
  const groups = new Map<string, NavItem[]>();
  for (const route of ROUTES) {
    if (!route.nav) continue;
    const items = groups.get(route.nav.group) ?? [];
    items.push({
      to: route.path,
      label: route.nav.label,
      icon: route.nav.icon,
      permission: route.permission,
      ...(route.nav.badge ? { badge: route.nav.badge } : {}),
    });
    groups.set(route.nav.group, items);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
})();
