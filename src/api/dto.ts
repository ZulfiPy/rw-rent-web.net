// Mirrors uploads/swagger.json (RWRentApi.Api v1, OpenAPI 3.1.1).
// Rules: server-owned names verbatim; JSON body properties camelCase; query parameter names
// PascalCase as the server binds them; enums are the numeric wire values. Display labels live in
// src/format/labels.ts, never here.
//
// Optionality follows each schema's `required` array: a property outside it is written `?`, and a
// nullable type is written `| null`. Timestamps are ISO-8601 instants; `date` formats are
// calendar dates (yyyy-MM-dd).

export type Uuid = string;
export type Instant = string;
export type DateOnly = string;

/* enums ------------------------------------------------------------------ */

export const ApplicationUserRole = {
  SystemAdministrator: 1,
  CompanyPrincipal: 2,
  FleetManager: 3,
  Viewer: 4,
} as const;
export type ApplicationUserRole = (typeof ApplicationUserRole)[keyof typeof ApplicationUserRole];

export const ApplicationUserStatus = {
  PendingActivation: 1,
  Active: 2,
  Suspended: 3,
  RegistrationRejected: 4,
  RegistrationExpired: 5,
} as const;
export type ApplicationUserStatus = (typeof ApplicationUserStatus)[keyof typeof ApplicationUserStatus];

export const AssignmentStatus = { Active: 1, Ended: 2, Cancelled: 3, Planned: 4 } as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const AssignmentDriverAuthorizationType = { NamedDriver: 1, BusinessCustomerDrivers: 2 } as const;
export type AssignmentDriverAuthorizationType =
  (typeof AssignmentDriverAuthorizationType)[keyof typeof AssignmentDriverAuthorizationType];

export const AuthorizationStopReason = {
  CustomerRequest: 1,
  DriverNoLongerEligible: 2,
  Replaced: 3,
  AssignmentEnded: 4,
  AssignmentCancelled: 5,
  Other: 6,
} as const;
export type AuthorizationStopReason = (typeof AuthorizationStopReason)[keyof typeof AuthorizationStopReason];

export const BillingImpact = {
  FullyBillable: 1,
  NotBillable: 2,
  Billable50Percent: 3,
  Billable25Percent: 4,
  ManualAgreement: 5,
} as const;
export type BillingImpact = (typeof BillingImpact)[keyof typeof BillingImpact];

export const BodyType = { Sedan: 1, Wagon: 2, Suv: 3 } as const;
export type BodyType = (typeof BodyType)[keyof typeof BodyType];

export const GearboxType = { Manual: 1, Automatic: 2 } as const;
export type GearboxType = (typeof GearboxType)[keyof typeof GearboxType];

export const FuelType = { Petrol: 1, Diesel: 2, Electric: 3, Hybrid: 4, Cng: 5, HybridLpg: 6 } as const;
export type FuelType = (typeof FuelType)[keyof typeof FuelType];

export const CustomerType = { PrivateIndividual: 1, Business: 2 } as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const InterruptionReason = {
  VacationOrLeave: 1,
  Sickness: 2,
  NoAvailableAuthorizedDriver: 3,
  CarAccident: 10,
  CarRepair: 11,
  ScheduledMaintenance: 12,
  TechnicalIssue: 13,
  NoActiveInsurance: 20,
  NotVerified: 21,
  NoActiveLicense: 22,
  NoValidInspection: 23,
  AdministrativeHold: 30,
  PaymentIssue: 31,
  DriverRequest: 32,
  CompanyDecision: 33,
  Other: 99,
} as const;
export type InterruptionReason = (typeof InterruptionReason)[keyof typeof InterruptionReason];

export const SortDirection = { Ascending: 0, Descending: 1 } as const;
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

/** PascalCase names for the numeric values. Audit payloads carry the NAME, never the id. */
export const enumName = <T extends Record<string, number>>(e: T, value: number): string =>
  (Object.keys(e) as Array<keyof T>).find((k) => e[k] === value) as string;

/* paged envelope --------------------------------------------------------- */

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  /** Present on every PagedResponseOf… schema in swagger. */
  totalPages: number;
}

/**
 * Shared query base. Server binds these names as written. SortBy/SortDirection are accepted but
 * documented as ignored on users, sessions, roles and security-audit.
 *
 * Every query DTO is a type ALIAS, not an interface: TypeScript gives an object type alias an
 * implicit index signature, which is what lets UsersQuery reach the transport's Query without
 * widening a single property. Declaring one as an interface breaks every call site — src/api/client
 * pins that down with AssertQuery.
 */
export type PagedQuery = {
  PageNumber?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortDirection?: SortDirection;
}

/* problem details -------------------------------------------------------- */

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  /** Stable machine-readable code. Framework field-binding validation can omit it. */
  code?: string;
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors: Record<string, string[]>;
}

/* health, antiforgery, auth --------------------------------------------- */

export interface HealthResponse { status: string }

export interface AntiforgeryTokenResponse { requestToken: string; headerName: string }

export interface LoginRequest { email: string; password: string }

export interface LoginResponse {
  userId: Uuid;
  sessionId: Uuid;
  companyId?: Uuid | null;
  securityVersion: number;
  /** Earlier of the session's idle deadline and its original absolute deadline. */
  expiresAtUtc: Instant;
}

export interface PasswordResetRequest { email: string }
export interface CompletePasswordResetRequest { email: string; token: string; newPassword: string }

/* registrations --------------------------------------------------------- */

export interface RegisterApplicationUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}
export interface ResendRegistrationEmailConfirmationRequest { email: string; password: string }
export interface CompleteRegistrationEmailConfirmationRequest { token: string }

/* current user ---------------------------------------------------------- */

export interface CurrentUserResponse {
  id: Uuid;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  companyId?: Uuid | null;
  status: ApplicationUserStatus;
  roles: ApplicationUserRole[];
  /** Effective code-owned permission strings; the only capability source the UI reads. */
  permissions: string[];
}

export interface OwnProfileResponse {
  id: Uuid;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface UpdateOwnPhoneRequest { phoneNumber: string }
export interface ChangeOwnPasswordRequest { currentPassword: string; newPassword: string }
export interface RequestOwnEmailChange { newEmail: string; currentPassword: string }
export interface ConfirmOwnEmailChange { token: string }
export interface EmailChangeRequestResponse { deliverySucceeded: boolean }
export interface ProfileSecurityChangeResponse { authentication: LoginResponse }

/* application users ----------------------------------------------------- */

export interface ApplicationUserListItemResponse {
  id: Uuid;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  companyId?: Uuid | null;
  status: ApplicationUserStatus;
  emailConfirmed: boolean;
  /** Seven-day expiry for an unconfirmed pending registration; null after confirmation. */
  registrationExpiresAtUtc?: Instant | null;
  /** Current unrevoked, unexpired roles; effective only while the user is Active. */
  effectiveRoles: ApplicationUserRole[];
  // FOLLOW-UP: not in swagger — the registration timestamp. The Registrations queue's Registered
  // column and its "submitted N days ago" reading depend on it, and the list projection is the only
  // call that screen makes. Served by the mock only.
  createdAtUtc?: Instant;
}

export interface ApplicationUserResponse extends ApplicationUserListItemResponse {
  securityVersion: number;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
  // FOLLOW-UP: not in swagger — the latest registration-decision reason for reviewers without
  // SecurityAudit access. Served by the mock only; see COVERAGE.md §5.6.
  registrationDecisionReason?: string | null;
}

export type UsersQuery = PagedQuery & {
  Status?: ApplicationUserStatus;
  Role?: ApplicationUserRole;
}

export interface CorrectApplicationUserNameRequest { firstName: string; lastName: string; reason: string }
export interface InitialRoleGrantRequest { role: ApplicationUserRole; expiresAtUtc?: Instant | null }
export interface ActivateApplicationUserRequest { roles: InitialRoleGrantRequest[] }
/** reject-registration and reopen-registration share this shape. */
export interface RegistrationDecisionRequest { reason: string }

/* role assignments ------------------------------------------------------ */

export interface RoleAssignmentResponse {
  id: Uuid;
  applicationUserId: Uuid;
  role: ApplicationUserRole;
  assignedAtUtc: Instant;
  assignedByUserId: Uuid;
  expiresAtUtc?: Instant | null;
  revokedAtUtc?: Instant | null;
  revokedByUserId?: Uuid | null;
  revocationReason?: string | null;
  isEffective: boolean;
}

export interface GrantRoleRequest { role: ApplicationUserRole; expiresAtUtc?: Instant | null }
export interface ChangeRoleExpiryRequest { expiresAtUtc?: Instant | null }
export interface RevokeRoleRequest { reason: string }

/* sessions -------------------------------------------------------------- */

export interface SessionResponse {
  id: Uuid;
  applicationUserId: Uuid;
  createdAtUtc: Instant;
  lastSeenAtUtc: Instant;
  /** Inactivity deadline, extended only by qualifying authenticated activity. */
  idleExpiresAtUtc: Instant;
  /** Fixed deadline, 12 hours after the original login. */
  absoluteExpiresAtUtc: Instant;
  revokedAtUtc?: Instant | null;
  revocationReason?: string | null;
  deviceDescription?: string | null;
  ipAddress?: string | null;
  /** Self-view only; administrators viewing another user never surface this. */
  isCurrent: boolean;
  isActive: boolean;
}

export type SessionsQuery = PagedQuery & { IncludeEnded?: boolean }
export interface SessionRevocationResponse { currentSessionRevoked: boolean; revokedCount: number }

/* security audit -------------------------------------------------------- */

export interface SecurityAuditResponse {
  id: Uuid;
  /** Free-form server-owned string, e.g. "RoleAssignment.ExpiryChanged". */
  eventType: string;
  actorUserId: Uuid;
  occurredAtUtc: Instant;
  companyId?: Uuid | null;
  targetUserId?: Uuid | null;
  entityType?: string | null;
  entityId?: Uuid | null;
  reason?: string | null;
  /** Flat JSON objects with PascalCase keys, changed keys only. Never normalised client-side. */
  beforeJson?: string | null;
  afterJson?: string | null;
}

export type SecurityAuditQuery = PagedQuery & {
  CompanyId?: Uuid;
  TargetUserId?: Uuid;
  /** Exact, case-sensitive. */
  EventType?: string;
}

/* company --------------------------------------------------------------- */

export interface CompanyResponse {
  id: Uuid;
  name: string;
  registrationNumber: string;
  vatNumber?: string | null;
  legalAddress: string;
  email: string;
  phoneNumber?: string | null;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
}

export interface CreateCompanyRequest {
  name: string;
  registrationNumber: string;
  vatNumber?: string | null;
  legalAddress: string;
  email: string;
  phoneNumber?: string | null;
}
export type UpdateCompanyRequest = CreateCompanyRequest;

/* vehicles -------------------------------------------------------------- */

export interface VehicleListItemResponse {
  id: Uuid;
  plateNumber: string;
  vinCode: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  fuelType: FuelType;
  isActive: boolean;
  // FOLLOW-UP: not in swagger — upcoming customer + planned start for a Reserved vehicle.
  // Served by the mock only; the reviewed list column depends on it.
  upcomingCustomerDisplayName?: string | null;
  upcomingPlannedStartAtUtc?: Instant | null;
}

export interface VehicleResponse {
  id: Uuid;
  plateNumber: string;
  vinCode: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  gearboxType: GearboxType;
  fuelType: FuelType;
  color: string;
  isActive: boolean;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
}

export interface CreateVehicleRequest {
  plateNumber: string;
  vinCode: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  gearboxType: GearboxType;
  fuelType: FuelType;
  color: string;
}
export type UpdateVehicleRequest = CreateVehicleRequest;

export type VehiclesQuery = PagedQuery & {
  BodyType?: BodyType;
  GearboxType?: GearboxType;
  FuelType?: FuelType;
  Year?: number;
  IsActive?: boolean;
}

/* customers ------------------------------------------------------------- */

export interface CustomerListItemResponse {
  id: Uuid;
  type: CustomerType;
  displayName: string;
  email: string;
  phoneNumber: string;
  driverId?: Uuid | null;
  isActive: boolean;
}

export interface CustomerResponse {
  id: Uuid;
  type: CustomerType;
  firstName?: string | null;
  lastName?: string | null;
  personalId?: string | null;
  dateOfBirth?: DateOnly | null;
  companyName?: string | null;
  registrationCode?: string | null;
  address: string;
  email: string;
  phoneNumber: string;
  driverId?: Uuid | null;
  isActive: boolean;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
}

export interface CreateCustomerRequest {
  type: CustomerType;
  firstName?: string | null;
  lastName?: string | null;
  personalId?: string | null;
  dateOfBirth?: DateOnly | null;
  companyName?: string | null;
  registrationCode?: string | null;
  address: string;
  email: string;
  phoneNumber: string;
  driverId?: Uuid | null;
}
/** type is immutable; the remaining fields must stay coherent with it. */
export type UpdateCustomerRequest = Omit<CreateCustomerRequest, 'type'>;

export type CustomersQuery = PagedQuery & { Type?: CustomerType; IsActive?: boolean }

/* drivers --------------------------------------------------------------- */

export interface DriverListItemResponse {
  id: Uuid;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface DriverResponse {
  id: Uuid;
  firstName: string;
  lastName: string;
  personalId?: string | null;
  dateOfBirth?: DateOnly | null;
  address: string;
  email: string;
  phoneNumber: string;
  driverLicenseNumber: string;
  isActive: boolean;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  personalId?: string | null;
  dateOfBirth?: DateOnly | null;
  address: string;
  email: string;
  phoneNumber: string;
  driverLicenseNumber: string;
}
export type UpdateDriverRequest = CreateDriverRequest;

export type DriversQuery = PagedQuery & { IsActive?: boolean }

/* rental assignments ---------------------------------------------------- */

export interface RentalAssignmentListItemResponse {
  id: Uuid;
  customerId: Uuid;
  customerDisplayName: string;
  vehicleId: Uuid;
  vehiclePlateNumber: string;
  status: AssignmentStatus;
  plannedStartAtUtc?: Instant | null;
  startedAtUtc?: Instant | null;
  plannedEndAtUtc?: Instant | null;
  closedAtUtc?: Instant | null;
}

export interface RentalAssignmentResponse extends RentalAssignmentListItemResponse {
  note?: string | null;
  concurrencyToken: Uuid;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
  driverAuthorizations: AssignmentDriverAuthorizationResponse[];
  interruptions: AssignmentInterruptionResponse[];
}

export type RentalAssignmentsQuery = PagedQuery & {
  CustomerId?: Uuid;
  VehicleId?: Uuid;
  Status?: AssignmentStatus;
  PlannedFromUtc?: Instant;
  PlannedToUtc?: Instant;
  StartedFromUtc?: Instant;
  StartedToUtc?: Instant;
}

export interface InitialAuthorizationRequest {
  authorizationType: AssignmentDriverAuthorizationType;
  driverId?: Uuid | null;
  authorizedFromUtc: Instant;
  note?: string | null;
}

export interface CreateRentalAssignmentRequest {
  customerId: Uuid;
  vehicleId: Uuid;
  /** Planned or Active only. */
  initialStatus: AssignmentStatus;
  plannedStartAtUtc?: Instant | null;
  startedAtUtc?: Instant | null;
  plannedEndAtUtc?: Instant | null;
  note?: string | null;
  initialAuthorizations: InitialAuthorizationRequest[];
}

export interface UpdateRentalAssignmentRequest {
  customerId: Uuid;
  vehicleId: Uuid;
  plannedStartAtUtc?: Instant | null;
  plannedEndAtUtc?: Instant | null;
  note?: string | null;
}

export interface ActivateRentalAssignmentRequest { startedAtUtc: Instant }
export interface EndRentalAssignmentRequest { closedAtUtc: Instant }
export interface CancelRentalAssignmentRequest {
  closedAtUtc: Instant;
  noPhysicalHandoverOccurred?: boolean;
  note?: string | null;
}

export interface CorrectRentalAssignmentPartiesRequest {
  customerId?: Uuid | null;
  vehicleId?: Uuid | null;
  concurrencyToken: Uuid;
  reason: string;
}

export interface CorrectRentalAssignmentTimelineRequest {
  plannedStartAtUtc?: Instant | null;
  startedAtUtc?: Instant | null;
  plannedEndAtUtc?: Instant | null;
  closedAtUtc?: Instant | null;
  note?: string | null;
  concurrencyToken: Uuid;
  reason: string;
}

/* driver authorizations ------------------------------------------------- */

export interface AssignmentDriverAuthorizationResponse {
  id: Uuid;
  rentalAssignmentId: Uuid;
  authorizationType: AssignmentDriverAuthorizationType;
  driverId?: Uuid | null;
  authorizedFromUtc: Instant;
  stoppedAtUtc?: Instant | null;
  stopReason?: AuthorizationStopReason | null;
  note?: string | null;
  concurrencyToken: Uuid;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
}

export type AuthorizationsQuery = PagedQuery & {
  AuthorizationType?: AssignmentDriverAuthorizationType;
  DriverId?: Uuid;
  IsOpen?: boolean;
}

export interface StartAssignmentDriverAuthorizationRequest {
  authorizationType: AssignmentDriverAuthorizationType;
  driverId?: Uuid | null;
  authorizedFromUtc: Instant;
  note?: string | null;
}

export interface ReplacementAuthorizationRequest {
  authorizationType: AssignmentDriverAuthorizationType;
  driverId?: Uuid | null;
  note?: string | null;
}

export interface StopAssignmentDriverAuthorizationRequest {
  stoppedAtUtc: Instant;
  stopReason: AuthorizationStopReason;
  note?: string | null;
  replacement?: ReplacementAuthorizationRequest | null;
}

export interface CorrectDriverAuthorizationRequest {
  authorizationType: AssignmentDriverAuthorizationType;
  driverId?: Uuid | null;
  authorizedFromUtc?: Instant;
  stoppedAtUtc?: Instant | null;
  stopReason?: AuthorizationStopReason | null;
  note?: string | null;
  concurrencyToken: Uuid;
  reason: string;
}

/* interruptions --------------------------------------------------------- */

export interface AssignmentInterruptionResponse {
  id: Uuid;
  rentalAssignmentId: Uuid;
  startedAtUtc: Instant;
  endedAtUtc?: Instant | null;
  reason: InterruptionReason;
  billingImpact: BillingImpact;
  note: string;
  concurrencyToken: Uuid;
  createdAtUtc: Instant;
  updatedAtUtc?: Instant | null;
}

export type InterruptionsQuery = PagedQuery & {
  Reason?: InterruptionReason;
  BillingImpact?: BillingImpact;
  IsOpen?: boolean;
}

export interface CreateAssignmentInterruptionRequest {
  startedAtUtc: Instant;
  endedAtUtc?: Instant | null;
  reason: InterruptionReason;
  billingImpact: BillingImpact;
  note: string;
}
export type UpdateAssignmentInterruptionRequest = CreateAssignmentInterruptionRequest;
export interface EndAssignmentInterruptionRequest { endedAtUtc: Instant }

/** The correction endpoint renames the enum field to reasonCode and adds the audited reason text. */
export interface CorrectInterruptionRequest {
  startedAtUtc?: Instant;
  endedAtUtc?: Instant | null;
  reasonCode: InterruptionReason;
  billingImpact: BillingImpact;
  note: string;
  concurrencyToken: Uuid;
  reason: string;
}

/* system administrator transfer ---------------------------------------- */

export interface SystemAdministratorTransferResponse {
  id: Uuid;
  currentAdministratorUserId: Uuid;
  targetUserId: Uuid;
  initiatedAtUtc: Instant;
  expiresAtUtc: Instant;
  cancelledAtUtc?: Instant | null;
  acceptedAtUtc?: Instant | null;
  isRecovery: boolean;
}

export interface InitiateSystemAdministratorTransferRequest {
  currentPassword: string;
  targetEmail: string;
  reason: string;
}
export interface ResendSystemAdministratorTransferRequest { currentPassword: string }
export interface CancelSystemAdministratorTransferRequest { reason: string }
export interface AcceptSystemAdministratorTransferRequest { token: string; password: string }

/* mock-only read models ------------------------------------------------- */

// FOLLOW-UP: not in swagger — the Overview summary counts. v1 derives them from four
// PageSize=1 probes (see api/overview.ts); a real summary endpoint replaces that one file.
export interface OverviewSummary {
  activeAssignments: number;
  plannedAssignments: number;
  availableVehicles: number;
  pendingRegistrations: number;
}
