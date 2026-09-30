import { get, post } from './client';
import {
  RecordKind,
  type CustomerDeletionCandidateResponse, type DeletableKind, type DeleteRecordRequest,
  type DriverAuthorizationDeletionCandidateResponse, type DriverDeletionCandidateResponse,
  type InsuranceCaseDeletionCandidateResponse, type InterruptionDeletionCandidateResponse, type PagedQuery, type PagedResponse,
  type RecordDeletionCandidateCountsResponse, type RecordDeletionCandidatesQuery,
  type RecordDeletionCountsQuery, type RecordDeletionListItemResponse, type RecordDeletionResponse,
  type RentalAssignmentDeletionCandidateResponse, type VehicleDeletionCandidateResponse,
} from './dto';

/**
 * The Delete records page's API (the backend's round 7). Every operation needs `Records.Delete`.
 * The server decides what is Ready and what is Blocked; nothing here judges a record.
 */

/** Each kind's candidate row. */
export interface CandidateByKind {
  [RecordKind.RentalAssignment]: RentalAssignmentDeletionCandidateResponse;
  [RecordKind.DriverAuthorization]: DriverAuthorizationDeletionCandidateResponse;
  [RecordKind.Interruption]: InterruptionDeletionCandidateResponse;
  [RecordKind.Vehicle]: VehicleDeletionCandidateResponse;
  [RecordKind.Customer]: CustomerDeletionCandidateResponse;
  [RecordKind.Driver]: DriverDeletionCandidateResponse;
  [RecordKind.InsuranceCase]: InsuranceCaseDeletionCandidateResponse;
}

export type AnyCandidate = CandidateByKind[DeletableKind];

/** The path segment of each kind's candidate list; an insurance case's since round 14 (Follow-up 19). */
export const CANDIDATE_PATH: Record<DeletableKind, string> = {
  [RecordKind.RentalAssignment]: 'rental-assignments',
  [RecordKind.DriverAuthorization]: 'driver-authorizations',
  [RecordKind.Interruption]: 'interruptions',
  [RecordKind.Vehicle]: 'vehicles',
  [RecordKind.Customer]: 'customers',
  [RecordKind.Driver]: 'drivers',
  [RecordKind.InsuranceCase]: 'insurance-cases',
};

/** One kind's candidates: newest created first, filtered by Show and searched as that kind's list is. */
export const listCandidates = <K extends DeletableKind>(kind: K, query: RecordDeletionCandidatesQuery = {}) =>
  get<PagedResponse<CandidateByKind[K]>>(`/api/record-deletions/candidates/${CANDIDATE_PATH[kind]}`, query);

/**
 * The totals under the filter, for the tab strip: six, and since round 14 the insurance cases. The
 * search does not narrow them.
 */
export const countCandidates = (query: RecordDeletionCountsQuery = {}) =>
  get<RecordDeletionCandidateCountsResponse>('/api/record-deletions/candidates/counts', query);

/** The deletions that were made, newest first, read from the audit entries they left. */
export const listDeletions = (query: PagedQuery = {}) =>
  get<PagedResponse<RecordDeletionListItemResponse>>('/api/record-deletions', query);

/** Deletes one record for good; answers the audit entry that now holds its copy. */
export const deleteRecord = (body: DeleteRecordRequest) =>
  post<RecordDeletionResponse>('/api/record-deletions', body);
