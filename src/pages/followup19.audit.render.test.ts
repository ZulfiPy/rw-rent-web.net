import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { RecordDeletionShow, RecordKind } from '@/api/dto';
import { deletedRecord, entityLabel, eventLabel } from '@/format';
import { AuditEntry } from './audit/AuditEntry';
import { SecurityAudit } from './audit/SecurityAudit';
import { DeleteRecords } from './admin/DeleteRecords';
import { clearTaskRenders, renderAs } from './followup12.harness';
import { meAdmin } from './followup17.support';
import { practiceCarEntry } from './followup17.practice';
import {
  R14_CAPTURED_AT, caseCandidatesEverything, countsEverything19, deletionsMade19, practiceCar19Entry, practiceCaseEntry,
} from './followup19.support';

/**
 * Follow-up 19, F19-2: the security audit reads the entry a closed insurance case's deletion leaves
 * (the backend's round 14), rendered from the entry round 14 wrote on 5003. It names the event
 * "Insurance case · Deleted" and its entity Insurance case, and reads the copy as it reads a car's
 * cases: the case's facts, the photos it was registered with, its events with theirs, its notes, and
 * the cases that lost their accident link. Recently deleted names the kind.
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
const DOOR = '770 HDV · Practice: front left door scratched';

const casesEverything = () => renderAs(h(DeleteRecords), {
  at: '/delete-records?kind=insurance-cases', route: '/delete-records', me: meAdmin,
  data: [
    [qk.recordDeletions.candidates(RecordKind.InsuranceCase, EVERYTHING), caseCandidatesEverything],
    [qk.recordDeletions.counts(RecordDeletionShow.Everything), countsEverything19],
    [qk.recordDeletions.made({ PageSize: 20 }), deletionsMade19],
  ],
}).markup;

describe('Recently deleted and the security audit', () => {
  const entry = (value: typeof practiceCaseEntry) => renderAs(h(AuditEntry), {
    at: `/security-audit/${value.id}`, route: '/security-audit/:entryId', me: meAdmin,
    data: [[qk.audit.entry(value.id), value]],
  }).markup;

  test('Recently deleted names the kind Insurance case, linked to its entry', () => {
    const markup = casesEverything();
    const made = deletionsMade19.items.find((one) => one.kind === RecordKind.InsuranceCase)!;
    expect(markup).toMatch(new RegExp(`<a class="_quietLink_[^"]*" href="/security-audit/${made.auditEntryId}"[^>]*>Insurance case · ${DOOR}</a>`));
  });

  test('the audit names the event “Insurance case · Deleted” and its entity Insurance case, and offers the event in its filter', () => {
    expect(eventLabel('InsuranceCase.Deleted')).toBe('Insurance case · Deleted');
    expect(entityLabel('InsuranceCase')).toBe('Insurance case');
    const markup = renderAs(h(SecurityAudit), { at: '/security-audit', route: '/security-audit', me: meAdmin }).markup;
    expect(markup).toContain('>Insurance case · Deleted</option>');
  });

  test('the entry reads the copy as it reads a car’s cases: the case’s facts, its photo, its events with theirs, its note, the case that lost its link', () => {
    const copy = JSON.parse(practiceCaseEntry.beforeJson!) as { ClearedAccidentLinks: Array<{ InsuranceCaseLabel: string }> };
    const markup = entry(practiceCaseEntry);
    expect(markup).toMatch(/>Event<\/span><span[^>]*>Insurance case · Deleted</);
    expect(markup).toMatch(/>Entity<\/span><span[^>]*>Insurance case</);
    expect(markup).toContain(`>${DOOR}<`);
    expect(markup).toContain('Deleted record');
    expect(markup).toMatch(/>Damage<\/span><span[^>]*>Practice: front left door scratched</);
    expect(markup).toMatch(/>Status<\/span><span[^>]*>Closed</);
    expect(markup).toContain('>Deleted photos<');
    expect(markup).toContain('door-registered.png');
    expect(markup).toContain('>Deleted events<');
    expect(markup).toContain('>Event 1</p>');
    expect(markup).toContain('Photos sent to the insurer');
    expect(markup).toContain('door-sent.png');
    expect(markup).toContain('>Event 2</p>');
    expect(markup).toContain('Closed for practice');
    expect(markup).toContain('>Deleted notes<');
    expect(markup).toContain('Practice note of Follow-up 19.');
    expect(markup).toContain('>Cleared accident links<');
    expect(markup).toContain('These cases named the deleted case as the same accident; the links were cleared and the cases stay.');
    expect(markup).toContain(copy.ClearedAccidentLinks[0]!.InsuranceCaseLabel);
    // The deleted-record view, not the raw fallback.
    expect(markup).not.toContain('Recorded values');
    expect(markup).not.toContain('Unrecognised payload shape');
  });

  test('the copy’s shape: its lists at the top, each part once, never among the facts; anything else falls back as before', () => {
    const read = deletedRecord(practiceCaseEntry.eventType, practiceCaseEntry.beforeJson)!;
    expect(read.recordLabel).toBe(DOOR);
    expect(read.photos).toHaveLength(1);
    expect(read.events.map((event) => event.photos.length)).toEqual([1, 0]);
    expect(read.notes).toHaveLength(1);
    expect(read.clearedAccidentLinks.map((link) => link.label)).toEqual(['770 HDV · Practice: the casco claim of the same door']);
    expect(read.facts.map((fact) => fact.key)).not.toEqual(expect.arrayContaining(['Photos', 'Events', 'Notes', 'RecordLabel', 'DeletionReason']));
    expect(read.insuranceCases).toEqual([]);
    // A list the copy does not know, and a vehicle's copy with a case's lists at its top, fall back.
    const body = JSON.parse(practiceCaseEntry.beforeJson!) as Record<string, unknown>;
    expect(deletedRecord('InsuranceCase.Deleted', JSON.stringify({ ...body, Somewhere: [] }))).toBeNull();
    expect(deletedRecord('Vehicle.Deleted', practiceCaseEntry.beforeJson)).toBeNull();
    // A vehicle's entry reads as before, with no case's own parts.
    const car = deletedRecord(practiceCarEntry.eventType, practiceCarEntry.beforeJson)!;
    expect([car.photos, car.events, car.notes]).toEqual([[], [], []]);
    expect(car.insuranceCases).toHaveLength(1);
  });

  test('a car’s entry keeps its words for the cases of other cars that lost their link', () => {
    const copy = JSON.parse(practiceCar19Entry.beforeJson!) as { ClearedAccidentLinks: Array<{ InsuranceCaseLabel: string }> };
    const markup = entry(practiceCar19Entry);
    expect(markup).toContain('These cases of other cars named a deleted case as their accident’s; the links were cleared and the cases stay.');
    expect(markup).toContain(copy.ClearedAccidentLinks[0]!.InsuranceCaseLabel);
    expect(markup).toContain('Deleted insurance cases');
    expect(markup).not.toContain('>Deleted events<');
  });
});
