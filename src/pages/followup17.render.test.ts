import { createElement as h, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import type { CurrentUserResponse, InsuranceCaseQuery } from '@/api/dto';
import { AppShell } from '@/app/AppShell';
import type { PageHeaderModel } from '@/app/pageHeader';
import { DriverRecord } from './fleet/DriverRecord';
import { Overview, WAITING_FOR_US } from './overview/Overview';
import { CaseRecord } from './insurance/CaseRecord';
import { InsuranceCases } from './insurance/InsuranceCases';
import { PhotoView, casePhotos } from './insurance/PhotoView';
import { CASE_REFRESH } from './insurance/caseAddress';
import { around, clearTaskRenders, count, renderAs } from './followup12.harness';
import { clearRenders, driver, renderPage } from './followup7b.support';
import {
  CAPTURED_AT, caseHdvDita, caseJlmDita, caseKlmDita, caseKlmToms, caseMprDita, caseNdpDita, caseTklCascoDita,
  caseTklUsualDita, countsDita, meAdmin, meDita, meToms, notFoundCase, view1Casco, view1Dita, view1Page2of2,
  view1SearchZzz, view1Toms, view2Dita, view3Dita,
} from './followup17.support';

/**
 * Follow-up 17, rendered to markup from the scratch stack's answers (`followup17.support.ts`): the
 * Insurance cases list with its three views, a case's page as a Fleet Manager and as the Viewer, the
 * other cases of an accident, a closed case and one not found, the large photo view, and the count on
 * the navigation's entry. The page header is the shell's, drawn from a model the page declares in an
 * effect, which a server render never runs; the model is caught here as the page hands it over.
 */
const header = vi.hoisted(() => ({ last: null as PageHeaderModel | null }));
vi.mock('@/app/pageHeader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/pageHeader')>()),
  usePageHeader: (model: PageHeaderModel) => { header.last = model; },
}));

beforeEach(() => {
  // The seed's times are relative to its seeding: read them at the moment the API answered.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
  clearRenders();
  header.last = null;
});

const LIST = (View: InsuranceCaseQuery['View'], extra: Partial<InsuranceCaseQuery> = {}): InsuranceCaseQuery =>
  ({ View, PageNumber: 1, PageSize: 20, ...extra });

const EMPTY_PAGE = { items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 };

const markupOf = (node: ReactNode) => renderToStaticMarkup(h('div', null, node));

/** Whether a query the page built is enabled: the option the page passed, as the cache keeps it. */
const enabled = (query: { options: unknown }) => (query.options as { enabled?: unknown }).enabled;

const list = (at: string, me: CurrentUserResponse, data: Array<[readonly unknown[], unknown]>) =>
  renderAs(h(InsuranceCases), { at, route: '/insurance-cases', me, data: [[qk.insuranceCases.counts, countsDita], ...data] });

/** The row of a case, by the text of its title and the line under it. */
const row = (markup: string, text: string) => around(markup, text, 'tr');

/* the list ---------------------------------------------------------------------------------------- */

describe('the Insurance cases list (F17-2)', () => {
  test('the header with Register case, the strip with the server’s counts, the search and Open’s filters', () => {
    const { markup } = list('/insurance-cases', meDita, [[qk.insuranceCases.list(LIST(1)), view1Dita]]);
    expect(header.last?.title).toBe('Insurance cases');
    expect(header.last?.description).toBe(
      'Damage to the company’s cars and its insurance claims, from the day it is found until the case is closed.');
    expect(markupOf(header.last?.actions)).toMatch(/<button[^>]*data-tone="primary"[^>]*>.*add<\/span>Register case<\/button>/);
    expect(countsDita).toEqual({ open: 5, waitingForUs: 2, closed: 2 });
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*folder_open<\/span>Open<span[^>]*>5<\/span>/);
    expect(markup).toMatch(/pending_actions<\/span>Waiting for us<span[^>]*>2<\/span>/);
    expect(markup).toMatch(/inventory_2<\/span>Closed<span[^>]*>2<\/span>/);
    // The strip as the other pages draw it, as wide as the list on the phone (the compact strip).
    expect(markup).toContain('data-compact="true"');
    expect(markup).not.toContain('Times in Tallinn time.');
    expect(markup).toContain('placeholder="Plate, damage, driver, insurer or claim"');
    // The API reads at most 50 characters of a search.
    expect(markup).toContain('maxLength="50"');
    for (const option of ['Any type', 'Usual', 'Casco', 'Any status', 'Happened', 'Reported', 'Under review', 'Repair',
      'Anyone', 'Us', 'The driver', 'The insurer', 'Someone else', 'Nobody']) {
      expect(markup).toContain(`>${option}</option>`);
    }
    // Closed is not a filter of the open views.
    expect(markup).not.toContain('>Closed</option>');
    expect(markup).not.toContain('Clear filters');
    expect(markup).toContain('>5 cases<');
  });

  test('Open: the API’s rows in its order, each with its type and time, status, waiting, handler and last event', () => {
    const { markup } = list('/insurance-cases', meDita, [[qk.insuranceCases.list(LIST(1)), view1Dita]]);
    expect(markup).toMatch(/>Case<\/th>.*>Status<\/th>.*>Waiting for<\/th>.*>Handled by<\/th>.*>Last event<\/th>/);
    const at = view1Dita.items.map((item) => markup.indexOf(`href="/insurance-cases/${item.id}"`));
    expect(at.every((index) => index > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);

    const hdv = row(markup, '770 HDV · Long scratches on both left doors');
    expect(hdv).toContain('Usual · Found 25 Sep');
    expect(hdv).toMatch(/data-tone="warn"><span[^>]*border-radius:50%[^>]*><\/span>Happened<\/span>/);
    // Waiting for us, in the warn tone at 500; since the registration, two days.
    expect(hdv).toMatch(/class="_us_[^"]*">Us · 2 days</);
    expect(hdv).toMatch(/_dim_[^"]*">Not reported</);
    expect(hdv).toMatch(/_dim_[^"]*">No events yet</);

    const klm = row(markup, '552 KLM · Rear bumper and boot lid dented');
    expect(klm).toContain('Usual · Happened 08 Sep');
    expect(klm).toMatch(/data-tone="info">.*Under review<\/span>/);
    expect(klm).toContain('>The insurer · 6 days<');
    expect(klm).toContain('>Meridian Insurance<');
    expect(klm).toMatch(/_subMono_[^"]*">MI-2026-118305</);
    expect(klm).toContain('>Everything is sent, Meridian is deciding<');
    expect(klm).toContain('>6 days ago<');
    // The folded band's line under the case: Handled by with its claim number.
    expect(klm).toMatch(/_showTablet_[^"]*[^>]*>Meridian Insurance · MI-2026-118305</);

    const jlm = row(markup, '204 JLM · Windscreen cracked by a stone');
    expect(jlm).toContain('Casco · Happened 26 Sep');
    expect(jlm).toMatch(/data-tone="ok">.*Repair<\/span>/);
    expect(jlm).toContain('>Someone else · 3 hours<');
    expect(jlm).toContain('>Today<');
    // An open view's case opens with no view in its address.
    expect(jlm).toContain(`href="/insurance-cases/${view1Dita.items[4]!.id}"`);
  });

  test('Waiting for us: its two cases, the Status filter and no Waiting for filter; a case opens with its view', () => {
    const { markup } = list('/insurance-cases?tab=us', meDita, [[qk.insuranceCases.list(LIST(2)), view2Dita]]);
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*pending_actions<\/span>Waiting for us/);
    expect(count(markup, '<tr class="_row_')).toBe(2);
    expect(markup).toContain('aria-label="Filter by status"');
    expect(markup).not.toContain('aria-label="Filter by waiting for"');
    for (const item of view2Dita.items) expect(markup).toContain(`href="/insurance-cases/${item.id}?tab=us"`);
    expect(markup).toContain('>2 cases<');
  });

  test('Closed: At fault and Closed instead, most recently closed first, and no Status or Waiting for filter', () => {
    const { markup } = list('/insurance-cases?tab=closed', meDita, [[qk.insuranceCases.list(LIST(3)), view3Dita]]);
    expect(markup).toMatch(/>Case<\/th>.*>Status<\/th>.*>At fault<\/th>.*>Handled by<\/th>.*>Closed<\/th>/);
    expect(markup).not.toContain('>Waiting for</th>');
    expect(markup).not.toContain('aria-label="Filter by status"');
    expect(markup).not.toContain('aria-label="Filter by waiting for"');
    expect(markup.indexOf('400 NDP')).toBeLessThan(markup.indexOf('119 MPR'));
    const ndp = row(markup, '400 NDP · Right mirror broken by a passing van');
    expect(ndp).toMatch(/data-tone="mute">.*Closed<\/span>/);
    expect(ndp).toContain('>The other party<');
    expect(ndp).toContain('Closed 19 Sep');
    expect(ndp).toContain('>Meridian Insurance<');
    const mpr = row(markup, '119 MPR · Rear door dented in a car park, the other car left');
    expect(mpr).toContain('>Not found<');
    expect(mpr).toContain('Closed 07 Sep');
    expect(mpr).toMatch(/_dim_[^"]*">Not reported</);
  });

  test('the filters live in the address: a type narrows the list, and Clear filters shows', () => {
    const { markup } = list('/insurance-cases?type=2', meDita, [[qk.insuranceCases.list(LIST(1, { Type: 2 })), view1Casco]]);
    expect(count(markup, '<tr class="_row_')).toBe(view1Casco.items.length);
    expect(markup).toContain('Clear filters');
    expect(markup).toMatch(/Type<\/span><span[^>]*>Casco<\/span>/);
  });

  test('a filter the view does not offer stays in the address but is not asked for (handover d)', () => {
    // Status and Waiting for set on Open, then Closed chosen: Closed asks for its view alone.
    const { markup, client } = list('/insurance-cases?tab=closed&status=2&waiting=1', meDita, [[qk.insuranceCases.list(LIST(3)), view3Dita]]);
    expect(count(markup, '<tr class="_row_')).toBe(2);
    expect(markup).not.toContain('Clear filters');
    const asked = client.getQueryCache().findAll({ queryKey: ['insurance-cases', 'list'] }).map((query) => query.queryKey[2]);
    expect(asked).toEqual([LIST(3)]);
  });

  test('a search that finds nothing, the empty views, and paging', () => {
    const none = list('/insurance-cases?search=zzz', meDita, [[qk.insuranceCases.list(LIST(1, { Search: 'zzz' })), view1SearchZzz]]).markup;
    expect(none).toContain('No results for these filters');
    expect(none).toContain('Nothing matches the current search and filters. Clearing them restores the full list.');
    expect(none).toContain('Clear filters');

    const open = list('/insurance-cases', meDita, [[qk.insuranceCases.list(LIST(1)), EMPTY_PAGE]]).markup;
    expect(open).toContain('No open cases');
    expect(open).toContain('Register a case as soon as you learn about new damage, so nothing is forgotten.');
    expect(open).toMatch(/<button[^>]*>.*add<\/span>Register case<\/button>/);
    const us = list('/insurance-cases?tab=us', meDita, [[qk.insuranceCases.list(LIST(2)), EMPTY_PAGE]]).markup;
    expect(us).toContain('Nothing is waiting for you');
    expect(us).toContain('A case appears here when the next move is yours.');
    const closed = list('/insurance-cases?tab=closed', meDita, [[qk.insuranceCases.list(LIST(3)), EMPTY_PAGE]]).markup;
    expect(closed).toContain('No closed cases yet');

    const paged = list('/insurance-cases?page=2&size=2', meDita, [[qk.insuranceCases.list(LIST(1, { PageNumber: 2, PageSize: 2 })), view1Page2of2]]).markup;
    expect(view1Page2of2.totalCount).toBe(5);
    expect(count(paged, '<tr class="_row_')).toBe(2);
    expect(paged).toContain('3–4 of 5');
  });

  test('the Viewer reads the list with no Register case, even on an empty Open', () => {
    const { markup } = list('/insurance-cases', meToms, [[qk.insuranceCases.list(LIST(1)), view1Toms]]);
    expect(meToms.permissions).toContain('InsuranceCases.Read');
    expect(meToms.permissions).not.toContain('InsuranceCases.Manage');
    expect(header.last?.actions).toBeUndefined();
    expect(count(markup, '<tr class="_row_')).toBe(5);
    const empty = list('/insurance-cases', meToms, [[qk.insuranceCases.list(LIST(1)), EMPTY_PAGE]]).markup;
    expect(empty).toContain('No open cases');
    expect(empty).not.toContain('Register case');
  });

  test('without InsuranceCases.Read nothing is asked for: an API before round 12, and a Record deleter alone', () => {
    const round11: CurrentUserResponse = { ...meDita, permissions: meDita.permissions.filter((p) => !p.startsWith('InsuranceCases.')) };
    const { markup, client } = list('/insurance-cases', round11, []);
    expect(markup).toContain('Not available to you');
    expect(markup).toContain('Opening this page needs InsuranceCases.Read.');
    const queries = client.getQueryCache().findAll({ queryKey: qk.insuranceCases.all });
    for (const query of queries) {
      if (query.state.data === undefined) expect(enabled(query), JSON.stringify(query.queryKey)).toBe(false);
    }
  });
});

/* a case's page ----------------------------------------------------------------------------------- */

const page = (kase: typeof caseKlmDita, me: CurrentUserResponse, tab = '') =>
  renderAs(h(CaseRecord), {
    at: `/insurance-cases/${kase.id}${tab ? `?tab=${tab}` : ''}`,
    route: '/insurance-cases/:caseId',
    me,
    data: [[qk.insuranceCases.detail(kase.id), kase]],
  });

describe('a case’s page (F17-3)', () => {
  test('the header: back to its view, the title, the type beside it and the four actions under it', () => {
    page(caseKlmDita, meDita, 'us');
    expect(header.last?.crumbs).toEqual([
      { label: 'Insurance cases', to: '/insurance-cases?tab=us' },
      { label: '552 KLM · Rear bumper and boot lid dented' },
    ]);
    expect(header.last?.title).toBe('552 KLM · Rear bumper and boot lid dented');
    expect(header.last?.badges).toEqual([{ label: 'Usual', tone: 'plain', dot: '2px' }]);
    expect(header.last?.actionsBelow).toBe(true);
    const actions = markupOf(header.last?.actions);
    expect(actions).toMatch(/data-tone="primary"[^>]*>.*add<\/span>Add event<\/button>.*edit_note<\/span>Add note<\/button>.*edit<\/span>Edit case<\/button>.*add_link<\/span>Casco case for this accident<\/button>/);
  });

  test('the hero: the status, then who it waits for since when, when and where, the driver, the rental, the handler and the fault', () => {
    const { markup } = page(caseKlmDita, meDita);
    expect(markup).toMatch(/data-tone="info" data-size="hero">.*Under review<\/span>/);
    expect(markup).toMatch(/>Waiting for<\/span><span[^>]*><span[^>]*><span>The insurer<\/span><\/span><span[^>]*>since 20 Sep, 14:40 · 6 days<\/span>/);
    expect(markup).toMatch(/>Happened<\/span><span[^>]*><span[^>]*>08 Sep, 08:35<\/span><span[^>]*>Crossing of Pärnu mnt and Liivalaia, Tallinn<\/span>/);
    expect(markup).toMatch(/>Driver<\/span><span[^>]*><span[^>]*><span class="_dim_[^"]*">Not known<\/span>/);
    expect(markup).toMatch(new RegExp(`>Rental</span><span[^>]*><span[^>]*><a[^>]*href="/rental-assignments/${caseKlmDita.rental!.rentalAssignmentId}"[^>]*>Nordwind Logistics</a></span><span[^>]*>Rental from 28 Aug</span>`));
    expect(markup).toMatch(/>Handled by<\/span><span[^>]*><span[^>]*><span>Meridian Insurance<\/span><\/span><span[^>]*>MI-2026-118305<\/span>/);
    expect(markup).toMatch(/>At fault<\/span><span[^>]*><span[^>]*><span class="_dim_[^"]*">Not decided yet<\/span>/);
  });

  test('the timeline, oldest first: the case itself, then each event with its gap, changes, photos and Edit for its author', () => {
    const { markup } = page(caseKlmDita, meDita);
    const timeline = markup.slice(markup.indexOf('>Timeline<'), markup.indexOf('>Photos<'));
    expect(timeline).toContain('What happened, oldest first. Times in Tallinn time.');
    const titles = ['Happened', ...caseKlmDita.events.map((event) => event.title)];
    const at = titles.map((title) => timeline.indexOf(`>${title.replace(/’/g, '’')}<`));
    expect(at.every((index) => index > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    // The case's own entry: the place, what is damaged, its four photos and who registered it.
    const first = timeline.slice(0, timeline.indexOf(caseKlmDita.events[0]!.title));
    expect(first).toContain('data-kind="case"');
    expect(first).toContain('location_on');
    expect(first).toContain('>Rear bumper and boot lid dented<');
    expect(count(first, 'aria-label="Open photo IMG_204')).toBe(4);
    expect(first).toContain(`src="/api/insurance-cases/${caseKlmDita.id}/photos/${caseKlmDita.photos[0]!.id}"`);
    expect(first).toContain('Registered by Dita Smite, 08 Sep, 10:05');
    // Each event: the time since the one before, its chips, who added it.
    expect(timeline).toMatch(/>1 day later<.*>Both drivers reported it on LKF.ee<.*>Status: Reported<.*>Waiting for: The insurer<.*Added by Dita Smite, 09 Sep, 11:38/s);
    expect(timeline).toContain('>19 hours later<');
    // A status change takes its status's tone; a waiting change stays hollow.
    expect(timeline).toContain('data-kind="status" data-tone="info"');
    expect(count(timeline, 'data-kind="event"')).toBe(5);
    // Edit only on the reader's own events: six of Dita's, none on Signe's.
    expect(count(timeline, '>Edit</button>')).toBe(6);
    const signe = around(timeline, 'Meridian asked for a repair calculation', 'li');
    expect(signe).toContain('Added by Signe Priede, 18 Sep, 09:23');
    expect(signe).not.toContain('>Edit</button>');
  });

  test('the photos by their entry, the notes newest first, the insurance, the description and the record', () => {
    const { markup } = page(caseKlmDita, meDita);
    const photos = markup.slice(markup.indexOf('>Photos<'));
    expect(photos).toContain('6 photos, by the entry they belong to.');
    expect(photos).toMatch(/>Happened<\/span><span[^>]*>08 Sep, 08:35<\/span>/);
    expect(photos).toMatch(/>Car shown at the BMW dealer, calculation sent<\/span><span[^>]*>20 Sep, 14:40<\/span>/);
    expect(count(photos.slice(0, photos.indexOf('>Notes<')), 'data-size="panel"')).toBe(6);

    const notes = markup.slice(markup.indexOf('>Notes<'), markup.indexOf('>Insurance<'));
    expect(notes).toContain('Newest first.');
    expect(notes).toMatch(/<button[^>]*>.*add<\/span>Add note<\/button>/);
    expect(notes.indexOf('handler is on leave')).toBeLessThan(notes.indexOf('Under warranty until 2027'));
    expect(count(notes, '>Edit</button>')).toBe(1);
    expect(notes).toContain('Signe Priede, 19 Sep, 16:20');

    const insurance = markup.slice(markup.indexOf('>Insurance<'));
    expect(insurance).toMatch(/>Our insurer<\/span><span[^>]*>Baltic Mutual</);
    expect(insurance).toMatch(/>Claim number<\/span><span class="_mono_[^"]*[^>]*>BM-26-04417</);
    expect(insurance).toMatch(/>The other party’s insurer<\/span><span[^>]*>Meridian Insurance</);
    expect(insurance).toMatch(/_full_[^"]*"><span[^>]*>Handled by<\/span><span[^>]*>Meridian Insurance \(the other party’s\)</);
    expect(markup).toMatch(/>Description<\/h2>.*Hit from behind at a crossing while waiting at the red light./s);
    expect(markup).toMatch(/>Created<\/span><span[^>]*>08 Sep, 10:05<\/span><span[^>]*>by Dita Smite<\/span>/);
    expect(markup).toMatch(/>Last updated<\/span><span[^>]*>21 Sep, 10:33<\/span><span[^>]*>by Dita Smite<\/span>/);
    // Two columns from 1024 px: the timeline and the photos on the left, the rest on the right.
    expect(markup).toContain('data-cols="2"');
    const left = markup.slice(markup.indexOf('data-cols="2"'), markup.indexOf('>Notes<'));
    expect(left).toContain('>Timeline<');
    expect(left).toContain('>Photos<');
  });

  test('the Viewer reads it all with no action and no Edit, the driver and the rental still links', () => {
    const { markup } = page(caseKlmToms, meToms);
    expect(caseKlmToms.canChange).toBe(false);
    expect(header.last?.actions).toBeUndefined();
    expect(markup).not.toContain('>Edit</button>');
    expect(markup).not.toContain('Add note');
    expect(markup).toContain(`href="/rental-assignments/${caseKlmToms.rental!.rentalAssignmentId}"`);
    const tkl = page(caseTklUsualDita, meToms).markup;
    expect(tkl).toMatch(new RegExp(`href="/drivers/${caseTklUsualDita.driverId}"[^>]*>Kristine Vitola</a>`));
  });

  test('a case found rather than happened, with no events, no insurers and no notes of the reader', () => {
    const { markup } = page(caseHdvDita, meDita);
    // Found at 08:40; it waits for us since it was registered, at 09:15.
    expect(markup).toMatch(/>Found<\/span><span[^>]*><span[^>]*>25 Sep, 08:40<\/span><span[^>]*>Car wash, Pärnu mnt 139, Tallinn<\/span>/);
    expect(markup).toMatch(/>Handled by<\/span><span[^>]*><span[^>]*><span class="_dim_[^"]*">Not reported<\/span>/);
    expect(markup).toMatch(/>Waiting for<\/span><span[^>]*><span[^>]*><span class="_us_[^"]*">Us<\/span><\/span><span[^>]*>since 25 Sep, 09:15 · 2 days<\/span>/);
    const timeline = markup.slice(markup.indexOf('>Timeline<'), markup.indexOf('>Photos<'));
    expect(timeline).toMatch(/>Found<\/span>/);
    expect(timeline).not.toContain('data-line');
    expect(count(timeline, '<li')).toBe(1);
    expect(markup).toMatch(/>Our insurer<\/span><span class="[^"]*_dim_[^"]*">None</);
    expect(markup).toMatch(/>The other party’s insurer<\/span><span class="[^"]*_dim_[^"]*">Not known</);
    expect(markup).toMatch(/>Last updated<\/span><span class="[^"]*_dim_[^"]*">Never</);
    expect(markup).not.toContain('>Description</h2>');
    expect(markup).toContain('3 photos, by the entry they belong to.');
  });

  test('the two cases of one accident: each lists the other; only the usual one without its casco offers one', () => {
    const usual = page(caseTklUsualDita, meDita).markup;
    const usualActions = markupOf(header.last?.actions);
    expect(usual).toContain('The other case of this accident.');
    const link = around(usual, `href="/insurance-cases/${caseTklCascoDita.id}"`, 'div');
    expect(link).toContain('>482 TKL · Front bumper and right headlight</a>');
    expect(link).toContain('>Casco<');
    expect(link).toMatch(/data-tone="info">.*Reported<\/span>/);
    // It already has its casco case.
    expect(usualActions).not.toContain('Casco case for this accident');
    expect(usual).toContain('No notes yet.');
    expect(usual).toContain('No photos yet');

    const casco = page(caseTklCascoDita, meDita, 'us').markup;
    expect(header.last?.badges).toEqual([{ label: 'Casco', tone: 'plain', dot: '50% 50% 50% 0' }]);
    expect(markupOf(header.last?.actions)).not.toContain('Casco case for this accident');
    expect(casco).toContain(`href="/insurance-cases/${caseTklUsualDita.id}?tab=us"`);
    // A casco case alone (204 JLM) offers none either.
    page(caseJlmDita, meDita);
    expect(markupOf(header.last?.actions)).not.toContain('Casco case for this accident');
  });

  test('a closed case: nobody to wait for, since when, and the fault decided', () => {
    const { markup } = page(caseNdpDita, meDita, 'closed');
    expect(markup).toMatch(/data-tone="mute" data-size="hero">.*Closed<\/span>/);
    expect(markup).toMatch(/>Waiting for<\/span><span[^>]*><span[^>]*><span>Nobody<\/span><\/span><span[^>]*>since 19 Sep, 13:00<\/span>/);
    expect(markup).toMatch(/>At fault<\/span><span[^>]*><span[^>]*><span>The other party<\/span>/);
    expect(markup).toMatch(/data-kind="status" data-tone="mute"/);
    const mpr = page(caseMprDita, meDita, 'closed').markup;
    expect(mpr).toMatch(/>At fault<\/span><span[^>]*><span[^>]*><span>Not found<\/span>/);
    expect(mpr).toMatch(/>Driver<\/span><span[^>]*><span[^>]*><span class="_dim_[^"]*">Not known<\/span>/);
  });

  test('a case that does not exist', () => {
    const { markup } = renderAs(h(CaseRecord), {
      at: '/insurance-cases/gone', route: '/insurance-cases/:caseId', me: meDita,
      errors: [[qk.insuranceCases.detail('gone'), notFoundCase]],
    });
    expect(notFoundCase.code).toBe('insurance_cases.not_found');
    expect(markup).toContain('That case is not available');
    expect(markup).toContain('This case no longer exists.');
    expect(markup).not.toContain('Try again');
    expect(header.last?.title).toBe('Insurance case');
  });
});

/* the photo view ---------------------------------------------------------------------------------- */

describe('the large photo view (F17-3)', () => {
  const view = (photoId: string) => markupOf(h(PhotoView, { kase: caseKlmDita, photoId, onMove: () => {}, onClose: () => {} }));

  test('every photo of the case in timeline order, the first with no ‹ and the last with no ›', () => {
    const photos = casePhotos(caseKlmDita);
    expect(photos.map((p) => p.photo.fileName)).toEqual([
      'IMG_2041.jpg', 'IMG_2042.jpg', 'IMG_2043.jpg', 'IMG_2044.jpg', 'IMG_2107.jpg', 'IMG_2108.jpg',
    ]);
    const first = view(photos[0]!.photo.id);
    expect(first).toContain('>Happened<');
    expect(first).toContain('>552 KLM · Rear bumper and boot lid dented · 08 Sep, 08:35<');
    expect(first).toContain(`src="/api/insurance-cases/${caseKlmDita.id}/photos/${photos[0]!.photo.id}"`);
    expect(first).toContain('>IMG_2041.jpg<');
    expect(first).toContain('>Added by Dita Smite, 08 Sep, 10:05 · 2 KB<');
    expect(first).toContain('>1 of 6<');
    expect(first).toContain('aria-label="Close photo"');
    expect(first).not.toContain('aria-label="Previous photo"');
    expect(first).toContain('aria-label="Next photo"');

    const last = view(photos[5]!.photo.id);
    expect(last).toContain('>Car shown at the BMW dealer, calculation sent<');
    expect(last).toContain('· 20 Sep, 14:40<');
    expect(last).toContain('>6 of 6<');
    expect(last).toContain('aria-label="Previous photo"');
    expect(last).not.toContain('aria-label="Next photo"');
  });
});

/* the count and freshness ------------------------------------------------------------------------- */

describe('the count on Insurance cases in the navigation (F17-8)', () => {
  const shell = (me: CurrentUserResponse, data: Array<[readonly unknown[], unknown]>) =>
    renderAs(h(AppShell, { companyName: 'RW-Rent Demo' }), { at: '/overview', route: '/overview', me, data });

  test('the entry carries the cases waiting for us', () => {
    const { markup } = shell(meDita, [[qk.insuranceCases.counts, countsDita]]);
    const entry = around(markup, 'aria-label="Insurance cases"', 'a');
    expect(entry).toContain('href="/insurance-cases"');
    expect(entry).toMatch(/shield<\/span><span[^>]*>Insurance cases<\/span><span class="_badge_[^"]*">2<\/span>/);
    // The administrator reads them too.
    expect(meAdmin.permissions).toEqual(expect.arrayContaining(['InsuranceCases.Read', 'InsuranceCases.Manage']));
    expect(shell(meAdmin, [[qk.insuranceCases.counts, countsDita]]).markup).toContain('aria-label="Insurance cases"');
  });

  test('without InsuranceCases.Read there is no entry and no count is asked for', () => {
    const round11: CurrentUserResponse = { ...meDita, permissions: meDita.permissions.filter((p) => !p.startsWith('InsuranceCases.')) };
    const { markup, client } = shell(round11, []);
    expect(markup).not.toContain('aria-label="Insurance cases"');
    const counts = client.getQueryCache().find({ queryKey: qk.insuranceCases.counts });
    expect(counts && enabled(counts)).toBe(false);
  });
});

describe('every write refreshes what it changes (F17-10)', () => {
  test('one prefix holds the case, the views, the counts and the dialogs’ lists; the deletions page follows', async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    const client = new QueryClient();
    const keys = [
      qk.insuranceCases.detail(caseKlmDita.id), qk.insuranceCases.list(LIST(1)), qk.insuranceCases.list(LIST(2)),
      qk.insuranceCases.counts, qk.insuranceCases.insurers, qk.recordDeletions.counts(2),
    ];
    for (const key of keys) client.setQueryData(key, {});
    client.setQueryData(qk.vehicles.list({ PageSize: 100 }), {});
    await Promise.all(CASE_REFRESH.map((queryKey) => client.invalidateQueries({ queryKey })));
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated, JSON.stringify(key)).toBe(true);
    expect(client.getQueryState(qk.vehicles.list({ PageSize: 100 }))?.isInvalidated).toBe(false);
  });
});

/* the Overview and the driver's page -------------------------------------------------------------- */

const overview = (me: CurrentUserResponse, data: Array<[readonly unknown[], unknown]>) =>
  renderAs(h(Overview), { at: '/overview', route: '/overview', me, data: [[qk.overview, {}], ...data] });

describe('the Overview’s insurance cases waiting for us (F17-8)', () => {
  test('the tile reads the count and opens Waiting for us; the card lists that view’s cases, each opening its case', () => {
    const { markup } = overview(meDita, [[qk.insuranceCases.counts, countsDita], [qk.insuranceCases.list(WAITING_FOR_US), view2Dita]]);
    expect(WAITING_FOR_US).toEqual(LIST(2));
    expect(markup).toMatch(/href="\/insurance-cases\?tab=us"[^>]*>.*car_crash<\/span><span[^>]*>Insurance cases waiting for us<\/span><\/span><span[^>]*><span[^>]*>2<\/span><span[^>]*>cases<\/span>/);
    const card = markup.slice(markup.indexOf('>Insurance cases waiting for us</h2>'));
    expect(card).toContain('Open cases where the next move is ours, the longest waiting first.');
    expect(card).toContain('>2 cases<');
    expect(card).not.toContain('Sample · module under development');
    const first = around(card, '>770 HDV · Long scratches on both left doors<', 'a');
    expect(first).toContain(`href="/insurance-cases/${view2Dita.items[0]!.id}?tab=us"`);
    expect(first).toMatch(/data-tone="warn"><span[^>]*>car_crash<\/span>/);
    expect(first).toContain('>No events yet<');
    expect(first).toContain('>Waiting for us · 2 days<');
    expect(first).toContain('chevron_right');
    const second = around(card, '>482 TKL · Front bumper and right headlight<', 'a');
    expect(second).toContain('>Baltic Mutual asked for the mileage and photos of the damage<');
    expect(second).toContain('>Waiting for us · 21 hours<');
    expect(card.indexOf('770 HDV')).toBeLessThan(card.indexOf('482 TKL'));
  });

  test('nothing waiting for us: the card says so', () => {
    const { markup } = overview(meToms, [[qk.insuranceCases.counts, { ...countsDita, waitingForUs: 0 }], [qk.insuranceCases.list(WAITING_FOR_US), EMPTY_PAGE]]);
    expect(markup).toContain('>Nothing is waiting for you<');
    expect(markup).toContain('>0 cases<');
  });

  test('without InsuranceCases.Read neither the tile nor the card shows, and nothing about insurance is asked', () => {
    const round11: CurrentUserResponse = { ...meDita, permissions: meDita.permissions.filter((p) => !p.startsWith('InsuranceCases.')) };
    const { markup, client } = overview(round11, []);
    expect(markup).not.toContain('Insurance cases waiting for us');
    expect(markup).not.toContain('Unresolved insurance cases');
    const queries = client.getQueryCache().findAll({ queryKey: qk.insuranceCases.all });
    expect(queries.length).toBeGreaterThan(0);
    for (const query of queries) expect(enabled(query), JSON.stringify(query.queryKey)).toBe(false);
  });
});

describe('the driver’s page loses its placeholder panel (F17-1)', () => {
  test('no “Insurance cases” panel and no “under development” note', () => {
    const markup = renderPage(h(DriverRecord), {
      at: `/drivers/${driver.id}`,
      route: '/drivers/:driverId',
      permissions: ['Drivers.Read'],
      data: [[qk.drivers.detail(driver.id), driver]],
    });
    expect(markup).toContain('>Record</h2>');
    expect(markup).not.toContain('>Insurance cases</h2>');
    expect(markup).not.toContain('Claims and policy records involving this driver.');
    expect(markup).not.toContain('not part of the current phase');
  });
});
