import { readFileSync } from 'node:fs';
import { createElement as h, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { qk } from '@/api';
import { WorkTaskDueFilter, WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { AppShell } from '@/app/AppShell';
import type { PageHeaderModel } from '@/app/pageHeader';
import { Overview, TO_DO } from './overview/Overview';
import { TaskRecord } from './tasks/TaskRecord';
import { Tasks } from './tasks/Tasks';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import {
  R11_CAPTURED_AT, r11CountsDita, r11CountsToms, r11CountsTomsAfterMark, r11MyTasksDita, r11ToDoToms,
  r11ToDoTomsAfterMark,
} from './followup13.support';
import {
  CAPTURED_AT, cancelBlank, countsDita, countsSigne, countsToms, countsTomsAfterMark, markCarWashToms,
  meAdmin, meDita, meSigne, meToms, notFoundDita, notSharedKarlis, meKarlis, taskAboutDeleted,
  taskAgreementSigne, taskFineDita, taskFobsDita, taskPrepareDita, taskPrepareToms, taskRegisterDita,
  taskVentspilsSigne, todoDita, view1DitaOverdue, view1DitaSearchZzz, view2Toms, view2TomsAfterMark,
  view3Signe, view3Toms,
} from './followup12.support';

/**
 * Follow-up 12, rendered to markup from the scratch stack's answers (`followup12.support.ts`): the
 * Tasks list with its three views, a task's page as its creator and as a step's person, the finished,
 * cancelled, not-shared and not-found states, and the Overview's Open tasks. The page header is the
 * shell's, drawn from a model the page declares in an effect, which a server render never runs; the
 * model is caught here as the page hands it over.
 */
const header = vi.hoisted(() => ({ last: null as PageHeaderModel | null }));
vi.mock('@/app/pageHeader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/pageHeader')>()),
  usePageHeader: (model: PageHeaderModel) => { header.last = model; },
}));

beforeEach(() => {
  // The seed's times are relative to its seeding: read them at the moment the API answered.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
  header.last = null;
});

const LIST = (view: WorkTaskQuery['View'], extra: Partial<WorkTaskQuery> = {}): WorkTaskQuery =>
  ({ View: view, PageNumber: 1, PageSize: 20, ...extra });

const markupOf = (node: ReactNode) => renderToStaticMarkup(h('div', null, node));

/** A list with nothing in it, of the test's own (Follow-up 13: the recorded ones are no longer empty). */
const EMPTY_PAGE = { items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 };

/** Round 11's answers were given a day later than round 10's: read them at their own moment. */
const atRound11 = () => vi.setSystemTime(new Date(R11_CAPTURED_AT));

/** Whether a query the page built is enabled: the option the page passed, as the cache keeps it. */
const enabled = (query: { options: unknown }) => (query.options as { enabled?: unknown }).enabled;

/* the list ---------------------------------------------------------------------------------------- */

const list = (at: string, me: typeof meDita, data: Array<[readonly unknown[], unknown]>) =>
  renderAs(h(Tasks), { at, route: '/tasks', me, data });

describe('the Tasks list (F12-2)', () => {
  test('the header, the strip with the server’s counts, the zone, the search and the Due filter', () => {
    // Follow-up 13: round 11's answers, where My tasks also holds Signe's task with Dita's step.
    atRound11();
    const { markup } = list('/tasks', meDita, [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), r11MyTasksDita], [qk.tasks.counts, r11CountsDita]]);
    expect(header.last?.title).toBe('Tasks');
    expect(header.last?.description).toBe('Your tasks, and the steps others have given you. Only a task’s creator changes or finishes it.');
    expect(markupOf(header.last?.actions)).toMatch(/<button[^>]*data-tone="primary"[^>]*>.*New task<\/button>/);
    expect(r11CountsDita).toEqual({ myTasks: 5, involvingMe: 1, finished: 1, toDo: 4 });
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*person<\/span>My tasks<span[^>]*>5<\/span>/);
    expect(markup).toMatch(/Involving me<span[^>]*>1<\/span>/);
    expect(markup).toMatch(/Finished<span[^>]*>1<\/span>/);
    expect(markup).toContain('data-compact="true"');
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).toContain('placeholder="Task, step or record"');
    expect(markup).toContain('maxLength="50"');
    for (const option of ['Any due date', 'Overdue', 'Due in the next 7 days', 'No due date']) {
      expect(markup).toContain(`>${option}</option>`);
    }
    expect(markup).not.toContain('Clear filters');
    expect(markup).toContain('>5 tasks<');
  });

  test('My tasks: the API’s rows in its order, each with its record, progress, your step, people and due', () => {
    // Follow-up 13: round 11's My tasks, Dita's four tasks and Signe's with her step, in Involving
    // me's layout.
    atRound11();
    const { markup } = list('/tasks', meDita, [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), r11MyTasksDita], [qk.tasks.counts, r11CountsDita]]);
    const titles = r11MyTasksDita.items.map((task) => task.title);
    const at = titles.map((title) => markup.indexOf(`>${title}</a>`));
    expect(at.every((index) => index > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    // The columns of the open views, Your step among them.
    expect(markup).toMatch(/>Task<\/th>.*>Steps<\/th>.*>Your step<\/th>.*>People<\/th>.*>Due<\/th>/);

    const fine = around(markup, 'Reassign the parking fine to the driver', 'tr');
    expect(fine).toContain('Rental assignment · 552 KLM · Nordwind Logistics');
    expect(fine).toContain('No steps');
    // Follow-up 14: the Due cell's date may take two lines, broken only after "·" or ",".
    expect(fine).toMatch(/class="_due_[^"]* _toneBad_[^"]*"><span class="_keep_[^"]*">Overdue ·<\/span> <span class="_keep_[^"]*">24 Sep<\/span><\/span>/);
    expect(fine).not.toContain('from ');
    expect(fine).not.toContain('Mark done');

    const prepare = around(markup, 'Prepare 204 JLM for a rental', 'tr');
    expect(prepare).toContain(`href="/tasks/${taskPrepareDita.id}"`);
    expect(prepare).toContain('Vehicle · 204 JLM');
    expect(prepare).toContain('1 of 4 done');
    expect(prepare).toContain('style="width:25%"');
    expect(prepare).toContain('Dita Smite, Signe Priede +1');
    expect(prepare).toMatch(/class="_due_[^"]*"><span class="_keep_[^"]*">28 Sep,<\/span> <span class="_keep_[^"]*">10:54<\/span><\/span>/);
    expect(prepare).not.toContain('from ');
    // Her own two steps: Add to Bolt done by her, with Undo; Handover to do, with Mark done.
    expect(prepare).toMatch(/Add to Bolt<\/span><span class="_yourStepDue_[^"]*">No due date<.*check<\/span>Done<\/span>.*<span>Undo<\/span>/);
    expect(prepare).toMatch(/Handover<\/span><span class="_yourStepDue_[^"]*">Due 28 Sep, 10:54<.*aria-label="Mark done: Handover"/);

    // Someone else's task in her My tasks: "from" its creator and her step with its action.
    const claim = around(markup, 'Handle the windscreen insurance case of 204 JLM', 'tr');
    expect(claim).toContain('from Signe Priede');
    expect(claim).toContain(`href="/tasks/${r11MyTasksDita.items[2]!.id}"`);
    expect(claim).toMatch(/Pick up the repair invoice<\/span><span class="_yourStepDue_[^"]*">No due date</);
    expect(claim).toMatch(/aria-label="Mark done: Pick up the repair invoice"[^>]*>.*check<\/span><span>Mark done<\/span>/);
    expect(claim).toMatch(/class="_due_[^"]*"><span class="_keep_[^"]*">05 Oct,<\/span> <span class="_keep_[^"]*">14:54<\/span><\/span>/);

    // Her own task without steps: a dim dash for Your step, People and Due.
    const fobs = around(markup, 'Order two spare key fobs', 'tr');
    expect(fobs).not.toContain(' · ');
    expect(count(fobs, '_dim_')).toBe(3);
    expect(fobs).toMatch(/_dim_[^"]*">—<\/td>/);
    expect(fobs).toMatch(/_dim_[^"]*">—<\/span>/);
  });

  test('Involving me: the reader’s own steps with the action the API allows, and who gave the task', () => {
    const { markup } = list('/tasks?tab=involving', meToms, [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), view2Toms], [qk.tasks.counts, countsToms]]);
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*group<\/span>Involving me<span[^>]*>3<\/span>/);
    expect(markup).toMatch(/>Task<\/th>.*>Steps<\/th>.*>Your step<\/th>.*>People<\/th>.*>Due<\/th>/);

    const service = around(markup, 'Book a service for 444 WKS and tell the driver', 'tr');
    expect(service).toContain('from Dita Smite');
    expect(service).toContain(`href="/tasks/${view2Toms.items[0]!.id}?tab=involving"`);
    expect(service).toMatch(/Tell the driver the time<\/span><span class="[^"]*_toneBad_[^"]*">Overdue · 23 Sep</);
    expect(service).toMatch(/aria-label="Mark done: Tell the driver the time"[^>]*>.*check<\/span><span>Mark done<\/span>/);

    const prepare = around(markup, 'Prepare 204 JLM for a rental', 'tr');
    expect(prepare).toMatch(/Car wash<\/span><span class="_yourStepDue_[^"]*">Due 25 Sep, 14:08</);
    expect(prepare).toContain('>Mark done</span>');
    // People fold into a line under Steps on the portrait band.
    expect(prepare).toMatch(/_showTablet_[^"]*">Dita Smite, Signe Priede \+1</);

    const claim = around(markup, 'Handle the windscreen insurance case of 204 JLM', 'tr');
    expect(claim).toContain('from Signe Priede');
    expect(claim).toMatch(/Collect the photos.*check<\/span>Done<\/span>.*undo<\/span><span>Undo<\/span>/);
    expect(claim).not.toContain('>Mark done<');
  });

  test('a step the reader may neither mark nor undo shows Done and no action', () => {
    // After Toms marked Car wash, Dita marked nothing of his: the answer offers him Undo on his own mark.
    const after = list('/tasks?tab=involving', meToms, [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), view2TomsAfterMark], [qk.tasks.counts, countsTomsAfterMark]]).markup;
    const prepare = around(after, 'Prepare 204 JLM for a rental', 'tr');
    expect(prepare).toMatch(/Car wash.*check<\/span>Done<\/span>.*<span>Undo<\/span>/);
    expect(countsTomsAfterMark.toDo).toBe(1);

    const unoffered = { ...view2Toms, items: view2Toms.items.map((task) => ({
      ...task, yourSteps: task.yourSteps.map((step) => ({ ...step, canMarkDone: false, canUndo: false })),
    })) };
    const { markup } = list('/tasks?tab=involving', meToms, [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), unoffered]]);
    expect(markup).not.toContain('>Mark done<');
    expect(markup).not.toContain('>Undo<');
    expect(count(markup, '</span>Done</span>')).toBe(1);
  });

  test('Finished: the chip, the time it was closed, and "from" on a task someone else created', () => {
    const { markup } = list('/tasks?tab=finished', meSigne, [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Signe], [qk.tasks.counts, countsSigne]]);
    expect(markup).toMatch(/>Task<\/th>.*>Steps<\/th>.*>People<\/th>.*>Closed<\/th>/);
    const register = around(markup, 'Register 119 MPR in Bolt', 'tr');
    expect(register).toMatch(/data-tone="ok"[^>]*>.*Finished<\/span>/);
    expect(register).toContain('22 Sep, 20:10');
    expect(register).toContain('from Dita Smite');
    expect(register).toContain('2 of 2 done');
    const ventspils = around(markup, 'Prepare an agreement for Ventspils Marine Services', 'tr');
    expect(ventspils).toMatch(/data-tone="mute"[^>]*>.*Cancelled<\/span>/);
    expect(ventspils).toContain('Customer · Ventspils Marine Services');
  });

  test('each view’s empty list, in the prototype’s words; My tasks offers New task', () => {
    // Follow-up 13: Toms's recorded My tasks is no longer empty, so the empty views are lists of
    // the test's own.
    const mine = list('/tasks', meToms, [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), EMPTY_PAGE], [qk.tasks.counts, countsToms]]).markup;
    expect(EMPTY_PAGE.items).toEqual([]);
    expect(mine).toContain('No open tasks');
    expect(mine).toContain('Press New task to write down what must not be forgotten.');
    expect(mine).toMatch(/<button[^>]*>.*add<\/span>New task<\/button>/);
    const finished = list('/tasks?tab=finished', meToms, [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Toms]]).markup;
    expect(finished).toContain('Nothing finished yet');
    expect(finished).not.toContain('New task</button>');
    const involving = list('/tasks?tab=involving', meToms, [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), EMPTY_PAGE]]).markup;
    expect(involving).toContain('Nobody is waiting on you');
    expect(involving).toContain('When someone gives you a step in their task, it appears here.');
  });

  test('a search or a filter that finds nothing is the no-results state, with Clear filters', () => {
    const { markup } = list('/tasks?search=zzz', meDita, [[qk.tasks.list(LIST(WorkTaskView.MyTasks, { Search: 'zzz' })), view1DitaSearchZzz]]);
    expect(view1DitaSearchZzz.items).toEqual([]);
    expect(markup).toContain('No results for these filters');
    expect(markup).toContain('Nothing matches the current search and filters. Clearing them restores the full list.');
    expect(count(markup, 'Clear filters')).toBe(2);
    expect(markup).not.toContain('No open tasks');
  });

  test('the Due filter lives in the address and is the server’s answer', () => {
    const { markup } = list('/tasks?due=overdue', meDita, [[qk.tasks.list(LIST(WorkTaskView.MyTasks, { Due: WorkTaskDueFilter.Overdue })), view1DitaOverdue]]);
    expect(markup).toMatch(/Due<\/span><span[^>]*>Overdue<\/span>/);
    expect(markup).toContain('Reassign the parking fine to the driver');
    expect(markup).not.toContain('Order two spare key fobs');
    expect(markup).toContain('Clear filters');
    expect(markup).toContain('>1 task<');
  });
});

/* a task's page ----------------------------------------------------------------------------------- */

const page = (task: typeof taskPrepareDita, me: typeof meDita, at = `/tasks/${task.id}`) =>
  renderAs(h(TaskRecord), { at, route: '/tasks/:taskId', me, data: [[qk.tasks.detail(task.id), task]] });

describe('a task’s page (F12-3)', () => {
  test('as its creator: the hero, the three actions, the description and the steps with their actions', () => {
    const { markup } = page(taskPrepareDita, meDita, `/tasks/${taskPrepareDita.id}`);
    expect(header.last?.crumbs).toEqual([{ label: 'Tasks', to: '/tasks' }, { label: 'Prepare 204 JLM for a rental' }]);
    expect(header.last?.description).toBe('Times in Tallinn time.');
    expect(markup).toMatch(/data-tone="info" data-size="hero">.*Open<\/span>/);
    expect(markup).toMatch(/Created by<\/span><span[^>]*><span[^>]*>Dita Smite<\/span><span[^>]*>22 Sep, 13:22<\/span>/);
    expect(markup).toMatch(/Due<\/span><span[^>]*><span[^>]*><span>27 Sep, 16:08<\/span><\/span><\/span>/);
    expect(markup).toContain(`href="/vehicles/${taskPrepareDita.aboutRecordId}"`);
    expect(markup).toContain('>Vehicle · 204 JLM</a>');
    expect(markup).toContain('1 of 4 steps done');
    expect(markup).toMatch(/>.*edit<\/span>Edit<\/button>.*task_alt<\/span>Finish task<\/button>.*block<\/span>Cancel task<\/button>/);
    expect(markup).toContain('data-stack="true"');
    expect(markup).toContain('Adding it to Bolt comes first. The car wash can happen any time before the handover.');
    expect(markup).toContain('In the order you set. Steps do not wait for each other.');

    const bolt = around(markup, 'Add to Bolt', 'li');
    expect(bolt).toContain('Dita Smite (you)');
    expect(bolt).toContain('No due date');
    expect(bolt).toContain('Done · Dita Smite, 23 Sep, 15:28');
    expect(bolt).toContain('>Undo</span>');
    expect(bolt).toContain('data-done="true"');
    const licence = around(markup, 'Apply for the taxi licence', 'li');
    expect(licence).toMatch(/<span>Signe Priede<\/span><span>Due 26 Sep, 20:08<\/span>/);
    expect(licence).toMatch(/data-tone="mute"[^>]*>.*Open<\/span>/);
    expect(licence).toContain('>Mark done</span>');
    expect(count(markup, '>Mark done</span>')).toBe(3);
    expect(count(markup, '>Undo</span>')).toBe(1);

    expect(markup).toMatch(/Created<\/span><span[^>]*>22 Sep, 13:22<\/span><span[^>]*>by Dita Smite<\/span>/);
    expect(markup).toMatch(/Last updated<\/span><span[^>]*>23 Sep, 15:28<\/span><span[^>]*>by Dita Smite<\/span>/);
  });

  test('as a step’s person: no task actions, the creator’s order, and Mark done on the reader’s step only', () => {
    const { markup } = page(taskPrepareToms, meToms, `/tasks/${taskPrepareToms.id}?tab=involving`);
    expect(header.last?.crumbs?.[0]).toEqual({ label: 'Tasks', to: '/tasks?tab=involving' });
    expect(markup).not.toContain('>Edit</button>');
    expect(markup).not.toContain('Finish task');
    expect(markup).not.toContain('Cancel task');
    expect(markup).toContain('In the order the creator set. Steps do not wait for each other.');
    expect(markup).toContain('Toms Rudzitis (you)');
    expect(markup).not.toContain('Dita Smite (you)');
    const carWash = around(markup, '>Car wash<', 'li');
    expect(carWash).toContain('>Mark done</span>');
    expect(count(markup, '>Mark done</span>')).toBe(1);
    expect(markup).not.toContain('>Undo</span>');
  });

  test('after the reader’s own mark the step reads done by them, with Undo', () => {
    const { markup } = page(markCarWashToms, meToms);
    const carWash = around(markup, '>Car wash<', 'li');
    expect(carWash).toMatch(/Done · Toms Rudzitis, 24 Sep, \d\d:\d\d/);
    expect(carWash).toContain('>Undo</span>');
  });

  test('overdue and due today are in the hero, in their tones', () => {
    const fine = page(taskFineDita, meDita).markup;
    expect(fine).toMatch(/Due<\/span><span[^>]*><span[^>]*><span class="[^"]*_toneBad_[^"]*">23 Sep, 19:08<\/span><\/span><span[^>]*>Overdue<\/span>/);
    const agreement = page(taskAgreementSigne, meSigne).markup;
    expect(agreement).toMatch(/<span class="[^"]*_toneWarn_[^"]*">24 Sep, 21:08<\/span><\/span><span[^>]*>Due today<\/span>/);
    expect(agreement).toContain('>Customer · Martins Ozols</a>');
  });

  test('a task without steps is its creator’s alone; about nothing, it says Nothing', () => {
    const { markup } = page(taskFobsDita, meDita);
    expect(markup).toContain('No steps');
    expect(markup).toContain('This task is yours alone.');
    expect(markup).toMatch(/About<\/span><span[^>]*><span[^>]*><span class="_dim_[^"]*">Nothing<\/span>/);
    expect(markup).toMatch(/Due<\/span><span[^>]*><span[^>]*><span class="_dim_[^"]*">No due date<\/span>/);
    expect(markup).not.toContain('>Description<');
  });

  test('a finished task: its banner in the ok tone, read-only', () => {
    const { markup } = page(taskRegisterDita, meDita);
    expect(markup).toMatch(/data-tone="ok"><span[^>]*>task_alt<\/span><div><p[^>]*>Finished by Dita Smite on 22 Sep, 20:10<\/p><\/div>/);
    expect(markup).toMatch(/data-tone="ok" data-size="hero">.*Finished<\/span>/);
    expect(markup).not.toContain('Finish task');
    expect(markup).not.toContain('>Mark done<');
    expect(markup).not.toContain('>Undo<');
    expect(markup).toContain('Done · Signe Priede, 21 Sep, 15:56');
  });

  test('a cancelled task: its banner in the mute tone with the reason, or none given', () => {
    const { markup } = page(taskVentspilsSigne, meSigne);
    expect(markup).toMatch(/data-tone="mute"><span[^>]*>block<\/span><div><p[^>]*>Cancelled by Signe Priede on 21 Sep, 14:23<\/p><p[^>]*>The customer changed their mind\.<\/p>/);
    const blank = page(cancelBlank, meDita).markup;
    expect(cancelBlank.cancellationNote).toBeNull();
    expect(blank).toMatch(/Cancelled by Dita Smite on 24 Sep, \d\d:\d\d<\/p><p[^>]*>No reason given\.<\/p>/);
  });

  test('a record deleted since: "deleted record", and no link', () => {
    const { markup } = page(taskAboutDeleted, meDita);
    expect(taskAboutDeleted.aboutRecordExists).toBe(false);
    expect(markup).toContain('Vehicle · deleted record');
    expect(markup).not.toContain('href="/vehicles/');
  });

  test('without the record’s own read permission the record is named, not linked', () => {
    const { markup } = page(taskPrepareDita, { ...meDita, permissions: meDita.permissions.filter((p) => p !== 'Vehicles.Read') });
    expect(markup).toContain('Vehicle · 204 JLM');
    expect(markup).not.toContain('href="/vehicles/');
  });

  test('a task not shared with the reader, and one that does not exist', () => {
    const shared = renderAs(h(TaskRecord), {
      at: `/tasks/${taskFobsDita.id}`, route: '/tasks/:taskId', me: meKarlis,
      errors: [[qk.tasks.detail(taskFobsDita.id), notSharedKarlis]],
    }).markup;
    expect(notSharedKarlis.code).toBe('tasks.not_shared');
    expect(shared).toContain('This task is not shared with you');
    expect(shared).toContain('A task is seen by its creator and by the people named on its steps.');
    expect(header.last?.title).toBe('Task');
    expect(shared).not.toContain('Try again');

    const missing = renderAs(h(TaskRecord), {
      at: '/tasks/gone', route: '/tasks/:taskId', me: meDita,
      errors: [[qk.tasks.detail('gone'), notFoundDita]],
    }).markup;
    expect(missing).toContain('That task is not available');
    expect(missing).toContain('This task no longer exists.');
    expect(missing).not.toContain('Try again');
    expect(missing).not.toContain('not shared');
  });
});

/* the Overview and the count ---------------------------------------------------------------------- */

const overview = (me: typeof meDita, data: Array<[readonly unknown[], unknown]>) =>
  renderAs(h(Overview), { at: '/overview', route: '/overview', me, data: [[qk.overview, {}], ...data] });

describe('the Overview’s Open tasks (F12-6)', () => {
  test('the tile reads the to-do count and opens Tasks; the card lists the to-do items, earliest due first', () => {
    const { markup } = overview(meDita, [[qk.tasks.counts, countsDita], [qk.tasks.toDo(TO_DO), todoDita]]);
    expect(markup).toMatch(/href="\/tasks"[^>]*>.*Open tasks<\/span><\/span><span[^>]*><span[^>]*>4<\/span><span[^>]*>to do<\/span>/);
    const card = markup.slice(markup.indexOf('<h2 class="_title_', markup.indexOf('Needs attention') + 1));
    expect(card).toContain('Your open steps and your own tasks, earliest due first. Times in Tallinn time.');
    expect(card).toContain('>4 to do<');
    const titles = todoDita.items.map((item) => item.title);
    const at = titles.map((title) => card.indexOf(`>${title}<`));
    expect(at.every((index) => index > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);

    const fine = around(card, '>Reassign the parking fine to the driver<', 'a');
    expect(fine).toContain(`href="/tasks/${todoDita.items[0]!.taskId}"`);
    expect(fine).toMatch(/data-tone="bad"><span[^>]*>task_alt<\/span>/);
    expect(fine).toContain('Rental assignment · 552 KLM · Nordwind Logistics');
    expect(fine).toMatch(/data-tone="bad">Overdue · 23 Sep</);
    expect(fine).toContain('chevron_right');

    const invoice = around(card, '>Pick up the repair invoice<', 'a');
    expect(invoice).toMatch(/<span[^>]*>checklist<\/span>/);
    expect(invoice).toContain('Vehicle · 204 JLM · from Signe Priede');
    expect(invoice).toContain('4 Oct, 20:08');

    const fobs = around(card, '>Order two spare key fobs<', 'a');
    expect(fobs).toContain('No due date');
    expect(fobs).not.toContain('_rowSub_');
    // Insurance cases stays exactly as it was.
    expect(markup).toContain('Unresolved insurance cases');
    expect(markup).toContain('Sample · module under development');
  });

  test('the count follows a mark: Toms’s card before and after he marked Car wash', () => {
    // Follow-up 13: round 11's answers, where Toms's My tasks holds the three tasks with his steps.
    atRound11();
    const before = overview(meToms, [[qk.tasks.counts, r11CountsToms], [qk.tasks.toDo(TO_DO), r11ToDoToms]]).markup;
    // The tile is the to-do count, not the size of a view: My tasks holds three, two are to do.
    expect(r11CountsToms.myTasks).toBe(3);
    expect(before).toMatch(/Open tasks<\/span><\/span><span[^>]*><span[^>]*>2<\/span><span[^>]*>to do<\/span>/);
    expect(before).toContain('>2 to do<');
    expect(before).toContain('>Car wash<');
    expect(before).toContain('Vehicle · 444 WKS · from Dita Smite');
    const after = overview(meToms, [[qk.tasks.counts, r11CountsTomsAfterMark], [qk.tasks.toDo(TO_DO), r11ToDoTomsAfterMark]]).markup;
    expect(after).toMatch(/Open tasks<\/span><\/span><span[^>]*><span[^>]*>1<\/span>/);
    expect(after).toContain('>1 to do<');
    expect(after).not.toContain('>Car wash<');
  });

  test('without Tasks.Use neither the tile nor the card shows, and the task queries are not enabled', () => {
    const { markup, client } = overview(meAdmin, []);
    expect(meAdmin.permissions).not.toContain('Tasks.Use');
    expect(markup).not.toContain('Open tasks');
    expect(markup).toContain('Unresolved insurance cases');
    const tasks = client.getQueryCache().findAll({ queryKey: qk.tasks.all });
    expect(tasks.length).toBeGreaterThan(0);
    for (const query of tasks) expect(enabled(query), JSON.stringify(query.queryKey)).toBe(false);
    expect(tasks.every((query) => query.state.data === undefined)).toBe(true);
  });

  test('with Tasks.Use the same queries are enabled', () => {
    const { client } = overview(meDita, [[qk.tasks.counts, countsDita], [qk.tasks.toDo(TO_DO), todoDita]]);
    for (const query of client.getQueryCache().findAll({ queryKey: qk.tasks.all })) {
      expect(enabled(query), JSON.stringify(query.queryKey)).toBe(true);
    }
  });
});

describe('the count on Tasks in the sidebar (F12-6)', () => {
  const shell = (me: typeof meDita, data: Array<[readonly unknown[], unknown]>) =>
    renderAs(h(AppShell, { companyName: 'RW-Rent Demo' }), { at: '/overview', route: '/overview', me, data });

  test('the entry carries the reader’s to-do count, and follows a mark', () => {
    const { markup } = shell(meDita, [[qk.tasks.counts, countsDita]]);
    expect(markup).toContain('data-mode="expanded"');
    const entry = around(markup, 'aria-label="Tasks"', 'a');
    expect(entry).toContain('href="/tasks"');
    expect(entry).toMatch(/checklist<\/span><span[^>]*>Tasks<\/span><span class="_badge_[^"]*">4<\/span>/);
    const after = shell(meToms, [[qk.tasks.counts, countsTomsAfterMark]]).markup;
    expect(around(after, 'aria-label="Tasks"', 'a')).toMatch(/_badge_[^"]*">1<\/span>/);
  });

  test('without Tasks.Use there is no entry and no count is asked for; Insurance cases stays', () => {
    const { markup, client } = shell(meAdmin, []);
    expect(markup).not.toContain('aria-label="Tasks"');
    expect(markup).toContain('aria-label="Insurance cases"');
    const counts = client.getQueryCache().find({ queryKey: qk.tasks.counts });
    expect(counts && enabled(counts)).toBe(false);
  });
});

describe('every task write refreshes what it changes (F12-7)', () => {
  test('one prefix: the task, the views, the counts, the to-do list and the people are all invalidated together', async () => {
    const client = new QueryClient();
    const keys = [
      qk.tasks.detail(taskPrepareDita.id), qk.tasks.list(LIST(WorkTaskView.MyTasks)), qk.tasks.counts,
      qk.tasks.toDo(TO_DO), qk.tasks.people,
    ];
    for (const key of keys) client.setQueryData(key, {});
    client.setQueryData(qk.vehicles.list({ PageSize: 100 }), {});
    await client.invalidateQueries({ queryKey: qk.tasks.all });
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated, JSON.stringify(key)).toBe(true);
    expect(client.getQueryState(qk.vehicles.list({ PageSize: 100 }))?.isInvalidated).toBe(false);
  });
});

describe('the tones win over a line’s own colour (read from the stylesheet)', () => {
  test('overdue and due today are the last rules of the Tasks stylesheet', () => {
    // A server render carries class names, not colours. The browser check found "Overdue" drawn in
    // the Due cell's grey: the cell's own colour came later in the file at the same specificity.
    const css = readFileSync(new URL('./tasks/Tasks.module.css', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const rules = css.split('}').map((rule) => rule.trim()).filter(Boolean);
    expect(rules.slice(-2).map((rule) => rule.split('{')[0]!.trim())).toEqual(['.toneBad', '.toneWarn']);
    for (const plain of ['.due', '.yourStepDue', '.cardDue']) expect(css).toContain(`${plain} {`);
  });
});

