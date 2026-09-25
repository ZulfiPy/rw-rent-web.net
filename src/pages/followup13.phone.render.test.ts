import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { Tasks } from './tasks/Tasks';
import { clearTaskRenders, count, renderAs } from './followup12.harness';
import { meSigne, meToms } from './followup12.support';
import {
  R11_CAPTURED_AT, r11CountsSigne, r11CountsToms, r11MyTasksSigne, r11MyTasksToms, r11MyTasksTomsAfterDitaMark,
} from './followup13.support';

/**
 * Follow-up 13 below 768 pixels (F13-2): a My tasks card shows the reader's own steps with their
 * 44px Mark done or Undo, as an Involving me card does, and nothing where the reader has no step.
 * A server render always takes the desktop tier, so the phone tier is set here, as in Follow-up 12.
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

const LIST: WorkTaskQuery = { View: WorkTaskView.MyTasks, PageNumber: 1, PageSize: 20 };

const myTasks = (me: typeof meToms, page: typeof r11MyTasksToms, counts = r11CountsToms) =>
  renderAs(h(Tasks), { at: '/tasks', route: '/tasks', me, data: [[qk.tasks.list(LIST), page], [qk.tasks.counts, counts]] }).markup;

/** The card that carries a title. */
const card = (markup: string, title: string) => {
  const at = markup.indexOf(`>${title}</a>`);
  expect(at, `no card ${title}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  const next = markup.indexOf('<div class="_card_', at);
  return markup.slice(start, next > -1 ? next : markup.indexOf('</section>', at));
};

describe('My tasks cards on a phone (F13-2)', () => {
  test('Toms: every card is someone else’s task, with "from" and his step’s 44px action', () => {
    const markup = myTasks(meToms, r11MyTasksToms);
    expect(markup).not.toContain('<table');
    expect(count(markup, '<div class="_card_')).toBe(3);
    const service = card(markup, 'Book a service for 444 WKS and tell the driver');
    expect(service).toContain('from Dita Smite');
    expect(service).toContain('>Your step<');
    expect(service).toMatch(/Tell the driver the time<\/span><span class="[^"]*_toneBad_[^"]*">Overdue · 24 Sep</);
    expect(service).toMatch(/data-size="card"[^>]*>.*Mark done<\/span><\/button>/);
    const claim = card(markup, 'Handle the windscreen insurance case of 204 JLM');
    expect(claim).toContain('from Signe Priede');
    expect(claim).toMatch(/data-size="card" data-done="true"[^>]*>.*Undo<\/span><\/button>/);
  });

  test('a step done by the task’s creator: Done on the card, no button', () => {
    const service = card(myTasks(meToms, r11MyTasksTomsAfterDitaMark), 'Book a service for 444 WKS and tell the driver');
    // The last card: its steps end where the pager begins.
    const steps = service.slice(service.indexOf('_cardSteps_'), service.indexOf('_range_'));
    expect(steps).toMatch(/Tell the driver the time.*check<\/span>Done<\/span>/);
    expect(steps).not.toContain('<button');
    expect(steps).not.toContain('data-size="card"');
  });

  test('Signe: her own task without a step of hers has no step section; her step in Dita’s task has one', () => {
    const markup = myTasks(meSigne, r11MyTasksSigne, r11CountsSigne);
    const agreement = card(markup, 'Prepare the rental agreement for Martins Ozols');
    expect(agreement).not.toContain('Your step');
    expect(agreement).not.toContain('from ');
    expect(agreement).toMatch(/_cardDue_[^"]* [^"]*_toneWarn_[^"]*">Due today · 15:54</);
    const prepare = card(markup, 'Prepare 204 JLM for a rental');
    expect(prepare).toContain('from Dita Smite');
    expect(prepare).toMatch(/>Your step<.*Apply for the taxi licence.*data-size="card"[^>]*>.*Mark done<\/span><\/button>/);
  });
});
