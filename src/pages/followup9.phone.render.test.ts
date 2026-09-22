import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind } from '@/api/dto';
import { DeleteRecords } from './admin/DeleteRecords';
import { clearRenders, page, renderPage } from './followup7b.support';
import { countsEverything, deletionsMade } from './followup8.support';
import { customerTwoRunning, customerWithRentals } from './followup9.support';

/**
 * The Delete records page below 768 pixels after the backend's round 8 (Follow-up 9): each card
 * carries the same lines as the table's Deletion cell — the reason with its running rentals for a
 * blocked one, and what a deletion takes along for every one. A server render always takes the
 * desktop tier, so the tier is set here; everything else is the real page.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
}));

afterEach(clearRenders);

const customers = (items: unknown[]) => renderPage(h(DeleteRecords), {
  at: '/delete-records?kind=customers&show=all',
  route: '/delete-records',
  permissions: ['Records.Delete', 'SecurityAudit.ReadCompany'],
  data: [
    [qk.recordDeletions.candidates(RecordKind.Customer, { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything }), page(items)],
    [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything],
    [qk.recordDeletions.made({ PageSize: 20 }), page(deletionsMade)],
  ],
});

/** The markup of the card that carries a text. */
const card = (markup: string, text: string) => {
  const at = markup.indexOf(text);
  expect(at).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  const next = markup.indexOf('<div class="_card_', at + 1);
  return markup.slice(start, next > -1 ? next : undefined);
};

describe('the cards on a phone (Follow-up 9)', () => {
  const markup = customers([customerWithRentals, customerTwoRunning]);
  const cards = markup.slice(0, markup.indexOf('Recently deleted'));

  test('a Ready card says what its deletion takes along, above its own Delete', () => {
    const ready = card(cards, customerWithRentals.displayName);
    expect(ready).toContain('>Ready<');
    expect(ready).toContain('Takes 2 rental assignments, 2 driver authorizations and 1 interruption with it');
    expect(ready).not.toMatch(/<button[^>]*disabled[^>]*>(?:(?!<\/button>).)*Delete<\/button>/);
  });

  test('a blocked card writes its reason, links each running rental, and still says what would go', () => {
    const blocked = card(cards, customerTwoRunning.displayName);
    expect(blocked).toContain('2 running rentals refer to this customer. End them first');
    for (const record of customerTwoRunning.deletion.blocks[0]!.records) {
      expect(blocked).toContain(`href="/rental-assignments/${record.id}"`);
    }
    expect(blocked).toContain('Takes 2 rental assignments and 2 driver authorizations with it');
    expect(blocked).toMatch(/<button[^>]*disabled[^>]*title="2 running rentals refer to this customer\. End them first\."/);
  });
});
