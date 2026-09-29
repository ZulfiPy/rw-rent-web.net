import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RecordKind, qk } from '@/api';
import { deletionInvalidates } from './admin/DeleteRecordDialog';
import { CASE_REFRESH } from './insurance/caseAddress';
import { INSURER_ADD_REFRESH, INSURER_CHANGE_REFRESH } from './insurance/InsurerDialogs';
import type { CurrentUserResponse, InsuranceCaseQuery, InsurerListItemResponse } from '@/api/dto';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import { CaseRecord } from './insurance/CaseRecord';
import { InsuranceCases } from './insurance/InsuranceCases';
import { countsDita, meDita, meToms } from './followup17.support';
import {
  closedHandledByBaltic, handledUnknownRefusal, insurersAll, openHandledByBaltic, openHandledByHarbour, usHandledByBaltic,
} from './followup18.support';
import {
  PRACTICE18_AT, insurersAllWithPilotOut, openHandledByPilot, practiceCaseOutOfUse, practiceCaseRenamed,
} from './followup18.practice';

/**
 * Follow-up 18, rendered to markup from round 13's answers (`followup18.support.ts`) and the joint
 * check's (`followup18.practice.ts`): a case's insurers with their email and phone (F18-2e).
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(PRACTICE18_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const casePage = (kase = practiceCaseRenamed, me = meDita) => renderAs(h(CaseRecord), {
  at: `/insurance-cases/${kase.id}`, route: '/insurance-cases/:caseId', me, data: [[qk.insuranceCases.detail(kase.id), kase]],
}).markup;

/** The Insurance panel's fact of one label, from its label to the end of its cell. */
const insurance = (markup: string, label: string) => {
  const panel = markup.slice(markup.indexOf('>Insurance</h2>'));
  const at = panel.indexOf(`>${label}</span>`);
  expect(at, `no fact ${label}`).toBeGreaterThan(-1);
  return panel.slice(at, panel.indexOf('</div>', at));
};

describe('a case’s insurers (F18-2e)', () => {
  test('each insurer’s name, and under it its email and phone as links', () => {
    const markup = casePage();
    const ours = insurance(markup, 'Our insurer');
    expect(ours).toMatch(/_insurerName_[^"]*">Baltic Mutual<\/span>/);
    expect(ours).toContain('<a class="_insurerLink_');
    expect(ours).toContain('href="mailto:claims@balticmutual.example">claims@balticmutual.example</a>');
    expect(ours).toContain('href="tel:+37167001100">+371 6700 1100</a>');
    const theirs = insurance(markup, 'The other party’s insurer');
    expect(theirs).toMatch(/_insurerName_[^"]*">Pilot Insurance Group<\/span>/);
    expect(theirs).toContain('href="mailto:claims@pilot-insurance.example"');
    expect(theirs).toContain('href="tel:+3726007700">+372 600 7700</a>');
    expect(theirs).not.toContain('Out of use');
  });

  test('an insurer with no email or phone shows its name alone', () => {
    const northgate = { ...practiceCaseRenamed.otherInsurer!, name: 'Northgate Insurance', email: 'claims@northgate.example', phoneNumber: null };
    const markup = casePage({ ...practiceCaseRenamed, otherInsurer: northgate });
    const theirs = insurance(markup, 'The other party’s insurer');
    expect(theirs).toContain('href="mailto:claims@northgate.example"');
    expect(theirs).not.toContain('tel:');
    const bare = casePage({ ...practiceCaseRenamed, otherInsurer: { ...northgate, email: null } });
    expect(insurance(bare, 'The other party’s insurer')).not.toContain('<a ');
  });

  test('one out of use is marked so, where a Viewer reads it too', () => {
    for (const me of [meDita, meToms]) {
      const theirs = insurance(casePage(practiceCaseOutOfUse, me), 'The other party’s insurer');
      expect(theirs).toMatch(/Pilot Insurance Group<span class="_chip_[^"]*" data-tone="mute"><span[^>]*border-radius:1px[^>]*><\/span>Out of use<\/span>/);
    }
  });

  test('the band’s Handled by and the Insurance panel’s show the name as before', () => {
    const markup = casePage(practiceCaseOutOfUse);
    expect(markup).toMatch(/>Handled by<\/span><span[^>]*><span[^>]*><span>Pilot Insurance Group<\/span><\/span><span[^>]*>PI-18-0001<\/span>/);
    expect(insurance(markup, 'Handled by')).toContain('Pilot Insurance Group (the other party’s)');
  });

  test('none named reads as before: None, and Not known for the other party', () => {
    const markup = casePage({ ...practiceCaseRenamed, ourInsurer: null, otherInsurer: null, handledBy: null });
    expect(insurance(markup, 'Our insurer')).toMatch(/_dim_[^"]*">None</);
    expect(insurance(markup, 'The other party’s insurer')).toMatch(/_dim_[^"]*">Not known</);
  });

  test('the list’s Handled by column shows the handling insurer’s name, its claim number under it', () => {
    const { markup } = renderAs(h(InsuranceCases), {
      at: '/insurance-cases', route: '/insurance-cases', me: meDita,
      data: [
        [qk.insuranceCases.counts, countsDita],
        [qk.insuranceCases.list({ View: 1, PageNumber: 1, PageSize: 20 }), openHandledByPilot],
      ],
    });
    const row = around(markup, 'Practice: the left mirror and its cover knocked off', 'tr');
    expect(row).toMatch(/_cellText_[^"]*">Pilot Insurance Group<\/span><span class="_subMono_[^"]*">PI-18-0001<\/span>/);
  });
});

describe('every write refreshes what it changes (F18-2a)', () => {
  const keys = (list: ReadonlyArray<readonly unknown[]>) => list.map((key) => key.join('/'));

  test('adding an insurer refreshes the insurers; editing one, or putting it out of use or back, the cases too', async () => {
    expect(keys(INSURER_ADD_REFRESH)).toEqual([qk.insurers.all.join('/')]);
    expect(keys(INSURER_CHANGE_REFRESH)).toEqual([qk.insurers.all, qk.insuranceCases.all].map((key) => key.join('/')));
    const { QueryClient } = await import('@tanstack/react-query');
    const client = new QueryClient();
    const kept = [qk.insurers.list({}), qk.insurers.list({ IsActive: true }), qk.insuranceCases.detail(practiceCaseRenamed.id),
      qk.insuranceCases.list({ View: 1, PageNumber: 1, PageSize: 20, HandledByInsurerId: practiceCaseRenamed.otherInsurer!.id })];
    for (const key of kept) client.setQueryData(key, {});
    await Promise.all(INSURER_CHANGE_REFRESH.map((queryKey) => client.invalidateQueries({ queryKey })));
    for (const key of kept) expect(client.getQueryState(key)?.isInvalidated, JSON.stringify(key)).toBe(true);
  });

  test('a case’s every write refreshes the insurers, which count the cases; so does a vehicle’s deletion, which takes its cases', () => {
    expect(keys(CASE_REFRESH)).toContain(qk.insurers.all.join('/'));
    expect(keys(deletionInvalidates(RecordKind.Vehicle))).toContain(qk.insurers.all.join('/'));
  });
});

/* the cases list's Handled by ---------------------------------------------------------------------- */

const LIST = (View: InsuranceCaseQuery['View'], extra: Partial<InsuranceCaseQuery> = {}): InsuranceCaseQuery =>
  ({ View, PageNumber: 1, PageSize: 20, ...extra });
const BALTIC = insurersAll.find((i) => i.name === 'Baltic Mutual')!.id;
const HARBOUR = insurersAll.find((i) => i.name === 'Old Harbour Insurance')!.id;

const cases = (at: string, data: Array<[readonly unknown[], unknown]>, insurers: InsurerListItemResponse[] | null = insurersAllWithPilotOut,
  me: CurrentUserResponse = meDita, errors: Array<[readonly unknown[], typeof handledUnknownRefusal]> = []) =>
  renderAs(h(InsuranceCases), {
    at, route: '/insurance-cases', me, errors,
    data: [[qk.insuranceCases.counts, countsDita], ...(insurers ? [[qk.insurers.list({}), insurers] as [readonly unknown[], unknown]] : []), ...data],
  });

/** The Handled by filter: its shown value and its options, in order. */
const handledFilter = (markup: string) => {
  // The filter and what stands under it: from its wrapper to the toolbar's spacer after it.
  const filter = markup.slice(markup.indexOf('_handledFilter_'), markup.indexOf('_spacer_', markup.indexOf('_handledFilter_')));
  const select = around(markup, 'aria-label="Filter by handled by"', 'select');
  return {
    shown: /_selectValue_[^"]*">([^<]*)</.exec(markup.slice(markup.indexOf('>Handled by</span>')))![1],
    options: [...select.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((m) => m[2]),
    selected: /<option value="([^"]*)" selected="">/.exec(select)?.[1] ?? null,
    filter,
  };
};

describe('the cases list’s Handled by (F18-2f)', () => {
  test('on every view, beside Waiting for: Anyone, the insurers in use, then those out of use, marked so', () => {
    for (const [at, view] of [['/insurance-cases', 1], ['/insurance-cases?tab=us', 2], ['/insurance-cases?tab=closed', 3]] as const) {
      const { markup } = cases(at, [[qk.insuranceCases.list(LIST(view)), { items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 }]]);
      const filter = handledFilter(markup);
      expect(filter.options).toEqual(['Anyone', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance',
        'Old Harbour Insurance · Out of use', 'Pilot Insurance Group · Out of use']);
      expect(filter.shown).toBe('Anyone');
    }
    // Beside Waiting for on Open, after Type on Closed.
    const open = cases('/insurance-cases', [[qk.insuranceCases.list(LIST(1)), openHandledByBaltic]]).markup;
    expect(open.indexOf('>Waiting for</span>')).toBeLessThan(open.indexOf('>Handled by</span>'));
    expect(open.indexOf('>Handled by</span>')).toBeLessThan(open.indexOf('<table'));
    const closed = cases('/insurance-cases?tab=closed', [[qk.insuranceCases.list(LIST(3)), closedHandledByBaltic]]).markup;
    expect(closed.indexOf('>Type</span>')).toBeLessThan(closed.indexOf('>Handled by</span>'));
    expect(closed).not.toContain('>Waiting for</span>');
  });

  test('set, it asks for the cases that insurer handles on each view, and Clear filters offers to clear it', () => {
    const views = [
      ['/insurance-cases', 1, openHandledByBaltic, '3 cases'],
      ['/insurance-cases?tab=us', 2, usHandledByBaltic, '1 case'],
      ['/insurance-cases?tab=closed', 3, closedHandledByBaltic, '0 cases'],
    ] as const;
    for (const [at, view, page, total] of views) {
      const { markup } = cases(`${at}${at.includes('?') ? '&' : '?'}handled=${BALTIC}`,
        [[qk.insuranceCases.list(LIST(view, { HandledByInsurerId: BALTIC })), page]]);
      const filter = handledFilter(markup);
      expect(filter.selected).toBe(BALTIC);
      expect(filter.shown).toBe('Baltic Mutual');
      expect(markup).toContain('Clear filters');
      expect(markup).toContain(`>${total}<`);
      expect(count(markup, '<tr class=')).toBe(page.items.length);
    }
    // Closed holds no case handled by Baltic Mutual: the filters' own empty state.
    const closed = cases(`/insurance-cases?tab=closed&handled=${BALTIC}`, [[qk.insuranceCases.list(LIST(3, { HandledByInsurerId: BALTIC })), closedHandledByBaltic]]).markup;
    expect(closed).toContain('No results for these filters');
  });

  test('an insurer out of use is a filter like any other', () => {
    const { markup } = cases(`/insurance-cases?handled=${HARBOUR}`, [[qk.insuranceCases.list(LIST(1, { HandledByInsurerId: HARBOUR })), openHandledByHarbour]]);
    expect(handledFilter(markup).shown).toBe('Old Harbour Insurance · Out of use');
    expect(markup).toContain('No results for these filters');
  });

  test('an insurer the API does not know: its sentence under Handled by, and the list finds nothing', () => {
    const unknown = '5f9e2a61-0000-4000-8000-000000000000';
    const { markup } = cases(`/insurance-cases?handled=${unknown}`, [], insurersAllWithPilotOut, meDita,
      [[qk.insuranceCases.list(LIST(1, { HandledByInsurerId: unknown })), handledUnknownRefusal]]);
    const filter = handledFilter(markup);
    expect(filter.shown).toBe('Not on the list');
    expect(filter.filter).toMatch(/role="alert"[^>]*>.*This insurer does not exist\.<\/span>/);
    expect(markup).toContain('No results for these filters');
    expect(markup).not.toContain('The cases could not be loaded');
  });

  test('while the list of insurers loads, a filter set shows as being read', () => {
    const { markup } = cases(`/insurance-cases?handled=${BALTIC}`, [[qk.insuranceCases.list(LIST(1, { HandledByInsurerId: BALTIC })), openHandledByBaltic]], null);
    expect(handledFilter(markup).shown).toBe('…');
  });
});
