import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskListItemResponse, type WorkTaskQuery } from '@/api/dto';
import { dueInfo, formatLocal, stepDue } from '@/format';
import { Tasks } from './tasks/Tasks';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import { meDita, meSigne, meToms, view3Signe } from './followup12.support';
import {
  R11_CAPTURED_AT, r11CountsDita, r11CountsSigne, r11CountsToms, r11InvolvingDita, r11InvolvingToms, r11MyTasksDita,
  r11MyTasksSigne, r11MyTasksToms, r11MyTasksTomsAfterDitaMark,
} from './followup13.support';
import { TABLE_CSS, TABLET, TASKS_CSS, declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 14, the list from 768 pixels up: how a step reads in Your step on the desktop and the
 * sideways iPad (F14-1, F14-4) and in the folded band of the upright iPad (F14-3), and the due date
 * that is never cut (F14-2). The markup is rendered from round 11's answers on the scratch stack
 * (`followup13.support.ts`) with the clock at the moment they were given; what each screen size
 * does with it is read from the stylesheet, since a server render has no layout.
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R11_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

type Page = typeof r11MyTasksDita;
type Me = typeof meDita;

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

const render = (me: Me, view: WorkTaskQuery['View'], page: Page, counts = r11CountsDita) =>
  renderAs(h(Tasks), {
    at: view === WorkTaskView.InvolvingMe ? '/tasks?tab=involving' : '/tasks',
    route: '/tasks',
    me,
    data: [[qk.tasks.list(LIST(view)), page], [qk.tasks.counts, counts]],
  }).markup;

/**
 * One step of Your step as drawn: its title, then the line under it (its due, or Done), then the
 * button's place and what it holds. The pattern is the order itself, so a step drawn in another
 * order is not found at all.
 */
const STEP = new RegExp(
  '<span class="_yourStep_[^"]*"><span class="_yourStepText_[^"]*"><span class="_yourStepTitle_[^"]*">([^<]*)</span>'
  + '<span class="_(yourStepDue|doneMark)_[^"]*">(.*?)</span></span>'
  + '<span class="_yourStepAction_[^"]*">((?:<button.*?</button>)?)</span></span>',
  'g',
);

interface DrawnStep { title: string; line: 'due' | 'done'; lineMarkup: string; button: string }

const drawnSteps = (row: string): DrawnStep[] => [...row.matchAll(STEP)].map((match) => ({
  title: match[1]!,
  line: match[2] === 'doneMark' ? 'done' : 'due',
  lineMarkup: match[3]!,
  button: match[4]!,
}));

/** What the API says a row's step should show: its line, and the action its flags allow. */
const expected = (task: WorkTaskListItemResponse) => task.yourSteps.map((step) => ({
  title: step.title,
  line: step.doneAtUtc ? 'done' : 'due',
  action: step.doneAtUtc ? (step.canUndo ? 'Undo' : null) : (step.canMarkDone ? 'Mark done' : null),
  due: stepDue(step, true).text,
}));

const actionOf = (button: string) => (button ? /<span>(Mark done|Undo)<\/span><\/button>$/.exec(button)?.[1] ?? 'unknown' : null);

/** Every row of a page against the API's answer: the order of each step's pieces and its action. */
function expectEveryStep(markup: string, page: Page) {
  for (const task of page.items) {
    const row = around(markup, `>${task.title}</a>`, 'tr');
    const drawn = drawnSteps(row);
    expect(drawn.map((step) => step.title), task.title).toEqual(task.yourSteps.map((step) => step.title));
    expect(count(row, '_yourStepAction_'), task.title).toBe(task.yourSteps.length);
    expected(task).forEach((want, index) => {
      const got = drawn[index]!;
      expect(got.line, want.title).toBe(want.line);
      if (want.line === 'due') expect(got.lineMarkup, want.title).toBe(want.due);
      else expect(got.lineMarkup, want.title).toMatch(/^<span[^>]*>check<\/span>Done$/);
      expect(actionOf(got.button), want.title).toBe(want.action);
      if (got.button) expect(got.button, want.title).toContain('data-size="cell"');
    });
  }
}

const rules = readRules(TASKS_CSS);

describe('Your step from 1024 up: the desktop and the sideways iPad (F14-1, F14-4)', () => {
  test('every step is its title, the line under it, then the button’s place, in My tasks and Involving me alike', () => {
    expectEveryStep(render(meDita, WorkTaskView.MyTasks, r11MyTasksDita), r11MyTasksDita);
    expectEveryStep(render(meSigne, WorkTaskView.MyTasks, r11MyTasksSigne, r11CountsSigne), r11MyTasksSigne);
    expectEveryStep(render(meToms, WorkTaskView.MyTasks, r11MyTasksToms, r11CountsToms), r11MyTasksToms);
    expectEveryStep(render(meToms, WorkTaskView.InvolvingMe, r11InvolvingToms, r11CountsToms), r11InvolvingToms);
    expectEveryStep(render(meDita, WorkTaskView.InvolvingMe, r11InvolvingDita), r11InvolvingDita);
  });

  test('"✓ Done" is the line under a done step’s title, in place of its due line; a step to do keeps its due', () => {
    const markup = render(meToms, WorkTaskView.MyTasks, r11MyTasksTomsAfterDitaMark, r11CountsToms);
    expectEveryStep(markup, r11MyTasksTomsAfterDitaMark);
    // Car wash and Tell the driver the time both had a due date: once done, Done stands in its place.
    const [carWash] = drawnSteps(around(markup, '>Prepare 204 JLM for a rental</a>', 'tr'));
    expect(carWash!.line).toBe('done');
    expect(around(markup, '>Prepare 204 JLM for a rental</a>', 'tr')).not.toContain('Due 26 Sep');
    const service = around(markup, '>Book a service for 444 WKS and tell the driver</a>', 'tr');
    expect(drawnSteps(service)[0]!.line).toBe('done');
    expect(service).not.toContain('Overdue');
    // Nothing of Done stands beside the button any more: every Done is the line right under a title.
    expect(count(markup, '_doneMark_')).toBe(3);
    expect([...markup.matchAll(/_yourStepTitle_[^"]*">[^<]*<\/span><span class="_doneMark_/g)]).toHaveLength(3);
    expect(markup).not.toContain('_yourStepLine_');

    const dita = around(render(meDita, WorkTaskView.MyTasks, r11MyTasksDita), '>Prepare 204 JLM for a rental</a>', 'tr');
    expect(drawnSteps(dita).map((step) => [step.title, step.line])).toEqual([['Add to Bolt', 'done'], ['Handover', 'due']]);
    expect(dita).not.toContain('No due date');
    expect(dita).toMatch(/Handover<\/span><span class="_yourStepDue_[^"]*">Due 28 Sep, 10:54<\/span>/);
  });

  test('where the API offers no action, the button’s place is still drawn, empty', () => {
    // Dita marked Tell the driver the time: Toms may neither mark nor undo it.
    const markup = render(meToms, WorkTaskView.MyTasks, r11MyTasksTomsAfterDitaMark, r11CountsToms);
    const [tell] = drawnSteps(around(markup, '>Book a service for 444 WKS and tell the driver</a>', 'tr'));
    expect(tell!.button).toBe('');
    expect(markup).toMatch(/_doneMark_[^"]*">.*?Done<\/span><\/span><span class="_yourStepAction_[^"]*"><\/span><\/span>/);

    const unoffered = { ...r11MyTasksDita, items: r11MyTasksDita.items.map((task) => ({
      ...task, yourSteps: task.yourSteps.map((step) => ({ ...step, canMarkDone: false, canUndo: false })),
    })) };
    const none = render(meDita, WorkTaskView.MyTasks, unoffered);
    const steps = unoffered.items.reduce((sum, task) => sum + task.yourSteps.length, 0);
    expect(count(none, '_yourStepAction_')).toBe(steps);
    expect(count(none, '"></span></span>')).toBeGreaterThanOrEqual(steps);
    expect(none).not.toContain('data-size="cell"');
    expectEveryStep(none, unoffered);
  });

  test('the button’s place is one column of one width at the right, level with the title’s first line', () => {
    const step = declared(rules, '.yourStep');
    expect(step.display).toBe('grid');
    expect(step['grid-template-columns']).toBe('minmax(0, 1fr) var(--your-step-button)');
    expect(step['--your-step-button']).toBe('104px');
    // A fixed gap before the button; the title takes the rest of the width.
    expect(step['column-gap']).toBe('12px');
    expect(step['align-items']).toBe('start');
    expect(declared(rules, '.yourStepAction')).toMatchObject({ 'grid-column': '2', 'grid-row': '1' });
    expect(declared(rules, '.yourStep > .yourStepText')['grid-column']).toBe('1');
    // Mark done and Undo take the place's width, not their label's.
    expect(declared(rules, ".stepButton[data-size='cell']")).toMatchObject({ width: '100%', height: '30px' });
    for (const rule of rules.filter((r) => r.selector.startsWith('.stepButton'))) {
      if (rule.selector !== ".stepButton[data-size='cell']") expect(rule.declarations.width, rule.selector).toBeUndefined();
    }
    // Level: the text starts half the difference between the button and the title's line lower.
    const button = parseFloat(declared(rules, ".stepButton[data-size='cell']").height!);
    const line = parseFloat(declared(rules, '.yourStepTitle')['line-height']!);
    const lead = parseFloat(declared(rules, '.yourStep > .yourStepText')['padding-top']!);
    expect(lead).toBe((button - line) / 2);
    // A refused mark's sentence takes the step's whole width under it.
    expect(declared(rules, '.yourStep > .stepRefusal')['grid-column']).toBe('1 / -1');
  });

  test('the sideways iPad is the desktop: nothing of the list changes between 1024 and 1279', () => {
    const queries = new Set(rules.filter((rule) => rule.media).map((rule) => rule.media));
    expect([...queries].sort()).toEqual(['(max-width: 1023px)', '(max-width: 639px)']);
    // The 639 query is the task page's panel button, not the list.
    expect(rules.filter((rule) => rule.media === '(max-width: 639px)').map((rule) => rule.selector)).toEqual([".stepButton[data-size='panel']"]);
    const markup = render(meDita, WorkTaskView.MyTasks, r11MyTasksDita);
    expect(markup).not.toMatch(/_tightWide_|_foldWide_|_showWide_/);
  });
});

describe('Your step in the folded band: the upright iPad (F14-3)', () => {
  test('every step reads title, its line, then its button under them, at one width, lined up on the left', () => {
    expect(declared(rules, '.yourStep', TABLET)['grid-template-columns']).toBe('minmax(0, 1fr)');
    const place = declared(rules, '.yourStepAction', TABLET);
    expect(place).toMatchObject({ 'grid-column': '1', 'grid-row': '2', width: 'var(--your-step-button)' });
    expect(place['justify-self'] ?? 'start').toBe('start');
    expect(declared(rules, '.yourStep > .yourStepText', TABLET)['padding-top']).toBe('0');
    // No rule lets a button stand beside a short title and drop under a long one any more.
    for (const rule of rules.filter((r) => /yourStep|stepButton/.test(r.selector))) {
      expect(rule.declarations['flex-wrap'], rule.selector).toBeUndefined();
    }
  });

  test('the same space between one step and the next: a step without an action ends at its text', () => {
    expect(declared(rules, '.yourSteps', TABLET).gap).toBe('12px');
    expect(declared(rules, '.yourStepAction:empty', TABLET).display).toBe('none');
    // The due line and Done are one line of the same height, so a done step is as tall as one to do.
    expect(declared(rules, '.yourStepDue')['line-height']).toBe(declared(rules, '.doneMark')['line-height']);
    expect(declared(rules, '.doneMark')['font-size']).toBe(declared(rules, '.yourStepDue')['font-size']);
  });
});

describe('a due date is never cut (F14-2)', () => {
  /** The Due cell's pieces as drawn, each kept whole. */
  const duePieces = (row: string) => {
    const cell = /<span class="_due_[^"]*">(.*?)<\/span><\/td>/.exec(row)?.[1];
    return cell ? [...cell.matchAll(/<span class="_keep_[^"]*">([^<]*)<\/span>/g)].map((match) => match[1]!) : null;
  };

  test('the Due cell breaks only after "·" or ",": "Overdue ·" over "24 Sep", never inside a date', () => {
    const pages: Array<[Me, Page, typeof r11CountsDita]> = [
      [meDita, r11MyTasksDita, r11CountsDita], [meSigne, r11MyTasksSigne, r11CountsSigne], [meToms, r11MyTasksToms, r11CountsToms],
    ];
    const seen: string[][] = [];
    for (const [me, page, counts] of pages) {
      const markup = render(me, WorkTaskView.MyTasks, page, counts);
      for (const task of page.items.filter((item) => item.dueAtUtc)) {
        const row = around(markup, `>${task.title}</a>`, 'tr');
        const pieces = duePieces(row)!;
        expect(pieces.join(' '), task.title).toBe(dueInfo(task.dueAtUtc).text);
        pieces.slice(0, -1).forEach((piece) => expect(piece).toMatch(/[·,]$/));
        // A real space between the pieces is where the second line may begin.
        expect(row).toMatch(/<\/span> <span class="_keep_/);
        seen.push(pieces);
      }
    }
    expect(seen).toEqual(expect.arrayContaining([['Overdue ·', '24 Sep'], ['Due today ·', '15:54'], ['28 Sep,', '10:54'], ['05 Oct,', '14:54']]));
  });

  test('no due line is held on one line: it wraps rather than being cut, in any view and at any width', () => {
    for (const selector of ['.due', '.yourStepDue', '.cardDue']) {
      for (const rule of rules.filter((r) => r.selector === selector)) {
        expect(rule.declarations['white-space'], `${selector} ${rule.media ?? ''}`).toBeUndefined();
        expect(rule.declarations['text-overflow'], selector).toBeUndefined();
      }
    }
    expect(declared(rules, '.keep')['white-space']).toBe('nowrap');
    // The owner's case: the Due column is still 121px in the folded band; the date takes two lines there.
    expect(declared(rules, '.cDue', TABLET).width).toBe('121px');
  });

  test('Finished: the time a task was closed wraps under its chip rather than being cut', () => {
    const markup = renderAs(h(Tasks), {
      at: '/tasks?tab=finished', route: '/tasks', me: meSigne, data: [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Signe]],
    }).markup;
    for (const task of view3Signe.items) {
      expect(around(markup, `>${task.title}</a>`, 'tr')).toMatch(new RegExp(`<span class="_sub_[^"]*">${formatLocal(task.closedAtUtc)}</span>`));
    }
    const sub = declared(readRules(TABLE_CSS), '.sub');
    expect(sub['white-space']).toBeUndefined();
    expect(sub['text-overflow']).toBeUndefined();
  });
});
