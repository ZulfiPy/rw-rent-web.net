import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { qk } from '@/api';
import { installTransport } from '@/api/transport';
import { WorkTaskAboutKind, WorkTaskView } from '@/api/dto';
import { useStepAction, type StepActionState } from './tasks/StepAction';
import {
  NO_PERSON, blankStep, cancelRequest, createRequest, formOf, stepMessage, updateRequest,
} from './tasks/TaskDialogs';
import { TASK_REFRESH } from './tasks/taskAddress';
import { refused } from './followup12.harness';
import {
  CAPTURED_AT, markAgainRefusal, markCarWashToms, peopleDita, taskPrepareDita, taskPrepareToms,
} from './followup12.support';

/**
 * What the task writes send and what they refresh (Follow-up 12, F12-4, F12-5 and F12-7). A server
 * render cannot submit a dialog, so the requests are built by the same functions the dialogs call and
 * read here; a step's Mark done runs through its real hook and a stand-in transport that records the
 * request and answers with the API's own answer.
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => vi.useRealTimers());

const ids = Object.fromEntries(peopleDita.map((person) => [person.displayName.split(' ')[0]!, person.userId]));

describe('what New task sends', () => {
  test('the form as it is, nothing judged: a blank title and a step without a person go as they are', () => {
    const step = { ...blankStep(), title: '' };
    expect(createRequest({ title: '  ', description: '', due: '', aboutKind: '', aboutId: '', steps: [step] })).toEqual({
      title: '  ', description: null, dueAtUtc: null, aboutKind: null, aboutRecordId: null,
      steps: [{ title: '', responsibleUserId: NO_PERSON, dueAtUtc: null }],
    });
    expect(NO_PERSON).toBe('00000000-0000-0000-0000-000000000000');
  });

  test('the times in UTC from Tallinn’s wall clock, the record with its kind, the steps in their order', () => {
    const request = createRequest({
      title: 'Check the tyres', description: 'Winter is coming.', due: '2026-10-01T12:00',
      aboutKind: WorkTaskAboutKind.Vehicle, aboutId: 'v-1',
      steps: [
        { ...blankStep(), title: 'Measure', userId: ids.Toms!, due: '2026-09-30T09:30' },
        { ...blankStep(), title: 'Order', userId: ids.Signe! },
      ],
    });
    expect(request).toEqual({
      title: 'Check the tyres', description: 'Winter is coming.', dueAtUtc: '2026-10-01T09:00:00.000Z',
      aboutKind: WorkTaskAboutKind.Vehicle, aboutRecordId: 'v-1',
      steps: [
        { title: 'Measure', responsibleUserId: ids.Toms, dueAtUtc: '2026-09-30T06:30:00.000Z' },
        { title: 'Order', responsibleUserId: ids.Signe, dueAtUtc: null },
      ],
    });
    expect(request.steps[0]).not.toHaveProperty('id');
  });
});

describe('what Edit task sends', () => {
  test('untouched, the task goes back as its page read it: every step with its id, every instant as stored', () => {
    const request = updateRequest(formOf(taskPrepareDita), taskPrepareDita);
    expect(request).toEqual({
      title: taskPrepareDita.title,
      description: taskPrepareDita.description,
      dueAtUtc: taskPrepareDita.dueAtUtc,
      aboutKind: taskPrepareDita.aboutKind,
      aboutRecordId: taskPrepareDita.aboutRecordId,
      steps: taskPrepareDita.steps.map((s) => ({
        id: s.id, title: s.title, responsibleUserId: s.responsibleUserId, dueAtUtc: s.dueAtUtc ?? null,
      })),
    });
  });

  test('moved, renamed, given to Karlis, one removed and one new: ids in the order shown, the new one without', () => {
    const form = formOf(taskPrepareDita);
    const [bolt, licence, wash, handover] = form.steps;
    const request = updateRequest({
      ...form,
      description: '',
      steps: [
        { ...handover!, title: 'Hand over the keys' },
        { ...bolt! },
        { ...licence!, userId: ids.Karlis! },
        { ...blankStep(), title: 'Photos', userId: ids.Toms!, due: '2026-09-26T10:00' },
      ],
    }, taskPrepareDita);
    expect(request.description).toBeNull();
    expect(request.steps.map((s) => [s.id ?? null, s.title, s.responsibleUserId])).toEqual([
      [handover!.id, 'Hand over the keys', ids.Dita],
      [bolt!.id, 'Add to Bolt', ids.Dita],
      [licence!.id, 'Apply for the taxi licence', ids.Karlis],
      [null, 'Photos', ids.Toms],
    ]);
    expect(request.steps.some((s) => s.id === wash!.id)).toBe(false);
    expect(request.steps[0]!.dueAtUtc).toBe(taskPrepareDita.steps[3]!.dueAtUtc);
    expect(request.steps[3]!.dueAtUtc).toBe('2026-09-26T07:00:00.000Z');
  });

  test('a due date emptied goes as none; one changed goes in UTC', () => {
    const form = formOf(taskPrepareDita);
    expect(updateRequest({ ...form, due: '' }, taskPrepareDita).dueAtUtc).toBeNull();
    expect(updateRequest({ ...form, due: '2026-09-28T18:00' }, taskPrepareDita).dueAtUtc).toBe('2026-09-28T15:00:00.000Z');
    const cleared = updateRequest({ ...form, steps: form.steps.map((s) => ({ ...s, due: '' })) }, taskPrepareDita);
    expect(cleared.steps.every((s) => s.dueAtUtc === null)).toBe(true);
  });
});

describe('what Cancel task sends', () => {
  test('the Why as typed, or none', () => {
    expect(cancelRequest('')).toEqual({ note: null });
    expect(cancelRequest('  The plan changed.  ')).toEqual({ note: '  The plan changed.  ' });
  });
});

describe('a step’s refusal stays with its row', () => {
  const fields = { 'steps[1].dueAtUtc': 'A step cannot be due after the task.', 'steps[0].id': 'This step is listed twice.' };

  test('found by where the row stood when it was sent, wherever it moved since', () => {
    const sent = ['a', 'b', 'c'];
    expect(stepMessage(fields, sent, 'b', 'dueAtUtc')).toBe('A step cannot be due after the task.');
    expect(stepMessage(fields, sent, 'a', 'dueAtUtc')).toBeUndefined();
    expect(stepMessage(fields, sent, 'a', null)).toBe('This step is listed twice.');
    // A row added after the refusal has none.
    expect(stepMessage(fields, sent, 'new-9', 'dueAtUtc')).toBeUndefined();
  });
});

describe('Mark done and Undo through their hook', () => {
  const calls: string[] = [];
  let answer: () => unknown = () => markCarWashToms;
  installTransport({
    request: async (method: string, path: string) => {
      calls.push(`${method} ${path}`);
      return answer() as never;
    },
  });

  const probe = (step: (typeof taskPrepareToms.steps)[number]) => {
    const client = new QueryClient();
    const keys = [qk.tasks.detail(taskPrepareToms.id), qk.tasks.counts, qk.tasks.toDo({ PageNumber: 1, PageSize: 100 }),
      qk.tasks.list({ View: WorkTaskView.InvolvingMe, PageNumber: 1, PageSize: 20 })];
    for (const key of keys) client.setQueryData(key, {});
    client.setQueryData(qk.vehicles.list({ PageSize: 100 }), {});
    let action: StepActionState | null = null;
    const Probe = () => { action = useStepAction(taskPrepareToms.id, step); return null; };
    renderToStaticMarkup(h(QueryClientProvider, { client }, h(Probe)));
    return { client, keys, action: action! as StepActionState };
  };

  afterEach(() => {
    calls.length = 0;
    answer = () => markCarWashToms;
  });

  test('offered only as the API says: Mark done on Toms’s Car wash, nothing on Dita’s Add to Bolt', () => {
    const wash = taskPrepareToms.steps.find((s) => s.title === 'Car wash')!;
    const bolt = taskPrepareToms.steps.find((s) => s.title === 'Add to Bolt')!;
    expect(probe(wash).action).toMatchObject({ offered: true, done: false });
    expect(probe(bolt).action).toMatchObject({ offered: false, done: true });
    const undo = markCarWashToms.steps.find((s) => s.title === 'Car wash')!;
    expect(probe(undo).action).toMatchObject({ offered: true, done: true });
  });

  test('a mark sends the step’s done and refreshes every task query, nothing else', async () => {
    const wash = taskPrepareToms.steps.find((s) => s.title === 'Car wash')!;
    const { client, keys, action } = probe(wash);
    expect(action.run()).toBe(true);
    await vi.waitFor(() => expect(client.getQueryState(qk.tasks.counts)?.isInvalidated).toBe(true));
    expect(calls).toEqual([`POST /api/tasks/${taskPrepareToms.id}/steps/${wash.id}/done`]);
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated, JSON.stringify(key)).toBe(true);
    expect(client.getQueryState(qk.vehicles.list({ PageSize: 100 }))?.isInvalidated).toBe(false);
  });

  test('an undo sends the undo; a refusal refreshes the same queries', async () => {
    const undone = markCarWashToms.steps.find((s) => s.title === 'Car wash')!;
    answer = () => { throw refused(markAgainRefusal); };
    const { client, action } = probe(undone);
    action.run();
    await vi.waitFor(() => expect(client.getQueryState(qk.tasks.counts)?.isInvalidated).toBe(true));
    expect(calls).toEqual([`POST /api/tasks/${taskPrepareToms.id}/steps/${undone.id}/undo`]);
  });

  test('every task write refreshes the one prefix', () => {
    expect(TASK_REFRESH).toEqual([['tasks']]);
    for (const key of [qk.tasks.counts, qk.tasks.people, qk.tasks.detail('x'), qk.tasks.toDo({}), qk.tasks.list({ View: WorkTaskView.MyTasks })]) {
      expect(key[0]).toBe(TASK_REFRESH[0]![0]);
    }
  });
});
