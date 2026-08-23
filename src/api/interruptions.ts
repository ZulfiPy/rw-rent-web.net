import { get, post, put } from './client';
import type {
  AssignmentInterruptionResponse, CorrectInterruptionRequest, CreateAssignmentInterruptionRequest,
  EndAssignmentInterruptionRequest, InterruptionsQuery, PagedResponse,
  UpdateAssignmentInterruptionRequest, Uuid,
} from './dto';

const base = (assignmentId: Uuid) => `/api/rental-assignments/${assignmentId}/interruptions`;

export const listInterruptions = (assignmentId: Uuid, query: InterruptionsQuery = {}) =>
  get<PagedResponse<AssignmentInterruptionResponse>>(base(assignmentId), query);
export const createInterruption = (assignmentId: Uuid, body: CreateAssignmentInterruptionRequest) =>
  post<AssignmentInterruptionResponse>(base(assignmentId), body);
export const updateInterruption = (
  assignmentId: Uuid,
  interruptionId: Uuid,
  body: UpdateAssignmentInterruptionRequest,
) => put<AssignmentInterruptionResponse>(`${base(assignmentId)}/${interruptionId}`, body);
export const correctInterruption = (
  assignmentId: Uuid,
  interruptionId: Uuid,
  body: CorrectInterruptionRequest,
) => put<AssignmentInterruptionResponse>(`${base(assignmentId)}/${interruptionId}/correction`, body);
export const endInterruption = (
  assignmentId: Uuid,
  interruptionId: Uuid,
  body: EndAssignmentInterruptionRequest,
) => post<AssignmentInterruptionResponse>(`${base(assignmentId)}/${interruptionId}/end`, body);
