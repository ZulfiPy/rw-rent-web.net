import { get, post, put } from './client';
import type {
  AssignmentDriverAuthorizationResponse, AuthorizationsQuery, CorrectDriverAuthorizationRequest,
  PagedResponse, StartAssignmentDriverAuthorizationRequest,
  StopAssignmentDriverAuthorizationRequest, Uuid,
} from './dto';

const base = (assignmentId: Uuid) => `/api/rental-assignments/${assignmentId}/authorizations`;

export const listAuthorizations = (assignmentId: Uuid, query: AuthorizationsQuery = {}) =>
  get<PagedResponse<AssignmentDriverAuthorizationResponse>>(base(assignmentId), query);
export const startAuthorization = (assignmentId: Uuid, body: StartAssignmentDriverAuthorizationRequest) =>
  post<AssignmentDriverAuthorizationResponse>(base(assignmentId), body);
export const stopAuthorization = (
  assignmentId: Uuid,
  authorizationId: Uuid,
  body: StopAssignmentDriverAuthorizationRequest,
) => post<AssignmentDriverAuthorizationResponse>(`${base(assignmentId)}/${authorizationId}/stop`, body);
export const correctAuthorization = (
  assignmentId: Uuid,
  authorizationId: Uuid,
  body: CorrectDriverAuthorizationRequest,
) => put<AssignmentDriverAuthorizationResponse>(`${base(assignmentId)}/${authorizationId}/correction`, body);
