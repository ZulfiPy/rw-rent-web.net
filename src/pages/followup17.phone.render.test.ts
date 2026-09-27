import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import type { InsuranceCaseQuery } from '@/api/dto';
import { AppShell } from '@/app/AppShell';
import { CaseRecord } from './insurance/CaseRecord';
import { InsuranceCases } from './insurance/InsuranceCases';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import { CAPTURED_AT, caseKlmDita, countsDita, meDita, view1Dita, view3Dita } from './followup17.support';

/**
 * Insurance cases below 768 pixels (Follow-up 17, handover e at 402): each case is the other lists'
 * card that opens it when tapped, with its type and time, its status chip top right, and two columns of
 * facts; a case's panels stand in one column; and the count on Insurance cases in the phone's
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

const LIST = (View: InsuranceCaseQuery['View']): InsuranceCaseQuery => ({ View, PageNumber: 1, PageSize: 20 });

/** The card that carries a title. */
const card = (markup: string, title: string) => {
  const at = markup.indexOf(`>${title}</a>`);
  expect(at, `no card ${title}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  const next = markup.indexOf('<div class="_card_', at);
  return markup.slice(start, next > -1 ? next : markup.indexOf('</section>', at));
};

describe('the case cards on a phone', () => {
  test('Open: no table; each card opens its case, with its type and time, its chip, waiting, handler and last event', () => {
    const { markup } = renderAs(h(InsuranceCases), {
      at: '/insurance-cases', route: '/insurance-cases', me: meDita,
      data: [[qk.insuranceCases.list(LIST(1)), view1Dita], [qk.insuranceCases.counts, countsDita]],
    });
    expect(markup).not.toContain('<table');
    expect(count(markup, '<div class="_card_')).toBe(view1Dita.items.length);
    const hdv = card(markup, '770 HDV · Long scratches on both left doors');
    expect(hdv).toContain(`href="/insurance-cases/${view1Dita.items[0]!.id}"`);
    expect(hdv).toContain('Usual · Found 25 Sep');
    // The status chip where the other cards carry theirs, top right.
    expect(hdv).toMatch(/<\/span><span[^>]*data-tone="warn"[^>]*>.*Happened<\/span><\/div>/);
    expect(hdv).toMatch(/>Waiting for<\/span><span class="[^"]*_us_[^"]*">Us · 2 days<\/span>/);
    expect(hdv).toMatch(/_cardFactEnd_[^"]*"><span[^>]*>Handled by<\/span><span class="[^"]*_cardDim_[^"]*">Not reported<\/span>/);
    expect(hdv).toMatch(/_cardFactFull_[^"]*"><span[^>]*>Last event<\/span><span class="[^"]*_cardDim_[^"]*">No events yet<\/span>/);
    const klm = card(markup, '552 KLM · Rear bumper and boot lid dented');
    expect(klm).toMatch(/>Handled by<\/span><span[^>]*>Meridian Insurance<\/span><span class="_cardSubMono_[^"]*">MI-2026-118305<\/span>/);
    expect(klm).toMatch(/>Last event<\/span><span[^>]*>Everything is sent, Meridian is deciding<\/span><span class="_cardSub_[^"]*">6 days ago<\/span>/);
    // The strip spans the list, as Tasks' does.
    expect(markup).toContain('data-compact="true"');
  });

  test('Closed: At fault on the left, Closed flush right, Handled by across both', () => {
    const { markup } = renderAs(h(InsuranceCases), {
      at: '/insurance-cases?tab=closed', route: '/insurance-cases', me: meDita,
      data: [[qk.insuranceCases.list(LIST(3)), view3Dita], [qk.insuranceCases.counts, countsDita]],
    });
    const ndp = card(markup, '400 NDP · Right mirror broken by a passing van');
    expect(ndp).toContain(`href="/insurance-cases/${view3Dita.items[0]!.id}?tab=closed"`);
    expect(ndp).toMatch(/>At fault<\/span><span[^>]*>The other party<\/span>/);
    expect(ndp).toMatch(/_cardFactEnd_[^"]*"><span[^>]*>Closed<\/span><span[^>]*>19 Sep<\/span>/);
    expect(ndp).toMatch(/_cardFactFull_[^"]*"><span[^>]*>Handled by<\/span><span[^>]*>Meridian Insurance<\/span>/);
    expect(ndp).not.toContain('Waiting for');
  });
});

describe('a case’s page on a phone', () => {
  test('its panels in one column: Timeline, Notes, Insurance, Photos, Description, Record', () => {
    const { markup } = renderAs(h(CaseRecord), {
      at: `/insurance-cases/${caseKlmDita.id}`, route: '/insurance-cases/:caseId', me: meDita,
      data: [[qk.insuranceCases.detail(caseKlmDita.id), caseKlmDita]],
    });
    expect(markup).toContain('data-cols="1"');
    expect(markup).not.toContain('data-cols="2"');
    const order = ['>Timeline<', '>Notes<', '>Insurance<', '>Photos<', '>Description<', '>Record<'].map((title) => markup.indexOf(title));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('the count in the phone’s navigation drawer (F17-8)', () => {
  test('the drawer’s entry carries the cases waiting for us', () => {
    const { markup } = renderAs(h(AppShell, { companyName: 'RW-Rent Demo' }), {
      at: '/overview', route: '/overview', me: meDita, data: [[qk.insuranceCases.counts, countsDita]],
    });
    expect(markup).toContain('aria-label="Open navigation"');
    expect(around(markup, 'aria-label="Insurance cases"', 'a')).toMatch(/Insurance cases<\/span><span class="_badge_[^"]*">2<\/span>/);
  });
});
