import { del, get, post, put } from './client';
import type {
  ChangeOwnPasswordRequest, ConfirmOwnEmailChange, CurrentUserResponse, EmailChangeRequestResponse,
  OwnProfileResponse, PagedResponse, ProfileSecurityChangeResponse, RequestOwnEmailChange,
  SessionResponse, SessionRevocationResponse, SessionsQuery, UpdateOwnPhoneRequest, Uuid,
} from './dto';

export const getCurrentUser = () => get<CurrentUserResponse>('/api/me');
export const updateOwnPhone = (body: UpdateOwnPhoneRequest) => put<OwnProfileResponse>('/api/me/phone', body);
export const changeOwnPassword = (body: ChangeOwnPasswordRequest) =>
  post<ProfileSecurityChangeResponse>('/api/me/password', body);
export const requestOwnEmailChange = (body: RequestOwnEmailChange) =>
  post<EmailChangeRequestResponse>('/api/me/email-change', body);
export const confirmOwnEmailChange = (body: ConfirmOwnEmailChange) =>
  post<ProfileSecurityChangeResponse>('/api/me/email-change/confirm', body);

/** Sessions surfaces always request IncludeEnded=true; ended rows are part of the record. */
export const listOwnSessions = (query: SessionsQuery = {}) =>
  get<PagedResponse<SessionResponse>>('/api/me/sessions', { IncludeEnded: true, ...query });
export const revokeOwnSession = (sessionId: Uuid) => del<void>(`/api/me/sessions/${sessionId}`);
export const revokeOtherOwnSessions = () =>
  post<SessionRevocationResponse>('/api/me/sessions/revoke-others');
