import { get, post, put } from './client';
import type {
  ChangeRoleExpiryRequest, GrantRoleRequest, PagedQuery, PagedResponse, RevokeRoleRequest,
  RoleAssignmentResponse, Uuid,
} from './dto';

/** Full history: revoked and expired assignments included, with current effectiveness. */
export const listRoleHistory = (userId: Uuid, query: PagedQuery = {}) =>
  get<PagedResponse<RoleAssignmentResponse>>(`/api/users/${userId}/roles`, query);
export const grantRole = (userId: Uuid, body: GrantRoleRequest) =>
  post<RoleAssignmentResponse>(`/api/users/${userId}/roles`, body);
export const changeRoleExpiry = (userId: Uuid, assignmentId: Uuid, body: ChangeRoleExpiryRequest) =>
  put<RoleAssignmentResponse>(`/api/users/${userId}/roles/${assignmentId}/expiry`, body);
export const revokeRole = (userId: Uuid, assignmentId: Uuid, body: RevokeRoleRequest) =>
  post<RoleAssignmentResponse>(`/api/users/${userId}/roles/${assignmentId}/revoke`, body);
