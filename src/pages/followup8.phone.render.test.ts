import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind } from '@/api/dto';
import { DeleteRecords } from './admin/DeleteRecords';
import { clearRenders, page, renderPage } from './followup7b.support';
import {
  countsEverything, deletionsMade, driverBlockedTwice, rentalEnded, vehicleBlocked, vehicleReady,
} from './followup8.support';

/**
 * The Delete records page below 768 pixels (Follow-up 8), where each row is a card that carries its
 * own action: a card cannot be one big button when a button sits inside it. A server render always
 * takes the desktop tier, so the tier is set here; everything else is the real page.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
}));

afterEach(clearRenders);

const read = (kind: RecordKind, at: string, items: unknown[], permissions = ['Records.Delete', 'SecurityAudit.ReadCompany']) =>
  renderPage(h(DeleteRecords), {
    at,
    route: '/delete-records',
    permissions,
    data: [
      [qk.recordDeletions.candidates(kind, { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything }), page(items)],
      [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything],
      [qk.recordDeletions.made({ PageSize: 20 }), page(deletionsMade)],
    ],
  });

/** The markup of the card that carries a text. */
const card = (markup: string, text: string) => {
  const at = markup.indexOf(text);
  expect(at).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  return markup.slice(start, markup.indexOf('<div class="_card_', at + 1) > -1 ? markup.indexOf('<div class="_card_', at + 1) : undefined);
};

describe('the candidates on a phone', () => {
  const vehicles = read(RecordKind.Vehicle, '/delete-records?kind=vehicles&show=all', [vehicleReady, vehicleBlocked]);

  test('are cards, not a table, each with its verdict and its own full-width Delete…', () => {
    const list = vehicles.slice(0, vehicles.indexOf('Recently deleted'));
    expect(list).not.toContain('<table');
    const ready = card(list, vehicleReady.plateNumber);
    expect(ready).toContain(`href="/vehicles/${vehicleReady.id}"`);
    expect(ready).toContain('Citroen Berlingo · 2019');
    expect(ready).toContain('>Ready<');
    expect(ready).toContain('>VIN<');
    expect(ready).toMatch(/<button[^>]*data-tone="danger"[^>]*>(?:(?!<\/button>).)*Delete…<\/button>/);
    expect(ready).not.toMatch(/<button[^>]*disabled[^>]*>(?:(?!<\/button>).)*Delete…/);
  });

  test('a blocked card writes its reason, names the records in the way, and holds a disabled Delete…', () => {
    const list = vehicles.slice(0, vehicles.indexOf('Recently deleted'));
    const blocked = card(list, '482 TKL');
    expect(blocked).toContain('>Blocked<');
    expect(blocked).toContain('2 rental assignments refer to this vehicle');
    expect(blocked).toContain(`href="/rental-assignments/${vehicleBlocked.deletion.blocks[0]!.records[0]!.id}"`);
    expect(blocked).toMatch(/<button[^>]*disabled[^>]*title="2 rental assignments refer to this vehicle\."/);
  });

  test('a rental card spans its parts across the card, and a driver card carries both of its blocks', () => {
    const rentals = read(RecordKind.RentalAssignment, '/delete-records?show=all', [rentalEnded]);
    expect(card(rentals, '400 NDP')).toContain('1 authorization · 1 interruption');
    const drivers = read(RecordKind.Driver, '/delete-records?kind=drivers&show=all', [driverBlockedTwice]);
    expect(drivers).toContain('1 driver authorization refers to this driver and a customer record is linked to this driver record');
  });
});

describe('Recently deleted on a phone', () => {
  test('is cards too: what, the reason, when and who, a Deleted chip, and the entry to open', () => {
    const markup = read(RecordKind.Vehicle, '/delete-records?kind=vehicles&show=all', [vehicleReady]);
    const made = markup.slice(markup.indexOf('Recently deleted'));
    expect(made).not.toContain('<table');
    expect(made).toContain(`Vehicle · ${deletionsMade[1]!.recordLabel}`);
    expect(made).toContain('Practice or test record — Made while teaching a new colleague.');
    expect(made).toContain('>When<');
    expect(made).toContain('>Who<');
    expect(made).toContain('>Deleted<');
    expect(made).toContain('Open audit entry');
    expect(made).toContain(`href="/security-audit/${deletionsMade[0]!.auditEntryId}"`);
  });

  test('offers no entry to open for a reader who may not read the audit', () => {
    const markup = read(RecordKind.Vehicle, '/delete-records?kind=vehicles&show=all', [vehicleReady], ['Records.Delete']);
    const made = markup.slice(markup.indexOf('Recently deleted'));
    expect(made).not.toContain('Open audit entry');
    expect(made).not.toContain('href="/security-audit/');
  });
});
