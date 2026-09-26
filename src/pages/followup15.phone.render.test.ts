import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { Vehicles } from './fleet/Vehicles';
import { Tasks } from './tasks/Tasks';
import { clearTaskRenders, count, renderAs } from './followup12.harness';
import { meDita, meSigne, meToms, pickVehicles, view3Signe } from './followup12.support';
import { P15_CAPTURED_AT, p15CountsDita, p15CountsToms, p15MyTasksDita, p15MyTasksToms } from './followup15.support';
import { TASKS_CSS, declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 15 below 768 pixels (F15-2): a task's card is the other lists' card
 * (`src/ui/cards.module.css`), as the Vehicles and Drivers cards are: the head with the title in bold and
 * no line under it, what the task is about and who gave it, a Finished card's chip where their status
 * chips stand; the facts in two columns, Steps with its bar on the left and Due flush right. The reader's
 * step boxes stay as they were. A server render always takes the desktop tier, so the phone tier is set
 * here, as in Follow-up 12.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
  useNarrow: () => true,
  useRailMode: () => 'drawer' as const,
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(P15_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

const taskCards = (me: typeof meDita, page: typeof p15MyTasksDita, counts: typeof p15CountsDita) =>
  renderAs(h(Tasks), { at: '/tasks', route: '/tasks', me, data: [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), page], [qk.tasks.counts, counts]] }).markup;

/** Each card of a list, from its opening to the next one's. */
const cardsOf = (markup: string) => markup.split('<div class="_card_').slice(1).map((piece) => `<div class="_card_${piece}`);

/** A card's skeleton: the classes of the shared card vocabulary it is drawn with, in order. */
const SHARED = ['card', 'head', 'heading', 'title', 'sub', 'facts', 'fact', 'factLabel', 'factValue', 'cardFactEnd'];
const skeleton = (card: string) =>
  [...card.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1]!.split(' '))
    .map((name) => /^_([A-Za-z]+)_/.exec(name)?.[1]).filter((name): name is string => !!name && SHARED.includes(name));

const rules = readRules(TASKS_CSS);

describe('a task card is the other lists’ card (F15-2)', () => {
  test('every card: the shared card, its head with the bold title and no line, its sub lines', () => {
    for (const [me, page, counts] of [[meDita, p15MyTasksDita, p15CountsDita], [meToms, p15MyTasksToms, p15CountsToms]] as const) {
      const markup = taskCards(me, page, counts);
      const drawn = cardsOf(markup.slice(0, markup.indexOf('_range_')));
      expect(drawn).toHaveLength(page.items.length);
      page.items.forEach((task, index) => {
        const card = drawn[index]!;
        // The whole card opens the task, as before; the shared card's hover says so.
        expect(card, task.title).toMatch(/^<div class="_card_[^"]* _cardLink_[^"]* _cardOpens_[^"]*">/);
        expect(card, task.title).toMatch(new RegExp(`^<div[^>]*><div class="_head_[^"]*"><span class="_heading_[^"]*"><a class="_title_[^"]* _cardTitle_[^"]*" href="/tasks/${task.id}"[^>]*>${task.title}</a>`));
        if (task.aboutKind) expect(card, task.title).toMatch(/<\/a><span class="_sub_[^"]*">[^<]+ · /);
        expect(card).not.toMatch(/_cardHead_|_cardHeading_|_cardSub_|_cardFact_|_cardValue_|_cardDue_|_cardTitleLine_/);
      });
    }
  });

  test('Steps with its bar on the left, Due flush right with its label and value, in the facts’ two columns', () => {
    const markup = taskCards(meDita, p15MyTasksDita, p15CountsDita);
    for (const card of cardsOf(markup.slice(0, markup.indexOf('_range_')))) {
      expect(card).toMatch(/<div class="_facts_[^"]* _cardFacts_[^"]*"><span class="_fact_[^"]*"><span class="_factLabel_[^"]*">Steps<\/span><span class="_factValue_[^"]*">[^<]+<\/span>/);
      expect(card).toMatch(/<span class="_fact_[^"]* _cardFactEnd_[^"]*"><span class="_factLabel_[^"]*">Due<\/span><span class="_factValue_[^"]*">[^<]+<\/span><\/span><\/div>/);
    }
    const [fine, prepare] = cardsOf(markup);
    expect(fine).toMatch(/_factValue_[^"]* [^"]*_cardValueDim_[^"]*">No steps</);
    expect(fine).toMatch(/_cardFactEnd_.*_factValue_[^"]* [^"]*_toneBad_[^"]*">Overdue · /);
    expect(prepare).toMatch(/>1 of 4 done<\/span><span aria-hidden="true" class="[^"]*_cardBar_/);
  });

  test('the same skeleton as a Vehicles card: head, heading, title, sub, facts, a left fact and a right one', () => {
    const vehicles = renderAs(h(Vehicles), {
      at: '/vehicles', route: '/vehicles', me: meDita, data: [[qk.vehicles.list({ PageNumber: 1, PageSize: 20 }), pickVehicles]],
    }).markup;
    const vehicle = cardsOf(vehicles)[0]!;
    const task = cardsOf(taskCards(meToms, p15MyTasksToms, p15CountsToms))[0]!;
    const head = ['card', 'head', 'heading', 'title', 'sub'];
    expect(skeleton(vehicle).slice(0, 5)).toEqual(head);
    expect(skeleton(task).slice(0, 5)).toEqual(head);
    // Both carry their facts in the grid, the right column's fact flush right.
    for (const card of [vehicle, task]) {
      expect(card).toMatch(/<div class="_facts_[^"]*"?[^>]*><span class="_fact_[^"]*"><span class="_factLabel_/);
      expect(card).toMatch(/<span class="_fact_[^"]* _cardFactEnd_[^"]*"><span class="_factLabel_[^"]*">[^<]+<\/span><span class="_factValue_/);
    }
  });

  test('a Finished card’s chip stands where the other lists’ status chips stand, Closed flush right', () => {
    const markup = renderAs(h(Tasks), {
      at: '/tasks?tab=finished', route: '/tasks', me: meSigne, data: [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Signe]],
    }).markup;
    const [register, ventspils] = cardsOf(markup.slice(0, markup.indexOf('_range_')));
    // The chip is the head's second child, after the heading, as on a Vehicles or Drivers card.
    expect(register).toMatch(/<\/span><span class="[^"]*" data-tone="ok"[^>]*>.*Finished<\/span><\/div><div class="_facts_/);
    expect(ventspils).toMatch(/<\/span><span class="[^"]*" data-tone="mute"[^>]*>.*Cancelled<\/span><\/div><div class="_facts_/);
    expect(register).toMatch(/_cardFactEnd_[^"]*"><span class="_factLabel_[^"]*">Closed<\/span><span class="_factValue_[^"]*">22 Sep, 20:10</);
  });

  test('the reader’s step boxes stay as they were: the long overdue step, the one Dita marked, their buttons', () => {
    const card = cardsOf(taskCards(meToms, p15MyTasksToms, p15CountsToms))[0]!;
    expect(card).toContain('>Your steps<');
    expect(count(card, '<div class="_cardStep_')).toBe(3);
    expect(card).toMatch(/<div class="_cardStep_[^"]*"><span class="_yourStepText_[^"]*"><span class="_yourStepTitle_[^"]*">Add to Bolt<\/span><span class="_yourStepDue_/);
    expect(card).toMatch(/tread depth<\/span><span class="[^"]*_toneBad_[^"]*">Overdue · [^<]+<\/span><\/span><button type="button" class="_stepButton_[^"]*" data-size="card"/);
    expect(card).toMatch(/where to bring the cars<\/span><span class="_doneMark_[^"]*">.*?Done<\/span><\/span><\/div>/);
  });

  test('the task card’s own styles are only what the shared card has no word for', () => {
    for (const gone of ['.cards', '.card', '.card:hover', '.cardHead', '.cardHeading', '.cardTitleLine', '.cardSub', '.cardFact', '.cardValue', '.cardDue']) {
      expect(declared(rules, gone), gone).toEqual({});
    }
    expect(declared(rules, '.cardOpens')).toEqual({ cursor: 'pointer' });
    expect(declared(rules, '.cardTitle')).toEqual({ 'overflow-wrap': 'anywhere' });
    // An empty value's dim words and a due date's tone win over the shared value colour by scope.
    expect(declared(rules, '.cardFacts .cardValueDim')).toEqual({ color: 'var(--fg-3)' });
    expect(declared(rules, '.cardFacts .toneBad')).toEqual({ color: 'var(--bad)' });
    expect(declared(rules, '.cardFacts .toneWarn')).toEqual({ color: 'var(--warn)' });
    // The step boxes keep theirs.
    expect(declared(rules, '.cardStep')).toMatchObject({ padding: '10px 12px', 'border-radius': '10px' });
    expect(declared(rules, ".stepButton[data-size='card']")).toMatchObject({ 'min-height': '44px' });
  });
});
