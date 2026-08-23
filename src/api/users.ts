import { get, post, put } from './client';
import type {
  ActivateApplicationUserRequest, ApplicationUserListItemResponse, ApplicationUserResponse,
  CorrectApplicationUserNameRequest, PagedResponse, RegistrationDecisionRequest, UsersQuery, Uuid,
} from './dto';

export const listUsers = (query: UsersQuery = {}) =>
  get<PagedResponse<ApplicationUserListItemResponse>>('/api/users', query);
export const getUser = (userId: Uuid) => get<ApplicationUserResponse>(`/api/users/${userId}`);
export const correctUserName = (userId: Uuid, body: CorrectApplicationUserNameRequest) =>
  put<ApplicationUserResponse>(`/api/users/${userId}/name`, body);
export const activateUser = (userId: Uuid, body: ActivateApplicationUserRequest) =>
  post<ApplicationUserResponse>(`/api/users/${userId}/activate`, body);
export const rejectRegistration = (userId: Uuid, body: RegistrationDecisionRequest) =>
  post<ApplicationUserResponse>(`/api/users/${userId}/reject-registration`, body);
export const reopenRegistration = (userId: Uuid, body: RegistrationDecisionRequest) =>
  post<ApplicationUserResponse>(`/api/users/${userId}/reopen-registration`, body);
/** No body, and the backend audits no reason — see COVERAGE.md §5.1. */
export const suspendUser = (userId: Uuid) => post<ApplicationUserResponse>(`/api/users/${userId}/suspend`);
export const restoreUser = (userId: Uuid) => post<ApplicationUserResponse>(`/api/users/${userId}/restore`);
