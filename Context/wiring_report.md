# Frontend Wiring — Follow-up 16, Tasks follows the other lists' layout

> Follow-up 16 (`Context/wiring_followups.md` §16): the owner asked that Tasks follow "absolutely the
> same design pattern and positioning pattern as the vehicle section or any other section"; the reviewer
> measured Tasks against Vehicles, Rental assignments, Drivers and Customers and found two differences,
> both fixed here. Frontend only; the backend and its contract did not change. On `feature/backend-wiring`
> in this worktree (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main` after
> verification. Written 2026-09-26. It replaces Follow-up 15's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001, never read or wrote `rwrent_v1` and never read Mailpit. The backend worktree was only
> built (in Release) and run, never changed.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it showed this run's code as it was
>   written. Every changed file was edited in a copy outside the worktree, typechecked and tested there,
>   and copied in whole, so the owner's app never loaded a half-written file.
> - Every live check used a scratch stack built for this run: `rwrent_check`, created, migrated and
>   seeded by round 11's Release build, behind the API on 5002.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

- **F16-1, the note leaves the Tasks list.** "Times in Tallinn time." is no longer drawn beside the tab
  strip, at any width, and so no longer drops to a line of its own on the phone. The tab strip stands
  alone in its row, a direct part of the page as on Delete records, with the list 14 px under it. The
  list shows its times as Vehicles and Rental assignments show theirs: local times with no note. The
  task's own page keeps its note (its header's description), and so does the Overview's Open tasks card.
- **F16-2, on the phone the Tasks tab bar is as wide as the list.** Below 768 px the bar runs edge to
  edge with the list under it (at 402 px: 370 of 370 px on a page without a scrollbar, 360 of 360 with
  one; it was 326 of 370). Its three tabs share the width: each keeps its label and count on one line
  and the space left over is shared evenly between them, labels centred. On the tablet and the desktop
  the bar stays as wide as its tabs, and the other three pages' bars do not change.
- **Nothing else changed:** the tabs still scroll away with the list (the owner's decision), the task's
  page, the Overview's card, the dialogs, the words, Insurance cases.

| | |
|---|---|
| Commits | `fd9e22c`, `c4519a7`, `b7bf09d` (`Wiring 41`) and this report's (`Wiring 42`), on `feature/backend-wiring` (§9) |
| Tests | 509 → **516**, all green: 7 new; 1 existing test updated on purpose (§2.4) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the three (§4.5) |
| Planted breakages | **10 planted, 10 caught** by the suite (§4.4) |
| Joint check | **14/14** through the API on a freshly seeded database (§4.2) |
| In a browser | Tasks at 1512, 834 and 402 px beside Vehicles and Delete records, light and dark; the app on 5174 signed out (§4.3) |

## 2. Implemented

### 2.1 F16-1: the note leaves the list (`src/pages/tasks/Tasks.tsx`, `Tasks.module.css`)

- The Tasks page draws `RecordTabs` straight in its page stack, as Delete records does; the row that
  held the strip and the note (`tabsRow`) and the note itself (`zone`, `LOCAL_TIME_NOTE`) are gone from
  the list, with their two rules in `Tasks.module.css`.
- The list's times are unchanged: local times, as `formatLocal` has always drawn them, with no note, as
  on Vehicles and Rental assignments.
- The task's own page (`TaskRecord.tsx`) keeps `LOCAL_TIME_NOTE` as its header's description; the
  Overview's Open tasks card keeps its sentence. Neither file changed.

### 2.2 F16-2: the phone's tab bar (`src/ui/record.module.css`, `RecordTabs.tsx`)

- The shared strip already has a compact form, which only Tasks asks for (`compact`): below 640 px its
  tabs drop their icons and tighten. Below 768 px the compact strip now takes the width it stands in
  (`width: 100%`), and each tab `flex: 1 0 auto`, centred, on one line (`white-space: nowrap`): a tab
  starts at the width of its label and count, never shrinks below it, and the width left over is
  shared evenly between the three. Split in plain thirds, "Involving me 5" (about 125 px with its
  padding) would not fit a third of the phone's bar (about 117 px) and would break: here it cannot.
- From 768 px up nothing is added: every strip keeps `width: max-content`, Tasks' included.
- Only Tasks passes `compact`, so the other three bars (a rental assignment's own page, the Profile page,
  Delete records) do not change: they keep filling the phone's width and scrolling with their fade.
- `RecordTabs.tsx` changed only in the comment that says what `compact` does.

### 2.3 What stays

The tabs scroll away with the list, as today; on the phone only the page's top block stays on screen,
on every page (§4 item 10 stays open). The task's page, the Overview's card, the dialogs, the words and
Insurance cases are unchanged.

### 2.4 Tests

**The test whose expectation this run changes on purpose:**

| Test | Before | Now |
|---|---|---|
| `followup12.render` › the Tasks list (F12-2) › "the header, the strip with the server’s counts, the zone, the search and the Due filter", renamed "… the strip with the server’s counts and no note of the zone, …" | the list's markup contains "Times in Tallinn time." | the list's markup does not contain it; every other expectation of the test is as it was |

The tests of the task's page (`followup12.render` › a task’s page › its header's description "Times in
Tallinn time.") and of the Overview card (its sentence ending "Times in Tallinn time.") are unchanged
and pass. No other test changed, and none was deleted, skipped or weakened.

**The new tests** (7):

| File | Cases | What they hold |
|---|---|---|
| `followup16.render.test.ts` | 6 | **F16-1:** none of the three views draws "Times in Tallinn time." and the page header's description is the list's own sentence; the `zone` and `tabsRow` rules are gone; the tab strip is a direct child of the page, followed at once by the list's panel, and in the source of Tasks and of Delete records the strip and the panel are siblings; the task's own page keeps the note as its header's description. **F16-2:** below 768 px the compact strip is `width: 100%` and its tabs `flex: 1 0 auto`, centred, on one line, never shrinking; from 768 px up `.tabs` keeps `width: max-content` and every compact rule sits in a phone query; the app draws `RecordTabs` on exactly four pages and only Tasks passes `compact`, so the other three do not change |
| `followup16.phone.render.test.ts` | 1 | on the phone tier, My tasks and Involving me: no note; the page opens with the compact strip, its three tabs and counts, and then at once the list's panel with its cards |

## 3. Not implemented or partial

**Nothing of Follow-up 16.** F16-1 and F16-2 are built and tested.

### 3.1 The steps that need a password typed into the app

This run may not type a password into the app, so the signed-in steps in a real browser are the
reviewer's, on 5174 and 5002 (§5). The same pages were looked at here in the real code drawn from
recorded answers (§4.3).

## 4. Verification

### 4.1 The scratch stack

As `RWRentApi-wiring/Context/round11_report.md` §7 describes it: nothing ran on 5002 or 5174 at the
start and `rwrent_check` did not exist. It was created, migrated and seeded by round 11's Release build
of the backend worktree at `1b51206` (clean; work tasks 8, work task steps 11), and the API started on
5002 from `bin/Release` with `ApiSecurity__RecordDeleterEmailDomain=rwrent.example`, trusting
`http://localhost:5174`. Every command sourced an environment script that refuses to run unless its
connection string names `rwrent_check`; the API client refuses any address but `localhost:5002`; the
seed password was the one the owner gave for this session, passed in each command's environment only.
The joint check only reads, so the seed is still as it was made.

### 4.2 Through the API — 14/14

As Dita, Signe, Toms, Karlis and the administrator:

- **The tab row's counts** (9): for each of the four people the three counts the tabs show (Dita 5, 1,
  1; Signe 3, 1, 2; Toms 3, 3, 0; Karlis 0, 0, 0), each equal to its view's total; the administrator,
  who has no Tasks, is refused them.
- **The list's times** (3): the Tasks list's due and closed times, the Rental assignments list's and the
  Vehicles list's are all UTC instants of the same form, which the app turns into local times without a
  note on every one of these lists.
- **What must keep working** (2): a task's own page reads as before; Delete records, the other list with
  a tab bar, still gets a count for each of its six tabs.

### 4.3 In a browser

**The real pages**, the app's own code from this worktree, served on 5175 from a folder outside both
repositories with a stand-in transport that answers from recorded answers (Follow-up 15's practice
answers for Dita and Toms, the scratch API's Vehicles list; Delete records' lists, as the administrator,
answered empty, which leaves its six tabs and its panels in place) and sends no request anywhere. Each
width loaded fresh.

**The row with the tabs:**

| Width | Tasks | Delete records | Vehicles |
|---|---|---|---|
| 1512 | the bar alone in its row, 413 px, as wide as its three tabs (126, 147, 121); the list 14 px under it; no note anywhere on the page | the bar alone in its row, 855 px, as wide as its six tabs; its list 14 px under it; its "Recently deleted" panel keeps "Times in Tallinn time." in its description, as before | no tabs; the list under the header; no note |
| 834 | the same: 413 px, as wide as its tabs, the list 14 px under it, no note | its six tabs need more than the width, so the bar fills it (802 of 802) and scrolls, as before | as at 1512 |
| 402 | **the bar edge to edge with the list:** 370 of 370 px on a page without a scrollbar, 360 of 360 with one (it was 326 of 370, and the note stood on a line of its own under it); the tabs 108.8, 129.8 and 103.4 px, each label and count on one line (38 px high, the height of one line); no note | its six tabs fill the width (360 of 360) and scroll with the fade at the end, as before | as at 1512 |

- **Wide counts on the phone.** With 128 in every tab ("My tasks 128", "Involving me 128", "Finished
  128") the labels still stay on one line; the three need about 365 px, so in a list of 360 px the bar
  scrolls by about 5 px with its fade, as the other pages' bars do; in the 370 px of a page without a
  scrollbar it fits.
- **Light and dark:** the same in both.
- **Console:** no error from the app.

**The app on 5174**, signed out, in the browser pane (not the owner's browser): `/tasks` went to Sign in;
its only API request went to 5002 (`/api/me`), none to 5001.

### 4.4 The planted breakages — 10 planted, 10 caught

Each replaced one exact piece in a copy of the worktree outside it, the full suite ran, and the piece
was written back; the restored copy passes. Each breakage is valid code, so what catches it is a test,
not a failed build (the first form of G2 left a tag unclosed and was rewritten as a valid wrap).

| # | Breakage | Caught by |
|---|---|---|
| G1 | the note back beside the strip | 4 tests |
| G2 | the strip wrapped in a row of its own again | 2 |
| G3 | the task's own page loses its note | 2 |
| G4 | the phone's bar only as wide as its tabs | 1 |
| G5 | the tabs split in plain thirds, free to shrink | 1 |
| G6 | a label and its count free to break onto two lines | 1 |
| G7 | the labels not centred in their tabs | 1 |
| G8 | the full width on the tablet and the desktop too | 1 |
| G9 | every page's bar made full width | 1 |
| G10 | Delete records given the compact strip | 1 |

### 4.5 The test suite, and each commit

Final state: typecheck 0 errors, **516/516** tests in 49 files, build green. Each commit alone, from
`git archive` into a folder of its own: `fd9e22c` 509, `c4519a7` 509, `b7bf09d` 516, all green with 0
type errors.

### 4.6 The owner's side, untouched

The owner's API on 5001 (pid 7505) and the app on 5173 (pid 24831) ran on their own processes
throughout; this run sent them nothing. `rwrent_v1` was not read, as the run's rules require. Mailpit
was not read. The backend worktree is clean at `1b51206`.

### 4.7 End state

- The scratch API runs on **5002** (pid 89104) over `rwrent_check`, **freshly seeded** at 08:47 Tallinn
  time on 2026-09-26, for the reviewer. Nothing runs on 5174 or 5175.
- The workspace's launch file is as it was.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. Start it from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173. After changing the window's width,
  reload the page.
- **The people**, all with the seed password: Dita `dita.smite@rwrent.example` (Fleet Manager), Toms
  `toms.rudzitis@rwrent.example` (Viewer), the administrator `sysadmin@rwrent.example` for Delete
  records.
- **Afterwards:** nothing here writes; the practice data stays as seeded.

### 5.1 The steps

1. **Desktop, about 1512 px, Dita, Tasks.** The tab bar stands alone under the header, as wide as its
   three tabs, with no "Times in Tallinn time." anywhere on the page; the list follows it. Open a task:
   its page still says "Times in Tallinn time." under its title. The Overview's Open tasks card still
   ends its sentence with it.
2. **Beside Delete records**, as the administrator: its bar also stands alone in its row, the list under
   it at the same distance.
3. **Upright iPad, 834 px, Dita, Tasks.** The same: the bar as wide as its tabs, no note, the list under
   it.
4. **iPhone, 402 px, Dita, Tasks.** The tab bar runs exactly from the list's left edge to its right
   edge; "My tasks", "Involving me" and "Finished" each on one line with its count; no line with the
   time zone between the bar and the list. Switch tabs: the bar stays edge to edge. Scroll down: the bar
   scrolls away with the list, and the page's top block stays.
5. **iPhone, 402 px, beside the others:** a rental assignment's own page, the Profile page and Delete
   records keep their bars as before: filling the width and scrolling sideways with a fade.
6. **Light and dark:** the same in both.

## 6. Decisions needed

None. Choices made where §16 left room, each reversible in a line:

1. **"Share the width evenly"** is read as each tab starting at the width of its label and count and the
   space left over shared evenly, since plain thirds break "Involving me" on the phone, as the reviewer
   saw.
2. **When the labels need more than the phone's width** (three-digit counts in every tab on a list
   narrower than about 365 px), the bar scrolls sideways with its fade rather than breaking a label, as
   the other pages' bars do.
3. **The strip is drawn straight in the page**, without the row that held the note, as Delete records
   draws its own.

## 7. Deviations

None: §16 and the code agree.

## 8. Open risks

1. **The phone's pinned top** (§4 item 10) is app-wide and was not part of this run; the tabs scroll
   away with the list, as the owner decided.

## 9. Commits

| Commit | Group | Files |
|---|---|---|
| `fd9e22c` | on the phone the Tasks tab bar spans the list, each label on one line; nothing else's bar changes | `src/ui/record.module.css`, `src/ui/RecordTabs.tsx` |
| `c4519a7` | the Tasks list without the time-zone note, its tab bar alone in its row; the test that read the note | `src/pages/tasks/Tasks.tsx`, `src/pages/tasks/Tasks.module.css`, `src/pages/followup12.render.test.ts` |
| `b7bf09d` | new tests for both items | `src/pages/followup16.render.test.ts` (new), `src/pages/followup16.phone.render.test.ts` (new) |
| this one | the report | `Context/wiring_report.md` |
