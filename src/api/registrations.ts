import { post } from './client';
import type {
  CompleteRegistrationEmailConfirmationRequest, RegisterApplicationUserRequest,
  ResendRegistrationEmailConfirmationRequest,
} from './dto';

export const register = (body: RegisterApplicationUserRequest) => post<void>('/api/registrations', body);
export const resendEmailConfirmation = (body: ResendRegistrationEmailConfirmationRequest) =>
  post<void>('/api/registrations/email-confirmation/resend', body);
export const completeEmailConfirmation = (body: CompleteRegistrationEmailConfirmationRequest) =>
  post<void>('/api/registrations/email-confirmation/complete', body);
