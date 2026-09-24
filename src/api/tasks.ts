import { get, post, put } from './client';
import type {
  CancelWorkTaskRequest, CreateWorkTaskRequest, PagedResponse, UpdateWorkTaskRequest,
  WorkTaskCountsResponse, WorkTaskListItemResponse, WorkTaskPersonResponse, WorkTaskQuery,
  WorkTaskResponse, WorkTaskToDoItemResponse, WorkTaskToDoQuery, Uuid,
} from './dto';

/**
 * Tasks (the backend's round 10). Every operation needs `Tasks.Use`. The server decides who sees a
 * task and who may mark, undo or change it, and says so in each answer (`canMarkDone`, `canUndo`,
 * `canChange`, `viewerIsCreator`); nothing here judges a task. Every write answers with the task as
 * the reader reads it after the change.
 */

/** One view, searched and filtered, in the order the server gives it. */
export const listTasks = (query: WorkTaskQuery) =>
  get<PagedResponse<WorkTaskListItemResponse>>('/api/tasks', query);

/** The three views' sizes and the to-do count, before any search or filter. */
export const countTasks = () => get<WorkTaskCountsResponse>('/api/tasks/counts');

/** The reader's to-do items, earliest due first. */
export const listToDo = (query: WorkTaskToDoQuery = {}) =>
  get<PagedResponse<WorkTaskToDoItemResponse>>('/api/tasks/to-do', query);

/** The people a step may be given to now, the reader included. */
export const listTaskPeople = () => get<WorkTaskPersonResponse[]>('/api/tasks/people');

export const getTask = (taskId: Uuid) => get<WorkTaskResponse>(`/api/tasks/${taskId}`);
export const createTask = (body: CreateWorkTaskRequest) => post<WorkTaskResponse>('/api/tasks', body);
export const updateTask = (taskId: Uuid, body: UpdateWorkTaskRequest) =>
  put<WorkTaskResponse>(`/api/tasks/${taskId}`, body);
export const finishTask = (taskId: Uuid) => post<WorkTaskResponse>(`/api/tasks/${taskId}/finish`);
export const cancelTask = (taskId: Uuid, body: CancelWorkTaskRequest) =>
  post<WorkTaskResponse>(`/api/tasks/${taskId}/cancel`, body);
export const markStepDone = (taskId: Uuid, stepId: Uuid) =>
  post<WorkTaskResponse>(`/api/tasks/${taskId}/steps/${stepId}/done`);
export const undoStep = (taskId: Uuid, stepId: Uuid) =>
  post<WorkTaskResponse>(`/api/tasks/${taskId}/steps/${stepId}/undo`);
