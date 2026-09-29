import { get, post, put } from './client';
import type {
  CreateInsurerRequest, InsurerListItemResponse, InsurerQuery, InsurerResponse, UpdateInsurerRequest, Uuid,
} from './dto';

/**
 * The insurers the company keeps (the backend's round 13, Follow-up 18). Everyone who reads cases reads
 * the list (`InsuranceCases.Read`); whoever manages cases adds an insurer, edits it and puts it out of
 * use or back (`InsuranceCases.Manage`). Nothing deletes one: an insurer no longer used is put out of
 * use and stays on every case that names it. The server holds every rule, the name's uniqueness
 * whatever its letters or spaces included; nothing here judges an insurer.
 */

/** The whole list, in the order of the names, with the cases each one handles and the cases that name it. */
export const listInsurers = (query: InsurerQuery = {}) => get<InsurerListItemResponse[]>('/api/insurers', query);

export const getInsurer = (insurerId: Uuid) => get<InsurerResponse>(`/api/insurers/${insurerId}`);

/** A new insurer, in use; it answers with the insurer as its read gives it. */
export const createInsurer = (request: CreateInsurerRequest) => post<InsurerResponse>('/api/insurers', request);

/** A rename shows at once on every case that names the insurer. */
export const updateInsurer = (insurerId: Uuid, request: UpdateInsurerRequest) =>
  put<InsurerResponse>(`/api/insurers/${insurerId}`, request);

/** Out of use: kept on every case that names it and no longer put on a case. Repeated, it changes nothing. */
export const deactivateInsurer = (insurerId: Uuid) => post<void>(`/api/insurers/${insurerId}/deactivate`);

/** Back in use. Repeated, it changes nothing. */
export const activateInsurer = (insurerId: Uuid) => post<void>(`/api/insurers/${insurerId}/activate`);
