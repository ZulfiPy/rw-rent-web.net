import { describe, expect, test } from 'vitest';
import { COMMON_WORDS, holdsFind, insurerCount, insurerKey, lookAlikes, looksAlike, mailHref, telHref } from './insurers';

/**
 * Follow-up 18, F18-2c and F18-2d: the two ways the app offers the insurers while a name is typed. The
 * picker's find box keeps the insurers whose names hold what is typed; the Add insurer and Edit insurer
 * windows show the insurers that look alike, as the mock-up the owner approved had them. Both ignore
 * letter case, accents and runs of spaces. The server alone decides which names are one name.
 */
const SEED = ['Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance'];
const alike = (typed: string) => SEED.filter((name) => looksAlike(name, typed));

describe('the words', () => {
  test('a name as it is compared: letter case, accents and runs of spaces ignored', () => {
    expect(insurerKey('  Baltic   MUTUAL ')).toBe('baltic mutual');
    expect(insurerKey('Ērgo  Insurance')).toBe('ergo insurance');
    expect(insurerKey('Seesam\tPolska')).toBe('seesam polska');
  });

  test('the count, the mail and the phone links', () => {
    expect(insurerCount(1)).toBe('1 insurer');
    expect(insurerCount(4)).toBe('4 insurers');
    expect(insurerCount(0)).toBe('0 insurers');
    expect(mailHref('claims@balticmutual.example')).toBe('mailto:claims@balticmutual.example');
    expect(telHref('+371 6700 1100')).toBe('tel:+37167001100');
    expect(telHref('(372) 600-2200')).toBe('tel:3726002200');
  });
});

describe('the picker’s find box (F18-2d)', () => {
  test('an insurer whose name holds what is typed, whatever the letters, accents and spaces', () => {
    expect(SEED.filter((name) => holdsFind(name, 'insurance'))).toEqual(['Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance']);
    expect(SEED.filter((name) => holdsFind(name, 'BALTIC  mu'))).toEqual(['Baltic Mutual']);
    expect(holdsFind('Ērgo Insurance', 'ergo')).toBe(true);
    // Nothing typed holds every name; a name is not found by its initials here.
    expect(SEED.filter((name) => holdsFind(name, ''))).toEqual(SEED);
    expect(SEED.filter((name) => holdsFind(name, 'BM'))).toEqual([]);
  });
});

describe('the insurers that look alike (F18-2c)', () => {
  test('its name holds what is typed', () => {
    expect(alike('meridian')).toEqual(['Meridian Insurance']);
    expect(alike('  old   HARBOUR')).toEqual(['Old Harbour Insurance']);
  });

  test('what is typed holds a word of four letters or more of its name', () => {
    // "Insurance" is a common word (F18-4): it no longer brings every "… Insurance".
    expect(alike('Baltic Mutual Insurance AS')).toEqual(['Baltic Mutual']);
    expect(alike('Northgate Group')).toEqual(['Northgate Insurance']);
    // "Old" has three letters: typing it inside another name does not bring Old Harbour.
    expect(alike('Bold Riga')).toEqual([]);
  });

  test('what is typed, without spaces, is its initials: "BM" shows Baltic Mutual', () => {
    expect(alike('BM')).toEqual(['Baltic Mutual']);
    expect(alike('b m')).toEqual(['Baltic Mutual']);
    expect(alike('ohi')).toEqual(['Old Harbour Insurance']);
    expect(alike('MI')).toEqual(['Meridian Insurance']);
  });

  test('from two letters on, and never for a name that matches none of the three', () => {
    expect(alike('B')).toEqual([]);
    expect(alike(' ')).toEqual([]);
    expect(alike('Pilot Insurance AS')).toEqual([]);
    expect(alike('Pilot')).toEqual([]);
  });

  test('accents and letter case are ignored on both sides', () => {
    expect(looksAlike('Ērgo Insurance', 'ERGO')).toBe(true);
    expect(looksAlike('Baltic Mutual', 'BALTIČ')).toBe(true);
  });

  test('the list’s look-alikes in its order, an edited insurer not its own', () => {
    const list = SEED.map((name, n) => ({ id: `i-${n}`, name }));
    expect(lookAlikes(list, 'Insurance').map((i) => i.name)).toEqual(['Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance']);
    expect(lookAlikes(list, 'Meridian Insurance', 'i-1').map((i) => i.name)).toEqual([]);
    expect(lookAlikes(list, 'Meridian Northgate', 'i-1').map((i) => i.name)).toEqual(['Northgate Insurance']);
    expect(lookAlikes(list, 'Meridian Northgate').map((i) => i.name)).toEqual(['Meridian Insurance', 'Northgate Insurance']);
  });
});

describe('the common words of insurers’ names (F18-4)', () => {
  /** The reviewer's ten names, as the owner's real list might hold them. */
  const TEN = [
    'Baltic Mutual', 'BTA Baltic Insurance Company', 'Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance',
    'Pilot Insurance Group', 'If P&C Insurance AS', 'ERGO Insurance SE', 'Salva Kindlustuse AS', 'LHV Kindlustus',
  ];
  const among = (list: readonly string[], typed: string) => list.filter((name) => looksAlike(name, typed));

  test('the reviewer’s names: a common word no longer brings every insurer that holds it', () => {
    // Before F18-4 the counts were 7, 8, 7, 7, 2 and 7.
    expect(among(TEN, 'Newco Insurance')).toEqual([]);
    expect(among(TEN, 'Baltic Mutual Insurance')).toEqual(['Baltic Mutual', 'BTA Baltic Insurance Company']);
    expect(among(TEN, 'Meridian Insurance AS')).toEqual(['Meridian Insurance']);
    expect(among(TEN, 'Pilot Insurance Group')).toEqual(['Pilot Insurance Group']);
    expect(among(TEN, 'Salva Kindlustus')).toEqual(['Salva Kindlustuse AS']);
    expect(among(TEN, 'Gjensidige Insurance Group')).toEqual([]);
  });

  test('the other two rules are unchanged: "BM", "Baltic" and "ERGO" show what they did', () => {
    expect(among(TEN, 'BM')).toEqual(['Baltic Mutual']);
    expect(among(TEN, 'Baltic')).toEqual(['Baltic Mutual', 'BTA Baltic Insurance Company']);
    expect(among(TEN, 'ERGO')).toEqual(['ERGO Insurance SE']);
    // A name that holds what is typed still counts, common word or not; so do the initials.
    expect(among(TEN, 'insurance').length).toBe(7);
    expect(among(TEN, 'Kindlustus')).toEqual(['Salva Kindlustuse AS', 'LHV Kindlustus']);
    expect(among(TEN, 'MI')).toEqual(['Meridian Insurance']);
    expect(among(TEN, 'LK')).toEqual(['LHV Kindlustus']);
  });

  test('every common word, with its accents or without, in capitals or not, is skipped', () => {
    expect(COMMON_WORDS).toHaveLength(20);
    for (const word of COMMON_WORDS) {
      const plain = insurerKey(word);
      for (const [inName, typed] of [[word, plain], [plain, word.toUpperCase()], [word.toUpperCase(), word], [plain, plain.toUpperCase()]]) {
        expect(looksAlike(`Acme ${inName}`, `Newco ${typed}`), `${inName} typed as ${typed}`).toBe(false);
      }
    }
    expect(insurerKey('Apdrošināšana')).toBe('apdrosinasana');
    expect(looksAlike('BALTA Apdrošināšanas Akciju Sabiedrība', 'Newco apdrosinasanas')).toBe(false);
    expect(looksAlike('Trygg Försäkring', 'NEWCO FORSAKRING')).toBe(false);
    expect(looksAlike('Allianz Versicherung GmbH', 'Newco versicherung gmbh')).toBe(false);
    // A word of the name that is not common still counts beside a common one.
    expect(looksAlike('Lietuvos Draudimas', 'LIETUVOS draudimo')).toBe(true);
    expect(looksAlike('Allianz Versicherung GmbH', 'Allianz Newco')).toBe(true);
  });

  test('the seed’s list and the practice copy’s: "Newco Insurance" looks like none of them', () => {
    expect(alike('Newco Insurance')).toEqual([]);
    const practice = ['Baltic Mutual', 'Lolkastan', 'Meridian Insurance', 'Northgate Insurance', 'RW-Rent OÜ'];
    expect(among(practice, 'Newco Insurance')).toEqual([]);
    expect(among(practice, 'Northgate Insurance Group')).toEqual(['Northgate Insurance']);
  });
});
