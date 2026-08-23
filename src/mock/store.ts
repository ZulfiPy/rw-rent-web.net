import type {
  ApplicationUserResponse, AssignmentDriverAuthorizationResponse, AssignmentInterruptionResponse,
  CompanyResponse, CustomerResponse, DriverResponse, RentalAssignmentResponse,
  RoleAssignmentResponse, SecurityAuditResponse, SessionResponse,
  SystemAdministratorTransferResponse, VehicleResponse,
} from '@/api/dto';
import { seed } from './seed';

/** Tagged so a stale shape is never read back. Bumped whenever the seed changes meaningfully. */
export const SEED_VERSION = 'rwrent-19';

export interface MockStore {
  version: string;
  company: CompanyResponse | null;
  users: ApplicationUserResponse[];
  roles: RoleAssignmentResponse[];
  sessions: SessionResponse[];
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
