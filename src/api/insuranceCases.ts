import { get, post, postForm, put } from './client';
import { resourceUrl } from './transport';
import type {
  AddInsuranceCaseEventRequest, CorrectInsuranceCaseEventRequest, InsuranceCaseAccidentChoicesQuery,
  InsuranceCaseCountsResponse, InsuranceCaseDriverSuggestionQuery, InsuranceCaseDriverSuggestionResponse,
  InsuranceCaseLinkResponse, InsuranceCaseListItemResponse, InsuranceCaseNoteRequest, InsuranceCaseQuery,
  InsuranceCaseResponse, PagedResponse, RegisterInsuranceCaseRequest, UpdateInsuranceCaseRequest, Uuid,
} from './dto';

/**
 * Insurance cases (the backend's round 12). Reading needs `InsuranceCases.Read`, every write
 * `InsuranceCases.Manage`. The server decides who may change a case (`canChange`) and who may
 * correct an entry (`canCorrect`), since when a case waits, when it was closed, its rental and the
 * other cases of its accident; nothing here judges a case. Every write answers with the case as the
 * reader reads it after the change. Since round 13 a case names its insurers by their ids, from the
 * list of `./insurers`, and reads them back as the list's insurers.
 */

/** A photo the browser has made ready to send, under the name the person chose it by. */
export interface PhotoUpload {
  file: Blob;
  fileName: string;
}

/**
 * The form of a write that carries photos: each field under its request member's name, a blank or
 * missing value left out, and each photo as a part named `photos`. The server binds the names in any
 * case; the document names them as the request's members.
 */
export function caseForm(fields: object, photos: readonly PhotoUpload[] = []): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    form.append(key.charAt(0).toUpperCase() + key.slice(1), String(value));
  }
  for (const photo of photos) form.append('photos', photo.file, photo.fileName);
  return form;
}

/** One view, searched and filtered, in the order the server gives it. */
export const listCases = (query: InsuranceCaseQuery) =>
  get<PagedResponse<InsuranceCaseListItemResponse>>('/api/insurance-cases', query);

/** The three views' sizes, before any search or filter. */
export const countCases = () => get<InsuranceCaseCountsResponse>('/api/insurance-cases/counts');

export const getCase = (caseId: Uuid) => get<InsuranceCaseResponse>(`/api/insurance-cases/${caseId}`);

/** The cases a case may name as its accident's, newest first. */
export const listAccidentChoices = (query: InsuranceCaseAccidentChoicesQuery = {}) =>
  get<InsuranceCaseLinkResponse[]>('/api/insurance-cases/accident-choices', query);

/** Who drove the car at that moment, as its rental says. */
export const suggestDriver = (query: InsuranceCaseDriverSuggestionQuery) =>
  get<InsuranceCaseDriverSuggestionResponse>('/api/insurance-cases/driver-suggestion', query);

export const registerCase = (request: RegisterInsuranceCaseRequest, photos: readonly PhotoUpload[]) =>
  postForm<InsuranceCaseResponse>('/api/insurance-cases', caseForm(request, photos));

export const updateCase = (caseId: Uuid, request: UpdateInsuranceCaseRequest) =>
  put<InsuranceCaseResponse>(`/api/insurance-cases/${caseId}`, request);

export const addEvent = (caseId: Uuid, request: AddInsuranceCaseEventRequest, photos: readonly PhotoUpload[]) =>
  postForm<InsuranceCaseResponse>(`/api/insurance-cases/${caseId}/events`, caseForm(request, photos));

export const correctEvent = (caseId: Uuid, eventId: Uuid, request: CorrectInsuranceCaseEventRequest) =>
  put<InsuranceCaseResponse>(`/api/insurance-cases/${caseId}/events/${eventId}`, request);

export const addNote = (caseId: Uuid, request: InsuranceCaseNoteRequest) =>
  post<InsuranceCaseResponse>(`/api/insurance-cases/${caseId}/notes`, request);

export const correctNote = (caseId: Uuid, noteId: Uuid, request: InsuranceCaseNoteRequest) =>
  put<InsuranceCaseResponse>(`/api/insurance-cases/${caseId}/notes/${noteId}`, request);

/**
 * Where the browser reads a photo's picture. The answer carries its own cache headers and is read
 * with the session's cookie, like every other request to the API.
 */
export const photoUrl = (caseId: Uuid, photoId: Uuid) =>
  resourceUrl(`/api/insurance-cases/${caseId}/photos/${photoId}`);
