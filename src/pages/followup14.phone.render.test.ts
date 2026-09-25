import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { stepDue } from '@/format';
import { Tasks } from './tasks/Tasks';
import { clearTaskRenders, count, renderAs } from './followup12.harness';
import { meDita, meToms } from './followup12.support';
import {
  R11_CAPTURED_AT, r11CountsDita, r11CountsToms, r11InvolvingToms, r11MyTasksDita, r11MyTasksToms,
  r11MyTasksTomsAfterDitaMark,
} from './followup13.support';
import { TASKS_CSS, declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 14 below 768 pixels, the iPhone 16 Pro at 402: a done step reads "✓ Done" on the line
 * under its title, in place of its due line, as on every other screen, while the buttons stay as
 * they were (F14-5); a task title's underline follows its words on every line (F14-6). A server
 * render always takes the desktop tier, so the phone tier is set here, as in Follow-up 12.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
  useNarrow: () => true,
  useRailMode: () => 'drawer' as const,
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R11_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

type Page = typeof r11MyTasksDita;

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

const cards = (me: typeof meDita, page: Page, counts = r11CountsDita, view: WorkTaskQuery['View'] = WorkTaskView.MyTasks) =>
  renderAs(h(Tasks), {
    at: view === WorkTaskView.InvolvingMe ? '/tasks?tab=involving' : '/tasks',
    route: '/tasks',
    me,
    data: [[qk.tasks.list(LIST(view)), page], [qk.tasks.counts, counts]],
  }).markup;

/**
 * One step box as drawn: its title, the line under it (its due, or Done), then its button if the
 * API offers one. The pattern is the order itself.
 */
const CARD_STEP = new RegExp(
  '<div class="_cardStep_[^"]*"><span class="_yourStepText_[^"]*"><span class="_yourStepTitle_[^"]*">([^<]*)</span>'
  + '<span class="_(yourStepDue|doneMark)_[^"]*">(.*?)</span></span>((?:<button.*?</button>)?)</div>',
  'g',
);

const boxes = (markup: string) => [...markup.matchAll(CARD_STEP)].map((match) => ({
  title: match[1]!, line: match[2] === 'doneMark' ? 'done' : 'due', lineMarkup: match[3]!, button: match[4]!,
}));

function expectEveryBox(markup: string, page: Page) {
  const want = page.items.flatMap((task) => task.yourSteps);
  const drawn = boxes(markup);
  expect(drawn.map((box) => box.title)).toEqual(want.map((step) => step.title));
  want.forEach((step, index) => {
    const box = drawn[index]!;
    expect(box.line, step.title).toBe(step.doneAtUtc ? 'done' : 'due');
    if (step.doneAtUtc) expect(box.lineMarkup, step.title).toMatch(/^<span[^>]*>check<\/span>Done$/);
    else expect(box.lineMarkup, step.title).toBe(stepDue(step, true).text);
    const action = step.doneAtUtc ? (step.canUndo ? 'Undo' : null) : (step.canMarkDone ? 'Mark done' : null);
    if (action) expect(box.button, step.title).toMatch(new RegExp(`^<button type="button" class="_stepButton_[^"]*" data-size="card"[^>]*>.*<span>${action}</span></button>$`));
    else expect(box.button, step.title).toBe('');
  });
}

const rules = readRules(TASKS_CSS);

describe('a done step on a phone card (F14-5)', () => {
  test('"✓ Done" is the line under the title, in place of the due line; then the full-width button', () => {
    const markup = cards(meDita, r11MyTasksDita);
    expect(markup).not.toContain('<table');
    expectEveryBox(markup, r11MyTasksDita);
    const [bolt, handover] = boxes(markup);
    expect([bolt!.title, bolt!.line]).toEqual(['Add to Bolt', 'done']);
    expect([handover!.title, handover!.line, handover!.lineMarkup]).toEqual(['Handover', 'due', 'Due 28 Sep, 10:54']);
    // The top-right corner the Done used to stand in is gone.
    expect(markup).not.toContain('_cardStepLine_');
    expect([...markup.matchAll(/_yourStepTitle_[^"]*">[^<]*<\/span><span class="_doneMark_/g)]).toHaveLength(count(markup, '_doneMark_'));
  });

  test('Toms: his steps to do, his own mark with Undo, and the creator’s mark with no button', () => {
    expectEveryBox(cards(meToms, r11MyTasksToms, r11CountsToms), r11MyTasksToms);
    expectEveryBox(cards(meToms, r11InvolvingToms, r11CountsToms, WorkTaskView.InvolvingMe), r11InvolvingToms);
    const after = cards(meToms, r11MyTasksTomsAfterDitaMark, r11CountsToms);
    expectEveryBox(after, r11MyTasksTomsAfterDitaMark);
    const tell = boxes(after).find((box) => box.title === 'Tell the driver the time')!;
    expect([tell.line, tell.button]).toEqual(['done', '']);
    expect(after).not.toContain('Overdue · 24 Sep');
  });

  test('the buttons do not change: 44px, the full width of the box', () => {
    expect(declared(rules, ".stepButton[data-size='card']")).toMatchObject({ 'min-height': '44px', padding: '0 14px' });
    expect(declared(rules, ".stepButton[data-size='card']").width).toBeUndefined();
    expect(declared(rules, '.cardStep')).toMatchObject({ display: 'flex', 'flex-direction': 'column' });
    expect(declared(rules, '.cardStep')['align-items']).toBeUndefined();
  });
});

describe('a task title’s underline on a phone card (F14-6)', () => {
  test('the title is a link inside a line of its own, so the underline runs under its words on every line', () => {
    const markup = cards(meDita, r11MyTasksDita);
    for (const task of r11MyTasksDita.items) {
      expect(markup, task.title).toMatch(new RegExp(`<span class="_cardTitleLine_[^"]*"><a class="_cardTitle_[^"]*" href="/tasks/${task.id}"[^>]*>${task.title}</a></span>`));
    }
    // The owner's two-line title is drawn the same way.
    expect(markup).toContain('>Handle the windscreen insurance case of 204 JLM</a></span>');
  });

  test('the underline belongs to the words: the link stays inline, and the line carries the size', () => {
    const title = declared(rules, '.cardTitle');
    expect(title['border-bottom']).toBe('1px solid var(--line-3)');
    // An inline link draws its underline under each line of words; a box would draw one under the box.
    expect(title.display).toBeUndefined();
    expect(title['max-width']).toBeUndefined();
    expect(title.width).toBeUndefined();
    expect(declared(rules, '.cardTitleLine')).toMatchObject({ 'font-size': '14px', 'overflow-wrap': 'anywhere' });
    expect(declared(rules, '.cardTitleLine').display).toBeUndefined();
    expect(declared(rules, '.cardTitle:hover')['border-bottom-color']).toBe('currentColor');
  });
});
