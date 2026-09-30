import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import {
  RecordDeletionBlockReason, RecordDeletionShow, RecordKind, type InsuranceCaseDeletionCandidateResponse,
  type ProblemDetails, type RecordDeletionTakes,
} from '@/api/dto';
import {
  AUDIT_CONSEQUENCE, blockSentence, candidateDescription, cannotBeRestored, deletionConsequences, deletionRefusal,
  outOfUseEmpty, takesSentence, wentWith,
} from '@/format';
import { DeleteRecordDialog, deletionInvalidates } from './admin/DeleteRecordDialog';
import { Confirmation, DeleteRecords } from './admin/DeleteRecords';
import { clearTaskRenders, count, renderAs } from './followup12.harness';
import { TABLET, declared, readRules } from './followup14.stylesheet';
import { countsEverything } from './followup11.support';
import { meAdmin } from './followup17.support';
import { practiceCarDeleted } from './followup17.practice';
import {
  R14_CAPTURED_AT, caseCandidatesEverything, caseCandidatesOutOfUse, caseCandidatesSearchBaltic, countsEverything19,
  countsOutOfUse19, deletionsMade19, openCaseRefusal, practiceCar19Deleted, practiceCaseDeleted, practiceCaseGoneRefusal,
  vehicleCandidates19,
} from './followup19.support';

/**
 * Follow-up 19, F19-2: the Delete records page learns the backend's round 14, rendered to markup from
 * what round 14 answered on 5003 (`followup19.support.ts`). A seventh tab, Insurance cases, lists the
 * cases as the other kinds list a record; a closed case is Ready and says what goes with it, an open
 * one is Blocked with the API's own sentence and nothing linked beside it; the delete window, the
 * confirmation line and a car's delete window say what goes and which accident links are cleared
 * (the security audit is `followup19.audit.render.test.ts`). The server decides; the page words it.
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R14_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const EVERYTHING = { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything };
const OUT_OF_USE = { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.OutOfUse };
const MADE = [qk.recordDeletions.made({ PageSize: 20 }), deletionsMade19] as const;

/** The Delete records page as the administrator reads it, on one kind's tab. */
const renderList = (at: string, data: Array<[readonly unknown[], unknown]>, errors: Array<[readonly unknown[], ProblemDetails]> = []) =>
  renderAs(h(DeleteRecords), { at, route: '/delete-records', me: meAdmin, data: [...data, [...MADE]], errors }).markup;

const casesEverything = () => renderList('/delete-records?kind=insurance-cases', [
  [qk.recordDeletions.candidates(RecordKind.InsuranceCase, EVERYTHING), caseCandidatesEverything],
  [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
]);

/** The markup of the table row that carries a text. */
const row = (markup: string, text: string): string => {
  const at = markup.indexOf(text);
  expect(at, `no row carries ${text}`).toBeGreaterThan(-1);
  return markup.slice(markup.lastIndexOf('<tr', at), markup.indexOf('</tr>', at));
};

/** A row's cells, each one's inner markup. */
const cells = (tr: string) => [...tr.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((m) => m[1]!);

const item = (label: string): InsuranceCaseDeletionCandidateResponse => {
  const found = caseCandidatesEverything.items.find((candidate) => candidate.recordLabel === label);
  expect(found, `no case ${label}`).toBeDefined();
  return found!;
};
const DOOR = '770 HDV · Practice: front left door scratched';
const BONNET = 'P19 26C · Practice: the bonnet dented';
const WINDSCREEN = '204 JLM · Windscreen cracked by a stone';
const SCRATCHES = '770 HDV · Long scratches on both left doors';
const NDP = '400 NDP · Right mirror broken by a passing van';

const takes = (over: Partial<RecordDeletionTakes>): RecordDeletionTakes => ({
  rentalAssignments: 0, driverAuthorizations: 0, interruptions: 0, customerLinksCleared: 0, ...over,
});

describe('the seventh tab, Insurance cases', () => {
  test('last, with the navigation’s shield and its count; the cases list’s search; the four columns', () => {
    const markup = casesEverything();
    expect(markup.match(/role="tab"/g)).toHaveLength(7);
    expect(markup).toMatch(/role="tab" aria-selected="true"[^>]*><span[^>]*>shield<\/span>Insurance cases<span[^>]*>11<\/span><\/button><\/div>/);
    expect(markup).toContain('placeholder="Plate, damage, driver, insurer or claim"');
    expect(markup).toContain('>11 insurance cases</span>');
    expect([...markup.matchAll(/<th scope="col"[^>]*>([^<]*)</g)].slice(0, 4).map((m) => m[1])).toEqual(['Case', 'Status', 'Closed', 'Deletion']);
    // Each of the eleven cases once, newest registered first, as the API ordered them.
    expect(count(markup, 'href="/insurance-cases/')).toBe(11);
    expect(markup.indexOf('444 WKS · Practice: the other car of the same accident')).toBeLessThan(markup.indexOf(NDP));
  });

  test('Out of use lists the closed cases, all Ready, with the tab counting them under the filter', () => {
    const markup = renderList('/delete-records?kind=insurance-cases&show=out-of-use', [
      [qk.recordDeletions.candidates(RecordKind.InsuranceCase, OUT_OF_USE), caseCandidatesOutOfUse],
      [qk.recordDeletions.counts(RecordDeletionShow.OutOfUse), countsOutOfUse19],
      [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
    ]);
    expect(markup).toMatch(/shield<\/span>Insurance cases<span[^>]*>4<\/span>/);
    expect(markup).toContain('>4 insurance cases</span>');
    expect(count(markup, '>Ready</span>')).toBe(4);
    expect(markup).not.toContain('>Blocked</span>');
    expect(markup).toContain('Clear filters');
  });

  test('the empty list under Out of use names the open insurance cases under Everything, with the switch to it', () => {
    const markup = renderList('/delete-records?kind=insurance-cases&show=out-of-use', [
      [qk.recordDeletions.candidates(RecordKind.InsuranceCase, OUT_OF_USE), { ...caseCandidatesOutOfUse, items: [], totalCount: 0, totalPages: 0 }],
      [qk.recordDeletions.counts(RecordDeletionShow.OutOfUse), { ...countsOutOfUse19, insuranceCases: 0 }],
      [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
    ]);
    expect(markup).toContain('Nothing out of use here');
    expect(markup).toContain('11 open insurance cases are under Everything.');
    expect(markup).toContain('Show everything');
    expect(outOfUseEmpty(RecordKind.InsuranceCase, 1)).toBe('1 open insurance case is under Everything.');
    expect(outOfUseEmpty(RecordKind.InsuranceCase, 0)).toBeNull();
  });

  test('its search is sent as the cases list’s is, and finds the cases by an insurer’s name', () => {
    const markup = renderList('/delete-records?kind=insurance-cases&search=baltic', [
      [qk.recordDeletions.candidates(RecordKind.InsuranceCase, { ...EVERYTHING, Search: 'baltic' }), caseCandidatesSearchBaltic],
      [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
    ]);
    expect(markup).toContain('value="baltic"');
    expect(markup).toContain('>4 insurance cases</span>');
    for (const found of caseCandidatesSearchBaltic.items) expect(markup).toContain(`>${found.recordLabel}</a>`);
  });

  test('an API before round 14, as the owner’s and the practice copy’s are until their upgrade: the tab shows no count, and the list its error', () => {
    const markup = renderList('/delete-records?kind=insurance-cases', [
      [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything],
    ], [[qk.recordDeletions.candidates(RecordKind.InsuranceCase, EVERYTHING), { status: 404, title: 'Not Found' }]]);
    expect(markup).toMatch(/shield<\/span>Insurance cases<\/button><\/div>/);
    expect(markup).not.toContain('undefined');
    expect(markup).toMatch(/Vehicles<span[^>]*>10<\/span>/);
    expect(markup).toContain('The records could not be loaded');
    expect(markup).toContain('Not Found');
  });
});

describe('each case, as the other kinds show a record', () => {
  test('a closed case: its label linked to the case, its type and when it happened under it, its status chip, when it was closed, Ready and what goes', () => {
    const door = item(DOOR);
    const [kase, status, closed, deletion] = cells(row(casesEverything(), `>${DOOR}</a>`));
    expect(kase).toMatch(new RegExp(`<a class="[^"]*_quietLink_[^"]*" href="/insurance-cases/${door.id}"[^>]*>${DOOR}</a>`));
    expect(kase).toContain('>Usual · Happened 28 Sep</span>');
    expect(status).toMatch(/data-tone="mute"><span[^>]*><\/span>Closed<\/span>/);
    expect(closed).toContain('>30 Sep</span>');
    expect(deletion).toContain('>Ready</span>');
    expect(deletion).toContain('Takes 2 events, 1 note and 2 photos with it. Clears the accident link of 1 insurance case');
  });

  test('a case whose time is when it was found says Found; an open case shows nothing under Closed', () => {
    const [kase, status, closed] = cells(row(casesEverything(), `>${SCRATCHES}</a>`));
    expect(kase).toContain('>Usual · Found 28 Sep</span>');
    expect(status).toContain('Happened</span>');
    expect(closed).toBe('');
  });

  test('an open case is Blocked with the sentence and nothing linked beside it; its Delete says the sentence and does nothing', () => {
    const windscreen = item(WINDSCREEN);
    expect(windscreen.deletion.blocks).toEqual([{ reason: RecordDeletionBlockReason.InsuranceCaseIsOpen, count: 1, records: [] }]);
    const tr = row(casesEverything(), `>${WINDSCREEN}</a>`);
    const [, status, , deletion, action] = cells(tr);
    expect(status).toContain('Repair</span>');
    expect(deletion).toContain('>Blocked</span>');
    expect(deletion).toContain('>This insurance case is open. Close it first; then it can be deleted</span>');
    // No record beside the sentence: the row is the case, and its label opens it.
    expect(deletion).not.toContain('<a ');
    expect(deletion).not.toContain('_blockers_');
    expect(count(tr, '<a ')).toBe(1);
    // What would go stays true once the case is closed: the spec's own example.
    expect(deletion).toContain('Takes 2 events, 1 note and 2 photos with it');
    expect(action).toMatch(/<button[^>]*disabled=""[^>]*title="This insurance case is open\. Close it first; then it can be deleted\."/);
  });

  test('what a deletion takes, in the page’s words, each only when not zero', () => {
    const markup = casesEverything();
    expect(cells(row(markup, `>${BONNET}</a>`))[3]).toContain('Takes 1 event and 1 photo with it. Clears the accident link of 1 insurance case');
    expect(cells(row(markup, '>119 MPR · Rear door dented in a car park, the other car left</a>'))[3]).toContain('Takes 2 events with it<');
    expect(cells(row(markup, `>${SCRATCHES}</a>`))[3]).toContain('Takes 1 note and 3 photos with it<');
    expect(cells(row(markup, '>444 WKS · Practice: the other car of the same accident</a>'))[3]).toContain('Nothing else goes with it');
    expect(takesSentence(takes({ insuranceCaseEvents: 1, insuranceCaseNotes: 2, accidentLinksCleared: 2 })))
      .toBe('Takes 1 event and 2 notes with it. Clears the accident link of 2 insurance cases');
  });

  test('a case refused as open is worded by the API itself, the same sentence as the row’s; one already gone leaves the list', () => {
    expect(deletionRefusal(openCaseRefusal.code as string, openCaseRefusal.detail)).toEqual({
      title: 'This insurance case is open. Close it first; then it can be deleted.',
      detail: 'Refresh the list.',
    });
    expect(`${blockSentence(RecordKind.InsuranceCase, item(WINDSCREEN).deletion.blocks)}.`).toBe(openCaseRefusal.detail);
    expect(deletionRefusal(practiceCaseGoneRefusal.code as string, practiceCaseGoneRefusal.detail))
      .toEqual({ title: 'This record is no longer in the list.', detail: 'Refresh the list.' });
  });

  test('the Status column is as wide as the cases list’s at every band, so Under review stays whole; the others as a vehicle’s', () => {
    const sheet = readRules(new URL('./admin/DeleteRecords.module.css', import.meta.url));
    expect(declared(sheet, '.cStatus')).toEqual({ width: '132px' });
    expect(declared(sheet, '.cStatus', TABLET)).toEqual({ width: '120px' });
    const header = /<thead>.*?<\/thead>/.exec(casesEverything())![0];
    expect(header).toMatch(/_cStatus_[^"]*">Status</);
    expect(header).toMatch(/_c118_[^"]*">Closed</);
    expect(header).toMatch(/_c300_[^"]*">Deletion</);
    expect(casesEverything()).toMatch(/<table class="[^"]*_records_/);
  });

  test('a case’s deletion refreshes the page, the audit, the Overview, the cases and the insurers', () => {
    const keys = deletionInvalidates(RecordKind.InsuranceCase).map((key) => key.join('/'));
    for (const key of [qk.recordDeletions.all, qk.audit.all, qk.overview, qk.insuranceCases.all, qk.insurers.all]) {
      expect(keys).toContain(key.join('/'));
    }
  });
});

describe('the delete window', () => {
  const dialog = (value: InsuranceCaseDeletionCandidateResponse) => renderAs(
    h(DeleteRecordDialog, { target: { kind: RecordKind.InsuranceCase, value }, onClose: () => {}, onDeleted: () => {}, onRefresh: () => {} }),
    { at: '/x', route: '/x', me: meAdmin },
  ).markup;

  test('the practice case: its line, what goes with it and what stays, the case naming it, the audit line, and the tick naming them', () => {
    const door = item(DOOR);
    expect(candidateDescription({ kind: RecordKind.InsuranceCase, value: door })).toBe(`${DOOR} · Usual · Closed 30 Sep`);
    const consequences = [
      'The insurance case is removed permanently.',
      'Its 2 events, 1 note and 2 photos are removed with it.',
      'Its car, driver, insurers and every other case stay as they are.',
      'The 1 insurance case that names it as the same accident loses that link and stays.',
      AUDIT_CONSEQUENCE,
    ];
    expect(deletionConsequences(RecordKind.InsuranceCase, door.deletion.takes)).toEqual(consequences);
    const markup = dialog(door);
    expect(markup).toContain('>Delete insurance case</h2>');
    expect(markup).toContain(`${DOOR} · Usual · Closed 30 Sep`);
    for (const line of consequences) expect(markup).toContain(`>${line}</li>`);
    expect(markup).toContain('This insurance case and the 2 events, 1 note and 2 photos cannot be restored from the app.');
    expect(markup).toContain('Delete permanently');
  });

  test('a case no other case names: no link line; one event and one photo; the words for many', () => {
    const ndp = item(NDP);
    expect(deletionConsequences(RecordKind.InsuranceCase, ndp.deletion.takes)).toEqual([
      'The insurance case is removed permanently.',
      'Its 3 events and 1 photo are removed with it.',
      'Its car, driver, insurers and every other case stay as they are.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.InsuranceCase, takes({ insuranceCaseEvents: 1 }))[1]).toBe('Its 1 event is removed with it.');
    expect(deletionConsequences(RecordKind.InsuranceCase, takes({ insuranceCaseEvents: 1, accidentLinksCleared: 2 }))[3])
      .toBe('The 2 insurance cases that name it as the same accident lose that link and stay.');
    expect(deletionConsequences(RecordKind.InsuranceCase, takes({}))[1]).toBe('Nothing else goes with it.');
    expect(cannotBeRestored(RecordKind.InsuranceCase, takes({}))).toBe('This insurance case cannot be restored from the app.');
    // An open case never reaches the window; its line would read its status.
    expect(candidateDescription({ kind: RecordKind.InsuranceCase, value: item(WINDSCREEN) })).toBe(`${WINDSCREEN} · Casco · Repair`);
  });

  test('the confirmation line after the deletion, from the answer’s counts', () => {
    const markup = renderAs(h(Confirmation, { done: practiceCaseDeleted, canAudit: true }), { at: '/x', route: '/x', me: meAdmin }).markup;
    expect(markup).toContain(`Insurance case deleted:</span> ${DOOR}. 2 events, 1 note and 2 photos went with it. The accident link of 1 insurance case was cleared. <a href="/security-audit/${practiceCaseDeleted.auditEntryId}"`);
    // An answer before round 14 reads as before.
    expect(wentWith(practiceCarDeleted)).toBe('1 insurance case went with it.');
  });
});

describe('a car’s deletion clears the accident links of other cars’ cases', () => {
  const car = vehicleCandidates19.items.find((candidate) => candidate.plateNumber === 'P19 26C')!;

  test('its row: the case it takes and the link it clears; a car whose case only its own case names clears none', () => {
    const markup = renderList('/delete-records?kind=vehicles', [
      [qk.recordDeletions.candidates(RecordKind.Vehicle, EVERYTHING), vehicleCandidates19],
      [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
    ]);
    expect(row(markup, '>P19 26C</a>')).toContain('Takes 1 insurance case with it. Clears the accident link of 1 insurance case');
    expect(row(markup, '>770 HDV</a>')).not.toContain('accident link');
  });

  test('its window says how many cases of other cars lose their link, and its confirmation line says it was cleared', () => {
    expect(deletionConsequences(RecordKind.Vehicle, car.deletion.takes)).toEqual([
      'The vehicle is removed permanently.',
      'Its 1 insurance case, with its events, notes and photos, is removed with it.',
      'The accident link of 1 insurance case of another car is cleared; that case stays.',
      AUDIT_CONSEQUENCE,
    ]);
    expect(deletionConsequences(RecordKind.Vehicle, takes({ insuranceCases: 2, accidentLinksCleared: 3 }))[2])
      .toBe('The accident links of 3 insurance cases of other cars are cleared; those cases stay.');
    const markup = renderAs(h(Confirmation, { done: practiceCar19Deleted, canAudit: false }), { at: '/x', route: '/x', me: meAdmin }).markup;
    expect(markup).toContain('Vehicle deleted:</span> P19 26C · Fiat Panda 2020. 1 insurance case went with it. The accident link of 1 insurance case was cleared. Written to the security audit.');
  });
});
