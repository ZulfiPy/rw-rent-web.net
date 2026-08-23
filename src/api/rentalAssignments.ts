import { get, post, put } from './client';
import type {
  ActivateRentalAssignmentRequest, CancelRentalAssignmentRequest,
  CorrectRentalAssignmentPartiesRequest, CorrectRentalAssignmentTimelineRequest,
  CreateRentalAssignmentRequest, EndRentalAssignmentRequest, PagedResponse,
  RentalAssignmentListItemResponse, RentalAssignmentResponse, RentalAssignmentsQuery,
  UpdateRentalAssignmentRequest, Uuid,
} from './dto';

export const listAssignments = (query: RentalAssignmentsQuery = {}) =>
  get<PagedResponse<RentalAssignmentListItemResponse>>('/api/rental-assignments', query);
export const getAssignment = (id: Uuid) => get<RentalAssignmentResponse>(`/api/rental-assignments/${id}`);
export const createAssignment = (body: CreateRentalAssignmentRequest) =>
  post<RentalAssignmentResponse>('/api/rental-assignments', body);
export const updateAssignment = (id: Uuid, body: UpdateRentalAssignmentRequest) =>
  put<RentalAssignmentResponse>(`/api/rental-assignments/${id}`, body);
export const activateAssignment = (id: Uuid, body: ActivateRentalAssignmentRequest) =>
  post<RentalAssignmentResponse>(`/api/rental-assignments/${id}/activate`, body);
export const endAssignment = (id: Uuid, body: EndRentalAssignmentRequest) =>
  post<RentalAssignmentResponse>(`/api/rental-assignments/${id}/end`, body);
export const cancelAssignment = (id: Uuid, body: CancelRentalAssignmentRequest) =>
  post<RentalAssignmentResponse>(`/api/rental-assignments/${id}/cancel`, body);

/** Privileged corrections. Both send the last-read concurrencyToken and an audited reason. */
export const correctAssignmentParties = (id: Uuid, body: CorrectRentalAssignmentPartiesRequest) =>
  put<RentalAssignmentResponse>(`/api/rental-assignments/${id}/corrections/parties`, body);
export const correctAssignmentTimeline = (id: Uuid, body: CorrectRentalAssignmentTimelineRequest) =>
  put<RentalAssignmentResponse>(`/api/rental-assignments/${id}/corrections/timeline`, body);
