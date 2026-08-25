import type {
  AuthorizationsQuery, CustomersQuery, DriversQuery, InterruptionsQuery, RentalAssignmentsQuery,
  SecurityAuditQuery, SessionsQuery, UsersQuery, VehiclesQuery, PagedQuery, Uuid,
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
  },
  assignments: {
    all: ['rental-assignments'] as const,
    list: (q: RentalAssignmentsQuery) => ['rental-assignments', 'list', q] as const,
    detail: (id: Uuid) => ['rental-assignments', 'detail', id] as const,
    authorizations: (id: Uuid, q: AuthorizationsQuery) => ['rental-assignments', id, 'authorizations', q] as const,
    interruptions: (id: Uuid, q: InterruptionsQuery) => ['rental-assignments', id, 'interruptions', q] as const,
  },
  transfers: ['system-administrator', 'transfers'] as const,
  overview: ['overview'] as const,
  overviewActivity: ['overview', 'security-activity'] as const,
};
