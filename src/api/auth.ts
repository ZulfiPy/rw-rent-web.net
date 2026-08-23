import { get, post } from './client';
import type {
  AntiforgeryTokenResponse, CompletePasswordResetRequest, LoginRequest, LoginResponse,
  PasswordResetRequest,
} from './dto';

export const getAntiforgeryToken = () => get<AntiforgeryTokenResponse>('/api/auth/antiforgery');
export const login = (body: LoginRequest) => post<LoginResponse>('/api/auth/login', body);
export const logout = () => post<void>('/api/auth/logout');
export const requestPasswordReset = (body: PasswordResetRequest) =>
  post<void>('/api/auth/password-reset/request', body);
export const completePasswordReset = (body: CompletePasswordResetRequest) =>
  post<void>('/api/auth/password-reset/complete', body);
