import { transport, type AssertQuery, type Query } from './transport';
import type {
  AuthorizationsQuery, CustomersQuery, DriversQuery, InterruptionsQuery, PagedQuery,
  RentalAssignmentsQuery, SecurityAuditQuery, SessionsQuery, UsersQuery, VehiclesQuery,
} from './dto';

/**
 * Every query DTO, checked against the transport's Query in one place. A failure here means the
 * type was redeclared as an interface (no implicit index signature) or grew a property a query
 * string cannot carry.
 */
export type QueryContract = [
  AssertQuery<PagedQuery>, AssertQuery<UsersQuery>, AssertQuery<SessionsQuery>,
  AssertQuery<SecurityAuditQuery>, AssertQuery<VehiclesQuery>, AssertQuery<CustomersQuery>,
  AssertQuery<DriversQuery>, AssertQuery<RentalAssignmentsQuery>, AssertQuery<AuthorizationsQuery>,
  AssertQuery<InterruptionsQuery>,
];

export const get = <T>(path: string, query?: Query) => transport().request<T>('GET', path, { query });
export const post = <T>(path: string, body?: unknown) => transport().request<T>('POST', path, { body });
export const put = <T>(path: string, body?: unknown) => transport().request<T>('PUT', path, { body });
export const del = <T>(path: string) => transport().request<T>('DELETE', path);

/** Drops undefined and null; leaves the server's PascalCase parameter names untouched. */
export function toSearchParams(query?: Query): URLSearchParams {
  const p = new URLSearchParams();
  if (!query) return p;
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  return p;
}
