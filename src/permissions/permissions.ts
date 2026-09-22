/**
 * Code-owned permission strings, exactly as GET /api/me returns them. Seven are enforced in service
 * code rather than policy attributes and so do not appear in swagger — see COVERAGE.md §5.2.
 */
export const PERMISSIONS = [
  'Company.Read', 'Company.Create', 'Company.Update', 'Company.Delete',
  'Users.ReadDirectory', 'Users.ReviewRegistrations', 'Users.ManageRegistrations',
  'Users.ActivateViewer', 'Users.ActivateFleetManager', 'Users.ActivateCompanyPrincipal',
  'Users.CorrectName', 'Users.SuspendRestoreOrdinary', 'Users.SuspendRestoreCompanyPrincipal',
  'Roles.ReadHistory', 'Roles.ManageViewerFleetManager', 'Roles.ManageCompanyPrincipal',
  // Giving, changing and revoking the Record deleter role: the System Administrator's alone (round 9).
  'Roles.ManageRecordDeleter',
  'Sessions.ManageOrdinaryCompanyUsers', 'Sessions.ManageAnyUser',
  'SecurityAudit.ReadCompany', 'SecurityAudit.ReadAll',
  'SystemAdministration.Transfer', 'PrivilegedCorrections.Execute',
  'Vehicles.Read', 'Vehicles.Manage',
  'Customers.Read', 'Customers.Manage',
  'Drivers.Read', 'Drivers.Manage',
  'RentalAssignments.Read', 'RentalAssignments.Manage',
  'DriverAuthorizations.Read', 'DriverAuthorizations.Manage',
  'Interruptions.Read', 'Interruptions.Manage',
  // The Delete records page (the backend's round 7): the System Administrator's, and since round 9
  // the Record deleter role's, which holds nothing else.
  'Records.Delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
