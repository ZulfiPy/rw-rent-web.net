// Mirrors the backend's OpenAPI document (RWRentApi.Api v1, OpenAPI 3.1.1), the contract this app
// is written against: GET http://localhost:5001/openapi/v1.json on the running API in Development.
// Since the backend's round 6 the seven record responses name who created and who last changed the
// record; a list item names nobody, so the two list items that share a record's shape omit both.
// Since its round 7 the Delete records page reads its candidates, counts and deletions here too.
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

/** Derived at read time from the vehicle's own state and the assignments holding it. */
export const VehicleAvailability = { Available: 1, InUse: 2, Reserved: 3, Retired: 4 } as const;
export type VehicleAvailability = (typeof VehicleAvailability)[keyof typeof VehicleAvailability];

/** Derived from the transfer's accepted, cancelled and expiry instants. */
export const SystemAdministratorTransferStatus = {
  AwaitingAcceptance: 1,
  Accepted: 2,
  Cancelled: 3,
  Expired: 4,
} as const;
export type SystemAdministratorTransferStatus =
  (typeof SystemAdministratorTransferStatus)[keyof typeof SystemAdministratorTransferStatus];

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
  /**
   * When the password in force was set (round 2): the newest password-history instant, or the
   * account's registration instant while it still holds the password it registered with.
   */
  passwordChangedAtUtc: Instant;
  /** The address of an email change still waiting for its confirmation, or null (round 2). */
  pendingEmail?: string | null;
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
  createdAtUtc: Instant;
}

export interface ApplicationUserResponse extends ApplicationUserListItemResponse {
  securityVersion: number;
  updatedAtUtc?: Instant | null;
  /** The newest registration rejection or reopening reason; null when the registration was never decided. */
  registrationDecisionReason?: string | null;
}

export type UsersQuery = PagedQuery & {
  Status?: ApplicationUserStatus;
  /**
   * Up to five effective statuses as a comma-separated string of the numeric values, e.g. "1,4,5".
   * Exclusive with Status; the validator rejects both together under the key Statuses.
   */
  Statuses?: string;
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
  /**
   * The actor's first and last name at read time, for every reader of the entry; null for the
   * technical system actor (round 5).
   */
  actorDisplayName?: string | null;
  occurredAtUtc: Instant;
  companyId?: Uuid | null;
  targetUserId?: Uuid | null;
  /** The target user's first and last name at read time; null when there is no target user. */
  targetDisplayName?: string | null;
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
  /** Exact, case-sensitive stored entity type, e.g. "RentalAssignment". */
  EntityType?: string;
  /** Exact stored entity identifier. */
  EntityId?: Uuid;
  /**
   * The assignment's own entries plus those of its driver authorizations and interruptions,
   * resolved on the server. Each entry keeps its own entityType and entityId.
   */
  RentalAssignmentId?: Uuid;
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
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
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
  availability: VehicleAvailability;
  /** The Active assignment holding the vehicle; null when none does. */
  currentAssignmentId?: Uuid | null;
  currentCustomerDisplayName?: string | null;
  /** The Planned assignment with the earliest planned start; null when none exists. */
  upcomingAssignmentId?: Uuid | null;
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
  availability: VehicleAvailability;
  currentAssignmentId?: Uuid | null;
  currentCustomerDisplayName?: string | null;
  upcomingAssignmentId?: Uuid | null;
  upcomingCustomerDisplayName?: string | null;
  upcomingPlannedStartAtUtc?: Instant | null;
  createdAtUtc: Instant;
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
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
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
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
  personalId?: string | null;
  driverLicenseNumber: string;
  address: string;
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
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
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

/** One open named driver on an assignment, in the list's coverage column. */
export interface AuthorizedDriverSummary {
  driverId: Uuid;
  firstName: string;
  lastName: string;
}

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
  customerType: CustomerType;
  vehicleMake: string;
  vehicleModel: string;
  /** Open authorizations of either kind; 0 means the assignment has no coverage. */
  openAuthorizationCount: number;
  /** Ordered by last name then first name; empty for collective or uncovered assignments. */
  openNamedDrivers: AuthorizedDriverSummary[];
  hasOpenCollectiveAuthorization: boolean;
  openInterruptionCount: number;
}

/**
 * The record shares the list item's identity and party members but not its four coverage counts
 * (`openAuthorizationCount`, `openNamedDrivers`, `hasOpenCollectiveAuthorization`,
 * `openInterruptionCount`): the record carries the authorizations and interruptions themselves.
 */
export interface RentalAssignmentResponse extends Omit<
  RentalAssignmentListItemResponse,
  'openAuthorizationCount' | 'openNamedDrivers' | 'hasOpenCollectiveAuthorization' | 'openInterruptionCount'
> {
  note?: string | null;
  /** The explanation recorded when the assignment was cancelled; null when it was not. */
  cancellationNote?: string | null;
  vehicleVinCode: string;
  /** The private customer's own driver record; null for a business or unlinked customer. */
  customerDriverId?: Uuid | null;
  concurrencyToken: Uuid;
  createdAtUtc: Instant;
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
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
  /** Required when the assignment is Active (ASSIGN-013); optional when it is Planned. */
  cancellationNote?: string | null;
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
  /** The named driver's identity; null on a collective authorization. */
  driverFirstName?: string | null;
  driverLastName?: string | null;
  driverLicenseNumber?: string | null;
  authorizedFromUtc: Instant;
  stoppedAtUtc?: Instant | null;
  stopReason?: AuthorizationStopReason | null;
  note?: string | null;
  concurrencyToken: Uuid;
  createdAtUtc: Instant;
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
}

export type AuthorizationsQuery = PagedQuery & {
  AuthorizationType?: AssignmentDriverAuthorizationType;
  DriverId?: Uuid;
  IsOpen?: boolean;
}

/**
 * A driver's named authorizations across every assignment, newest first. Search is rejected and
 * SortBy is ignored: the order is fixed.
 */
export interface DriverAuthorizationHistoryItemResponse
  extends Omit<AssignmentDriverAuthorizationResponse, 'createdByDisplayName' | 'updatedByDisplayName'> {
  assignmentStatus: AssignmentStatus;
  vehicleId: Uuid;
  vehiclePlateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  customerId: Uuid;
  customerDisplayName: string;
  customerType: CustomerType;
}

export type DriverAuthorizationsQuery = PagedQuery & {
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
  /** Who created the record, by first and last name at read time; null for the technical actor. */
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  /** Who last changed it; null while it was never changed, or when the technical actor did. */
  updatedByDisplayName?: string | null;
}

export type InterruptionsQuery = PagedQuery & {
  Reason?: InterruptionReason;
  BillingImpact?: BillingImpact;
  IsOpen?: boolean;
}

/**
 * Interruptions across every assignment, oldest first. Search is rejected and SortBy is ignored:
 * the order is fixed.
 */
export interface InterruptionListItemResponse
  extends Omit<AssignmentInterruptionResponse, 'createdByDisplayName' | 'updatedByDisplayName'> {
  assignmentStatus: AssignmentStatus;
  vehicleId: Uuid;
  vehiclePlateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  customerId: Uuid;
  customerDisplayName: string;
}

export type CompanyInterruptionsQuery = PagedQuery & {
  IsOpen?: boolean;
  RentalAssignmentId?: Uuid;
  AssignmentStatus?: AssignmentStatus;
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
  targetEmail: string;
  targetFirstName: string;
  targetLastName: string;
  /** Derived on the server from the three instants; the app never derives it again. */
  status: SystemAdministratorTransferStatus;
}

/** The transfers read takes paging only. Search is rejected. */
export type SystemAdministratorTransferQuery = PagedQuery

export interface InitiateSystemAdministratorTransferRequest {
  currentPassword: string;
  targetEmail: string;
  reason: string;
}
export interface ResendSystemAdministratorTransferRequest { currentPassword: string }
export interface CancelSystemAdministratorTransferRequest { reason: string }
export interface AcceptSystemAdministratorTransferRequest { token: string; password: string }

/* overview -------------------------------------------------------------- */

/**
 * The Overview's four counts in one request. A count the caller may not read is null, not 0: the
 * card is left out rather than shown empty.
 */
export interface OverviewSummaryResponse {
  activeAssignments?: number | null;
  plannedAssignments?: number | null;
  activeVehicles?: number | null;
  /** Of the active vehicles, the ones with no Active assignment and no Planned one (round 2). */
  availableVehicles?: number | null;
  pendingRegistrations?: number | null;
}

/* record deletions (the backend's round 7) ------------------------------ */

/** The six kinds of record the Delete records page can remove. */
export const RecordKind = {
  RentalAssignment: 1,
  DriverAuthorization: 2,
  Interruption: 3,
  Vehicle: 4,
  Customer: 5,
  Driver: 6,
} as const;
export type RecordKind = (typeof RecordKind)[keyof typeof RecordKind];

export const RecordDeletionReason = {
  EnteredByMistake: 1,
  PracticeOrTestRecord: 2,
  NoLongerNeeded: 3,
  Other: 4,
} as const;
export type RecordDeletionReason = (typeof RecordDeletionReason)[keyof typeof RecordDeletionReason];

/** The server's verdict on one candidate. The app words it and never decides it. */
export const RecordDeletionState = { Ready: 1, Blocked: 2 } as const;
export type RecordDeletionState = (typeof RecordDeletionState)[keyof typeof RecordDeletionState];

export const RecordDeletionBlockReason = {
  /** A vehicle or a customer a rental assignment of any status refers to. */
  ReferencedByRentalAssignments: 1,
  /** A driver a driver authorization refers to. */
  ReferencedByDriverAuthorizations: 2,
  /** A driver a customer record is linked to. */
  LinkedFromCustomer: 3,
  /** The only open authorization of an Active rental assignment. */
  OnlyOpenAuthorizationOfActiveRental: 4,
} as const;
export type RecordDeletionBlockReason =
  (typeof RecordDeletionBlockReason)[keyof typeof RecordDeletionBlockReason];

/** OutOfUse (the default): Cancelled or Ended, stopped, ended, inactive. */
export const RecordDeletionShow = { OutOfUse: 1, Everything: 2 } as const;
export type RecordDeletionShow = (typeof RecordDeletionShow)[keyof typeof RecordDeletionShow];

/** One record in the way of a deletion; its label is a rental's record label or a customer's name. */
export interface RecordDeletionBlockingRecordResponse {
  kind: RecordKind;
  id: Uuid;
  label: string;
}

export interface RecordDeletionBlockResponse {
  reason: RecordDeletionBlockReason;
  /** How many records block the deletion for this reason. */
  count: number;
  /** The first five of them, newest first. */
  records: RecordDeletionBlockingRecordResponse[];
}

export interface RecordDeletionInfo {
  state: RecordDeletionState;
  /** Empty when the state is Ready. */
  blocks: RecordDeletionBlockResponse[];
}

export interface RentalAssignmentDeletionCandidateResponse {
  id: Uuid;
  /** "<plate> · <customer>", the text the audit entry keeps. */
  recordLabel: string;
  vehicleId: Uuid;
  vehiclePlateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  customerId: Uuid;
  customerDisplayName: string;
  status: AssignmentStatus;
  plannedStartAtUtc?: Instant | null;
  plannedEndAtUtc?: Instant | null;
  startedAtUtc?: Instant | null;
  closedAtUtc?: Instant | null;
  /** The driver authorizations that would go with it. */
  authorizationCount: number;
  /** The interruptions that would go with it. */
  interruptionCount: number;
  deletion: RecordDeletionInfo;
}

export interface DriverAuthorizationDeletionCandidateResponse {
  id: Uuid;
  /** "<driver or Business customer drivers> · <plate> · <customer>". */
  recordLabel: string;
  rentalAssignmentId: Uuid;
  /** The rental's own record label (round 7's report §5). */
  rentalAssignmentLabel: string;
  vehiclePlateNumber: string;
  customerDisplayName: string;
  rentalAssignmentStatus: AssignmentStatus;
  authorizationType: AssignmentDriverAuthorizationType;
  driverId?: Uuid | null;
  /** Null for the collective Business-customer authorization. */
  driverDisplayName?: string | null;
  driverLicenseNumber?: string | null;
  authorizedFromUtc: Instant;
  stoppedAtUtc?: Instant | null;
  stopReason?: AuthorizationStopReason | null;
  deletion: RecordDeletionInfo;
}

export interface InterruptionDeletionCandidateResponse {
  id: Uuid;
  /** "<reason name> · <plate> · <customer>"; the reason is its API name, e.g. "CarRepair". */
  recordLabel: string;
  rentalAssignmentId: Uuid;
  rentalAssignmentLabel: string;
  vehiclePlateNumber: string;
  customerDisplayName: string;
  reason: InterruptionReason;
  billingImpact: BillingImpact;
  startedAtUtc: Instant;
  endedAtUtc?: Instant | null;
  deletion: RecordDeletionInfo;
}

export interface VehicleDeletionCandidateResponse {
  id: Uuid;
  /** "<plate> · <make> <model> <year>". */
  recordLabel: string;
  plateNumber: string;
  vinCode: string;
  make: string;
  model: string;
  year: number;
  isActive: boolean;
  deletion: RecordDeletionInfo;
}

export interface CustomerDeletionCandidateResponse {
  id: Uuid;
  /** The customer's display name. */
  recordLabel: string;
  displayName: string;
  type: CustomerType;
  /**
   * The registration code of a business customer, the personal identity code of a private one;
   * null when the record has neither (round 7's report §5).
   */
  identifier?: string | null;
  email: string;
  isActive: boolean;
  deletion: RecordDeletionInfo;
}

export interface DriverDeletionCandidateResponse {
  id: Uuid;
  /** "<first> <last> · <licence>". */
  recordLabel: string;
  firstName: string;
  lastName: string;
  email: string;
  driverLicenseNumber: string;
  isActive: boolean;
  deletion: RecordDeletionInfo;
}

/** Newest created first, then id; SortBy and SortDirection are ignored. */
export type RecordDeletionCandidatesQuery = PagedQuery & { Show?: RecordDeletionShow }

/** The counts endpoint binds its one parameter in lower case. */
export type RecordDeletionCountsQuery = { show?: RecordDeletionShow }

export interface RecordDeletionCandidateCountsResponse {
  rentalAssignments: number;
  driverAuthorizations: number;
  interruptions: number;
  vehicles: number;
  customers: number;
  drivers: number;
}

/** One deletion that was made, newest first; Search, SortBy and SortDirection are ignored. */
export interface RecordDeletionListItemResponse {
  auditEntryId: Uuid;
  occurredAtUtc: Instant;
  actorUserId: Uuid;
  /** Named at read time; null only for the technical actor. */
  actorDisplayName?: string | null;
  kind: RecordKind;
  /** The record's label as it was when it was deleted. */
  recordLabel: string;
  reason: RecordDeletionReason;
  note?: string | null;
}

export interface DeleteRecordRequest {
  kind: RecordKind;
  recordId: Uuid;
  reason: RecordDeletionReason;
  /** Required when the reason is Other; at most 1000 characters once trimmed. */
  note?: string | null;
  /** The explicit confirmation; a request without it is refused. */
  confirmed: boolean;
}

export interface RecordDeletionResponse {
  /** The one audit entry of this deletion, holding the copy of the record. */
  auditEntryId: Uuid;
  kind: RecordKind;
  recordLabel: string;
  /** The rental's own authorizations that went with it; 0 for every other kind. */
  deletedAuthorizationCount: number;
  deletedInterruptionCount: number;
}
