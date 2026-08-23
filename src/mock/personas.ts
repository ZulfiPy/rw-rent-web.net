import { ID } from './ids';

/**
 * Stands in for GET /api/me. The persona switcher swaps which entry is returned and nothing else —
 * no component reads a role name.
 */
export const ROLE_PERMS = {
  Viewer: [
    'Company.Read', 'Users.ReadDirectory', 'Drivers.Read', 'Customers.Read', 'Vehicles.Read',
    'RentalAssignments.Read', 'DriverAuthorizations.Read', 'Interruptions.Read',
  ],
  FleetManager: [
    'Company.Update', 'Users.ReviewRegistrations', 'Users.ManageRegistrations', 'Users.ActivateViewer',
    'Drivers.Manage', 'Customers.Manage', 'Vehicles.Manage', 'RentalAssignments.Manage',
    'DriverAuthorizations.Manage', 'Interruptions.Manage',
  ],
  CompanyPrincipal: [
    'Users.ActivateFleetManager', 'Users.CorrectName', 'Users.SuspendRestoreOrdinary',
    'Roles.ReadHistory', 'Roles.ManageViewerFleetManager', 'Sessions.ManageOrdinaryCompanyUsers',
    'SecurityAudit.ReadCompany',
  ],
  SystemAdministrator: [
    'Company.Create', 'Company.Delete', 'Users.ActivateCompanyPrincipal',
    'Users.SuspendRestoreCompanyPrincipal', 'Roles.ManageCompanyPrincipal', 'Sessions.ManageAnyUser',
    'SecurityAudit.ReadAll', 'SystemAdministration.Transfer', 'PrivilegedCorrections.Execute',
  ],
} as const;

export type RoleName = keyof typeof ROLE_PERMS;

/** Each role inherits everything below it. */
export const ROLE_CHAIN: Record<RoleName, RoleName[]> = {
  Viewer: ['Viewer'],
  FleetManager: ['Viewer', 'FleetManager'],
  CompanyPrincipal: ['Viewer', 'FleetManager', 'CompanyPrincipal'],
  SystemAdministrator: ['Viewer', 'FleetManager', 'CompanyPrincipal', 'SystemAdministrator'],
};

export const permsOf = (role: RoleName): string[] => {
  const out: string[] = [];
  for (const r of ROLE_CHAIN[role]) for (const p of ROLE_PERMS[r]) if (!out.includes(p)) out.push(p);
  return out;
};

export interface Persona {
  id: string;
  userId: string;
  role: RoleName;
}

/** The prototype's four personas, plus the no-permission state it reaches through Access pending. */
export const PERSONAS: Persona[] = [
  { id: 'u1', userId: ID.users.u1, role: 'SystemAdministrator' },
  { id: 'u2', userId: ID.users.u2, role: 'CompanyPrincipal' },
  { id: 'u4', userId: ID.users.u4, role: 'FleetManager' },
  { id: 'u5', userId: ID.users.u5, role: 'Viewer' },
  { id: 'u0', userId: ID.users.u5, role: 'Viewer' },
];

export const personaById = (id: string): Persona =>
  PERSONAS.find((p) => p.id === id) ?? (PERSONAS[0] as Persona);
