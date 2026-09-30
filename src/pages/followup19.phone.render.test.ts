import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind } from '@/api/dto';
import { DeleteRecords } from './admin/DeleteRecords';
import { clearTaskRenders, count, renderAs } from './followup12.harness';
import { declared, readRules } from './followup14.stylesheet';
import { meAdmin } from './followup17.support';
import { R14_CAPTURED_AT, caseCandidatesEverything, countsEverything19, deletionsMade19, vehicleCandidates19 } from './followup19.support';

/**
 * Follow-up 19, F19-2 below 768 pixels: each insurance case is the deletions page's card, as every
 * other kind's record is, titled with the case's label and opening the case, with its type and time
 * under it, its verdict top right, its status and when it was closed, the block sentence or what a
 * deletion takes, and Delete across the card. A server render always takes the desktop tier, so the
 * tier is set here; everything else is the real page.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
  useNarrow: () => true,
  useRailMode: () => 'drawer' as const,
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R14_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const EVERYTHING = { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything };

const markup = () => renderAs(h(DeleteRecords), {
  at: '/delete-records?kind=insurance-cases', route: '/delete-records', me: meAdmin,
  data: [
    [qk.recordDeletions.candidates(RecordKind.InsuranceCase, EVERYTHING), caseCandidatesEverything],
    [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
    [qk.recordDeletions.made({ PageSize: 20 }), deletionsMade19],
  ],
}).markup;

/** The card that carries a title. */
const card = (html: string, title: string) => {
  const at = html.indexOf(`>${title}</a>`);
  expect(at, `no card ${title}`).toBeGreaterThan(-1);
  const start = html.lastIndexOf('<div class="_card_', at);
  const next = html.indexOf('<div class="_card_', at);
  return html.slice(start, next > -1 ? next : html.indexOf('</section>', at));
};

describe('the insurance cases’ cards on a phone', () => {
  test('no table: a card for each case, titled with its label, opening the case', () => {
    const html = markup();
    // Recently deleted is cards on a phone too: no table anywhere.
    expect(html).not.toContain('<table');
    // Two cases of 482 TKL share a label: each card is found by the case it opens.
    for (const one of caseCandidatesEverything.items) {
      const title = new RegExp(`<a class="([^"]*)" href="/insurance-cases/${one.id}"[^>]*>([^<]*)</a>`).exec(html);
      expect(title, one.recordLabel).not.toBeNull();
      expect(title![1]).toMatch(/_cardTitle_/);
      // A label, not a plate: the card title is not set in the plate's mono.
      expect(title![1]).not.toMatch(/_cardPlate_/);
      // The whole label, on as many lines as it needs: what is damaged tells two cases of one car apart.
      expect(title![1]).toMatch(/_cardTitleWraps_/);
      expect(title![2]).toBe(one.recordLabel);
    }
    expect(count(html, 'href="/insurance-cases/')).toBe(caseCandidatesEverything.items.length);
  });

  test('a closed case: its type and time, Ready, its status and when it was closed, what goes, and Delete across the card', () => {
    const found = card(markup(), '770 HDV · Practice: front left door scratched');
    expect(found).toContain('>Usual · Happened 28 Sep</span>');
    expect(found).toContain('>Ready</span>');
    expect(found).toMatch(/>Status<\/span><span[^>]*>Closed<\/span>/);
    expect(found).toMatch(/>Closed<\/span><span class="_factMono_[^"]*">30 Sep<\/span>/);
    expect(found).toContain('>Takes 2 events, 1 note and 2 photos with it. Clears the accident link of 1 insurance case</p>');
    expect(found).toMatch(/<button type="button" data-tone="danger" class="[^"]*_block_[^"]*"[^>]*title="Delete this insurance case"/);
  });

  test('an open case: Blocked, its status and no Closed, the sentence with nothing linked, what would go, and its Delete disabled', () => {
    const found = card(markup(), '204 JLM · Windscreen cracked by a stone');
    expect(found).toContain('>Casco · Happened 29 Sep</span>');
    expect(found).toContain('>Blocked</span>');
    expect(found).toMatch(/>Status<\/span><span[^>]*>Repair<\/span>/);
    expect(found).not.toContain('>Closed</span>');
    expect(found).toContain('>This insurance case is open. Close it first; then it can be deleted</p>');
    expect(count(found, '<a ')).toBe(1);
    expect(found).toContain('>Takes 2 events, 1 note and 2 photos with it</p>');
    expect(found).toMatch(/<button[^>]*disabled=""[^>]*title="This insurance case is open\. Close it first; then it can be deleted\."/);
  });

  test('only a case’s card title wraps; the other kinds’ titles keep their one cut line, as before', () => {
    const sheet = readRules(new URL('./admin/DeleteRecords.module.css', import.meta.url));
    expect(declared(sheet, '.cardTitleWraps')).toEqual({ 'white-space': 'normal', 'overflow-wrap': 'anywhere', 'text-wrap': 'pretty' });
    expect(declared(sheet, '.cardTitle')).toMatchObject({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis' });
    const cars = renderAs(h(DeleteRecords), {
      at: '/delete-records?kind=vehicles', route: '/delete-records', me: meAdmin,
      data: [[qk.recordDeletions.candidates(RecordKind.Vehicle, EVERYTHING), vehicleCandidates19]],
    }).markup;
    expect(cars).toContain('>P19 26C</a>');
    expect(cars).not.toContain('_cardTitleWraps_');
  });

  test('Recently deleted: the case’s card names its kind', () => {
    expect(markup()).toContain('>Insurance case · 770 HDV · Practice: front left door scratched</span>');
  });
});
