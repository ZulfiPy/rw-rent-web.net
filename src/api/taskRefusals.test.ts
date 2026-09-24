import { describe, expect, test } from 'vitest';
import { codeToField } from './codes';
import { ApiError, fieldMessages, toFailure } from './problem';
import { taskRefusal } from '@/pages/tasks/TaskDialogs';
import { stepRefusal } from '@/pages/tasks/StepAction';
import {
  concurrencyRefusal, createAboutMissingRefusal, createDueAfterRefusal, createShapeRefusal, editClosedRefusal,
  editCreatorOnlyRefusal, markAgainRefusal, markNotYoursRefusal, notFoundDita, undoNotYoursRefusal,
} from '@/pages/followup12.support';
import type { ProblemDetails } from './dto';

/**
 * How the app reads the refusals of tasks (Follow-up 12), each one the scratch API's own answer: a
 * step's field keeps its index, the record that is gone names its select, and the rest keep the
 * shared reading — a closed task a conflict, a creator's right forbidden, a lost race stale.
 */
const refusal = (body: ProblemDetails) => new ApiError(body.status ?? 0, body);

describe('the two writes', () => {
  test('a step’s fields keep their index, in the app’s spelling', () => {
    const failure = toFailure(refusal(createShapeRefusal), 'task-create');
    expect(failure.kind).toBe('field');
    expect(fieldMessages(failure)).toMatchObject({
      title: 'Enter a title for the task.',
      'steps[0].title': 'Every step needs a title.',
      'steps[0].responsibleUserId': 'Every step needs a person.',
    });
    const due = fieldMessages(toFailure(refusal(createDueAfterRefusal), 'task-create'));
    expect(due['steps[1].dueAtUtc']).toBe('A step cannot be due after the task.');
    expect(due['steps[0].dueAtUtc']).toBeUndefined();
  });

  test('a record that is gone is a 404 that belongs under the record’s select, on both writes only', () => {
    expect(createAboutMissingRefusal.status).toBe(404);
    for (const op of ['task-create', 'task-edit']) {
      expect(codeToField('tasks.about_record_not_found', op)).toBe('aboutRecordId');
      expect(toFailure(refusal(createAboutMissingRefusal), op)).toEqual({
        kind: 'field-code', field: 'aboutRecordId', code: 'tasks.about_record_not_found',
        message: 'The vehicle this task is about was not found.',
      });
    }
    expect(toFailure(refusal(createAboutMissingRefusal)).kind).toBe('unknown');
    expect(toFailure(refusal(createAboutMissingRefusal), 'assignment-create').kind).toBe('unknown');
    expect(taskRefusal(refusal(createAboutMissingRefusal))).toBeNull();
  });

  test('a task that no longer exists is a refused change; other 404s are not rewritten', () => {
    expect(taskRefusal(refusal(notFoundDita))).toEqual({ kind: 'conflict', message: 'This task no longer exists.', code: 'tasks.not_found' });
    expect(toFailure(refusal(notFoundDita), 'task-edit').kind).toBe('unknown');
    expect(taskRefusal(refusal(editClosedRefusal))).toBeNull();
    expect(taskRefusal(new Error('offline'))).toBeNull();
  });

  test('a closed task is a conflict, the creator’s right forbidden, a lost race stale', () => {
    expect(toFailure(refusal(editClosedRefusal), 'task-edit')).toEqual({
      kind: 'conflict', code: 'tasks.closed', message: 'This task was finished or cancelled and can no longer be changed.',
    });
    expect(toFailure(refusal(editCreatorOnlyRefusal), 'task-edit').kind).toBe('forbidden');
    expect(toFailure(refusal(concurrencyRefusal), 'task-edit').kind).toBe('stale');
  });
});

describe('Mark done and Undo', () => {
  test('their refusals read in the API’s own sentence', () => {
    expect(stepRefusal(refusal(markAgainRefusal))).toBe('This step is already done.');
    expect(stepRefusal(refusal(markNotYoursRefusal))).toBe('Only the step\'s person or the task\'s creator can mark this step.');
    expect(stepRefusal(refusal(undoNotYoursRefusal))).toBe('Only the person who marked this step, or the task\'s creator, can undo the mark.');
    expect(stepRefusal(refusal(concurrencyRefusal))).toBe('The task changed concurrently. Retry the operation.');
    expect(stepRefusal(new TypeError('Failed to fetch'))).toBe('Failed to fetch');
  });
});
