import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind } from '@/api/dto';
import { DeleteRecords } from './admin/DeleteRecords';
import { Drivers } from './fleet/Drivers';
import { clearRenders, page, renderPage } from './followup7b.support';
import { countsEverything, deletionsMade } from './followup8.support';
import { deletionDrivers } from './followup17.support';

/**
 * Follow-up 20, F20-3: since the backend's round 15 the drivers list also finds a driver by the licence
 * number, so its search says so, in the words the Delete records page's Drivers tab already uses for
 * the same search.
 */
afterEach(clearRenders);

const WORDS = 'Name, licence number or email';

/** The search box of a rendered list: its placeholder and the name it is read by. */
const search = (markup: string) => {
  const box = /<input type="search"[^>]*>/.exec(markup);
  expect(box, 'no search box').not.toBeNull();
  return {
    placeholder: /placeholder="([^"]*)"/.exec(box![0])![1],
    label: /aria-label="([^"]*)"/.exec(box![0])![1],
    maxLength: /maxLength="(\d+)"/i.exec(box![0])?.[1],
  };
};

describe('F20-3: the drivers list’s search names the licence number', () => {
  test('the drivers list reads "Name, licence number or email", shown and read aloud, its cap as before', () => {
    const markup = renderPage(h(Drivers), { at: '/drivers', route: '/drivers', permissions: ['Drivers.Read'] });
    expect(search(markup)).toEqual({ placeholder: WORDS, label: WORDS, maxLength: '50' });
    expect(markup).not.toContain('First name, last name or email');
  });

  test('the Delete records page’s Drivers tab says the same of the same search', () => {
    const markup = renderPage(h(DeleteRecords), {
      at: '/delete-records?kind=drivers&show=all',
      route: '/delete-records',
      permissions: ['Records.Delete', 'SecurityAudit.ReadCompany', 'RentalAssignments.Read'],
      data: [
        [qk.recordDeletions.candidates(RecordKind.Driver, { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything }), page(deletionDrivers.items)],
        [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything],
        [qk.recordDeletions.made({ PageSize: 20 }), page(deletionsMade)],
      ],
    });
    const drivers = renderPage(h(Drivers), { at: '/drivers', route: '/drivers', permissions: ['Drivers.Read'] });
    expect(search(markup).placeholder).toBe(WORDS);
    expect(search(drivers).placeholder).toBe(search(markup).placeholder);
  });
});
