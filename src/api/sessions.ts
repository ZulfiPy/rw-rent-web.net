import { del, get, post } from './client';
import type { PagedResponse, SessionResponse, SessionRevocationResponse, SessionsQuery, Uuid } from './dto';

export const listUserSessions = (userId: Uuid, query: SessionsQuery = {}) =>
  get<PagedResponse<SessionResponse>>(`/api/users/${userId}/sessions`, { IncludeEnded: true, ...query });
export const revokeUserSession = (userId: Uuid, sessionId: Uuid) =>
  del<void>(`/api/users/${userId}/sessions/${sessionId}`);
export const revokeAllUserSessions = (userId: Uuid) =>
  post<SessionRevocationResponse>(`/api/users/${userId}/sessions/revoke-all`);
