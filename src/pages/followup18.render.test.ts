import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RecordKind, qk } from '@/api';
import { deletionInvalidates } from './admin/DeleteRecordDialog';
import { CASE_REFRESH } from './insurance/caseAddress';
import { INSURER_ADD_REFRESH, INSURER_CHANGE_REFRESH } from './insurance/InsurerDialogs';
import { around, clearTaskRenders, renderAs } from './followup12.harness';
import { CaseRecord } from './insurance/CaseRecord';
import { InsuranceCases } from './insurance/InsuranceCases';
import { countsDita, meDita, meToms } from './followup17.support';
import { PRACTICE18_AT, openHandledByPilot, practiceCaseOutOfUse, practiceCaseRenamed } from './followup18.practice';

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
