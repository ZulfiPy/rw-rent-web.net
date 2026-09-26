import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import type { PageHeaderModel } from '@/app/pageHeader';
import { LOCAL_TIME_NOTE } from '@/format';
import { TaskRecord } from './tasks/TaskRecord';
import { Tasks } from './tasks/Tasks';
import { clearTaskRenders, renderAs } from './followup12.harness';
import { meDita, meSigne, taskPrepareDita, view3Signe } from './followup12.support';
import { R11_CAPTURED_AT, r11CountsDita, r11InvolvingDita, r11MyTasksDita } from './followup13.support';
import { TASKS_CSS, declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 16: the Tasks list follows the other lists' layout. The time-zone note leaves the list, so
 * the tab strip stands alone in its row as on Delete records, while the task's own page keeps its note
 * (F16-1); on the phone the Tasks tab bar spans the list with each label on one line, and from 768 up
 * it stays as wide as its tabs, as the other pages' bars do (F16-2). The page header is the shell's,
 * drawn from a model the page declares in an effect, which a server render never runs; the model is
 * caught here as the page hands it over, as in Follow-up 12.
 */
const header = vi.hoisted(() => ({ last: null as PageHeaderModel | null }));
vi.mock('@/app/pageHeader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/pageHeader')>()),
  usePageHeader: (model: PageHeaderModel) => { header.last = model; },
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R11_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
  header.last = null;
});

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

const views = () => [
  renderAs(h(Tasks), { at: '/tasks', route: '/tasks', me: meDita, data: [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), r11MyTasksDita], [qk.tasks.counts, r11CountsDita]] }).markup,
  renderAs(h(Tasks), { at: '/tasks?tab=involving', route: '/tasks', me: meDita, data: [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), r11InvolvingDita], [qk.tasks.counts, r11CountsDita]] }).markup,
  renderAs(h(Tasks), { at: '/tasks?tab=finished', route: '/tasks', me: meSigne, data: [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Signe]] }).markup,
];

/** How many elements deep `index` sits inside the element that opens at `from` (1: a direct child). */
function depthAt(markup: string, from: number, index: number): number {
  let depth = 0;
  for (const tag of markup.slice(from, index).matchAll(/<(\/?)[a-z][^>]*?(\/?)>/g)) {
    if (tag[2]) continue;
    depth += tag[1] ? -1 : 1;
  }
  return depth;
}

const recordRules = readRules(new URL('../ui/record.module.css', import.meta.url));
const PHONE = '(max-width: 767px)';

describe('the time-zone note leaves the Tasks list (F16-1)', () => {
  test('no view of the list draws "Times in Tallinn time.", and the header says what it said', () => {
    expect(LOCAL_TIME_NOTE).toBe('Times in Tallinn time.');
    for (const markup of views()) {
      expect(markup).not.toContain(LOCAL_TIME_NOTE);
      expect(header.last?.description).toBe('Your tasks, and the steps others have given you. Only a task’s creator changes or finishes it.');
    }
    // The list's rule for the note and the row around the strip are gone.
    const rules = readRules(TASKS_CSS);
    expect(declared(rules, '.zone')).toEqual({});
    expect(declared(rules, '.tabsRow')).toEqual({});
  });

  test('the tab strip stands alone in its row: a direct child of the page, as on Delete records', () => {
    for (const markup of views()) {
      const page = markup.indexOf('<div class="_page_');
      const strip = markup.indexOf('role="tablist"');
      expect(page).toBeGreaterThan(-1);
      expect(depthAt(markup, page, strip)).toBe(1);
      // Nothing but the list follows it in the row: the next element is the list's panel.
      expect(markup.slice(strip)).toMatch(/^role="tablist"[^>]*>(?:<button[^>]*>.*?<\/button>)+<\/div><section class="_panel_/);
    }
    // In the source of both lists, the strip and the list's panel are siblings in the page.
    for (const file of ['./admin/DeleteRecords.tsx', './tasks/Tasks.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      const strip = /\n( *)<RecordTabs\b/.exec(source)![1];
      const panel = /\n( *)<section className=\{list\.panel\}>/.exec(source)![1];
      expect(strip, file).toBe(panel);
    }
  });

  test('the task’s own page keeps its note', () => {
    renderAs(h(TaskRecord), { at: `/tasks/${taskPrepareDita.id}`, route: '/tasks/:taskId', me: meDita, data: [[qk.tasks.detail(taskPrepareDita.id), taskPrepareDita]] });
    expect(header.last?.description).toBe(LOCAL_TIME_NOTE);
  });
});

describe('on the phone the Tasks tab bar spans the list (F16-2)', () => {
  test('below 768 the compact strip is the list’s width; its tabs share what is left, each label on one line', () => {
    expect(declared(recordRules, ".tabs[data-compact='true']", PHONE)).toEqual({ width: '100%' });
    expect(declared(recordRules, ".tabs[data-compact='true'] .tab", PHONE)).toEqual({
      flex: '1 0 auto', 'justify-content': 'center', 'white-space': 'nowrap',
    });
    // Grow, never shrink: a tab is never narrower than its label and count, so neither breaks.
    expect(declared(recordRules, ".tabs[data-compact='true'] .tab", PHONE).flex!.split(' ')[1]).toBe('0');
  });

  test('from 768 up nothing changes: every strip, Tasks’ included, is as wide as its tabs', () => {
    expect(declared(recordRules, '.tabs')).toMatchObject({ width: 'max-content', 'max-width': '100%' });
    const compact = recordRules.filter((rule) => rule.selector.includes("[data-compact='true']"));
    for (const rule of compact) {
      expect(['(max-width: 639px)', PHONE], rule.selector).toContain(rule.media);
    }
  });

  test('only Tasks draws the compact strip, so the other three pages’ bars do not change', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx$/.test(name) && !/\.test\./.test(name)) files.push(path);
      }
    };
    walk(new URL('..', import.meta.url).pathname);
    const users = files.flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/<RecordTabs\b([^>]*?)\/?>/gs)].map((use) => ({ path, props: use[1]! })));
    expect(users.map((use) => use.path.split('/src/')[1]).sort()).toEqual([
      'pages/account/Profile.tsx', 'pages/admin/DeleteRecords.tsx', 'pages/fleet/AssignmentRecord.tsx', 'pages/tasks/Tasks.tsx',
    ]);
    expect(users.filter((use) => /\bcompact\b/.test(use.props)).map((use) => use.path.split('/src/')[1])).toEqual(['pages/tasks/Tasks.tsx']);
    for (const markup of views()) expect(markup).toContain('role="tablist" data-fade="none" data-compact="true"');
  });
});
