import type {
  AuthorizationsQuery, CompanyInterruptionsQuery, CustomersQuery, DriverAuthorizationsQuery,
  DriversQuery, InterruptionsQuery, RecordDeletionCandidatesQuery, RecordDeletionShow, RecordKind,
  RentalAssignmentsQuery, SecurityAuditQuery, SessionsQuery, SystemAdministratorTransferQuery,
  UsersQuery, VehiclesQuery, PagedQuery, Uuid,
} from './dto';

/** One key factory per resource. Mutations invalidate by prefix: qk.users.all, qk.roles.of(id), … */
export const qk = {
  me: ['me'] as const,
  meSessions: (q: SessionsQuery) => ['me', 'sessions', q] as const,
  company: ['company'] as const,

  users: {
    all: ['users'] as const,
    list: (q: UsersQuery) => ['users', 'list', q] as const,
    detail: (id: Uuid) => ['users', 'detail', id] as const,
  },
  roles: {
    all: ['roles'] as const,
    history: (userId: Uuid, q: PagedQuery) => ['roles', userId, q] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    ofUser: (userId: Uuid, q: SessionsQuery) => ['sessions', userId, q] as const,
  },
  audit: {
    all: ['security-audit'] as const,
    list: (q: SecurityAuditQuery) => ['security-audit', 'list', q] as const,
    entry: (id: Uuid) => ['security-audit', 'entry', id] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    list: (q: VehiclesQuery) => ['vehicles', 'list', q] as const,
    detail: (id: Uuid) => ['vehicles', 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (q: CustomersQuery) => ['customers', 'list', q] as const,
    detail: (id: Uuid) => ['customers', 'detail', id] as const,
  },
  drivers: {
    all: ['drivers'] as const,
    list: (q: DriversQuery) => ['drivers', 'list', q] as const,
    detail: (id: Uuid) => ['drivers', 'detail', id] as const,
    authorizations: (id: Uuid, q: DriverAuthorizationsQuery) =>
      ['drivers', id, 'authorizations', q] as const,
  },
  assignments: {
    all: ['rental-assignments'] as const,
    list: (q: RentalAssignmentsQuery) => ['rental-assignments', 'list', q] as const,
    detail: (id: Uuid) => ['rental-assignments', 'detail', id] as const,
    authorizations: (id: Uuid, q: AuthorizationsQuery) => ['rental-assignments', id, 'authorizations', q] as const,
    interruptions: (id: Uuid, q: InterruptionsQuery) => ['rental-assignments', id, 'interruptions', q] as const,
  },
  /** Company-wide, not the assignment-scoped list under qk.assignments.interruptions. */
  interruptions: {
    all: ['interruptions'] as const,
    list: (q: CompanyInterruptionsQuery) => ['interruptions', 'list', q] as const,
  },
  transfers: {
    all: ['system-administrator', 'transfers'] as const,
    list: (q: SystemAdministratorTransferQuery) =>
      ['system-administrator', 'transfers', q] as const,
  },
  overview: ['overview'] as const,
  /** The Delete records page: one prefix, so a deletion refreshes its lists, counts and history at once. */
  recordDeletions: {
    all: ['record-deletions'] as const,
    candidates: (kind: RecordKind, q: RecordDeletionCandidatesQuery) =>
      ['record-deletions', 'candidates', kind, q] as const,
    counts: (show: RecordDeletionShow) => ['record-deletions', 'counts', show] as const,
    made: (q: PagedQuery) => ['record-deletions', 'made', q] as const,
  },
};
