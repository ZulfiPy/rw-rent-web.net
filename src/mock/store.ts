import type {
  ApplicationUserResponse, AssignmentDriverAuthorizationResponse, AssignmentInterruptionResponse,
  CompanyResponse, CustomerResponse, DriverResponse, RentalAssignmentResponse,
  RoleAssignmentResponse, SecurityAuditResponse, SystemAdministratorTransferResponse, Uuid,
  VehicleResponse,
} from '@/api/dto';
import type { SessionRecord } from './security';
import { seed } from './seed';

/** Tagged so a stale shape is never read back. Bumped whenever the seed changes meaningfully. */
export const SEED_VERSION = 'rwrent-21';

export interface MockStore {
  version: string;
  company: CompanyResponse | null;
  users: ApplicationUserResponse[];
  roles: RoleAssignmentResponse[];
  /** Rows carry no isActive/isCurrent — see SessionRecord. */
  sessions: SessionRecord[];
  /** userId → the session that authenticates that persona's requests. */
  currentSessionByUserId: Record<Uuid, Uuid>;
  audit: SecurityAuditResponse[];
  vehicles: VehicleResponse[];
  customers: CustomerResponse[];
  drivers: DriverResponse[];
  assignments: RentalAssignmentResponse[];
  authorizations: AssignmentDriverAuthorizationResponse[];
  interruptions: AssignmentInterruptionResponse[];
  transfers: SystemAdministratorTransferResponse[];
}

let store: MockStore = seed();

/** Mutations mutate this store; reads reflect it; a reload resets it. No persistence. */
export const getStore = (): MockStore => store;
export const resetStore = (): MockStore => (store = seed());
