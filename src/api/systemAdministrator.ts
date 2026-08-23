import { post } from './client';
import type {
  AcceptSystemAdministratorTransferRequest, CancelSystemAdministratorTransferRequest,
  InitiateSystemAdministratorTransferRequest, ResendSystemAdministratorTransferRequest,
  SystemAdministratorTransferResponse, Uuid,
} from './dto';

const base = '/api/system-administrator/transfers';

export const initiateTransfer = (body: InitiateSystemAdministratorTransferRequest) =>
  post<SystemAdministratorTransferResponse>(base, body);
export const resendTransfer = (transferId: Uuid, body: ResendSystemAdministratorTransferRequest) =>
  post<SystemAdministratorTransferResponse>(`${base}/${transferId}/resend`, body);
export const cancelTransfer = (transferId: Uuid, body: CancelSystemAdministratorTransferRequest) =>
  post<SystemAdministratorTransferResponse>(`${base}/${transferId}/cancel`, body);
export const acceptTransfer = (body: AcceptSystemAdministratorTransferRequest) =>
  post<void>(`${base}/accept`, body);
