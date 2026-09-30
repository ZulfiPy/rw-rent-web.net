import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { fieldMessages, toFailure } from '@/api/problem';
import { CARRIED_BY_ERRORS_CODES, codeToField } from '@/api/codes';
import type { InsurerListItemResponse, ProblemDetails } from '@/api/dto';
import { CaseForm, cascoFormOf, registerRequest, updateRequest, blankCase, withInsurer } from './insurance/CaseDialogs';
import {
  InsurerForm, InsurerToggle, createInsurerRequest, insurerRefusal, toggleInsurer, updateInsurerRequest,
} from './insurance/InsurerDialogs';
import { installTransport, type Method } from '@/api/transport';
import { chosenInsurer, findKey, pickerItems } from './insurance/InsurerPicker';
import { around, clearTaskRenders, count, refused, renderAs } from './followup12.harness';
import { caseKlmDita, choicesKlm, choicesNew, meDita, pickDrivers, pickVehicles } from './followup17.support';
import {
  R13_CAPTURED_AT, editOutOfUseRefusal, handledUnknownRefusal, insurerEmptyRefusal, insurerNameConflictRefusal,
  insurerNotFoundRefusal, insurerRenameConflictRefusal, insurerStaleRefusal, insurerToggleNotFoundRefusal, insurersAll,
  registerOutOfUseRefusal, registerUnknownInsurerRefusal,
} from './followup18.support';
import {
  editHarbourRefusal, insurersAllWithPilotOut, pilotAdded, pilotNameConflictRefusal, pilotRenamed, practiceCaseOutOfUse,
  registerPilotOutOfUseRefusal,
} from './followup18.practice';

/**
 * Follow-up 18, F18-2c and F18-2d: the insurer pickers of a case's form, the Add insurer window they
 * open, and the Add insurer and Edit insurer windows of the Insurers page, each rendered with round
 * 13's answers (`followup18.support.ts`) and the joint check's (`followup18.practice.ts`). A server
 * render cannot press a key or send a form, so the one hook every dialog submits through is replaced as
 * in Follow-up 17: it answers with the refusal a test names, read by the dialog's own `refusal` and the
 * app's own `toFailure` under the dialog's own `op`. What a key does in the picker is its own rule,
 * `findKey`, tested as such; the browser pressed the keys (the report, §4.3).
 */
const hook = vi.hoisted(() => ({ refusal: null as unknown, ops: [] as string[] }));

vi.mock('@/app/useActionMutation', () => ({
  useActionMutation: ({ op, refusal }: { op: string; refusal?: (error: unknown) => unknown }) => {
    hook.ops.push(op);
    const failure = hook.refusal
      ? ((refusal?.(hook.refusal) as ReturnType<typeof toFailure> | null) ?? toFailure(hook.refusal, op))
      : null;
    return { submit: () => true, busy: false, failure, fields: failure ? fieldMessages(failure) : {}, refresh: () => {} };
  },
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(R13_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
  hook.refusal = null;
  hook.ops = [];
});

const ACTIVE = { IsActive: true, PageSize: 100 } as const;
const lists = (insurers: InsurerListItemResponse[]): Array<[readonly unknown[], unknown]> => [
  [qk.vehicles.list(ACTIVE), pickVehicles],
  [qk.drivers.list(ACTIVE), pickDrivers],
  [qk.insurers.list({}), insurers],
  [qk.insuranceCases.accidentChoices({}), choicesNew],
  [qk.insuranceCases.accidentChoices({ ForCaseId: caseKlmDita.id }), choicesKlm],
  [qk.insuranceCases.accidentChoices({ ForCaseId: practiceCaseOutOfUse.id }), choicesNew],
];

const render = (element: ReturnType<typeof h>, body: ProblemDetails | null = null, insurers = insurersAll) => {
  hook.refusal = body ? refused(body) : null;
  return renderAs(element, { at: '/x', route: '/x', me: meDita, data: lists(insurers) }).markup;
};

const byName = (list: InsurerListItemResponse[], name: string) => list.find((i) => i.name === name)!;
const BALTIC = byName(insurersAll, 'Baltic Mutual');
const MERIDIAN = byName(insurersAll, 'Meridian Insurance');
const HARBOUR = byName(insurersAll, 'Old Harbour Insurance');

/** An insurer picker's control, by its field's label: its whole button, and what it shows as chosen. */
const trigger = (markup: string, label: string) => {
  const match = new RegExp(`<button type="button"[^>]*aria-label="${label}: ([^"]*)"[^>]*>(.*?)</button>`).exec(markup);
  expect(match, `no picker ${label}`).not.toBeNull();
  return { shown: match![1]!, html: match![0] };
};
/** The open list of a picker: its lines' texts, in order, and the markup of the list. */
const openList = (markup: string) => {
  const list = around(markup, 'role="listbox"', 'ul');
  const lines = [...list.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((m) => m[1]!.replace(/<span data-icon[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '').trim());
  return { list, lines, markup };
};
const register = (props = {}) => h(CaseForm, { tab: 'open', onClose: () => {}, ...props });

/** A picker's field: its group, from its label to the next field's group. */
const group = (markup: string, label: string) => {
  const at = markup.indexOf(`role="group" aria-label="${label}"`);
  expect(at, `no field ${label}`).toBeGreaterThan(-1);
  const next = markup.indexOf('role="group"', at + 1);
  return markup.slice(at, next > -1 ? next : undefined);
};

describe('the picker’s own rules (F18-2d)', () => {
  const list = [...insurersAll, pilotRenamed];

  test('Not chosen, the insurers in use whose names hold what is typed in the list’s order, then Add an insurer', () => {
    const names = (items: ReturnType<typeof pickerItems>) =>
      items.map((item) => (item.kind === 'insurer' ? item.insurer.name : item.kind));
    expect(names(pickerItems(list, '', null, true)))
      .toEqual(['none', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Pilot Insurance Group', 'add']);
    expect(names(pickerItems(list, '  INSURANCE ', null, true))).toEqual(['none', 'Meridian Insurance', 'Northgate Insurance', 'Pilot Insurance Group', 'add']);
    expect(names(pickerItems(list, 'zzz', null, true))).toEqual(['none', 'add']);
    // Only whoever may add one is offered Add an insurer.
    expect(names(pickerItems(list, '', null, false))).toEqual(['none', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Pilot Insurance Group']);
  });

  test('the case’s own insurer stays offered even out of use; the list’s copy of it wins, so a rename shows', () => {
    const names = (items: ReturnType<typeof pickerItems>) =>
      items.map((item) => (item.kind === 'insurer' ? `${item.insurer.name}${item.insurer.isActive ? '' : ' (out)'}` : item.kind));
    expect(names(pickerItems(insurersAll, '', HARBOUR, true)))
      .toEqual(['none', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance (out)', 'add']);
    const kept = practiceCaseOutOfUse.otherInsurer!;
    expect(names(pickerItems(insurersAllWithPilotOut, 'pilot', { ...kept, name: 'Pilot Insurance AS' }, true)))
      .toEqual(['none', 'Pilot Insurance Group (out)', 'add']);
    // A case's insurer the list does not hold yet (the list still loading) is offered from the case.
    expect(names(pickerItems([], '', kept, true))).toEqual(['none', 'Pilot Insurance Group (out)', 'add']);
  });

  test('the chosen insurer: the list’s, or the case’s own while the list loads; none for no id', () => {
    expect(chosenInsurer(BALTIC.id, insurersAll, null)?.name).toBe('Baltic Mutual');
    expect(chosenInsurer(practiceCaseOutOfUse.otherInsurer!.id, undefined, practiceCaseOutOfUse.otherInsurer)?.name).toBe('Pilot Insurance Group');
    // A rename shows at once: the list's copy of the case's own insurer wins over the case's.
    expect(chosenInsurer(pilotRenamed.id, [pilotRenamed], { ...pilotRenamed, name: 'Pilot Insurance AS' })?.name).toBe('Pilot Insurance Group');
    expect(chosenInsurer('', insurersAll, null)).toBeNull();
    expect(chosenInsurer('unknown', insurersAll, null)).toBeNull();
  });

  test('the keys of the find box: arrows within the lines, Enter chooses the line reached, Esc closes, Tab moves on', () => {
    expect(findKey('ArrowDown', 0, 6)).toEqual({ move: 1 });
    expect(findKey('ArrowDown', 5, 6)).toEqual({ move: 5 });
    expect(findKey('ArrowUp', 0, 6)).toEqual({ move: 0 });
    expect(findKey('ArrowUp', 3, 6)).toEqual({ move: 2 });
    expect(findKey('Enter', 2, 6)).toEqual({ choose: 2 });
    // A line out of reach after the list shrank: Enter takes the last one there is.
    expect(findKey('Enter', 7, 3)).toEqual({ choose: 2 });
    expect(findKey('Escape', 2, 6)).toEqual({ close: true });
    expect(findKey('Tab', 2, 6)).toEqual({ leave: true });
    expect(findKey('a', 2, 6)).toBeNull();
  });
});

describe('the pickers of Register case (F18-2d)', () => {
  test('closed: "Choose an insurer" on each side, the list asked for whole, nothing typed or suggested', () => {
    const markup = render(register());
    expect(trigger(markup, 'Our insurer').shown).toBe('Choose an insurer');
    expect(trigger(markup, 'The other party’s insurer').shown).toBe('Choose an insurer');
    expect(trigger(markup, 'Our insurer').html).toContain('aria-haspopup="listbox"');
    expect(trigger(markup, 'Our insurer').html).toContain('aria-expanded="false"');
    expect(markup).not.toContain('role="listbox"');
    expect(markup).not.toContain('<datalist');
  });

  test('open: the find box, Not chosen with its check, the insurers in use, Add an insurer at the foot', () => {
    const markup = render(register({ initialPicker: { key: 'ourInsurerId', find: '' } }));
    expect(trigger(markup, 'Our insurer').html).toContain('aria-expanded="true"');
    const find = /<input[^>]*role="combobox"[^>]*>/.exec(markup)![0];
    expect(find).toContain('placeholder="Find an insurer"');
    expect(find).toMatch(/aria-controls="[^"]+-list"/);
    expect(find).toMatch(/aria-activedescendant="[^"]+-option-0"/);
    const { list, lines } = openList(markup);
    expect(lines).toEqual(['Not chosen', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Add an insurer']);
    // Old Harbour Insurance is out of use: not offered on a new case.
    expect(list).not.toContain('Old Harbour');
    expect(list).toMatch(/aria-selected="true"[^>]*><span[^>]*>Not chosen<\/span><span data-icon[^>]*>check<\/span>/);
    expect(count(list, 'aria-selected="true"')).toBe(1);
    expect(list).toMatch(/_add_[^"]*"><span data-icon[^>]*>add<\/span>Add an insurer<\/li>/);
  });

  test('what is typed keeps the insurers that hold it; nothing held says so above Add an insurer', () => {
    expect(openList(render(register({ initialPicker: { key: 'otherInsurerId', find: 'insur' } }))).lines)
      .toEqual(['Not chosen', 'Meridian Insurance', 'Northgate Insurance', 'Add an insurer']);
    expect(openList(render(register({ initialPicker: { key: 'otherInsurerId', find: 'Lolkastan' } }))).lines)
      .toEqual(['Not chosen', 'No insurer on the list holds “Lolkastan”.', 'Add an insurer']);
  });

  test('with no insurer on the list (the owner’s list starts empty): "No insurers yet" above Add an insurer', () => {
    const markup = render(register({ initialPicker: { key: 'ourInsurerId', find: '' } }), null, []);
    expect(openList(markup).lines).toEqual(['Not chosen', 'No insurers yet', 'Add an insurer']);
  });

  test('an insurer chosen: its name in the picker, and Handled by offers that side by it', () => {
    const markup = render(register({ initial: { ourInsurerId: BALTIC.id, otherInsurerId: MERIDIAN.id } }));
    expect(trigger(markup, 'Our insurer').shown).toBe('Baltic Mutual');
    expect(trigger(markup, 'The other party’s insurer').shown).toBe('Meridian Insurance');
    const handled = around(markup, '<span>Handled by</span>', 'label');
    expect(handled).toContain('>Our insurer · Baltic Mutual</option>');
    expect(handled).toContain('>The other party’s insurer · Meridian Insurance</option>');
    const open = openList(render(register({ initial: { ourInsurerId: BALTIC.id }, initialPicker: { key: 'ourInsurerId', find: '' } })));
    expect(open.list).toMatch(/aria-selected="true"[^>]*><span[^>]*>Baltic Mutual<\/span><span data-icon[^>]*>check<\/span>/);
    // The arrows start from the chosen insurer.
    expect(/<input[^>]*role="combobox"[^>]*>/.exec(open.markup)![0]).toMatch(/aria-activedescendant="[^"]+-option-1"/);
    expect(open.list).toMatch(/id="[^"]+-option-1"[^>]*aria-selected="true" data-active="true"/);
  });

  test('choosing a side’s insurer keeps Handled by; clearing the side it names resets it, clearing the other does not', () => {
    const form = { ...blankCase(), ourInsurerId: BALTIC.id, otherInsurerId: MERIDIAN.id, handledBy: '2' };
    expect(withInsurer(form, 'ourInsurerId', HARBOUR.id)).toMatchObject({ ourInsurerId: HARBOUR.id, handledBy: '2' });
    expect(withInsurer(form, 'ourInsurerId', '')).toMatchObject({ ourInsurerId: '', handledBy: '2' });
    expect(withInsurer(form, 'otherInsurerId', '')).toMatchObject({ otherInsurerId: '', handledBy: '' });
    expect(withInsurer({ ...form, handledBy: '1' }, 'ourInsurerId', '')).toMatchObject({ ourInsurerId: '', handledBy: '' });
    expect(withInsurer({ ...form, handledBy: '1' }, 'otherInsurerId', BALTIC.id)).toMatchObject({ otherInsurerId: BALTIC.id, handledBy: '1' });
  });

  test('what Register case sends: the insurers by their ids, none as none', () => {
    const request = registerRequest({ ...blankCase(), vehicleId: 'car', damage: 'Door', place: 'Riga', ourInsurerId: BALTIC.id, otherInsurerId: '' });
    expect(request.ourInsurerId).toBe(BALTIC.id);
    expect(request.otherInsurerId).toBeNull();
    expect(request).not.toHaveProperty('ourInsurer');
    expect(request).not.toHaveProperty('otherInsurer');
  });

  test('refused: one out of use under Our insurer, one not on the list under the other party’s, in the API’s words', () => {
    const out = render(register({ initial: { ourInsurerId: BALTIC.id } }), registerOutOfUseRefusal);
    expect(trigger(out, 'Our insurer').html).toContain('aria-invalid="true"');
    expect(group(out, 'Our insurer')).toContain('This insurer is out of use.');
    expect(out.match(/aria-invalid="true"/g)).toHaveLength(1);
    const unknown = render(register(), registerUnknownInsurerRefusal);
    expect(trigger(unknown, 'The other party’s insurer').html).toContain('aria-invalid="true"');
    expect(group(unknown, 'The other party’s insurer')).toContain('This insurer does not exist.');
    expect(group(unknown, 'Our insurer')).not.toContain('This insurer');
    expect(unknown).not.toContain('The change was refused');
    // The joint check's own refusal: Pilot Insurance Group out of use on a new case.
    const pilot = render(register(), registerPilotOutOfUseRefusal);
    expect(trigger(pilot, 'The other party’s insurer').html).toContain('aria-invalid="true"');
  });
});

describe('Edit case and Casco case for this accident with the list (F18-2d)', () => {
  const edit = (body: ProblemDetails | null = null, props = {}) =>
    render(h(CaseForm, { kase: practiceCaseOutOfUse, tab: 'open', onClose: () => {}, ...props }), body, insurersAllWithPilotOut);

  test('the case’s own insurer out of use stays chosen, marked Out of use, and Handled by keeps its side', () => {
    const markup = edit();
    expect(trigger(markup, 'Our insurer').shown).toBe('Baltic Mutual');
    const other = trigger(markup, 'The other party’s insurer');
    expect(other.shown).toBe('Pilot Insurance Group');
    expect(other.html).toMatch(/data-tone="mute"[^>]*>.*Out of use<\/span>/);
    const handled = around(markup, '<span>Handled by</span>', 'label');
    expect(handled).toMatch(/<option value="2" selected="">The other party’s insurer · Pilot Insurance Group<\/option>/);
  });

  test('open, it offers that insurer, chosen with its check and marked; the others out of use are not offered', () => {
    const { list, lines } = openList(edit(null, { initialPicker: { key: 'otherInsurerId', find: '' } }));
    expect(lines).toEqual(['Not chosen', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Pilot Insurance GroupOut of use', 'Add an insurer']);
    expect(list).toMatch(/aria-selected="true"[^>]*><span[^>]*>Pilot Insurance Group<\/span><span[^>]*data-tone="mute"[^>]*>.*?Out of use<\/span><span data-icon[^>]*>check<\/span>/);
    // Our side's picker does not offer Pilot: it is not that side's insurer.
    expect(openList(edit(null, { initialPicker: { key: 'ourInsurerId', find: '' } })).lines)
      .toEqual(['Not chosen', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Add an insurer']);
  });

  test('what Edit case sends: each insurer’s id, the kept one out of use included', () => {
    const request = updateRequest({ ...blankCase(), ...{
      vehicleId: practiceCaseOutOfUse.vehicleId, damage: practiceCaseOutOfUse.damage, place: practiceCaseOutOfUse.place,
      happened: '', ourInsurerId: practiceCaseOutOfUse.ourInsurer!.id, otherInsurerId: practiceCaseOutOfUse.otherInsurer!.id, handledBy: '2',
    } }, practiceCaseOutOfUse);
    expect([request.ourInsurerId, request.otherInsurerId]).toEqual([BALTIC.id, practiceCaseOutOfUse.otherInsurer!.id]);
    expect(request.concurrencyToken).toBe(practiceCaseOutOfUse.concurrencyToken);
  });

  test('changing a side to an insurer out of use is refused under that side’s picker', () => {
    for (const body of [editHarbourRefusal, editOutOfUseRefusal]) {
      const markup = edit(body);
      expect(trigger(markup, 'The other party’s insurer').html).toContain('aria-invalid="true"');
      expect(group(markup, 'The other party’s insurer')).toContain('This insurer is out of use.');
      expect(trigger(markup, 'Our insurer').html).not.toContain('aria-invalid');
    }
  });

  test('Casco case for this accident copies our insurer with Handled by ours only while it is in use', () => {
    expect(cascoFormOf(caseKlmDita)).toMatchObject({ ourInsurerId: BALTIC.id, handledBy: '1', otherInsurerId: '' });
    const outOfUse = { ...caseKlmDita, ourInsurer: { ...caseKlmDita.ourInsurer!, isActive: false } };
    expect(cascoFormOf(outOfUse)).toMatchObject({ ourInsurerId: '', handledBy: '', otherInsurerId: '' });
    const markup = render(h(CaseForm, { from: caseKlmDita, tab: 'open', onClose: () => {} }));
    expect(trigger(markup, 'Our insurer').shown).toBe('Baltic Mutual');
    expect(trigger(markup, 'The other party’s insurer').shown).toBe('Choose an insurer');
    const none = render(h(CaseForm, { from: outOfUse, tab: 'open', onClose: () => {} }));
    expect(trigger(none, 'Our insurer').shown).toBe('Choose an insurer');
    expect(around(none, '<span>Handled by</span>', 'label')).toContain('<option value="" selected="">Not known yet</option>');
  });
});

describe('Add an insurer from a case’s picker (F18-2d)', () => {
  test('its own window over the form: what was typed, Use this one on each look-alike in use, one out of use marked without it', () => {
    const markup = render(register({ initialAdding: { key: 'otherInsurerId', typed: 'Harbour Baltic' } }));
    const caseAt = markup.indexOf('aria-label="Register case"');
    const addAt = markup.indexOf('aria-label="Add insurer"');
    expect(caseAt).toBeGreaterThan(-1);
    expect(addAt).toBeGreaterThan(caseAt);
    const window = markup.slice(addAt);
    expect(around(window, '<span>Name</span>', 'label')).toContain('value="Harbour Baltic"');
    const alike = around(window, 'Already on the list, and looks alike', 'div');
    expect(alike).toMatch(/Baltic Mutual<\/span><span[^>]*><button[^>]*>.*?check<\/span>Use this one<\/button>/);
    expect(alike).toMatch(/Old Harbour Insurance<\/span><span[^>]*data-tone="mute"[^>]*>.*?Out of use<\/span><\/li>/);
    expect(count(alike, 'Use this one')).toBe(1);
    expect(window).toContain('The insurer is chosen on the case and is on the list for everyone.');
    expect(window).toMatch(/data-tone="primary"[^>]*>Add insurer<\/button>/);
    expect(hook.ops).toEqual(['case-register', 'insurer-create']);
  });

  test('"BM" shows Baltic Mutual; a name that looks like none shows no list', () => {
    const bm = render(register({ initialAdding: { key: 'ourInsurerId', typed: 'BM' } }));
    expect(around(bm, 'Already on the list, and looks alike', 'div')).toContain('Baltic Mutual');
    const fresh = render(register({ initialAdding: { key: 'ourInsurerId', typed: 'Lolkastan' } }));
    expect(fresh).not.toContain('Already on the list, and looks alike');
  });
});

describe('the Add insurer and Edit insurer windows of the Insurers page (F18-2c)', () => {
  const add = (body: ProblemDetails | null = null, props = {}) =>
    render(h(InsurerForm, { insurers: insurersAll, onClose: () => {}, ...props }), body);

  test('Add insurer: Name required, Email and Phone optional, the look-alikes only shown', () => {
    const markup = add(null, { initial: { name: 'Meridian Insurance Group' } });
    expect(markup).toContain('aria-label="Add insurer"');
    expect(markup).toContain('style="max-width:520px"');
    const name = around(markup, '<span>Name</span>', 'label');
    expect(name).toContain('>required<');
    expect(name).toContain('maxLength="100"');
    expect(around(markup, '<span>Email</span>', 'label')).toContain('· optional');
    expect(around(markup, '<span>Email</span>', 'label')).toContain('type="email"');
    expect(around(markup, '<span>Email</span>', 'label')).toContain('maxLength="254"');
    expect(around(markup, '<span>Phone</span>', 'label')).toContain('type="tel"');
    expect(around(markup, '<span>Phone</span>', 'label')).toContain('maxLength="30"');
    const alike = around(markup, 'Already on the list, and looks alike', 'div');
    expect(alike).toContain('Meridian Insurance');
    // "Insurance" is a common word (F18-4): Northgate Insurance does not look alike.
    expect(alike).not.toContain('Northgate Insurance');
    expect(alike).not.toContain('Use this one');
    expect(markup).toContain('The insurer is on the list for everyone who works with cases.');
    expect(hook.ops).toEqual(['insurer-create']);
  });

  test('a name of one letter shows no look-alike', () => {
    expect(add(null, { initial: { name: 'B' } })).not.toContain('Already on the list');
  });

  test('what Add insurer and Edit insurer send: the name as typed, a blank email or phone as none, the token on an edit', () => {
    expect(createInsurerRequest({ name: ' Pilot  Insurance ', email: '  ', phone: '+372 600 7700' }))
      .toEqual({ name: ' Pilot  Insurance ', email: null, phoneNumber: '+372 600 7700' });
    expect(updateInsurerRequest({ name: 'Pilot Insurance Group', email: 'claims@pilot-insurance.example', phone: '' }, pilotAdded))
      .toEqual({ name: 'Pilot Insurance Group', email: 'claims@pilot-insurance.example', phoneNumber: null, concurrencyToken: pilotAdded.concurrencyToken });
  });

  test('Edit insurer: the insurer as the list read it, its own name not a look-alike of itself', () => {
    const markup = render(h(InsurerForm, { insurer: MERIDIAN, insurers: insurersAll, onClose: () => {} }));
    expect(markup).toContain('aria-label="Edit insurer"');
    expect(markup).toContain('>Meridian Insurance</p>');
    expect(around(markup, '<span>Name</span>', 'label')).toContain('value="Meridian Insurance"');
    expect(around(markup, '<span>Email</span>', 'label')).toContain('value="claims@meridian-insurance.example"');
    expect(around(markup, '<span>Phone</span>', 'label')).toContain('value="+372 600 2200"');
    // Its own name brings no other insurer since F18-4: "Insurance" is a common word.
    expect(markup).not.toContain('Already on the list, and looks alike');
    expect(markup).toContain('A new name shows at once on every case that names this insurer.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Save changes<\/button>/);
    expect(hook.ops).toEqual(['insurer-edit']);
    const renamed = render(h(InsurerForm, { insurer: MERIDIAN, insurers: insurersAll, onClose: () => {}, initial: { name: 'Meridian Northgate' } }));
    const alike = around(renamed, 'Already on the list, and looks alike', 'div');
    expect(alike).not.toContain('Meridian Insurance');
    expect(alike).toContain('Northgate Insurance');
  });

  test('refusals: the same name under Name, the three the validators give under theirs', () => {
    for (const body of [insurerNameConflictRefusal, pilotNameConflictRefusal]) {
      const markup = add(body, { initial: { name: 'Baltic mutual' } });
      expect(around(markup, '<span>Name</span>', 'label')).toContain('Another insurer already has this name.');
      expect(around(markup, '<span>Name</span>', 'label')).toContain('aria-invalid="true"');
      expect(markup).not.toContain('The change was refused');
    }
    const empty = add(insurerEmptyRefusal);
    expect(empty.match(/aria-invalid="true"/g)).toHaveLength(3);
    for (const label of ['Name', 'Email', 'Phone']) {
      expect(around(empty, `<span>${label}</span>`, 'label')).toContain('aria-invalid="true"');
    }
    const renamed = render(h(InsurerForm, { insurer: MERIDIAN, insurers: insurersAll, onClose: () => {} }), insurerRenameConflictRefusal);
    expect(around(renamed, '<span>Name</span>', 'label')).toContain('Another insurer already has this name.');
  });

  test('a stale token shows the stale banner with Refresh; an insurer gone, a refused change in the API’s words', () => {
    const stale = render(h(InsurerForm, { insurer: MERIDIAN, insurers: insurersAll, onClose: () => {} }), insurerStaleRefusal);
    expect(stale).toContain('This record changed while you had it open.');
    expect(stale).toMatch(/refresh<\/span>Refresh<\/button>/);
    const gone = render(h(InsurerForm, { insurer: MERIDIAN, insurers: insurersAll, onClose: () => {} }), insurerNotFoundRefusal);
    expect(gone).toContain('The change was refused');
    expect(gone).toContain('This insurer does not exist.');
  });
});

describe('Put out of use and Put back in use (F18-2b)', () => {
  const toggle = (insurer: InsurerListItemResponse, body: ProblemDetails | null = null) =>
    render(h(InsurerToggle, { insurer, onClose: () => {} }), body);

  test('out of use: its words, the cases that keep it, Put out of use as the vehicle’s Deactivate is drawn', () => {
    const markup = toggle(BALTIC);
    expect(markup).toContain('aria-label="Put insurer out of use"');
    expect(markup).toContain('style="max-width:480px"');
    expect(markup).toContain('>Baltic Mutual will no longer be offered on a case.</p>');
    expect(markup).toContain('The 4 cases that name it keep it, and an edit of one of them may keep it.');
    expect(markup).toContain('It stays on the list, marked Out of use, and can be put back in use.');
    expect(markup).toMatch(/data-tone="danger-solid"[^>]*>Put out of use<\/button>/);
    expect(hook.ops).toEqual(['insurer-toggle']);
    expect(toggle(byName(insurersAll, 'Northgate Insurance'))).toContain('The case that names it keeps it, and an edit of that case may keep it.');
    expect(toggle({ ...pilotAdded })).toContain('No case names it.');
  });

  test('back in use: its words, nothing on the cases changes', () => {
    const markup = toggle(HARBOUR);
    expect(markup).toContain('aria-label="Put insurer back in use"');
    expect(markup).toContain('>Old Harbour Insurance is offered on cases again.</p>');
    expect(markup).toContain('The cases that name it are unchanged.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Put back in use<\/button>/);
  });

  test('what each sends: one in use is put out of use, one out of use back in use, with no body', async () => {
    const sent: Array<[Method, string, unknown]> = [];
    installTransport({ async request<T>(method: Method, path: string, init?: { body?: unknown }) { sent.push([method, path, init?.body]); return undefined as T; } });
    await toggleInsurer(BALTIC);
    await toggleInsurer(HARBOUR);
    expect(sent).toEqual([
      ['POST', `/api/insurers/${BALTIC.id}/deactivate`, undefined],
      ['POST', `/api/insurers/${HARBOUR.id}/activate`, undefined],
    ]);
  });

  test('an insurer gone is a refused change in the API’s words', () => {
    const markup = toggle(HARBOUR, insurerToggleNotFoundRefusal);
    expect(markup).toContain('The change was refused');
    expect(markup).toContain('This insurer does not exist.');
  });
});

describe('the insurers’ refusals land where they belong (F18-2a)', () => {
  test('the same name stands under Name on adding and on editing, from its field or from the table', () => {
    for (const op of ['insurer-create', 'insurer-edit']) {
      expect(fieldMessages(toFailure(refused(insurerNameConflictRefusal), op))).toEqual({ name: 'Another insurer already has this name.' });
      expect(codeToField('insurers.name_conflict', op)).toBe('name');
    }
  });

  test('a stale insurer is the stale banner; one gone is a refused change on its own writes', () => {
    expect(toFailure(refused(insurerStaleRefusal), 'insurer-edit').kind).toBe('stale');
    expect(insurerRefusal(refused(insurerNotFoundRefusal))).toEqual({ kind: 'conflict', message: 'This insurer does not exist.', code: 'insurers.not_found' });
    expect(insurerRefusal(refused(insurerToggleNotFoundRefusal))?.kind).toBe('conflict');
    expect(insurerRefusal(refused(insurerStaleRefusal))).toBeNull();
  });

  test('a case’s insurer not on the list or out of use stands under the field the API names', () => {
    expect(fieldMessages(toFailure(refused(registerOutOfUseRefusal), 'case-register'))).toEqual({ ourInsurerId: 'This insurer is out of use.' });
    expect(fieldMessages(toFailure(refused(registerUnknownInsurerRefusal), 'case-register'))).toEqual({ otherInsurerId: 'This insurer does not exist.' });
    expect(fieldMessages(toFailure(refused(editOutOfUseRefusal), 'case-edit'))).toEqual({ otherInsurerId: 'This insurer is out of use.' });
    expect(fieldMessages(toFailure(refused(handledUnknownRefusal)))).toEqual({ handledByInsurerId: 'This insurer does not exist.' });
    // One code names either insurer, so the table gives it no one input.
    for (const code of CARRIED_BY_ERRORS_CODES) {
      for (const op of ['case-register', 'case-edit', undefined]) expect(codeToField(code, op)).toBeUndefined();
    }
  });
});

describe('the common words of insurers’ names in the three windows (F18-4)', () => {
  const NONE = 'Already on the list, and looks alike';

  test('with the seed’s list, "Newco Insurance" shows no look-alike in the Add insurer window of a case’s picker', () => {
    const markup = render(register({ initialAdding: { key: 'otherInsurerId', typed: 'Newco Insurance' } }));
    const window = markup.slice(markup.indexOf('aria-label="Add insurer"'));
    expect(around(window, '<span>Name</span>', 'label')).toContain('value="Newco Insurance"');
    expect(markup).not.toContain(NONE);
    // A word that tells insurers apart still counts beside it.
    const harbour = render(register({ initialAdding: { key: 'otherInsurerId', typed: 'Harbour Insurance' } }));
    const alike = around(harbour, NONE, 'div');
    expect(alike).toContain('Old Harbour Insurance');
    expect(alike).not.toContain('Meridian Insurance');
    expect(alike).not.toContain('Northgate Insurance');
  });

  test('the Insurers page’s Add insurer and Edit insurer windows the same', () => {
    const add = render(h(InsurerForm, { insurers: insurersAll, onClose: () => {}, initial: { name: 'Newco Insurance' } }));
    expect(around(add, '<span>Name</span>', 'label')).toContain('value="Newco Insurance"');
    expect(add).not.toContain(NONE);
    const edit = render(h(InsurerForm, { insurer: MERIDIAN, insurers: insurersAll, onClose: () => {}, initial: { name: 'Newco Insurance' } }));
    expect(edit).toContain('aria-label="Edit insurer"');
    expect(edit).not.toContain(NONE);
    const group = render(h(InsurerForm, { insurers: insurersAll, onClose: () => {}, initial: { name: 'NEWCO INSURANCE GROUP' } }));
    expect(group).not.toContain(NONE);
  });
});
