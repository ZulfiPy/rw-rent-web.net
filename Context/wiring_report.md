# Frontend Wiring: Follow-up 20, the small fixes before going live, the app's half

> Follow-up 20 (`Context/wiring_followups.md` §20): every field at 16 px on a phone (F20-1), the tab
> strip's active tab whole once its counts arrive (F20-2), and the drivers list's search naming the
> licence number (F20-3), after the backend's round 15 (`RWRentApi-wiring/Context/round15_report.md`
> §5). Frontend only: nothing in `RWRentApi-wiring` was changed or rebuilt. On `feature/backend-wiring`
> in this worktree (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main`
> after verification. Written 2026-10-01. It replaces Follow-up 19's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173 or 5174, never called 5001 or
> 5002, and never read or wrote `rwrent_v1` or `rwrent_check`.
>
> - Both of the owner's apps hot-reload from this worktree, so they show this run's code (§8, item 1).
> - Every live look used this run's own stack: round 15's API on 5003, left running by round 15, and
>   this run's Vite on 5176 against it, besides a harness of the real pages on 5175 (§4.1).
> - **For the owner's reviewer: §5 lists the signed-in steps, on 5176 against 5003, with a phone step
>   for F20-1 and for F20-2.**

## 1. Summary

- **F20-1, a field's text is 16 px on a phone.** Below 768 px every text field, select and text area
  of the app draws its text at 16 px, so Safari on an iPhone has no reason to zoom the page when one
  is tapped. That is one rule in the base stylesheet, naming the fields by kind, so a field added later
  has it too.
  - The filters, the page size and the driver pick show their value in a span over a transparent
    select; those values are 16 px on the phone too, and their labels keep their sizes.
  - Checkboxes, radios and the photo picker are not typed into and keep their sizes, as do labels,
    hints and buttons. From 768 px up nothing changes.
  - Measured at 402 px: the 19 fields of the insurance cases list with its Register case form open are
    all 16 px; at 768 px and above they keep their old 12.5 to 14 px. The sign-in page's two fields on
    5176 grew from 40 to 43 px tall, which is what the larger text needs.
- **F20-2, the active tab whole once its counts arrive.** Whenever the tabs change width, the strip
  brings the active tab whole into view again, without a slide, unless the person has already scrolled
  it. Every page with the strip gains it, since they all draw the one component.
  - Measured at 402 px on Delete records opened straight on Insurance cases, its counts held back 6
    seconds: before, the tab stood 127 px past the strip's edge once the counts arrived. Now, in the
    very frame they arrived, the strip moved from 644 to 776 without a slide, and the tab stands whole.
  - Scrolled by the person before the counts arrive, the strip stays where they put it.
  - A click on another tab still slides to it, and the bold that widens the chosen tab in that frame
    does not cut the slide short.
  - Repeated on the final code, where the page's font also narrowed the tabs after the first seat: at
    the first frame the strip moved from 645 to 776 without a slide, the tab whole.
- **F20-3, the drivers list's search.** It reads "Name, licence number or email", as the API searches
  it since round 15 and as the Delete records page's Drivers tab already said. Through 5003, "ae-118"
  finds Anete Kalnina, LV-AE-118440, on both lists.

| | |
|---|---|
| Commits | five `Wiring 51` commits and this report's `Wiring 52`, on `feature/backend-wiring` (§9) |
| Tests | 742 before, **761** now, all green: 19 new, none changed (§2.4) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the five (§4.4) |
| Planted breakages | **32 planted, 32 caught**: 13 for F20-1, 16 for F20-2, 3 for F20-3; one test made stronger after the first run (§4.3) |
| In a browser | the real pages at 402, 767, 768, 1024 and 1512 px from a stand-in transport; the app on 5176 signed out against 5003 (§4.2) |
| Safari | **not measured**: this Mac has no Xcode, so no iOS Simulator (§8, item 2) |

## 2. Implemented

### 2.1 F20-1: the fields (`src/styles/base.css` and three modules)

- **The rule**, in the base stylesheet under `@media (max-width: 767px)`:
  `input:not([type='checkbox']):not([type='radio']):not([type='file']), select, textarea { font-size: 16px !important; }`.
  - It is `!important` because every module's own class sets its field's size, `.control` 13 px,
    the filters' `.input` 13.5 px, the picker's `.find` 13 px and so on, and a class outranks an
    element selector. The reduced-motion rule in the same file is written the same way for the same
    reason.
  - It names the fields by kind, so it reaches every field of the app's 18 components that draw one,
    105 of their 110 inputs, selects and text areas, and any field added later. The five it leaves out
    are 3 checkboxes, 1 radio and the photo picker's file input.
  - It reaches the transparent selects too: the filters', the page size's and the driver pick's. They
    inherited 14 px or 12.5 px, and they are what Safari measures when one is tapped.
- **The values shown over those selects**, each in its own module under the same query:
  `Filters.module.css` `.selectValue, .moreValue`, `Pagination.module.css` `.sizeValue` and
  `NewAssignment.module.css` `.searchValue`, all 16 px. They are what the reviewer saw at 13 px as
  "the filters' selects". The filter's name beside its value, "Per page", and the extra filter's name
  above it keep their sizes.
- Nothing else of a field changes: its padding, border and height rules are as they were, so it grows
  only by the larger line.

### 2.2 F20-2: the strip (`src/ui/tabStrip.ts`, new, and `src/ui/RecordTabs.tsx`)

- **What the strip does in the browser moved into `tabStrip`**, a function started on the strip's
  element, as `revealFirstInvalid` is for a dialog. `RecordTabs` starts it once in a layout effect,
  stops it when it goes, and seats the active tab on each choice, the first without a slide. It draws
  exactly the markup it drew.
- **What stayed:** the first paint of a deep link lands on the active tab without a slide, a later
  choice slides, the tab keeps 22 px from the strip's edges, and the cut edge fades as before.
- **New:** a `ResizeObserver` on the tab buttons themselves. When their widths change, the counts
  arriving among them, fonts loading too, the active tab is seated again without a slide.
- **The person's scroll** is a scroll of the strip while their finger is on it, or a wheel turned
  sideways over it. From then on, a change of width never moves the strip. A wheel that mostly scrolls
  the page, and a tap, are not the person scrolling the strip.
- **A choice's bold:** choosing a tab sets it in bold, which widens it and narrows the one left, in
  the frame its slide starts. The slide is already heading where the wider tab stands whole, so a
  change of width that asks for the same place leaves it to finish.
- **Only a slide is waited for.** An instant seat stands where it stops as it is sent. The browser may
  then keep it short of where it was sent, as when the page's font narrows the tabs, so waiting for it
  could keep a later change of width from seating the tab; the strip does not wait for it.
- **React's development mode starts every effect twice.** The second start must not take the first
  start's scroll for the person's, or the counts would never seat the tab on 5173 and 5174, which run
  in that mode. Only a finger or a sideways wheel makes a scroll the person's, so that cannot happen;
  a test starts the strip twice.

### 2.3 F20-3: the words (`src/pages/fleet/Drivers.tsx`)

The drivers list's search placeholder, which `SearchInput` also gives as the box's name, reads "Name,
licence number or email". Its cap stays 50. The Delete records page keeps its own copy of the same
words, and a test renders both pages and compares them.

### 2.4 Tests

**19 new test cases, none changed** (742 before, 761 now). Each new file reads one item:

| File | Cases | What they hold |
|---|---|---|
| `pages/followup20.fields.test.ts` | 5 | the base rule exactly, in the phone query only; every `<input>`, `<select>` and `<textarea>` in the app's components read from the source, only checkboxes, radios and the photo picker left out, and the prop-typed input's union read too; no other `!important` size anywhere; the four shown values at 16 px on the phone and their old sizes above, their labels unchanged; the app's transparent selects being exactly those |
| `pages/followup20.strip.test.ts` | 12 | the strip played as the browser holds it: the Delete records page's seven tabs at 402 px, their boxes from their widths and the scroll, the observer fired as the browser fires it. A deep link; the counts widening the tabs; a tab in the middle keeping 22 px; a finger's scroll; a tap and a page-scrolling wheel; a sideways wheel; a click's bold; an instant seat the browser moves as the tabs narrow; a tab already whole; React's double start; stopping; and `RecordTabs` read for its wiring |
| `pages/followup20.drivers.render.test.ts` | 2 | the drivers list's words, shown and spoken, its cap 50; the Delete records page's Drivers tab rendering the same words |

`RecordTabs`'s effects do not run in a server render, so its wiring is read from its source, as
Follow-up 16's test reads which pages draw it. The browser measurements in §4.2 are the proof that it
runs.

## 3. Not implemented or partial

Nothing of §20. Safari's zoom itself could not be measured here (§8, item 2).

## 4. Verification

### 4.1 The stack

- **The API:** round 15's, on 5003, pid 55167, started 2026-10-01 07:02:47 from the backend
  worktree's `bin/Release`, over `rwrent_r15`, as round 15 left it. This run only read through it: the
  sign-in page's one request, and the drivers searched as Dita and the administrator (§4.2).
- **The app:** this run's Vite on 5176 from this worktree, with `VITE_API_BASE_URL=http://localhost:5003`.
- **The harness:** Follow-up 19's, on 5175, with the app's real pages from this worktree and a
  stand-in transport that sends nothing anywhere. It gained `?slow=` to hold every count back that
  long, and a log of every scroll the strip was sent and every size its tabs reported.
- Both ran from launch entries added to the workspace's `.claude/launch.json` for the run and removed
  after it; the file is as it was.

### 4.2 In a browser

**F20-2, Delete records at 402 px, opened straight on Insurance cases:**

| What | Measured |
|---|---|
| The first paint, counts held 6 s | seated at 150 ms without a slide, at the strip's end, 644; the tab 4.7 px inside the edge |
| The counts arrive, at 6.18 s | in that frame the seven tabs reported their new widths, 171, 171, 121, 100, 108, 84 and 151 px, and the strip moved 644 to 776 without a slide; the tab 4.7 px inside the edge, at the strip's end |
| The counts in, no frame yet | with the counts laid out and no frame run yet, so before the observer could act, the tab stood 126.8 px past the edge: where it stayed before this fix, as Follow-up 19 measured, 127 |
| Counts in 30 ms | seated at 644 at 157 ms, then at 776 at 211 ms, both without a slide |
| The person first, counts held 9 s | a sideways wheel at 4.8 s moved the strip to 344; at 9.17 s the tabs reported their widths and nothing moved the strip; it stayed at 344 |
| A click on Customers, nobody's scroll | one slide, 766 to 674; in that frame Customers' bold widened it 108 to 110 px and Insurance cases narrowed 151 to 149, and no second scroll followed; Customers ends 22 px inside the left edge |

| On the final code, `746d572` | the first seat was sent to 944 under the fallback font; the page's font then narrowed the tabs and the browser held the strip at 645. At the first frame drawn the tabs reported their counted widths and the strip moved 645 to 776 without a slide; the tab 4.7 px inside the edge |

- The browser pane renders only while it is shown. While it was hidden, no frame ran and no observer
  fired, and a screenshot drew one frame; the last row's frame was such a screenshot.
- **The person's finger was not seen in a browser.** The pane's clicks arrive as a mouse's, even at
  a phone's width, so the person's scroll above was a sideways wheel. A finger's scroll is held by
  the strip's tests with a stand-in strip; §5.2 step 3 asks the reviewer to swipe.

**F20-1, at 402 px:**

- **The insurance cases list:** the search box and the 5 transparent selects at 16 px; the shown
  values at 16 px; their labels and "Per page" at 12.5 px.
- **Register case:** 4 text fields, the time, 7 selects and the text area at 16 px; its 2 checkboxes
  14 px and the photo picker's input 13 px, as before. The labels at 12.5 px.
- **At 767 px** all 19 fields of the page are 16 px. **At 768, 1024 and 1512 px** they are as before:
  13 px in the form, 13.5 px the search, 14 px and 12.5 px the transparent selects, 13 px and 12.5 px
  the shown values.
- **The sign-in page on 5176**, signed out against 5003: the email and password fields are 16 px and
  43 px tall at 402 px, 14 px and 40 px at 1024 px. Its only API request went to
  `http://localhost:5003/api/me`, which answered 401, as expected.

**F20-3:**

- **The drivers list** in the harness reads "Name, licence number or email", spoken the same, cap 50.
- **Through 5003**, read-only, as Dita: "ae-118", "LV-AE-118440", "kalnina" and "anete.kalnina" each
  find Anete Kalnina, LV-AE-118440, alone. As the administrator, the Delete records page's drivers
  find her by "ae-118" too.

### 4.3 The planted breakages: 32 planted, 32 caught

Each changed one rule in a copy of the commit taken with `git archive`, never the worktree; the whole
suite and the typecheck ran in the copy; the file was then written back fresh, and the copy ran clean
at the end. F20-1's and F20-3's ran on `7a9e363`, whose files for them are final, 760 green at the
end; the strip's sixteen ran again on the final `746d572`, 761 green at the end, and those are the
results below.

| # | The breakage | Caught by |
|---|---|---|
| A1 | the base rule is gone | the base rule's test; the `!important` test |
| A2 | the rule without `!important` | the same two |
| A3 | the rule on every tier | the same two |
| A4 | the tablet gets it too | the same two |
| A5 | selects left out | the same two |
| A6 | text areas left out | the same two |
| A7 | checkboxes given 16 px too | the same two |
| A8 | the date fields left out | the same two |
| A9 | a filter's shown value stays 13 px | the shown values' test |
| A10 | the page size's shown value as before | the same |
| A11 | the driver pick's shown value at 15 px | the same |
| A12 | a field's own class outranks the rule | the `!important` test |
| A13 | a filter's label grows with its value | the shown values' test |
| B1 | a change of width does not seat the tab | 6 of the strip's tests |
| B2 | the second seat slides | the same 6 |
| B3 | the tabs' widths are not watched | the same 6 |
| B4 | the person's scroll is ignored | the finger's and the sideways wheel's tests |
| B5 | a finger's scroll is not the person's | the finger's test |
| B6 | a finger once down stays on the strip | the tap's test |
| B7 | every wheel is the person's, the page's scroll too | the tap and page wheel's test |
| B8 | a sideways wheel is not the person's | the sideways wheel's test |
| B9 | the bold of a click cuts the slide short | the click's test |
| B10 | any scroll the app is not heading for is the person's | the same 6, React's double start among them |
| B11 | a deep link slides | the deep link's, the middle tab's and the double start's tests |
| B12 | stopped, it still hears the wheel | the stopping test |
| B13 | the room from the edge is 0 | the deep link's, the middle tab's, the counts' and the double start's tests |
| B14 | `RecordTabs` never starts the strip | the wiring's test |
| B15 | `RecordTabs` seats only once | the wiring's test |
| B16 | an instant seat is waited for as a slide is | the instant seat's test |
| C1 | the old words back | both of F20-3's tests |
| C2 | the words leave out the licence | both |
| C3 | the Delete records page's words drift | the comparing test |

- **One test made stronger:** in the first run B13 was caught, but not by the test written for the
  room, which read the 22 px from the module it was planted in. That test now reads 22 itself, in its
  own commit `43a9e79`.
- **B16** is the line `746d572` changed, put back.
- B4, B5, B7, B11 and B14 also left a type error, an unused name; each was caught by a failing test
  besides.

### 4.4 The test suite, and each commit

- `npx vitest run`: **761 passed**, 70 files. `tsc -b --noEmit`: 0 errors.
- `vite build` into a scratch folder: green, with the chunk-size warning that predates this run.
- Each commit exported alone with `git archive`, typechecked and tested:

| Commit | Type errors | Tests |
|---|---|---|
| `8516839` | 0 | 747 |
| `b07f5b6` | 0 | 758 |
| `7a9e363` | 0 | 760 |
| `43a9e79` | 0 | 760 |
| `746d572` | 0 | 761 |

### 4.5 The owner's side, untouched

- 5001 is pid 43055 and 5002 pid 42710, as before; neither was called.
- 5173 is pid 24831 and 5174 pid 58932, as before; neither was opened.
- `rwrent_v1` and `rwrent_check` were never addressed, and nothing in `RWRentApi-wiring` changed.

### 4.6 End state

- **The API on 5003 is left running**, pid 55167, over `rwrent_r15`, as round 15 left it. This run
  added only the sessions of its own sign-ins as Dita and the administrator.
- **Nothing else of this run runs.** The Vite on 5176 and the harness on 5175 are stopped, and nothing
  listens on either port.

## 5. For the owner's reviewer: the signed-in steps

### 5.0 Before you start

- **The stack:** the API on 5003 over `rwrent_r15`, round 15's seed and its acceptance's records.
- **Start Vite on 5176 from this worktree.** The API trusts only that origin:
  `VITE_API_BASE_URL=http://localhost:5003 npm run dev -- --port 5176 --strictPort`
- **Use a browser profile of its own**, never the owner's. The apps on 5173, 5174 and 5176 share
  `localhost`'s cookies, so signing in on 5176 in the owner's profile signs the owner out of 5173.
- **The seeded people**, all with the seed password: the administrator, Arturs Veidenbaums
  (`sysadmin@rwrent.example`), who may delete records; Dita Smite, Fleet Manager.

### 5.1 At 1512 px

1. **Sign in as Dita and open Drivers.** The search reads "Name, licence number or email".
2. **Type `ae-118`.** Anete Kalnina alone, licence LV-AE-118440. Type `kalnina`: the same. Clear it.
3. **Register case, from Insurance cases.** The fields' text is as before, 13 px; nothing moved.
   Cancel.
4. **Sign out, and in as the administrator. Delete records, Drivers.** The search reads the same
   words; `ae-118` finds Anete Kalnina.
5. **The strip at this width:** all seven tabs fit, and choosing one changes nothing but the choice.

### 5.2 On the phone

At 402 px, in the browser's device mode, with its network throttled to Slow 4G so the counts come
late:

1. **F20-2, a deep link.** As the administrator, open `http://localhost:5176/delete-records?kind=insurance-cases`
   and reload. Insurance cases, the last tab, stands whole at the strip's right end before its count
   arrives, and still whole once every tab shows its count, with no slide.
2. **The same for Drivers:** `?kind=drivers`. Drivers stands whole, its count beside it.
3. **The person first.** Reload on Insurance cases and, before the counts arrive, swipe the strip to
   the right so the first tabs show. When the counts arrive, the strip stays where the finger left it.
4. **A tap on another tab** slides to it, as before, and it ends whole.
5. **F20-1.** Tap the search box, a filter, Per page, and in Register case each kind of field. In the
   inspector each field's computed size is 16 px; the labels, hints and buttons are as before. Signed
   out, the sign-in page's two fields are 16 px.

**On an iPhone, on the first day the app is reached from one:** tap the drivers list's search, a
filter, and a field of Register case. The page does not zoom in; before this run it did, and stayed
zoomed. An iPhone cannot reach `localhost:5176` on the Mac, so this step waits for a reachable address,
or for Xcode's iOS Simulator on the Mac (§8, item 2).

## 6. Decisions

Choices this run made where the specification left room, each small to change:

1. **One base rule, naming the fields by kind, with `!important`,** rather than 16 px in each field's
   own module. It reaches every field there is and every field to come; a test holds that nothing
   else in the app sets a size with `!important`.
2. **The values shown over transparent selects are 16 px too.** The rule alone would stop the zoom,
   since Safari measures the select itself; but those values are the selects' text as a person reads
   it, which §20 counts as "the filters' selects" at 13 px.
3. **The strip's behaviour is a plain function, `tabStrip`, the component its one caller,** so its
   rules can be played in node with a stand-in strip.
4. **The person's scroll is a finger's or a sideways wheel's.** The strip's scroll events alone cannot
   tell the person from the app: React's development mode starts the strip twice, and the second start
   would take the first one's scroll for the person's. Keyboard scrolling of the strip is not counted;
   a phone has none.
5. **Once the person has scrolled the strip, a change of width never moves it again** while the page
   is open. A choice still slides to the chosen tab, as before.
6. **The observer watches the tabs, not the strip.** A change of the strip's own width, a rotated
   phone, is not a change of the tabs, and §20 asks for nothing there.
7. **The Delete records page keeps its own copy of the drivers' words,** untouched; a test compares the
   two pages' rendered words.

## 7. Deviations

None from §20.

## 8. Open risks and observations

1. **The owner's apps on 5173 and 5174 hot-reloaded this code as it was saved.** Each file was written
   whole, swapped in at once, after its typecheck and tests ran in a scratch copy, and `tabStrip.ts`
   before the `RecordTabs.tsx` that imports it.
   - F20-1 and F20-2 need nothing of an API, and show there as here.
   - Their APIs run round 14, whose drivers search finds by name and email only. Until the reviewer
     upgrades them to round 15, their drivers list's search names the licence number before it finds
     a driver by one.
2. **Safari was not measured.** This Mac has the command line tools but no Xcode, so no iOS Simulator;
   the built-in browser pane is Chromium, and Safari on a Mac does not zoom into fields.
   - Safari on an iPhone zooms when a field whose text is under 16 px is focused. Every field is now 16
     px on the phone tier, as computed in Chromium; the rule is plain CSS, which Safari reads the same.
   - §5.2 gives the reviewer the iPhone step for the day the app is reachable from one.
3. **A field on the phone is a few pixels taller**, 3 px for the sign-in page's; the toolbar's filters
   keep their 35 px and only their values grow, so a filter with a long value is wider. Whether a
   toolbar now wraps a filter onto another line where it did not was not compared.
4. **The user record page has its own strip**, older than the shared one, with no seating of the
   active tab at all: Account, Roles and Sessions, three short tabs. It is not the shared strip, so §20
   does not reach it, and it was left as it is; how it stands on a phone was not measured here.
5. **The two compact strips**, Tasks' and Insurance cases', fit the phone whole and never scroll, so
   the re-seat finds nothing to move there.
6. **What the suite does not hold:** that the browser fires the observer when the counts land. The
   rules are tested with a stand-in strip and the wiring is read from the source; the browser measured
   the result (§4.2). A finger's scroll was seen only with the stand-in strip; §5.2 step 3 is its look
   in a browser.

## 9. Commits

On `feature/backend-wiring`, after `05662ed`, in this order:

1. **`8516839`** Wiring 51: On a phone every text field, select and text area draws its text at 16 px, so Safari never zooms the page when one is tapped, and a select drawn over its value shows that value at 16 px too.
   5 files (under `src/`): `pages/fleet/NewAssignment.module.css`; added `pages/followup20.fields.test.ts`; `styles/base.css`; `ui/Filters.module.css`; `ui/Pagination.module.css`.

2. **`b07f5b6`** Wiring 51: The tab strip brings its active tab whole into view again whenever the tabs change width, its counts arriving among them, without a slide, unless the person has already scrolled the strip.
   3 files (under `src/`): added `pages/followup20.strip.test.ts`; `ui/RecordTabs.tsx`; added `ui/tabStrip.ts`.

3. **`7a9e363`** Wiring 51: The drivers list's search reads Name, licence number or email, as the API now searches it and as the Delete records page already says.
   2 files (under `src/`): `pages/fleet/Drivers.tsx`; added `pages/followup20.drivers.render.test.ts`.

4. **`43a9e79`** Wiring 51: The strip's test reads the active tab's room from the edge as 22 px itself, so a strip seated without that room is caught by the test written for it.
   1 file: `src/pages/followup20.strip.test.ts`.

5. **`746d572`** Wiring 51: The strip waits only for its own slides, so an instant seat the browser moves as the tabs narrow never keeps a later change of width from seating the active tab.
   2 files (under `src/`): `pages/followup20.strip.test.ts`; `ui/tabStrip.ts`.

6. **This report's commit**, `Wiring 52`: `Context/wiring_report.md`, rewritten.
