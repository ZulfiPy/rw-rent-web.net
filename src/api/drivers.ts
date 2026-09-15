import { get, post, put } from './client';
import type {
  CreateDriverRequest, DriverAuthorizationHistoryItemResponse, DriverAuthorizationsQuery,
  DriverListItemResponse, DriverResponse, DriversQuery, PagedResponse, UpdateDriverRequest, Uuid,
} from './dto';

export const listDrivers = (query: DriversQuery = {}) =>
  get<PagedResponse<DriverListItemResponse>>('/api/drivers', query);
export const getDriver = (id: Uuid) => get<DriverResponse>(`/api/drivers/${id}`);
export const createDriver = (body: CreateDriverRequest) => post<DriverResponse>('/api/drivers', body);
export const updateDriver = (id: Uuid, body: UpdateDriverRequest) =>
  put<DriverResponse>(`/api/drivers/${id}`, body);
export const activateDriver = (id: Uuid) => post<DriverResponse>(`/api/drivers/${id}/activate`);
export const deactivateDriver = (id: Uuid) => post<DriverResponse>(`/api/drivers/${id}/deactivate`);

/**
 * One driver's named authorizations across every assignment, newest first, each with the
 * assignment's status, vehicle and customer. Collective authorizations never appear.
 */
export const listDriverAuthorizations = (driverId: Uuid, query: DriverAuthorizationsQuery = {}) =>
  get<PagedResponse<DriverAuthorizationHistoryItemResponse>>(
    `/api/drivers/${driverId}/authorizations`,
    query,
  );
