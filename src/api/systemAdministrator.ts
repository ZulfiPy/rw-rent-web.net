import { get, post } from './client';
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

/**
 * FOLLOW-UP: not in swagger. Initiate, resend, cancel and accept exist; there is no read, and the
 * reviewed screen lists every transfer with its state. Mock-only until the backend exposes one —
 * this single function is what the wiring phase repoints.
 */
export const listTransfers = () =>
  get<{ items: SystemAdministratorTransferResponse[] }>(base);
