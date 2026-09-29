import type {
  AuthorizationsQuery, CompanyInterruptionsQuery, CustomersQuery, DriverAuthorizationsQuery,
  DriversQuery, InterruptionsQuery, RecordDeletionCandidatesQuery, RecordDeletionShow, RecordKind,
  RentalAssignmentsQuery, SecurityAuditQuery, SessionsQuery, SystemAdministratorTransferQuery,
  UsersQuery, VehiclesQuery, PagedQuery, Uuid, WorkTaskQuery, WorkTaskToDoQuery,
  InsuranceCaseAccidentChoicesQuery, InsuranceCaseDriverSuggestionQuery, InsuranceCaseQuery, InsurerQuery,
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
  /**
   * Tasks: one prefix, so every write refreshes the task, the three views, the counts, the to-do list
   * and the people at once, and the navigation's count and the Overview follow a mark straight away.
   */
  tasks: {
    all: ['tasks'] as const,
    list: (q: WorkTaskQuery) => ['tasks', 'list', q] as const,
    counts: ['tasks', 'counts'] as const,
    toDo: (q: WorkTaskToDoQuery) => ['tasks', 'to-do', q] as const,
    people: ['tasks', 'people'] as const,
    detail: (id: Uuid) => ['tasks', 'detail', id] as const,
  },
  /**
   * Insurance cases (Follow-up 17): one prefix, so every write refreshes the case, the three views,
   * the counts, the Overview's card and tile and the navigation's count at once.
   */
  insuranceCases: {
    all: ['insurance-cases'] as const,
    list: (q: InsuranceCaseQuery) => ['insurance-cases', 'list', q] as const,
    counts: ['insurance-cases', 'counts'] as const,
    detail: (id: Uuid) => ['insurance-cases', 'detail', id] as const,
    accidentChoices: (q: InsuranceCaseAccidentChoicesQuery) => ['insurance-cases', 'accident-choices', q] as const,
    driverSuggestion: (q: InsuranceCaseDriverSuggestionQuery) => ['insurance-cases', 'driver-suggestion', q] as const,
  },
  /**
   * The insurers the company keeps (Follow-up 18): one prefix for the list at each Show. Adding an
   * insurer refreshes it; editing one, or putting it out of use or back, refreshes it and every case
   * read, so a rename shows on the cases at once; every case write refreshes it too, since the list
   * counts the cases each insurer handles and the cases that name it.
   */
  insurers: {
    all: ['insurers'] as const,
    list: (q: InsurerQuery) => ['insurers', 'list', q] as const,
  },
};
