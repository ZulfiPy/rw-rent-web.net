import { createElement as h } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionBlockReason, RecordDeletionShow, RecordKind } from '@/api/dto';
import { blockSentence, deletionRefusal, takesSentence, wentWith } from '@/format';
import { AuditEntry } from './audit/AuditEntry';
import { DeleteRecordDialog, deletionInvalidates } from './admin/DeleteRecordDialog';
import { Confirmation, DeleteRecords } from './admin/DeleteRecords';
import { clearRenders, page, renderPage as render } from './followup7b.support';
import { countsEverything, deletionsMade } from './followup8.support';
import { vehicleWithRentalsDeleted } from './followup9.support';
import { deleteCaseKindRefusal, deletionDrivers, deletionVehicles } from './followup17.support';
import {
  practiceCarBlocked, practiceCarBlockedRefusal, practiceCarDeleted, practiceCarEntry, practiceCarReady,
  practiceDriverCandidate, practiceDriverDeleted, practiceDriverEntry,
} from './followup17.practice';

/**
 * Follow-up 17, F17-9: the Delete records page learns the backend's round 12, rendered to markup from
 * what the scratch API answered (`followup17.support.ts` for the seeded vehicles and drivers,
 * `followup17.practice.ts` for the joint check's practice car and driver). A vehicle with an open
 * insurance case is Blocked with reason 8, its cases linked beside the sentence; a vehicle takes its
 * closed cases along and a driver is cleared from theirs, in the counts, the dialog and the answer;
 * and the security audit reads the copies those deletions leave. The server decides; the page words it.
 */
afterEach(clearRenders);

const ADMIN = ['Records.Delete', 'SecurityAudit.ReadCompany', 'RentalAssignments.Read'];
const EVERYTHING = { PageNumber: 1, PageSize: 20, Show: RecordDeletionShow.Everything };

const list = (kind: RecordKind, slug: string, items: unknown[]) => render(h(DeleteRecords), {
  at: `/delete-records?kind=${slug}&show=all`,
  route: '/delete-records',
  permissions: ADMIN,
  data: [
    [qk.recordDeletions.candidates(kind, EVERYTHING), page(items)],
    [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything],
    [qk.recordDeletions.made({ PageSize: 20 }), page(deletionsMade)],
  ],
});

/** The markup of the table row that carries a text. */
const row = (markup: string, text: string): string => {
  const at = markup.indexOf(text);
  expect(at, `no row carries ${text}`).toBeGreaterThan(-1);
  return markup.slice(markup.lastIndexOf('<tr', at), markup.indexOf('</tr>', at));
};

const vehicle = (plate: string) => deletionVehicles.items.find((item) => item.plateNumber === plate)!;
const driver = (lastName: string) => deletionDrivers.items.find((item) => item.lastName === lastName)!;

describe('a vehicle with an open insurance case is Blocked with reason 8', () => {
  test('552 KLM: its running rental and its open case, each sentence in the API’s words, each record linked', () => {
    const klm = vehicle('552 KLM');
    expect(klm.deletion.blocks.map((block) => block.reason))
      .toEqual([RecordDeletionBlockReason.HasRunningRental, RecordDeletionBlockReason.HasOpenInsuranceCase]);
    const markup = list(RecordKind.Vehicle, 'vehicles', deletionVehicles.items);
    const blocked = row(markup, '552 KLM');
    expect(blocked).toContain('A running rental refers to this vehicle. End it first. One of its insurance cases is open. Close it first; then the vehicle can be deleted with its cases');
    const rental = klm.deletion.blocks[0]!.records[0]!;
    const kase = klm.deletion.blocks[1]!.records[0]!;
    expect(kase.kind).toBe(RecordKind.InsuranceCase);
    expect(blocked).toMatch(new RegExp(`<a [^>]*href="/rental-assignments/${rental.id}"[^>]*>${rental.label}</a>`));
    expect(blocked).toMatch(new RegExp(`<a [^>]*href="/insurance-cases/${kase.id}"[^>]*>552 KLM · Rear bumper and boot lid dented</a>`));
    expect(blocked).toContain('Takes 1 rental assignment, 1 driver authorization, 1 interruption and 1 insurance case with it');
    expect(blocked).toMatch(/<button[^>]*disabled=""[^>]*title="A running rental refers to this vehicle\. End it first\. One of its insurance cases is open\. Close it first; then the vehicle can be deleted with its cases\."/);
  });

  test('482 TKL: two open cases, counted and each linked', () => {
    const tkl = vehicle('482 TKL');
    const cases = tkl.deletion.blocks.find((block) => block.reason === RecordDeletionBlockReason.HasOpenInsuranceCase)!;
    expect(cases.count).toBe(2);
    const markup = list(RecordKind.Vehicle, 'vehicles', deletionVehicles.items);
    const blocked = row(markup, '482 TKL');
    expect(blocked).toContain('2 of its insurance cases are open. Close them first; then the vehicle can be deleted with its cases');
    for (const record of cases.records) expect(blocked).toContain(`href="/insurance-cases/${record.id}"`);
    expect(blocked).toContain('and 2 insurance cases with it');
  });

  test('a Ready vehicle takes its closed case along; the sentence reads it from the takes', () => {
    const markup = list(RecordKind.Vehicle, 'vehicles', deletionVehicles.items);
    const ndp = row(markup, '400 NDP');
    expect(ndp).toContain('Ready');
    expect(ndp).toContain('Takes 1 rental assignment, 1 driver authorization, 1 interruption and 1 insurance case with it');
    // The practice car of the joint check: its case open, then closed.
    expect(blockSentence(RecordKind.Vehicle, practiceCarBlocked.deletion.blocks))
      .toBe('One of its insurance cases is open. Close it first; then the vehicle can be deleted with its cases');
    expect(takesSentence(practiceCarReady.deletion.takes)).toBe('Takes 1 insurance case with it');
  });

  test('its refused deletion is worded by the API itself; since round 14 a case is a kind of its own, the seventh tab (Follow-up 19)', () => {
    expect(deletionRefusal(practiceCarBlockedRefusal.code, practiceCarBlockedRefusal.detail)).toEqual({
      title: 'One of its insurance cases is open. Close it first; then the vehicle can be deleted with its cases.',
      detail: 'Refresh the list.',
    });
    const markup = list(RecordKind.Vehicle, 'vehicles', deletionVehicles.items);
    // Before Follow-up 19: six tabs, none of them Insurance cases.
    expect(markup.match(/role="tab"/g)).toHaveLength(7);
    // Last, with the navigation's shield; round 12's counts hold no insurance cases, so no count shows.
    expect(markup).toMatch(/role="tab"[^>]*><span[^>]*>shield<\/span>Insurance cases<\/button><\/div>/);
    // Round 12's refusal of the kind, as that API gave it; round 14 no longer sends it.
    expect(deleteCaseKindRefusal.detail).toBe('An insurance case is deleted only together with its vehicle.');
  });
});

describe('a driver’s deletion clears the driver of their cases', () => {
  test('the drivers’ rows count the cases they would be cleared from, beside the customer links', () => {
    const markup = list(RecordKind.Driver, 'drivers', deletionDrivers.items);
    expect(driver('Vitola').deletion.takes.insuranceCaseDriversCleared).toBe(2);
    expect(row(markup, driver('Vitola').driverLicenseNumber)).toContain('Takes 1 driver authorization with it. Clears the driver of 2 insurance cases');
    expect(row(markup, driver('Kalnina').driverLicenseNumber))
      .toContain('Takes 1 driver authorization with it. Clears the driver link of 1 customer record. Clears the driver of 1 insurance case');
  });
});

describe('the delete dialog and the answer name the cases', () => {
  const dialog = (target: Parameters<typeof DeleteRecordDialog>[0]['target']) => render(
    h(DeleteRecordDialog, { target, onClose: () => {}, onDeleted: () => {}, onRefresh: () => {} }),
    { at: '/x', route: '/x', permissions: ADMIN },
  );

  test('a vehicle’s dialog: its insurance case goes with it, with its events, notes and photos', () => {
    const markup = dialog({ kind: RecordKind.Vehicle, value: practiceCarReady });
    expect(markup).toContain('Its 1 insurance case, with its events, notes and photos, is removed with it.');
    expect(markup).not.toContain('Nothing else goes with it.');
    expect(markup).toContain('This vehicle and the 1 insurance case cannot be restored from the app.');
  });

  test('a driver’s dialog: the driver is cleared from their case, which stays', () => {
    const markup = dialog({ kind: RecordKind.Driver, value: practiceDriverCandidate });
    expect(markup).toContain('The driver is cleared from 1 insurance case; the case stays.');
    expect(markup).not.toContain('Nothing else goes with it.');
  });

  test('the confirmation line reports the cases by the deletion’s own answer; an older answer reads as before', () => {
    expect(practiceCarDeleted.deletedInsuranceCaseCount).toBe(1);
    const car = render(h(Confirmation, { done: practiceCarDeleted, canAudit: false }), { at: '/x', route: '/x' });
    expect(car).toContain(`Vehicle deleted:</span> ${practiceCarDeleted.recordLabel}. 1 insurance case went with it. Written to the security audit.`);
    const person = render(h(Confirmation, { done: practiceDriverDeleted, canAudit: false }), { at: '/x', route: '/x' });
    expect(person).toContain('The driver of 1 insurance case was cleared.');
    // Round 8's answer, without round 12's counts: the same sentence as before.
    expect(wentWith(vehicleWithRentalsDeleted)).toBe('2 rental assignments, 2 driver authorizations and 1 interruption went with it.');
  });

  test('a vehicle’s or a driver’s deletion refreshes the insurance cases too', () => {
    const keys = (kind: typeof RecordKind.Vehicle | typeof RecordKind.Driver) => deletionInvalidates(kind).map((key) => key.join('/'));
    expect(keys(RecordKind.Vehicle)).toContain(qk.insuranceCases.all.join('/'));
    expect(keys(RecordKind.Driver)).toContain(qk.insuranceCases.all.join('/'));
  });
});

describe('the security audit reads the copies round 12’s deletions leave', () => {
  const entry = (value: typeof practiceCarEntry) => render(h(AuditEntry), {
    at: `/security-audit/${value.id}`,
    route: '/security-audit/:entryId',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[qk.audit.entry(value.id), value]],
  });

  test('a vehicle’s entry: the case that went, with its photo, its event, and the other car’s case that lost its link', () => {
    const copy = JSON.parse(practiceCarEntry.beforeJson!) as {
      InsuranceCases: Array<{ RecordLabel: string }>;
      ClearedAccidentLinks: Array<{ InsuranceCaseLabel: string }>;
    };
    const markup = entry(practiceCarEntry);
    expect(markup).toContain('Deleted record');
    expect(markup).toContain('Deleted insurance cases');
    expect(markup).toContain(`Insurance case 1 · ${copy.InsuranceCases[0]!.RecordLabel}`);
    expect(markup).toContain('>Photo 1<');
    expect(markup).toContain('bonnet.png');
    expect(markup).toContain('>Event 1<');
    expect(markup).toContain('Repaired at our cost');
    expect(markup).toContain('Cleared accident links');
    expect(markup).toContain(copy.ClearedAccidentLinks[0]!.InsuranceCaseLabel);
    // The deleted-record view, not the raw fallback.
    expect(markup).not.toContain('Recorded values');
    expect(markup).not.toContain('Before → after');
  });

  test('a driver’s entry names the case whose driver was cleared', () => {
    const copy = JSON.parse(practiceDriverEntry.beforeJson!) as { ClearedInsuranceCaseDrivers: Array<{ InsuranceCaseLabel: string }> };
    const markup = entry(practiceDriverEntry);
    expect(markup).toContain('Cleared case drivers');
    expect(markup).toContain(copy.ClearedInsuranceCaseDrivers[0]!.InsuranceCaseLabel);
    expect(markup).not.toContain('Recorded values');
  });
});
