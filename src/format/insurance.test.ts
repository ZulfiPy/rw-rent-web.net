import { describe, expect, test } from 'vitest';
import {
  AtFaultParty, InsuranceCaseDriverSituation, InsuranceCaseParty, InsuranceCaseStatus, InsuranceCaseType,
  InsurerSide, type InsuranceCaseDriverSuggestionResponse,
} from '@/api/dto';
import {
  atFaultText, caseCount, caseSub, caseTitle, changeChips, changedText, closedText, daysAgoText, driverHint,
  durationText, handledInfo, handledLine, handledLong, laterText, photosDescription, placeText, rentalSub,
  sinceText, sizeText, waitText, waitingForUsText,
} from './insurance';

/** The words of Insurance cases (Follow-up 17), from the approved prototype's copy deck. */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('durations, rounded down (handover d)', () => {
  test('minutes under an hour, at least one; hours under a day; then whole days', () => {
    expect(durationText(0)).toBe('1 minute');
    expect(durationText(59_999)).toBe('1 minute');
    expect(durationText(2 * MIN + 59_000)).toBe('2 minutes');
    expect(durationText(HOUR - 1)).toBe('59 minutes');
    expect(durationText(HOUR)).toBe('1 hour');
    expect(durationText(23 * HOUR + 59 * MIN)).toBe('23 hours');
    expect(durationText(DAY)).toBe('1 day');
    expect(durationText(6 * DAY + 23 * HOUR)).toBe('6 days');
  });

  test('who a case waits for, and for how long; Nobody has no duration', () => {
    const now = new Date('2026-09-27T10:00:00Z');
    const since = '2026-09-25T09:00:00Z';
    expect(waitText({ waitingFor: InsuranceCaseParty.Us, waitingSinceUtc: since }, now)).toBe('Us · 2 days');
    expect(waitText({ waitingFor: InsuranceCaseParty.SomeoneElse, waitingSinceUtc: '2026-09-27T07:00:00Z' }, now)).toBe('Someone else · 3 hours');
    expect(waitText({ waitingFor: InsuranceCaseParty.Nobody, waitingSinceUtc: since }, now)).toBe('Nobody');
    expect(sinceText({ waitingFor: InsuranceCaseParty.Insurer, waitingSinceUtc: since }, now)).toBe('since 25 Sep, 12:00 · 2 days');
    expect(sinceText({ waitingFor: InsuranceCaseParty.Nobody, waitingSinceUtc: since }, now)).toBe('since 25 Sep, 12:00');
    expect(waitingForUsText(since, now)).toBe('Waiting for us · 2 days');
  });
});

describe('when things were', () => {
  test('a last event by the Tallinn calendar: Today, Yesterday, days ago, then its date', () => {
    // 00:30 on 28 Sep in Tallinn.
    const now = new Date('2026-09-27T21:30:00Z');
    expect(daysAgoText('2026-09-27T21:10:00Z', now)).toBe('Today');
    // 23:00 on 27 Sep in Tallinn: the day before, though only ninety minutes earlier.
    expect(daysAgoText('2026-09-27T20:00:00Z', now)).toBe('Yesterday');
    expect(daysAgoText('2026-09-24T08:00:00Z', now)).toBe('4 days ago');
    expect(daysAgoText('2026-08-29T08:00:00Z', now)).toBe('29 Aug');
  });

  test('the time between two entries of a timeline', () => {
    expect(laterText('2026-09-20T08:00:00Z', '2026-09-20T08:00:30Z')).toBe('At the same time');
    expect(laterText('2026-09-20T08:00:00Z', '2026-09-20T08:05:00Z')).toBe('5 minutes later');
    expect(laterText('2026-09-20T08:00:00Z', '2026-09-20T11:30:00Z')).toBe('3 hours later');
    expect(laterText('2026-09-18T08:00:00Z', '2026-09-20T09:00:00Z')).toBe('2 days later');
  });

  test('closed, and the rental’s dates', () => {
    expect(closedText('2026-09-12T10:00:00Z')).toBe('Closed 12 Sep');
    expect(rentalSub({ startedAtUtc: '2026-08-28T08:34:43Z', closedAtUtc: null })).toBe('Rental from 28 Aug');
    expect(rentalSub({ startedAtUtc: '2026-08-28T08:34:43Z', closedAtUtc: '2026-09-11T15:00:00Z' })).toBe('Rental from 28 Aug to 11 Sep');
  });
});

describe('a case in words', () => {
  const kase = {
    vehiclePlate: '552 KLM', damage: 'Rear bumper and boot lid dented', type: InsuranceCaseType.Usual,
    timeIsWhenFound: false, happenedAtUtc: '2026-09-08T05:35:00Z',
  };

  test('its title and the line under it', () => {
    expect(caseTitle(kase)).toBe('552 KLM · Rear bumper and boot lid dented');
    expect(caseSub(kase)).toBe('Usual · Happened 08 Sep');
    expect(caseSub({ ...kase, type: InsuranceCaseType.Casco, timeIsWhenFound: true })).toBe('Casco · Found 08 Sep');
    expect(caseCount(1)).toBe('1 case');
    expect(caseCount(7)).toBe('7 cases');
  });

  test('its place, marked when only one of the time and the place is the finding’s', () => {
    const place = 'Riga, Brivibas iela';
    expect(placeText({ place, timeIsWhenFound: false, placeIsWhereFound: false })).toBe(place);
    expect(placeText({ place, timeIsWhenFound: true, placeIsWhereFound: true })).toBe(place);
    expect(placeText({ place, timeIsWhenFound: false, placeIsWhereFound: true })).toBe(`${place} (where it was found)`);
    expect(placeText({ place, timeIsWhenFound: true, placeIsWhereFound: false })).toBe(`${place} (where it happened)`);
  });

  test('who handles it: the chosen side’s insurer, not decided yet, not reported', () => {
    const both = { ourInsurer: 'Baltic Mutual', ourClaimNumber: 'BM-1', otherInsurer: 'Meridian Insurance', otherClaimNumber: 'MI-2' };
    expect(handledInfo({ ...both, handledBy: InsurerSide.Theirs })).toEqual({ text: 'Meridian Insurance', sub: 'MI-2', dim: false });
    expect(handledInfo({ ...both, handledBy: InsurerSide.Ours })).toEqual({ text: 'Baltic Mutual', sub: 'BM-1', dim: false });
    expect(handledInfo({ ...both, handledBy: null })).toEqual({ text: 'Not decided yet', sub: '', dim: true });
    expect(handledInfo({})).toEqual({ text: 'Not reported', sub: '', dim: true });
    // A side chosen without its insurer (the API refuses it) reads as not decided.
    expect(handledInfo({ otherInsurer: 'Meridian Insurance', handledBy: InsurerSide.Ours }).text).toBe('Not decided yet');
    expect(handledLine({ ...both, handledBy: InsurerSide.Theirs })).toBe('Meridian Insurance · MI-2');
    expect(handledLine({})).toBe('Not reported');
    expect(handledLong({ ...both, handledBy: InsurerSide.Ours })).toBe('Baltic Mutual (ours)');
    expect(handledLong({ ...both, handledBy: InsurerSide.Theirs })).toBe('Meridian Insurance (the other party’s)');
    expect(handledLong({ ...both })).toBe('Not decided yet');
  });

  test('at fault, what an event changed, and photos', () => {
    expect(atFaultText(null)).toBe('Not decided yet');
    expect(atFaultText(AtFaultParty.OtherParty)).toBe('The other party');
    const both = { statusChangedTo: InsuranceCaseStatus.Reported, waitingForChangedTo: InsuranceCaseParty.Insurer };
    expect(changeChips(both)).toEqual(['Status: Reported', 'Waiting for: The insurer']);
    expect(changeChips({ statusChangedTo: null, waitingForChangedTo: InsuranceCaseParty.Nobody })).toEqual(['Waiting for: Nobody']);
    expect(changedText(both)).toBe('Status: Reported · Waiting for: The insurer');
    expect(changedText({ statusChangedTo: null, waitingForChangedTo: null }))
      .toBe('Nothing: the status and who the case waited for stayed as they were.');
    expect(photosDescription(0)).toBeUndefined();
    expect(photosDescription(1)).toBe('1 photo, by the entry they belong to.');
    expect(photosDescription(6)).toBe('6 photos, by the entry they belong to.');
    expect(sizeText(2_936_013)).toBe('2.8 MB');
    expect(sizeText(421_888)).toBe('412 KB');
    expect(sizeText(10)).toBe('1 KB');
  });
});

describe('the hint under Driver names the rental the server found (handover f)', () => {
  const rental = {
    vehiclePlate: '482 TKL', rentalAssignmentId: 'r1', customerDisplayName: 'Ilze Berzina',
    startedAtUtc: '2026-09-01T08:00:00Z', closedAtUtc: null,
  };
  const suggestion = (situation: InsuranceCaseDriverSituation, names: string[] = []): InsuranceCaseDriverSuggestionResponse => ({
    situation,
    rental: situation === InsuranceCaseDriverSituation.NotRented ? null : rental,
    drivers: names.map((displayName, i) => ({ driverId: `d${i}`, displayName })),
  });

  test('each situation in its words', () => {
    expect(driverHint(null, null)).toBe('Choose the car and the time, and the driver is filled in from its rental.');
    expect(driverHint(suggestion(InsuranceCaseDriverSituation.NotRented), '444 WKS'))
      .toBe('444 WKS was not rented at that time, so there is no driver to fill in.');
    expect(driverHint(suggestion(InsuranceCaseDriverSituation.OneDriver, ['Ilze Berzina']), '482 TKL'))
      .toBe('From the rental of 482 TKL for Ilze Berzina');
    expect(driverHint(suggestion(InsuranceCaseDriverSituation.SeveralDrivers, ['Janis Krumins', 'Kristine Vitola']), '482 TKL'))
      .toBe('Janis Krumins and Kristine Vitola were both authorised on the rental of 482 TKL for Ilze Berzina then. Choose who drove.');
    expect(driverHint(suggestion(InsuranceCaseDriverSituation.SeveralDrivers, ['A B', 'C D', 'E F']), '482 TKL'))
      .toBe('A B, C D and E F were all authorised on the rental of 482 TKL for Ilze Berzina then. Choose who drove.');
    expect(driverHint(suggestion(InsuranceCaseDriverSituation.BusinessCustomerDrivers), '482 TKL'))
      .toBe('482 TKL was on the rental for Ilze Berzina, driven by the customer’s own drivers, so no driver is filled in.');
    expect(driverHint(suggestion(InsuranceCaseDriverSituation.NoDriverNamed), '482 TKL'))
      .toBe('No driver was named on the rental of 482 TKL for Ilze Berzina at that time.');
  });
});
