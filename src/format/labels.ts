import {
  ApplicationUserRole, ApplicationUserStatus, AssignmentDriverAuthorizationType, AssignmentStatus,
  AuthorizationStopReason, BillingImpact, BodyType, CustomerType, FuelType, GearboxType,
  InterruptionReason,
} from '@/api/dto';

/** Display strings, keyed by raw wire value. No component builds a label itself. */

export const ROLE_LABEL: Record<ApplicationUserRole, string> = {
  [ApplicationUserRole.SystemAdministrator]: 'System Administrator',
  [ApplicationUserRole.CompanyPrincipal]: 'Company Principal',
  [ApplicationUserRole.FleetManager]: 'Fleet Manager',
  [ApplicationUserRole.Viewer]: 'Viewer',
};
export const NO_ROLE_LABEL = 'None';

const ROLE_RANK: Record<ApplicationUserRole, number> = {
  [ApplicationUserRole.SystemAdministrator]: 4,
  [ApplicationUserRole.CompanyPrincipal]: 3,
  [ApplicationUserRole.FleetManager]: 2,
  [ApplicationUserRole.Viewer]: 1,
};

/** Every effective role, in the order the API returns them. */
export const rolesLabel = (roles: readonly ApplicationUserRole[]): string =>
  roles.length ? roles.map((r) => ROLE_LABEL[r]).join(', ') : NO_ROLE_LABEL;

/** The highest role held — what the account is, in one word, for the sidebar footer. */
export const primaryRoleLabel = (roles: readonly ApplicationUserRole[]): string => {
  const top = roles.reduce<ApplicationUserRole | null>(
    (best, r) => (best === null || ROLE_RANK[r] > ROLE_RANK[best] ? r : best),
    null,
  );
  return top === null ? NO_ROLE_LABEL : ROLE_LABEL[top];
};

export const USER_STATUS_LABEL: Record<ApplicationUserStatus, string> = {
  [ApplicationUserStatus.PendingActivation]: 'Pending activation',
  [ApplicationUserStatus.Active]: 'Active',
  [ApplicationUserStatus.Suspended]: 'Suspended',
  [ApplicationUserStatus.RegistrationRejected]: 'Registration rejected',
  [ApplicationUserStatus.RegistrationExpired]: 'Registration expired',
};

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  [AssignmentStatus.Active]: 'Active',
  [AssignmentStatus.Ended]: 'Ended',
  [AssignmentStatus.Cancelled]: 'Cancelled',
  [AssignmentStatus.Planned]: 'Planned',
};

export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  [BodyType.Sedan]: 'Sedan',
  [BodyType.Wagon]: 'Wagon',
  [BodyType.Suv]: 'SUV',
};

export const GEARBOX_LABEL: Record<GearboxType, string> = {
  [GearboxType.Manual]: 'Manual',
  [GearboxType.Automatic]: 'Automatic',
};

export const FUEL_LABEL: Record<FuelType, string> = {
  [FuelType.Petrol]: 'Petrol',
  [FuelType.Diesel]: 'Diesel',
  [FuelType.Electric]: 'Electric',
  [FuelType.Hybrid]: 'Hybrid',
  [FuelType.Cng]: 'CNG',
  [FuelType.HybridLpg]: 'Hybrid LPG',
};

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  [CustomerType.PrivateIndividual]: 'Private',
  [CustomerType.Business]: 'Business',
};

export const AUTHORIZATION_TYPE_LABEL: Record<AssignmentDriverAuthorizationType, string> = {
  [AssignmentDriverAuthorizationType.NamedDriver]: 'Named driver',
  [AssignmentDriverAuthorizationType.BusinessCustomerDrivers]: 'Company-authorized drivers',
};

export const STOP_REASON_LABEL: Record<AuthorizationStopReason, string> = {
  [AuthorizationStopReason.CustomerRequest]: 'Customer request',
  [AuthorizationStopReason.DriverNoLongerEligible]: 'Driver no longer eligible',
  [AuthorizationStopReason.Replaced]: 'Replaced',
  [AuthorizationStopReason.AssignmentEnded]: 'Assignment ended',
  [AuthorizationStopReason.AssignmentCancelled]: 'Assignment cancelled',
  [AuthorizationStopReason.Other]: 'Other',
};

export const BILLING_IMPACT_LABEL: Record<BillingImpact, string> = {
  [BillingImpact.FullyBillable]: 'Fully billable',
  [BillingImpact.NotBillable]: 'Not billable',
  [BillingImpact.Billable50Percent]: 'Billable 50%',
  [BillingImpact.Billable25Percent]: 'Billable 25%',
  [BillingImpact.ManualAgreement]: 'Manual agreement',
};

export const INTERRUPTION_REASON_LABEL: Record<InterruptionReason, string> = {
  [InterruptionReason.VacationOrLeave]: 'Vacation or leave',
  [InterruptionReason.Sickness]: 'Sickness',
  [InterruptionReason.NoAvailableAuthorizedDriver]: 'No available authorized driver',
  [InterruptionReason.CarAccident]: 'Car accident',
  [InterruptionReason.CarRepair]: 'Car repair',
  [InterruptionReason.ScheduledMaintenance]: 'Scheduled maintenance',
  [InterruptionReason.TechnicalIssue]: 'Technical issue',
  [InterruptionReason.NoActiveInsurance]: 'No active insurance',
  [InterruptionReason.NotVerified]: 'Not verified',
  [InterruptionReason.NoActiveLicense]: 'No active licence',
  [InterruptionReason.NoValidInspection]: 'No valid inspection',
  [InterruptionReason.AdministrativeHold]: 'Administrative hold',
  [InterruptionReason.PaymentIssue]: 'Payment issue',
  [InterruptionReason.DriverRequest]: 'Driver request',
  [InterruptionReason.CompanyDecision]: 'Company decision',
  [InterruptionReason.Other]: 'Other',
};

/** Internal entity type names never reach the UI. */
export const ENTITY_LABEL: Record<string, string> = {
  ApplicationUser: 'User',
  RentalAssignment: 'Rental assignment',
  AssignmentDriverAuthorization: 'Driver authorisation',
  RoleAssignment: 'Role',
  Session: 'Session',
  Driver: 'Driver',
  Company: 'Company',
  Vehicle: 'Vehicle',
  Customer: 'Customer',
};
export const entityLabel = (t?: string | null) => (t ? ENTITY_LABEL[t] ?? t : '—');

/**
 * Every event type the API can emit, in prefix groups. The Event type filter is driven by this
 * catalog, not by the rows on the page. A third entry overrides the display prefix where the API
 * name and the product word differ.
 */
export const AUDIT_EVENTS: Array<[string, string[], string?]> = [
  ['Authentication', ['SessionCreated', 'Logout', 'PasswordChanged', 'EmailChangeRequested', 'EmailChanged', 'PasswordResetCompleted']],
  ['ApplicationUser', ['Suspended', 'Restored', 'NameCorrected'], 'User'],
  ['Registration', ['Submitted', 'EmailConfirmed', 'EmailConfirmationRotated', 'Activated', 'Rejected', 'Reopened', 'Restarted', 'Expired']],
  ['RoleAssignment', ['Granted', 'Revoked', 'ExpiryChanged'], 'Role'],
  ['Session', ['RevokedByAdministrator', 'AllRevokedByAdministrator']],
  ['Company', ['Created', 'Updated', 'Deleted']],
  ['RentalAssignment', ['TimelineCorrected', 'PartiesCorrected'], 'Rental assignment'],
  ['DriverAuthorization', ['Corrected'], 'Driver authorisation'],
  ['Interruption', ['Corrected']],
  ['SystemAdministrator', ['Bootstrapped', 'OfflineRecovery', 'TransferInitiated', 'TransferAccepted', 'TransferCancelled', 'TransferConfirmationRotated'], 'System Administrator'],
];

const words = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export const AUDIT_EVENT_TYPES: string[] = [];
export const AUDIT_EVENT_LABELS: Record<string, string> = {};
for (const [prefix, actions, override] of AUDIT_EVENTS) {
  const head = override ?? words(prefix);
  for (const action of actions) {
    const type = `${prefix}.${action}`;
    AUDIT_EVENT_TYPES.push(type);
    AUDIT_EVENT_LABELS[type] = `${head} · ${sentence(words(action))}`;
  }
}

/** Unknown event types degrade to a humanized "Prefix · Action" rather than raw dotted text. */
export function eventLabel(type: string | null | undefined): string {
  if (!type) return '—';
  if (AUDIT_EVENT_LABELS[type]) return AUDIT_EVENT_LABELS[type] as string;
  const [prefix, action] = type.split('.');
  if (!action) return words(prefix ?? 'Event');
  return `${words(prefix as string)} · ${sentence(words(action))}`;
}

/* Audit payload keys are PascalCase; auditFieldLabel in format/auditPayload.ts renders them. */
