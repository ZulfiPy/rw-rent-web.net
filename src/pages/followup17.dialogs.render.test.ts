import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { fieldMessages, toFailure } from '@/api/problem';
import type { InsuranceCaseDriverSuggestionResponse, ProblemDetails } from '@/api/dto';
import { fromLocalInput, toLocalInput } from '@/format';
import {
  CaseForm, EventForm, NoteForm, TOO_LARGE_TOGETHER, addEventRequest, correctEventRequest, registerRequest,
  updateRequest, type PhotoTile,
} from './insurance/CaseDialogs';
import { MAX_PHOTOS } from './insurance/photos';
import { clearTaskRenders, count, refused, renderAs } from './followup12.harness';
import {
  CAPTURED_AT, caseAfterFirstEventRefusal, caseKlmDita, changeOutOfOrderRefusal, choicesKlm, choicesNew,
  eventBeforeCaseRefusal, meDita, noteEmptyRefusal, notFoundCase, notYourEventRefusal,
  notYourNoteRefusal, pickDrivers, pickVehicles, registerEmptyRefusal, registerFutureRefusal,
  registerHandlerRefusal, registerNotAPictureRefusal, staleTokenRefusal, suggestBusiness, suggestNobodyNamed,
  suggestNotRented, suggestOne, suggestSeveral, suggestionQueries,
} from './followup17.support';
import { insurersAll } from './followup18.support';

/**
 * Follow-up 17, F17-4 to F17-7: Register case and Edit case, Casco case for this accident, Add event
 * and Edit event, Add note and Edit note, and the photos in the dialogs, each rendered with the lists
 * it picks from and a refusal the scratch API really gave. A server render cannot submit, so the one
 * hook every dialog submits through is replaced, as in Follow-ups 10 to 12: it answers with the
 * refusal a test names, read by the dialog's own `refusal` and the app's own `toFailure` under the
 * dialog's own `op`, which is what the real hook does.
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
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
  hook.refusal = null;
  hook.ops = [];
});

const ACTIVE = { IsActive: true, PageSize: 100 } as const;
const LISTS: Array<[readonly unknown[], unknown]> = [
  [qk.vehicles.list(ACTIVE), pickVehicles],
  [qk.drivers.list(ACTIVE), pickDrivers],
  // Follow-up 18: the insurers are the list the company keeps, no longer the names typed on cases.
  [qk.insurers.list({}), insurersAll],
  [qk.insuranceCases.accidentChoices({}), choicesNew],
  [qk.insuranceCases.accidentChoices({ ForCaseId: caseKlmDita.id }), choicesKlm],
];

const dialog = (element: ReturnType<typeof h>, body: ProblemDetails | null = null, data: Array<[readonly unknown[], unknown]> = []) => {
  hook.refusal = body ? refused(body) : null;
  return renderAs(element, { at: '/x', route: '/x', me: meDita, data: [...LISTS, ...data] }).markup;
};

/** An insurer picker's control, by its field's label: what it shows as chosen (Follow-up 18). */
const picker = (markup: string, label: string) => {
  const match = new RegExp(`<button type="button"[^>]*aria-label="${label}: ([^"]*)"`).exec(markup);
  expect(match, `no picker ${label}`).not.toBeNull();
  return match![1];
};
const BALTIC = insurersAll.find((i) => i.name === 'Baltic Mutual')!.id;
const MERIDIAN = insurersAll.find((i) => i.name === 'Meridian Insurance')!.id;

/** The markup of one field, from its label to the end of that field. */
const field = (markup: string, label: string, from = 0) => {
  const at = markup.indexOf(`<span>${label}</span>`, from);
  expect(at, `no field ${label}`).toBeGreaterThan(-1);
  const start = Math.max(markup.lastIndexOf('<label', at), markup.lastIndexOf('<div class="_field_', at));
  const end = markup.indexOf('</label>', at);
  return markup.slice(start, end > -1 ? end + '</label>'.length : undefined);
};

const marked = (markup: string) => markup.match(/aria-invalid="true"/g)?.length ?? 0;
const selected = (markup: string, value: string) => new RegExp(`<option value="${value}" selected="">`).test(markup);

const register = (initial = {}, initialPhotos?: PhotoTile[]) =>
  h(CaseForm, { tab: 'open', onClose: () => {}, initial, ...(initialPhotos ? { initialPhotos } : {}) });

/** A form seeded at the car and moment a suggestion was captured for, with that answer in the cache. */
function suggested(name: keyof typeof suggestionQueries, answer: InsuranceCaseDriverSuggestionResponse) {
  const query = suggestionQueries[name]!;
  const happened = toLocalInput(query.AtUtc);
  const key = qk.insuranceCases.driverSuggestion({ VehicleId: query.VehicleId, AtUtc: fromLocalInput(happened) });
  return dialog(register({ vehicleId: query.VehicleId, happened }), null, [[key, answer]]);
}

/* register a case --------------------------------------------------------------------------------- */

describe('Register case (F17-4)', () => {
  test('a new case: the sections, the active cars, Usual, now, both ticks off, Happened and Us, no other case', () => {
    const markup = dialog(register());
    expect(markup).toContain('aria-label="Register case"');
    expect(markup).toContain('style="max-width:720px"');
    for (const section of ['The damage', 'When and where', 'Driver', 'Insurance', 'Where it stands', 'Photos', 'Same accident']) {
      expect(markup).toContain(`>${section}</p>`);
    }
    expect(markup).not.toContain('>Decision</p>');
    const car = field(markup, 'Car');
    expect(car).toContain('>required<');
    expect(car).toContain('<option value="" selected="">Choose a car</option>');
    for (const vehicle of pickVehicles.items) {
      expect(car).toContain(`>${vehicle.plateNumber} · ${vehicle.make} ${vehicle.model}</option>`);
    }
    expect(selected(field(markup, 'Type'), '1')).toBe(true);
    expect(field(markup, 'Type')).toContain('The insurers decide who is at fault.');
    expect(field(markup, 'What is damaged')).toContain('placeholder="For example Rear bumper dented"');
    expect(field(markup, 'What is damaged')).toContain('maxLength="200"');
    expect(field(markup, 'Description')).toContain('· optional');
    expect(field(markup, 'Description')).toContain('maxLength="4000"');
    // Happened now, to the minute.
    expect(field(markup, 'Happened')).toContain(`value="${toLocalInput(CAPTURED_AT)}"`);
    expect(markup).toContain('We don’t know when');
    expect(markup).toContain('This is when it was found.');
    expect(markup).toContain('We don’t know where');
    expect(markup).toContain('This is where it was found.');
    expect(field(markup, 'Place')).toContain('maxLength="200"');
    const driver = field(markup, 'Driver');
    expect(driver).toContain('<option value="" selected="">Not known</option>');
    expect(driver).toContain('Choose the car and the time, and the driver is filled in from its rental.');
    // Any active driver can be chosen.
    for (const d of pickDrivers.items) expect(driver).toContain(`>${d.firstName} ${d.lastName}</option>`);
    // Follow-up 18: each insurer is picked from the list, none chosen yet; nothing is typed or suggested.
    expect(picker(markup, 'Our insurer')).toBe('Choose an insurer');
    expect(picker(markup, 'The other party’s insurer')).toBe('Choose an insurer');
    expect(markup).not.toContain('<datalist');
    const handled = field(markup, 'Handled by');
    expect(count(handled, '<option')).toBe(1);
    expect(handled).toContain('>Not known yet</option>');
    expect(handled).toContain('Offers the insurers filled in above.');
    expect(selected(field(markup, 'Status'), '1')).toBe(true);
    expect(selected(field(markup, 'Waiting for'), '1')).toBe(true);
    expect(markup).toMatch(/<input type="file" accept="image\/\*" multiple=""/);
    expect(markup).toContain('Optional, several at once. Photos only: documents stay in the mailbox.');
    const same = field(markup, 'Same accident as');
    expect(same).toContain('<option value="" selected="">No other case</option>');
    for (const choice of choicesNew) {
      expect(same).toContain(`>${choice.label} · ${choice.type === 2 ? 'Casco' : 'Usual'}</option>`);
    }
    expect(markup).toContain('After this, the status and who the case waits for change only through an event.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Register case<\/button>/);
    expect(hook.ops).toEqual(['case-register']);
  });

  test('the driver is filled in from the rental the server found, in each of its situations', () => {
    const one = field(suggested('suggestOne', suggestOne), 'Driver');
    expect(one).toContain('From the rental of 770 HDV for Ilze Berzina');
    expect(one).toContain('<option value="" selected="">Not known</option>');
    expect(one).toMatch(new RegExp(`<option value="${suggestOne.drivers[0]!.driverId}">Ilze Berzina · on the rental then</option>`));

    const several = field(suggested('suggestSeveral', suggestSeveral), 'Driver');
    expect(several).toContain('>Choose who drove</option>');
    expect(several).toContain('Janis Krumins and Kristine Vitola were both authorised on the rental of 482 TKL for Baltic Freight Partners then. Choose who drove.');
    // Those drivers first, marked, and not offered a second time among the rest.
    expect(several.indexOf('Janis Krumins · on the rental then')).toBeLessThan(several.indexOf('Kristine Vitola · on the rental then'));
    expect(several.indexOf('Kristine Vitola · on the rental then')).toBeLessThan(several.indexOf('>Ilze Berzina</option>'));
    expect(count(several, 'Janis Krumins')).toBe(2);

    expect(field(suggested('suggestBusiness', suggestBusiness), 'Driver'))
      .toContain('552 KLM was on the rental for Nordwind Logistics, driven by the customer’s own drivers, so no driver is filled in.');
    expect(field(suggested('suggestNotRented', suggestNotRented), 'Driver'))
      .toContain('444 WKS was not rented at that time, so there is no driver to fill in.');
    expect(field(suggested('suggestNobodyNamed', suggestNobodyNamed), 'Driver'))
      .toContain('No driver was named on the rental of 119 MPR for Baltic Freight Partners at that time.');
  });

  test('the ticks turn the labels into Found and Where it was found; the insurers become Handled by’s options', () => {
    const markup = dialog(register({ timeIsWhenFound: true, placeIsWhereFound: true, ourInsurerId: BALTIC, otherInsurerId: MERIDIAN, type: '2' }));
    expect(field(markup, 'Found')).toContain('type="datetime-local"');
    expect(field(markup, 'Where it was found')).toContain('maxLength="200"');
    expect(markup).not.toContain('<span>Happened</span>');
    const handled = field(markup, 'Handled by');
    expect(handled).toContain('>Our insurer · Baltic Mutual</option>');
    expect(handled).toContain('>The other party’s insurer · Meridian Insurance</option>');
    expect(handled).toContain('The insurer that handles the case, once the two have agreed.');
    expect(field(markup, 'Type')).toContain('Our casco repairs the car now; the company pays the 500-euro deductible.');
  });

  test('what Register case sends: the form as left, blanks as none, the time in UTC', () => {
    const request = registerRequest({
      vehicleId: 'car', type: '2', damage: 'Door', description: '  ', happened: '2026-09-27T11:40', timeIsWhenFound: true,
      place: 'Riga', placeIsWhereFound: false, driverId: '', ourInsurerId: BALTIC, ourClaimNumber: '', otherInsurerId: '',
      otherClaimNumber: 'X-1', handledBy: '1', status: '5', waitingFor: '5', atFault: '', sameAccidentCaseId: '',
    });
    expect(request).toEqual({
      type: 2, vehicleId: 'car', damage: 'Door', description: null, happenedAtUtc: '2026-09-27T08:40:00.000Z',
      timeIsWhenFound: true, place: 'Riga', placeIsWhereFound: false, driverId: null, ourInsurerId: BALTIC,
      ourClaimNumber: null, otherInsurerId: null, otherClaimNumber: 'X-1', handledBy: 1, status: 5, waitingFor: 5,
      sameAccidentCaseId: null,
    });
  });

  test('its refusals land under their fields: the four the validators give, the future, the handler', () => {
    const empty = dialog(register({ happened: '' }), registerEmptyRefusal);
    expect(marked(empty)).toBe(4);
    expect(field(empty, 'Car')).toContain('Choose the car.');
    expect(field(empty, 'What is damaged')).toContain('Say what is damaged.');
    expect(field(empty, 'Happened')).toContain('Enter when it happened.');
    expect(field(empty, 'Place')).toContain('Enter where it happened.');
    expect(empty).not.toContain('The change was refused');

    const future = dialog(register(), registerFutureRefusal);
    expect(registerFutureRefusal.code).toBe('insurance_cases.time_in_future');
    expect(field(future, 'Happened')).toContain('The time cannot be in the future.');
    expect(marked(future)).toBe(1);

    const handler = dialog(register(), registerHandlerRefusal);
    expect(field(handler, 'Handled by')).toContain('Choose an insurer that is filled in.');
  });
});

/* edit a case, and its casco case ----------------------------------------------------------------- */

describe('Edit case, and Casco case for this accident (F17-4)', () => {
  test('Edit case: the case as its page read it, the Decision, its own choices, no status and no photos', () => {
    const markup = dialog(h(CaseForm, { kase: caseKlmDita, tab: 'open', onClose: () => {} }));
    expect(markup).toContain('aria-label="Edit case"');
    expect(markup).toContain('>552 KLM · Rear bumper and boot lid dented</p>');
    expect(selected(field(markup, 'Car'), caseKlmDita.vehicleId)).toBe(true);
    expect(field(markup, 'Happened')).toContain(`value="${toLocalInput(caseKlmDita.happenedAtUtc)}"`);
    expect(picker(markup, 'Our insurer')).toBe('Baltic Mutual');
    expect(picker(markup, 'The other party’s insurer')).toBe('Meridian Insurance');
    expect(field(markup, 'Claim number')).toContain('value="BM-26-04417"');
    expect(selected(field(markup, 'Handled by'), '2')).toBe(true);
    expect(markup).toContain('>Decision</p>');
    const fault = field(markup, 'At fault');
    for (const label of ['Not decided yet', 'Our driver', 'The other party', 'Both', 'Not found']) expect(fault).toContain(`>${label}</option>`);
    expect(fault).toContain('Set it once the decision is known.');
    expect(markup).not.toContain('>Where it stands</p>');
    expect(markup).not.toContain('type="file"');
    // The case itself, and the cases that name it, are not offered.
    expect(choicesKlm.some((c) => c.id === caseKlmDita.id)).toBe(false);
    expect(count(field(markup, 'Same accident as'), '<option')).toBe(choicesKlm.length + 1);
    expect(markup).toContain('Status and Waiting for change only through an event.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Save changes<\/button>/);
    expect(hook.ops).toEqual(['case-edit']);
  });

  test('what Edit case sends: no status, the time the person did not touch exactly as stored, the case’s token', () => {
    const request = updateRequest({
      vehicleId: caseKlmDita.vehicleId, type: '1', damage: caseKlmDita.damage, description: '', happened: toLocalInput(caseKlmDita.happenedAtUtc),
      timeIsWhenFound: false, place: caseKlmDita.place, placeIsWhereFound: false, driverId: '', ourInsurerId: BALTIC,
      ourClaimNumber: 'BM-26-04417', otherInsurerId: MERIDIAN, otherClaimNumber: 'MI-2026-118305', handledBy: '2',
      status: '1', waitingFor: '1', atFault: '3', sameAccidentCaseId: '',
    }, caseKlmDita);
    expect(request).not.toHaveProperty('status');
    expect(request).not.toHaveProperty('waitingFor');
    expect(request.happenedAtUtc).toBe(caseKlmDita.happenedAtUtc);
    expect(request.atFault).toBe(3);
    expect(request.handledBy).toBe(2);
    expect(request.ourInsurerId).toBe(BALTIC);
    expect(request.otherInsurerId).toBe(MERIDIAN);
    expect(request.concurrencyToken).toBe(caseKlmDita.concurrencyToken);
  });

  test('the edit’s refusals: the time after its first event under the time; a lost race as the stale banner', () => {
    const late = dialog(h(CaseForm, { kase: caseKlmDita, tab: 'open', onClose: () => {} }), caseAfterFirstEventRefusal);
    expect(field(late, 'Happened')).toContain('The case&#x27;s time cannot be later than its first event.');
    const stale = dialog(h(CaseForm, { kase: caseKlmDita, tab: 'open', onClose: () => {} }), staleTokenRefusal);
    expect(stale).toContain('This record changed while you had it open.');
    expect(stale).toMatch(/refresh<\/span>Refresh<\/button>/);
  });

  test('Casco case for this accident: filled in from the usual case, as handover d says', () => {
    const markup = dialog(h(CaseForm, { from: caseKlmDita, tab: 'open', onClose: () => {} }));
    expect(markup).toContain('aria-label="Register case"');
    expect(markup).toContain('>Filled in from 552 KLM · Rear bumper and boot lid dented, as its casco case.</p>');
    expect(selected(field(markup, 'Car'), caseKlmDita.vehicleId)).toBe(true);
    expect(selected(field(markup, 'Type'), '2')).toBe(true);
    expect(field(markup, 'What is damaged')).toContain('value="Rear bumper and boot lid dented"');
    expect(field(markup, 'Description')).toContain('Hit from behind at a crossing while waiting at the red light.');
    expect(field(markup, 'Happened')).toContain(`value="${toLocalInput(caseKlmDita.happenedAtUtc)}"`);
    expect(field(markup, 'Place')).toContain(`value="${caseKlmDita.place}"`);
    expect(picker(markup, 'Our insurer')).toBe('Baltic Mutual');
    // Handled by ours; the claim numbers and the other party's insurer are left out.
    expect(selected(field(markup, 'Handled by'), '1')).toBe(true);
    expect(field(markup, 'Claim number')).toContain('value=""');
    expect(picker(markup, 'The other party’s insurer')).toBe('Choose an insurer');
    expect(selected(field(markup, 'Status'), '1')).toBe(true);
    expect(selected(field(markup, 'Same accident as'), caseKlmDita.id)).toBe(true);
    expect(field(markup, 'Same accident as')).toContain('>552 KLM · Rear bumper and boot lid dented · Usual</option>');
  });
});

/* photos ------------------------------------------------------------------------------------------ */

describe('photos in the dialogs (F17-6, F17-7)', () => {
  const tile = (key: string, patch: Partial<PhotoTile>): PhotoTile => ({ key, name: `${key}.jpg`, size: 2_936_013, state: 'ready', ...patch });

  test('each chosen photo is a tile with its name, size and Remove; one still being made ready holds the dialog', () => {
    const markup = dialog(register({}, [tile('IMG_1', { preview: 'blob:one' }), tile('IMG_2', { state: 'checking' })]));
    expect(markup).toContain('>IMG_1.jpg</span>');
    expect(markup).toContain('>2.8 MB</span>');
    expect(markup).toContain('src="blob:one"');
    expect(count(markup, '>Remove</button>')).toBe(2);
    expect(markup).toContain('aria-label="Remove IMG_2.jpg"');
    expect(markup).toContain('hourglass_empty');
    expect(markup).toMatch(/title="Wait until the photos are ready."[^>]*>Register case<\/button>/);
  });

  test('a file the browser could not open is refused under its tile before anything is sent', () => {
    const markup = dialog(register({}, [tile('scan', { state: 'refused', error: 'This file is not a photo. Only photos can be added: JPEG, PNG or WebP.' })]));
    expect(markup).toMatch(/data-refused="true".*This file is not a photo. Only photos can be added: JPEG, PNG or WebP./s);
    expect(markup).toMatch(/title="Remove the files that cannot be added first."[^>]*>Register case<\/button>/);
  });

  test('the API’s refusal lands under the tile its Photos[i] names', () => {
    const markup = dialog(register({}, [tile('claim', {}), tile('IMG_3', {})]), registerNotAPictureRefusal);
    expect(registerNotAPictureRefusal.errors).toEqual({ 'Photos[0]': ['Only photos can be added: JPEG, PNG or WebP.'] });
    const first = markup.slice(markup.indexOf('>claim.jpg<'), markup.indexOf('>IMG_3.jpg<'));
    expect(first).toContain('Only photos can be added: JPEG, PNG or WebP.');
    expect(markup.slice(markup.indexOf('>IMG_3.jpg<'))).not.toContain('Only photos can be added');
  });

  test('twenty in one dialog at most; a body too large together is refused in the banner', () => {
    const full = dialog(register({}, Array.from({ length: MAX_PHOTOS }, (_, i) => tile(`IMG_${i}`, {}))));
    expect(full).toMatch(/<label class="_add_[^"]*" data-full="true">/);
    expect(full).toMatch(/<input type="file"[^>]*disabled=""/);
    const tooLarge = dialog(register(), { status: 413, title: 'Payload Too Large', code: 'request.body_too_large' });
    expect(tooLarge).toContain('The change was refused');
    expect(tooLarge).toContain(TOO_LARGE_TOGETHER);
  });
});

/* events ------------------------------------------------------------------------------------------ */

const bmwEvent = caseKlmDita.events.find((event) => event.title.startsWith('Car shown at the BMW dealer'))!;

describe('Add event and Edit event (F17-5)', () => {
  test('Add event: now, the title, photos, and Status now and Waiting for now preset to the case’s values', () => {
    const markup = dialog(h(EventForm, { kase: caseKlmDita, onClose: () => {} }));
    expect(markup).toContain('aria-label="Add event"');
    expect(markup).toContain('style="max-width:640px"');
    expect(markup).toContain('>552 KLM · Rear bumper and boot lid dented</p>');
    expect(field(markup, 'When')).toContain(`value="${toLocalInput(CAPTURED_AT)}"`);
    expect(field(markup, 'When')).toContain('The day it happened, even when you type it in later.');
    expect(field(markup, 'Title')).toContain('placeholder="The insurer asked for the driver’s licence"');
    expect(markup).toContain('Optional. Photos only: documents stay in the mailbox.');
    expect(selected(field(markup, 'Status now'), String(caseKlmDita.status))).toBe(true);
    expect(selected(field(markup, 'Waiting for now'), String(caseKlmDita.waitingFor))).toBe(true);
    expect(field(markup, 'Status now')).toContain('>Closed</option>');
    expect(markup).toContain('Preset to the case’s current values. Most events change neither.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Add event<\/button>/);
    expect(hook.ops).toEqual(['case-event-add']);
  });

  test('what Add event sends: the statuses as chosen and the case’s token', () => {
    const request = addEventRequest({ happened: '2026-09-27T11:00', title: 'Reported', description: '', status: '2', waitingFor: '3' }, caseKlmDita);
    expect(request).toEqual({
      happenedAtUtc: '2026-09-27T08:00:00.000Z', title: 'Reported', description: null, statusNow: 2, waitingForNow: 3,
      concurrencyToken: caseKlmDita.concurrencyToken,
    });
  });

  test('an event’s refusals under its time, and a lost race as the stale banner', () => {
    const before = dialog(h(EventForm, { kase: caseKlmDita, onClose: () => {} }), eventBeforeCaseRefusal);
    expect(field(before, 'When')).toContain('An event cannot be before the case happened.');
    const order = dialog(h(EventForm, { kase: caseKlmDita, onClose: () => {} }), changeOutOfOrderRefusal);
    expect(field(order, 'When')).toContain('A change of the status or of who the case waits for cannot be dated before the previous one.');
    const stale = dialog(h(EventForm, { kase: caseKlmDita, onClose: () => {} }), staleTokenRefusal);
    expect(stale).toContain('This record changed while you had it open.');
  });

  test('Edit event: its time, title and description, its photos each with Remove, and what it changed, read-only', () => {
    const markup = dialog(h(EventForm, { kase: caseKlmDita, event: bmwEvent, onClose: () => {}, initial: { removed: [bmwEvent.photos[1]!.id] } }));
    expect(markup).toContain('aria-label="Edit event"');
    expect(field(markup, 'Title')).toContain('value="Car shown at the BMW dealer, calculation sent"');
    expect(field(markup, 'When')).toContain(`value="${toLocalInput(bmwEvent.happenedAtUtc)}"`);
    expect(markup).toContain(`src="/api/insurance-cases/${caseKlmDita.id}/photos/${bmwEvent.photos[0]!.id}"`);
    expect(markup).toContain(`aria-label="Remove ${bmwEvent.photos[0]!.fileName}"`);
    // A photo marked for removal says so, and can be kept.
    expect(markup).toContain('>Removed</span>');
    expect(markup).toContain(`aria-label="Keep ${bmwEvent.photos[1]!.fileName}"`);
    expect(markup).toContain('You can remove a photo you added. New photos go with a new event.');
    expect(markup).not.toContain('type="file"');
    expect(markup).toContain('What this event changed');
    expect(markup).toContain('>Waiting for: The insurer</p>');
    expect(markup).not.toContain('Status now');
    expect(markup).toContain('Only you, who added this event, can correct it.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Save changes<\/button>/);
  });

  test('what Edit event sends: the stored time while untouched, and the photos it removes', () => {
    const request = correctEventRequest(
      { happened: toLocalInput(bmwEvent.happenedAtUtc), title: 'Shown at the dealer', description: '' },
      bmwEvent, [bmwEvent.photos[0]!.id],
    );
    expect(request).toEqual({ happenedAtUtc: bmwEvent.happenedAtUtc, title: 'Shown at the dealer', description: null, removePhotoIds: [bmwEvent.photos[0]!.id] });
  });

  test('only the author corrects an event: the refusal is the dialog’s banner, not a field’s', () => {
    const signeEvent = caseKlmDita.events.find((event) => !event.canCorrect)!;
    const markup = dialog(h(EventForm, { kase: caseKlmDita, event: signeEvent, onClose: () => {} }), notYourEventRefusal);
    expect(markup).toContain('Not permitted');
    expect(markup).toContain('Only the person who added this event can correct it.');
    expect(marked(markup)).toBe(0);
    const gone = dialog(h(EventForm, { kase: caseKlmDita, event: bmwEvent, onClose: () => {} }), notFoundCase);
    expect(gone).toContain('The change was refused');
    expect(gone).toContain('This case no longer exists.');
  });
});

/* notes ------------------------------------------------------------------------------------------- */

describe('Add note and Edit note (F17-5)', () => {
  test('Add note: the text, its footnote; a blank note is refused under it', () => {
    const markup = dialog(h(NoteForm, { kase: caseKlmDita, onClose: () => {} }));
    expect(markup).toContain('aria-label="Add note"');
    expect(markup).toContain('style="max-width:560px"');
    expect(field(markup, 'Text')).toContain('placeholder="The driver says a witness saw the other car’s plate"');
    expect(field(markup, 'Text')).toContain('maxLength="4000"');
    expect(markup).toContain('A note changes nothing on the case.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Add note<\/button>/);
    const empty = dialog(h(NoteForm, { kase: caseKlmDita, onClose: () => {} }), noteEmptyRefusal);
    expect(field(empty, 'Text')).toContain('Write the note.');
  });

  test('Edit note: the note’s text, its footnote, and only its writer may correct it', () => {
    const note = caseKlmDita.notes.find((n) => n.canCorrect)!;
    const markup = dialog(h(NoteForm, { kase: caseKlmDita, note, onClose: () => {} }));
    expect(markup).toContain('aria-label="Edit note"');
    expect(markup).toContain('Meridian’s handler is on leave until next Monday.');
    expect(markup).toContain('Only you, who wrote this note, can correct it.');
    const other = caseKlmDita.notes.find((n) => !n.canCorrect)!;
    const refused = dialog(h(NoteForm, { kase: caseKlmDita, note: other, onClose: () => {} }), notYourNoteRefusal);
    expect(refused).toContain('Only the person who wrote this note can correct it.');
    expect(hook.ops).toEqual(['case-note-edit', 'case-note-edit']);
  });
});
