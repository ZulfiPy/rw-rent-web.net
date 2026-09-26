import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { AppShell } from '@/app/AppShell';
import { Tasks } from './tasks/Tasks';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import {
  CAPTURED_AT, countsDita, countsToms, meDita, meSigne, meToms, view1Dita, view2Toms, view3Signe,
} from './followup12.support';
import { R11_CAPTURED_AT, r11CountsDita, r11MyTasksDita } from './followup13.support';

/**
 * Tasks below 768 pixels (Follow-up 12, handover e at 402): each task is a card that opens it when
 * tapped, with its record and who gave it, Steps with the bar, Due or Closed, and on Involving me the
 * reader's own steps each with a 44px Mark done or Undo; and the count on Tasks in the phone's
 * navigation drawer. A server render always takes the desktop tier, so the tiers are set here;
 * everything else is the real page and the real shell.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
  useNarrow: () => true,
  useRailMode: () => 'drawer' as const,
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

/** The card that carries a title. */
const card = (markup: string, title: string) => {
  const at = markup.indexOf(`>${title}</a>`);
  expect(at, `no card ${title}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  const next = markup.indexOf('<div class="_card_', at);
  return markup.slice(start, next > -1 ? next : markup.indexOf('</section>', at));
};

describe('the task cards on a phone', () => {
  test('no table; each card opens its task, with its record, progress, due and the reader’s steps', () => {
    // Follow-up 13: round 11's My tasks, whose cards carry the reader's own steps as Involving me's do.
    vi.setSystemTime(new Date(R11_CAPTURED_AT));
    const { markup } = renderAs(h(Tasks), {
      at: '/tasks', route: '/tasks', me: meDita,
      data: [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), r11MyTasksDita], [qk.tasks.counts, r11CountsDita]],
    });
    expect(markup).not.toContain('<table');
    expect(count(markup, '<div class="_card_')).toBe(r11MyTasksDita.items.length);
    const prepare = card(markup, 'Prepare 204 JLM for a rental');
    expect(prepare).toContain(`href="/tasks/${r11MyTasksDita.items[1]!.id}"`);
    expect(prepare).toContain('Vehicle · 204 JLM');
    expect(prepare).toMatch(/>Steps<\/span><span[^>]*>1 of 4 done<\/span><span aria-hidden="true" class="[^"]*_cardBar_/);
    // Follow-up 15: the card's facts are the other lists' (`cards.module.css`), Due in the right column.
    expect(prepare).toMatch(/_cardFactEnd_[^"]*"><span class="_factLabel_[^"]*">Due<\/span><span class="_factValue_[^"]*">28 Sep, 10:54</);
    expect(prepare).toContain('>Your steps<');
    expect(count(prepare, '<div class="_cardStep_')).toBe(2);
    expect(prepare).toMatch(/Add to Bolt.*data-size="card" data-done="true"[^>]*>.*Undo<\/span><\/button>.*Handover.*data-size="card"[^>]*>.*Mark done<\/span><\/button>/);
    const claim = card(markup, 'Handle the windscreen insurance case of 204 JLM');
    expect(claim).toContain('from Signe Priede');
    expect(claim).toContain('>Your step<');
    expect(claim).toMatch(/Pick up the repair invoice.*data-size="card"[^>]*>.*Mark done<\/span><\/button>/);
    const fine = card(markup, 'Reassign the parking fine to the driver');
    expect(fine).toMatch(/_factValue_[^"]* [^"]*_toneBad_[^"]*">Overdue · 24 Sep</);
    expect(fine).not.toContain('Your step');
    expect(fine).toMatch(/_cardValueDim_[^"]*">No steps</);
    const fobs = card(markup, 'Order two spare key fobs');
    expect(fobs).toContain('No due date');
    // The strip keeps its three tabs; below 640 they drop their icons (CSS).
    expect(markup).toContain('data-compact="true"');
    // The pager stays.
    expect(markup).toContain('aria-label="Next page"');
  });

  test('Involving me: the reader’s steps, each with a 44px action; "from" who gave the task', () => {
    const { markup } = renderAs(h(Tasks), {
      at: '/tasks?tab=involving', route: '/tasks', me: meToms,
      data: [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), view2Toms], [qk.tasks.counts, countsToms]],
    });
    const service = card(markup, 'Book a service for 444 WKS and tell the driver');
    expect(service).toContain('from Dita Smite');
    expect(service).toContain('>Your step<');
    expect(service).toMatch(/Tell the driver the time<\/span><span class="[^"]*_toneBad_[^"]*">Overdue · 23 Sep</);
    expect(service).toMatch(/data-size="card"[^>]*>.*Mark done<\/span><\/button>/);
    const claim = card(markup, 'Handle the windscreen insurance case of 204 JLM');
    expect(claim).toMatch(/check<\/span>Done<\/span>/);
    expect(claim).toMatch(/data-size="card" data-done="true"[^>]*>.*Undo<\/span><\/button>/);
  });

  test('two steps of the reader’s in one task: "Your steps", each with its own action', () => {
    // Dita's own two steps of Prepare 204 JLM, as a row of hers: Add to Bolt done, Handover to do.
    const prepare = view1Dita.items.find((task) => task.title === 'Prepare 204 JLM for a rental')!;
    expect(prepare.yourSteps).toHaveLength(2);
    const { markup } = renderAs(h(Tasks), {
      at: '/tasks?tab=involving', route: '/tasks', me: meDita,
      data: [[qk.tasks.list(LIST(WorkTaskView.InvolvingMe)), { ...view1Dita, items: [prepare] }]],
    });
    const card0 = card(markup, 'Prepare 204 JLM for a rental');
    expect(card0).toContain('>Your steps<');
    expect(count(card0, '<div class="_cardStep_')).toBe(2);
    expect(card0).toMatch(/Add to Bolt.*Undo<\/span><\/button>.*Handover.*Mark done<\/span><\/button>/);
  });

  test('Finished: the chip beside the title and the time it was closed', () => {
    const { markup } = renderAs(h(Tasks), {
      at: '/tasks?tab=finished', route: '/tasks', me: meSigne,
      data: [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Signe]],
    });
    const register = card(markup, 'Register 119 MPR in Bolt');
    expect(register).toMatch(/data-tone="ok"[^>]*>.*Finished<\/span>/);
    expect(register).toMatch(/_cardFactEnd_[^"]*"><span class="_factLabel_[^"]*">Closed<\/span><span class="_factValue_[^"]*">22 Sep, 20:10</);
    expect(register).toContain('from Dita Smite');
    expect(card(markup, 'Prepare an agreement for Ventspils Marine Services')).toMatch(/data-tone="mute"[^>]*>.*Cancelled<\/span>/);
  });
});

describe('the count on Tasks (F12-6)', () => {
  const shell = (me: typeof meDita, data: Array<[readonly unknown[], unknown]>) =>
    renderAs(h(AppShell, { companyName: 'RW-Rent Demo' }), { at: '/overview', route: '/overview', me, data }).markup;

  test('in the phone’s drawer, as the other counts: the reader’s to-do count', () => {
    const markup = shell(meDita, [[qk.tasks.counts, countsDita]]);
    expect(markup).toContain('data-mode="drawer"');
    expect(around(markup, 'aria-label="Tasks"', 'a')).toMatch(/>Tasks<\/span><span class="_badge_[^"]*">4<\/span>/);
    const toms = shell(meToms, [[qk.tasks.counts, countsToms]]);
    expect(around(toms, 'aria-label="Tasks"', 'a')).toMatch(/_badge_[^"]*">2<\/span>/);
  });

  test('none when nothing is to do', () => {
    const markup = shell(meDita, [[qk.tasks.counts, { ...countsDita, toDo: 0 }]]);
    expect(around(markup, 'aria-label="Tasks"', 'a')).not.toContain('_badge_');
  });
});
