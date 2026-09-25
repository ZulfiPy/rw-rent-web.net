import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskDueFilter, WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { AppShell } from '@/app/AppShell';
import { TASK_TABS } from './tasks/taskAddress';
import { Tasks } from './tasks/Tasks';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import { meDita, meKarlis, meSigne, meToms } from './followup12.support';
import {
  R11_CAPTURED_AT, r11CountsDita, r11CountsKarlis, r11CountsSigne, r11CountsToms, r11InvolvingToms,
  r11MyTasksDita, r11MyTasksKarlis, r11MyTasksSigne, r11MyTasksToms, r11MyTasksTomsAfterDitaMark,
  r11MyTasksTomsAfterMark, r11MyTasksTomsOverdue,
} from './followup13.support';

/**
 * Follow-up 13: since round 11 My tasks holds the tasks the reader created and the tasks someone else
 * created in which the reader has a step, so it takes Involving me's layout (F13-1): Task with "from"
 * its creator, Steps, Your step with the reader's own steps and Mark done or Undo exactly as the API's
 * `canMarkDone` and `canUndo` say, a dim dash where the reader has none, People, Due, People folding
 * under Steps on the tablet. Rendered from round 11's answers on the scratch stack
 * (`followup13.support.ts`), with the clock at the moment they were given.
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R11_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const LIST = (view: WorkTaskQuery['View'], extra: Partial<WorkTaskQuery> = {}): WorkTaskQuery =>
  ({ View: view, PageNumber: 1, PageSize: 20, ...extra });

const list = (at: string, me: typeof meDita, data: Array<[readonly unknown[], unknown]>) =>
  renderAs(h(Tasks), { at, route: '/tasks', me, data }).markup;

const myTasks = (me: typeof meDita, page: typeof r11MyTasksDita, counts = r11CountsDita) =>
  list('/tasks', me, [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), page], [qk.tasks.counts, counts]]);

/** The ids of the rows in the order they are drawn. */
const rowIds = (markup: string) =>
  [...markup.matchAll(/<tr[^>]*>.*?href="\/tasks\/([0-9a-f-]{36})[^"]*"/g)].map((match) => match[1]);

describe('My tasks takes the open views’ layout (F13-1)', () => {
  test('the two open views carry the reader’s steps; Finished keeps its own columns', () => {
    expect(TASK_TABS.map((tab) => [tab.id, tab.yourSteps])).toEqual([['mine', true], ['involving', true], ['finished', false]]);
  });

  test('Toms, who created nothing: every row is someone else’s task, with his step and its action', () => {
    const markup = myTasks(meToms, r11MyTasksToms, r11CountsToms);
    expect(r11CountsToms).toEqual({ myTasks: 3, involvingMe: 3, finished: 0, toDo: 2 });
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*person<\/span>My tasks<span[^>]*>3<\/span>/);
    expect(markup).toMatch(/>Task<\/th>.*>Steps<\/th>.*>Your step<\/th>.*>People<\/th>.*>Due<\/th>/);
    // The rows in the server's order, the same tasks as his Involving me.
    expect(rowIds(markup)).toEqual(r11MyTasksToms.items.map((task) => task.id));
    expect(r11InvolvingToms.items.map((task) => task.id)).toEqual(r11MyTasksToms.items.map((task) => task.id));

    const service = around(markup, 'Book a service for 444 WKS and tell the driver', 'tr');
    expect(service).toContain('from Dita Smite');
    expect(service).toContain(`href="/tasks/${r11MyTasksToms.items[0]!.id}"`);
    expect(service).toMatch(/Tell the driver the time<\/span><span class="[^"]*_toneBad_[^"]*">Overdue · 24 Sep</);
    expect(service).toMatch(/aria-label="Mark done: Tell the driver the time"[^>]*>.*check<\/span><span>Mark done<\/span>/);

    const prepare = around(markup, 'Prepare 204 JLM for a rental', 'tr');
    expect(prepare).toContain('from Dita Smite');
    expect(prepare).toMatch(/Car wash<\/span><span class="_yourStepDue_[^"]*">Due 26 Sep, 08:54</);
    expect(prepare).toContain('>Mark done</span>');
    expect(prepare).toMatch(/_showTablet_[^"]*">Dita Smite, Signe Priede \+1</);

    const claim = around(markup, 'Handle the windscreen insurance case of 204 JLM', 'tr');
    expect(claim).toContain('from Signe Priede');
    expect(claim).toMatch(/Collect the photos.*check<\/span>Done<\/span>.*undo<\/span><span>Undo<\/span>/);
    expect(claim).not.toContain('>Mark done<');
  });

  test('Signe, with tasks of her own and one of Dita’s: her own without a step of hers reads a dim dash', () => {
    const markup = myTasks(meSigne, r11MyTasksSigne, r11CountsSigne);
    expect(markup).toMatch(/My tasks<span[^>]*>3<\/span>/);
    expect(rowIds(markup)).toEqual(r11MyTasksSigne.items.map((task) => task.id));

    const agreement = around(markup, 'Prepare the rental agreement for Martins Ozols', 'tr');
    expect(agreement).not.toContain('from ');
    expect(agreement).toContain('Customer · Martins Ozols');
    // Follow-up 14: the Due cell's date may take two lines, broken only after "·" or ",".
    expect(agreement).toMatch(/class="_due_[^"]* _toneWarn_[^"]*"><span class="_keep_[^"]*">Due today ·<\/span> <span class="_keep_[^"]*">15:54<\/span><\/span>/);
    // Task, Steps, Your step (a dim dash), People (a dim dash), Due.
    expect(agreement).toMatch(/No steps<\/span><\/span><\/td><td class="[^"]*"><span class="[^"]*_dim_[^"]*">—<\/span><\/td>/);

    const prepare = around(markup, 'Prepare 204 JLM for a rental', 'tr');
    expect(prepare).toContain('from Dita Smite');
    expect(prepare).toMatch(/Apply for the taxi licence<\/span><span class="_yourStepDue_[^"]*">Due 27 Sep, 14:54</);
    expect(prepare).toMatch(/aria-label="Mark done: Apply for the taxi licence"/);

    const claim = around(markup, 'Handle the windscreen insurance case of 204 JLM', 'tr');
    expect(claim).not.toContain('from ');
    expect(claim).toMatch(/Send the claim to the insurer.*check<\/span>Done<\/span>.*<span>Undo<\/span>/);
  });

  test('the table is the open views’ width, and People fold under Steps on the tablet', () => {
    const markup = myTasks(meDita, r11MyTasksDita);
    expect(markup).toMatch(/<table class="[^"]*_withSteps_[^"]*"/);
    expect(markup).not.toMatch(/<table class="[^"]*_plain_/);
    expect(markup).toMatch(/_cPeople200_[^"]* [^"]*_foldTablet_[^"]*">People<\/th>/);
    expect(markup).toMatch(/_cYour_[^"]*">Your step<\/th>/);
    // Every row with people carries them under Steps too, for the folded band.
    const withPeople = r11MyTasksDita.items.filter((task) => task.people.length).length;
    expect(count(markup, '_showTablet_')).toBe(withPeople);
  });
});

describe('the actions are the API’s answer, row by row (F13-1)', () => {
  test('after Toms marks Car wash: Done with Undo; after Dita marks his other step: Done, no action, and the row moves', () => {
    const after = myTasks(meToms, r11MyTasksTomsAfterMark);
    expect(around(after, 'Prepare 204 JLM for a rental', 'tr')).toMatch(/Car wash.*check<\/span>Done<\/span>.*<span>Undo<\/span>/);

    const markup = myTasks(meToms, r11MyTasksTomsAfterDitaMark);
    const service = around(markup, 'Book a service for 444 WKS and tell the driver', 'tr');
    expect(service).toMatch(/Tell the driver the time.*check<\/span>Done<\/span>/);
    expect(service).not.toContain('>Mark done<');
    expect(service).not.toContain('>Undo<');
    // Its creator's mark leaves him no step to do in it, and the server puts it last.
    expect(rowIds(markup)).toEqual(r11MyTasksTomsAfterDitaMark.items.map((task) => task.id));
    expect(rowIds(markup).at(-1)).toBe(r11MyTasksToms.items[0]!.id);
  });

  test('nothing offered, nothing drawn: the flags alone decide', () => {
    const unoffered = { ...r11MyTasksDita, items: r11MyTasksDita.items.map((task) => ({
      ...task, yourSteps: task.yourSteps.map((step) => ({ ...step, canMarkDone: false, canUndo: false })),
    })) };
    const markup = myTasks(meDita, unoffered);
    expect(markup).not.toContain('>Mark done<');
    expect(markup).not.toContain('>Undo<');
    const done = r11MyTasksDita.items.flatMap((task) => task.yourSteps).filter((step) => step.doneAtUtc).length;
    expect(count(markup, '</span>Done</span>')).toBe(done);
  });
});

describe('the rest of My tasks is as it was (F13-3)', () => {
  test('the Due filter is the server’s answer: Toms’s overdue step in Dita’s task', () => {
    const markup = list('/tasks?due=overdue', meToms, [
      [qk.tasks.list(LIST(WorkTaskView.MyTasks, { Due: WorkTaskDueFilter.Overdue })), r11MyTasksTomsOverdue],
    ]);
    expect(markup).toContain('Book a service for 444 WKS and tell the driver');
    expect(markup).not.toContain('Prepare 204 JLM for a rental');
    expect(markup).toContain('from Dita Smite');
    expect(markup).toContain('>1 task<');
    expect(markup).toContain('Clear filters');
  });

  test('Karlis, on no task: the API’s empty My tasks is the empty state with New task', () => {
    expect(r11MyTasksKarlis.items).toEqual([]);
    const markup = myTasks(meKarlis, r11MyTasksKarlis, r11CountsKarlis);
    expect(markup).toContain('No open tasks');
    expect(markup).toMatch(/<button[^>]*>.*add<\/span>New task<\/button>/);
    expect(markup).not.toContain('<table');
  });

  test('the count on Tasks is still the to-do count, not the size of My tasks', () => {
    const shell = renderAs(h(AppShell, { companyName: 'RW-Rent Demo' }), {
      at: '/overview', route: '/overview', me: meToms, data: [[qk.tasks.counts, r11CountsToms]],
    }).markup;
    expect(r11CountsToms.myTasks).toBe(3);
    expect(around(shell, 'aria-label="Tasks"', 'a')).toMatch(/_badge_[^"]*">2<\/span>/);
  });
});
