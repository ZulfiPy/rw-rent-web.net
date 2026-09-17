import type { Permission } from './permissions';

/**
 * What each destination needs, in one place, so the navigation and the route guard can never
 * disagree.
 *
 * They did disagree, and that was the tester's T-001: the menu hid an item the persona had no
 * permission for, but typing its address rendered the page anyway. `/system-administrator` was the
 * worst case — it told a Company Principal, a Fleet Manager and a Viewer that they were the current
 * System Administrator and offered them the transfer action, which only the API's 403 then refused.
 *
 * `null` means open to every signed-in persona, exactly as the prototype's `perm: null`: the
 * Overview, the queue, the two placeholders and the account's own page.
 */
export const ROUTE_PERMISSIONS: ReadonlyArray<readonly [string, Permission | null]> = [
  ['/overview', null],
  ['/needs-attention', null],
  ['/tasks', null],
  ['/insurance-cases', null],
  ['/profile', null],
  ['/rental-assignments', 'RentalAssignments.Read'],
  ['/vehicles', 'Vehicles.Read'],
  ['/customers', 'Customers.Read'],
  ['/drivers', 'Drivers.Read'],
  ['/users', 'Users.ReadDirectory'],
  ['/registrations', 'Users.ReviewRegistrations'],
  ['/security-audit', 'SecurityAudit.ReadCompany'],
  ['/company', 'Company.Read'],
  ['/system-administrator', 'SystemAdministration.Transfer'],
];

const BY_SECTION = new Map<string, Permission | null>(
  ROUTE_PERMISSIONS.map(([to, permission]) => [to, permission]),
);

/**
 * The permission a path needs, or `null` when it needs none.
 *
 * A record route takes its list's permission, because a record is the list's own row: `/vehicles/x`
 * asks for `Vehicles.Read` like `/vehicles`. That is what the first path segment is for here.
 *
 * An address that belongs to no section returns `null`: the router sends it to the Overview, and a
 * guard that refused it would replace that redirect with a lock the persona cannot act on.
 */
export function routePermission(pathname: string): Permission | null {
  const section = pathname.split('/')[1] ?? '';
  return BY_SECTION.get(`/${section}`) ?? null;
}

/**
 * Whether a persona holding `permissions` may open `pathname`. The permission list is the one
 * `GET /api/me` returns; nothing is inferred from a role name.
 */
export function isRouteAllowed(pathname: string, permissions: readonly string[]): boolean {
  const permission = routePermission(pathname);
  return permission === null || permissions.includes(permission);
}
