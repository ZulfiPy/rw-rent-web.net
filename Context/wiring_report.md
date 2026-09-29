# Frontend Wiring: Follow-up 18, the owner's desktop fixes to Insurance cases

> Follow-up 18 (`Context/wiring_followups.md` §18): the band's labels on one line (F18-1), the insurers
> as a list the company keeps (F18-2a to F18-2g), and the Waiting for column on one line (F18-3), built
> on the backend's round 13 (`RWRentApi-wiring/Context/round13_report.md` §5, the contract). Frontend
> only; the backend was not changed and not rebuilt, only run from its round 13 Release build. On
> `feature/backend-wiring` in this worktree (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer
> fast-forwards `main` after verification. Written 2026-09-29. It replaces Follow-up 17's report, which
> git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173 or 5174, never signed in anywhere,
> never called 5001 or 5002, never read or wrote `rwrent_v1` or `rwrent_check`, and never read Mailpit.
>
> - Both of the owner's apps hot-reload from this worktree, so they showed this run's code as it was
>   written (§8, items 1 and 2). The owner's API on 5001 still answers round 11, which grants no
>   insurance permission, so the owner's app still offers no Insurance cases, no Insurers button and
>   asks for no insurer. The practice API on 5002 still answers round 12, so the practice app's
>   insurance pages do not work with this code until the reviewer upgrades the practice copy, as the
>   owner knows.
> - Every live check used this run's own stack: round 13's API on 5003 over `rwrent_r13`, re-created and
>   seeded twice (§4.1), and this run's Vite on 5176 against it.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5176 against 5003.**

## 1. Summary

- **F18-1, the band's labels.** In a record's band where one fact has a line under its value, every
  fact now stands from the top of its reserve, so the labels share one line, the values the line under
  it, and the lines under the values the line below that. Measured at 1512 and 1024 px: on both 770 HDV
  cases Driver, Handled by and At fault stood 9.1 px lower than Waiting for, Found or Happened and
  Rental; they now stand level. The task page is fixed the same way. The user and rental-assignment
  bands, where no fact has such a line, are unchanged, and no band changed its height.
- **F18-3, Waiting for on one line.** The column is 190 px from 1024 up, as wide as its longest
  value, and each value is kept on one line there.
- **F18-2, the insurers.**
  - A case's form picks each insurer from the list with a picker that has a find box. At the foot of
    the picker, **Add an insurer** opens the Add insurer window over the form. That window shows the
    insurers that look alike, and **Use this one** chooses one of them instead.
  - A case's page shows each insurer's email and phone, and marks one that is out of use.
  - The cases list gains **Handled by** on every view.
  - The new **Insurers** page opens from a button beside Register case. It has Show, the counts, and
    the links to the cases each insurer handles. A manager can Add insurer, Edit, and Put out of use
    or back.
  - All of it is hidden without `InsuranceCases.Read`.
  - The API holds every rule. The app decides only which insurers it offers, and the API's refusals
    land under the field they name.

| | |
|---|---|
| Commits | seven `Wiring 45` commits and this report's `Wiring 46`, on `feature/backend-wiring` (§9) |
| Tests | 627 → **704**, all green: 77 new; 13 existing tests updated on purpose and two fixture files moved to round 13's contract (§2.8) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the seven (§4.5) |
| Planted breakages | **47 planted, 43 caught** by the suite; the four others are key and focus behaviours only a browser shows, three of them checked in the browser (§4.4) |
| Joint check | **25/25 twice**, each on a freshly seeded `rwrent_r13` through 5003 (§4.2) |
| In a browser | the real pages at 1512, 1280, 1024, 834 and 402 px from a stand-in transport; the app on 5176 signed out against 5003 (§4.3) |

## 2. Implemented

### 2.1 F18-1: the band's labels (`src/ui/RecordHeader.tsx`, `RecordHeader.module.css`)

- `RecordHeader` marks its facts row `data-sub-lines="true"` when one of its facts has a line under its
  value. The stylesheet then stands every fact of that row from the top of the 54.5 px reserve,
  `align-self` and `justify-content` both `flex-start`, instead of centring it.
- The reserve is unchanged, so the band keeps its height. The chip and the buttons stay on the band's
  centre line.
- A band with no such line, like the user's and a rental's, carries no mark and is drawn as before.
- The phone tier stacked its facts from the top already.
- The four bands built of facts are those of a case, a task, a user and a rental assignment. Only the
  first two have lines under values.

### 2.2 F18-3: the Waiting for column (`src/pages/insurance/InsuranceCases.module.css`, `InsuranceCases.tsx`)

- **The width.** `.cWaiting` goes from 170 to 190 px. The longest value the column can hold is
  "Someone else · 59 minutes", which measures 161 px in Geist 13 px; with the cell's 14 px on each
  side, the column needs 189 px.
- **One line.** Each value carries `waitingText`, which keeps it on one line from 1024 up, so a
  value can never break even in another font.
- **The folded band.** At 768 to 1023 px the column keeps its 121 px, and a value may wrap there as
  before.
- **The table's floor stays 920 px.** The three text columns give up the 20 px between them.

### 2.3 F18-2a: the contract (`src/api`, `src/format`)

- **`dto.ts`.**
  - New types:
    - `InsuranceCaseInsurerResponse`: `id`, `name`, `email`, `phoneNumber` and `isActive`.
    - `InsurerListItemResponse`, with `openCasesHandled`, `casesNamed` and `concurrencyToken`.
    - `InsurerResponse`, which adds who added the insurer and who last changed it.
    - `InsurerQuery`, `CreateInsurerRequest` and `UpdateInsurerRequest`.
  - A case and a list item now carry `ourInsurer` and `otherInsurer` as insurer objects or null.
  - A registration's form and an edit's JSON send `ourInsurerId` and `otherInsurerId`.
  - `InsuranceCaseQuery` gains `HandledByInsurerId`.
- **`src/api/insurers.ts`** holds the six operations of `/api/insurers`.
- **Removed.** `listInsurers` of `GET /api/insurance-cases/insurers`, its query key, the `rw-insurers`
  datalist and the typed insurer fields are gone.
- **`codes.ts`: where each refusal lands.**
  - `insurers.name_conflict` stands under Name when a person adds or edits an insurer. It is a 409
    that carries its field.
  - `insurers.concurrency_conflict` is the stale banner with Refresh, matched by its suffix like the
    other concurrency codes.
  - `insurers.not_found` is a refused change in the API's words, through the windows' own
    `insurerRefusal`.
  - `insurance_cases.insurer_not_found` and `insurance_cases.insurer_out_of_use` always arrive with
    their field under `errors`: `OurInsurerId`, `OtherInsurerId` or `HandledByInsurerId`. The shared
    mapping puts each one under that field. One code names either insurer, so the table gives it no
    single input. The table lists both codes, so the catalogue test checks them too.
- **What each write refreshes.**
  - Adding an insurer refreshes the insurers.
  - Editing one, or putting it out of use or back, refreshes the insurers and every case read, so a
    rename shows on the cases at once.
  - Beyond the specification, every case write, and a vehicle's deletion, which takes its cases,
    also refreshes the insurers, because the list counts the cases (§6, item 11).
- **`src/format/insurers.ts`.**
  - The words: Out of use, Choose an insurer, Not chosen, No insurers yet, the look-alike heading
    and the page's description.
  - The count: "1 insurer", "4 insurers".
  - The mail and phone links.
  - The two rules of a typed name, described in §2.4.

### 2.4 F18-2c and F18-2d: the picker and the Add insurer window (`InsurerPicker.tsx`, `InsurerDialogs.tsx`, `CaseDialogs.tsx`)

- **The picker**, for Our insurer and for The other party's insurer, in Register case, Edit case and
  Casco case for this accident.
  - Closed, it shows the chosen insurer, marked Out of use when it is, or "Choose an insurer".
  - Open, it shows, in this order:
    - a find box that takes the focus;
    - Not chosen;
    - the insurers in use whose names hold what is typed, in the list's order, the chosen one with a
      check;
    - on an edit, the case's own insurer of that side, even out of use, marked so;
    - at the foot, Add an insurer.
  - When the list is empty, "No insurers yet" stands above Add an insurer. When something is typed
    and no insurer holds it, a line says so in the same place.
  - The arrows start from the chosen line and move through the lines, Add an insurer included. Enter
    chooses. Esc closes the list and gives the focus back to the control, without closing the
    dialog. A press outside closes it, and so does Tab.
  - What each key does is its own rule, `findKey`.
- **Handled by** keeps its options from the two chosen insurers, for example "Our insurer · Baltic
  Mutual". Clearing the side it names resets it; that is the rule `withInsurer`.
- **Casco case for this accident** copies the usual case's own insurer, with Handled by Ours, only
  while that insurer is in use.
- **Add an insurer** opens the Add insurer window over the case's form.
  - The window opens with what was typed in the find box, has its own Refresh, and never re-seeds
    the case.
  - Each look-alike in use carries Use this one, which chooses it on the case and closes the window.
    One out of use is marked so, without the button.
  - An insurer added is chosen on the case at once and is on the list for everyone.
- **The Add insurer and Edit insurer windows.**
  - Name is required, at most 100 characters. Email is optional, at most 254, typed as an email.
    Phone is optional, at most 30.
  - From two letters on, "Already on the list, and looks alike" lists the insurers that look alike
    above the buttons. An insurer looks alike when its name holds what is typed, when what is typed
    holds a word of four letters or more of its name, or when what is typed, without spaces, is its
    name's initials. Letter case, accents and runs of spaces are ignored. An edited insurer is not a
    look-alike of itself.
  - Edit sends the insurer's token.
- **Dialogs over dialogs** (`src/ui/Dialog.tsx`). When more than one modal is open, Esc now closes
  only the one on top. So Esc in the Add insurer window leaves the case's form open. With a single
  dialog, nothing changes. Besides the shared `Dialog`, only the photo view carries
  `role="dialog" aria-modal="true"`, and it is always drawn after the case's dialogs.

### 2.5 F18-2e: a case's page (`CaseRecord.tsx`)

- **The Insurance panel.** Each insurer shows its name, marked Out of use when it is, and under the
  name its email as a mail link and its phone as a call link, when it has them.
- **The links are quiet.** They use the ink of other secondary text and take the accent only under
  the pointer (§6, item 12).
- **Handled by**, in the band and in the list's column, shows the name as before.

### 2.6 F18-2f: the cases list's Handled by (`InsuranceCases.tsx`, `caseAddress.ts`)

- **Where it stands.** Handled by is a filter on every view. It stands beside Waiting for on Open,
  and after Type on Closed.
- **Its options.** Anyone comes first, then the insurers in use, then those out of use marked "·
  Out of use", each group in the list's order.
- **How it is sent.** It sends `HandledByInsurerId`. It lives in the address as `handled`, and is
  kept and cleared like the other filters.
- **An insurer the list does not hold.**
  - The filter shows it as "Not on the list".
  - The API's refusal stands under the filter: "This insurer does not exist."
  - The list shows the filters' own empty state with Clear filters.

### 2.7 F18-2b and F18-2g: the Insurers page (`Insurers.tsx`)

- **How it opens.** The **Insurers** button stands beside Register case for everyone who reads
  cases. It opens `/insurance-cases/insurers`, a route of its own that needs `InsuranceCases.Read`
  and is not in the navigation.
- **Its header.** The breadcrumb reads Insurance cases, Insurers. The description reads "The insurers
  the company works with. A case picks its insurers from this list."
- **Show.** It offers In use, the default, Out of use and All. The choice lives in the address.
- **The table.**
  - Name, with Out of use marked.
  - Email, as a mail link.
  - Phone, as a call link.
  - Open cases it handles, a link that opens the Open view filtered to the insurer, or a plain 0.
  - Cases, how many cases name the insurer.
- **Actions.** With `InsuranceCases.Manage`: Add insurer in the header, and on each row Edit and
  Put out of use or Put back in use. The last two go through a confirmation window drawn as a
  vehicle's Deactivate and Activate are. Without the permission, no action appears anywhere.
- **The empty states.**
  - "No insurers yet" when the company has none, with Add insurer for a manager.
  - "No insurers in use" when all are out of use.
  - "No insurers out of use".
- **Widths.**
  - Below 1280 px, Email and Phone fold under the name, as Vehicles folds its columns.
  - Below 768 px each insurer is the other lists' card.
- **F18-2g.** Without `InsuranceCases.Read`, there is no Insurers button, the page reads "Not
  available to you", and no insurer query is enabled.

### 2.8 Tests

**77 new tests, 13 existing ones updated on purpose**, with the lists the Follow-up 17 dialog tests
share and the code catalogue one test reads (627 → 704, 57 → 63 files). None was deleted, skipped or
weakened.

**The fixtures moved to round 13's contract.** `followup17.support.ts` and `followup17.practice.ts`
held each insurer as a name, as round 12 answered.

- **What changed.** The run captured round 13's answers for the same seven cases and three views
  from a freshly seeded `rwrent_r13`. Each name in the two files became the insurer object round 13
  gives for it: 31 values in the first file, 5 in the second.
- **What stayed the same.** Round 13's answers matched Follow-up 17's in every other member, with 0
  differences, apart from the times and tokens, which the seed sets afresh.
- **What went.** The `insurers` fixture of the removed endpoint is gone.
- **What did not change.** The deletions' audit copies stay as round 12 wrote them.

Each file's header says this.

**The tests updated on purpose:**

| Test | Before | Now |
|---|---|---|
| `pages/followup17.stylesheet.test.ts` · "from 1024 up: … Waiting for 170 …" (renamed "… Waiting for 190 (Follow-up 18) …") | `.cWaiting` 170px | 190px |
| `pages/followup17.dialogs.render.test.ts` · the dialogs' lists | the insurer names under `qk.insuranceCases.insurers` | round 13's list under `qk.insurers.list({})` |
| same file · "a new case: the sections, …" | Our insurer a text input with `list="rw-insurers"` and `maxLength="100"`, the datalist of the three names | each picker shows "Choose an insurer"; no datalist |
| same file · "the ticks turn the labels … Handled by's options" | the form seeded with `ourInsurer: 'Baltic Mutual'`, `otherInsurer: 'Meridian Insurance'` | seeded with their ids; the same options expected |
| same file · "what Register case sends …" | `ourInsurer: 'Baltic Mutual'`, `otherInsurer: null` | `ourInsurerId: <Baltic Mutual's id>`, `otherInsurerId: null` |
| same file · "Edit case: the case as its page read it …" | Our insurer's input holds `value="Baltic Mutual"` | the pickers show Baltic Mutual and Meridian Insurance |
| same file · "what Edit case sends …" | the form's insurer names | their ids, and both ids sent |
| same file · "Casco case for this accident …" | `value="Baltic Mutual"`, the other party's `value=""` | the pickers show Baltic Mutual and "Choose an insurer" |
| `pages/followup17.render.test.ts` · "the photos by their entry, … the insurance …" | the insurer's name straight in the fact's value | the name leading the insurer's block (`_insurer_`), email and phone under it |
| same file · "every write refreshes …" (renamed "… the deletions page and the insurers follow") | `qk.insuranceCases.insurers` among the refreshed keys | `qk.insurers.list({})` |
| same file · "the Viewer reads the list with no Register case …" | the header has no action at all | the header holds Insurers and no Register case |
| `format/insurance.test.ts` · "who handles it: …" | the insurers as names | the insurers as round 13's objects; the same words expected |
| `api/codes.test.ts` · the backend's catalogue | round 12's codes | and round 13's five |
| `api/insuranceCases.test.ts` · "each field under its member name …" | the form field `OurInsurer` | `OurInsurerId`, and none sent for the other side |

**The new tests:**

| File | Tests | What they hold |
|---|---|---|
| `pages/followup18.layout.test.ts` | 10 | F18-1: the band's mark with and without a line under a value, the stylesheet's rule, both 770 HDV cases and 552 KLM, a case still loading, two tasks, the user and rental bands unmarked; F18-3: 190 px with one line from 1024 up, the folded band as it was, every value carrying the class; the browser's two findings (§4.3) |
| `api/insurers.test.ts` | 2 | the six operations as the transport receives them |
| `format/insurers.test.ts` | 9 | the name's key, the count and links, the find box, the three look-alike rules, two letters, accents and case, an edited insurer |
| `pages/followup18.dialogs.render.test.ts` | 32 | the picker's own rules and keys; Register case's pickers closed, open, filtered, empty, chosen, what it sends and its refusals under the right picker; Edit case keeping an insurer out of use and refused changing to one; Casco only in use; Add an insurer over the form with Use this one; Add and Edit insurer, what they send, their refusals, stale and gone; Put out of use and back, what each sends; where each insurer refusal lands |
| `pages/followup18.render.test.ts` | 21 | a case's insurers with email and phone, out of use marked, for a manager and a Viewer; the list's Handled by on each view, set, out of use, refused, loading; the Insurers page as a manager, a Viewer, empty, none in use, none out of use; the Insurers button and the permission; what each write refreshes |
| `pages/followup18.phone.render.test.ts` | 2 | the Insurers page's cards, a manager's and a Viewer's |
| `app/routes.test.ts` | +1 | `/insurance-cases/insurers` is its own route by any spelling, needs `InsuranceCases.Read`, is not in the navigation |

The new fixtures are round 13's answers as it gave them on 5003, typed as the DTOs.

- **`followup18.support.ts`** holds the list at each Show, one insurer, each view filtered to Baltic
  Mutual, and the refusals.
- **`followup18.practice.ts`** holds the joint check's first run: Pilot Insurance AS added, renamed,
  put out of use, on a case of 770 HDV.

## 3. Not implemented or partial

Everything §18 asks for is built, F18-3 included. This run could not type the seed password into the
app, so the steps that need it are in §5 for the reviewer.

## 4. Verification

### 4.1 The stack

- **The API.** At the start, round 13's API ran on 5003, pid 86580, over `rwrent_r13` as round 13's
  acceptance left it.
  - The run used round 13's own scripts, copied into its scratchpad. They refuse any connection
    string that does not name `rwrent_r13`, and stop only a process listening on 5003 that runs from
    the backend worktree's `bin/Release`.
  - With them, `rwrent_r13` was dropped, recreated, migrated with eleven migrations,
    `V11Insurers` last, and seeded with four insurers and seven cases. The API was started on 5003.
  - This was done twice: before the fixtures were captured, and again before the joint check's
    second run.
  - The backend worktree was not changed and not rebuilt. Its `bin/Release` is round 13's build.
- **The seed password** was passed through each command's environment only. It is in no file,
  script, log or report.
- **The app.** This run's Vite ran on 5176 from this worktree, with
  `VITE_API_BASE_URL=http://localhost:5003`. It was started from a launch entry outside both
  repositories, which is now removed.
- **The harness.** The real pages were served on 5175 from a folder outside both repositories,
  answered by a stand-in transport that sends nothing anywhere (§4.3).

### 4.2 Through the API, 25/25 twice

A script ran as the seeded people, against 5003 only. It sends exactly what the app sends: Add and
Edit insurer as JSON with the insurer's token, Put out of use and back with no body, Register case
as the form the app builds, Edit case as JSON, and the filter as `HandledByInsurerId`.

| Checks | What was proved |
|---|---|
| 1–3 | the list: the seed's four in the order of the names, with Baltic Mutual 3 open handled of 4 named, Meridian 1/2, Northgate 0/1, Old Harbour 0/0 out of use; the Viewer reads it, may not add one (403) |
| 4–6 | Dita adds Pilot Insurance AS with email and phone (201); "  pilot   INSURANCE as " refused (409 `insurers.name_conflict` under Name); the list holds five in order |
| 7–8 | Register case on 770 HDV naming Baltic Mutual and Pilot Insurance AS by their ids, handled by theirs: both named with email and phone; the list counts it |
| 9–12 | the rename to Pilot Insurance Group with its token; the old token refused (409 `insurers.concurrency_conflict`); the case reads the new name at once; the list's search finds it by that name |
| 13–21 | Put out of use (204); the Viewer may not put it back (403); Out of use lists Old Harbour and Pilot; the old case keeps it, marked out of use; a new case naming it refused (400 `insurer_out_of_use` under `OtherInsurerId`); Edit case changing only the damage keeps it (200); changing the other insurer to Old Harbour refused under `OtherInsurerId`; Handled by Pilot on Open finds the case while Pilot is out of use; Put back in use (204) |
| 22–25 | Handled by Baltic Mutual on Open, Waiting for us and Closed gives each view's cases whose Handled by names it, in the view's order (3 on Open); an unknown insurer refused under `HandledByInsurerId`; putting out of use an unknown insurer 404; the counts at the end |

The first run's answers are the repository's `followup18.practice.ts`. The second run on a fresh seed
passed the same 25 checks; its records are what 5003 holds now (§4.7).

### 4.3 In a browser

**The real pages** came from the app's own code in this worktree, served on 5175 by a stand-in
transport. It answers from the recorded answers of §2.8 and sends no request anywhere. It holds the
insurers in the page's memory, so Add, Edit and Put out of use could be tried, and a rename or out
of use shows on the cases; every other write is refused. The built-in browser pane was used, never
the owner's browser. After each resize the page was reloaded before measuring.

- **The band, F18-1.** Top edges in px, before, with the mark taken off, and now:

  | Page | Width | Label tops before | Now |
  |---|---|---|---|
  | 770 HDV, the found case | 1512 | Waiting for, Found, Rental 183; Driver, Handled by, At fault 192.1 | all 183; values all 199.8; lines under values 220.3 |
  | 770 HDV, the practice case | 1512 | Driver and At fault 9.1 lower | all 183 |
  | Prepare 204 JLM, a task | 1512 | About and Progress 9.1 lower than Created by and Due | all 157 |
  | Order two spare key fobs, a task with no Due line | 1512 | Due, About and Progress 9.1 lower | all 157 |
  | the same four | 1024 | the same 9.1 px | level: 225.8, 261.8, 199.8, 205.8 |
  | Toms's user page, a rental | 1512 and 1024 | level, no mark | unchanged, no mark |

  Every band kept its height, 84.5 px at 1512. The chip's centre stayed on the band's centre line.
- **Waiting for, F18-3.** The browser measured the column at both widths:
  - At 1512 it is 190 px. With "Someone else · 21 hours" and "Someone else · 59 minutes" written
    into two rows, each stays on one line; the longest is 160 px wide, and the column stays at 190.
  - At 1024 it is again 190 px. Every value is on one line, the longest possible included.
- **The picker, in Register case and Edit case**, driven with the keyboard.
  - Typing "insur", ArrowDown and Enter chose Northgate Insurance, and the focus went back to the
    picker.
  - Handled by then offered "Our insurer · Northgate Insurance".
  - "Lolkastan" showed "No insurer on the list holds “Lolkastan”." above Add an insurer. ArrowDown
    and Enter opened the Add insurer window over the form, with Lolkastan typed and the focus in
    Name.
  - Esc closed only that window, and the focus went back to the picker.
  - ArrowDown on the closed picker opened it. Esc then closed the list, not the dialog.
  - Add insurer added Lolkastan and chose it on the case at once.
  - "Balt" and a click on Add an insurer showed Baltic Mutual with Use this one. Use this one chose
    it and closed the window.
  - In Edit case, an insurer out of use showed as chosen, with its mark, in the closed control and in
    the open list. Old Harbour, also out of use, was not offered.
- **The Insurers page.**
  - Add insurer with "BM" showed Baltic Mutual as a look-alike.
  - " baltic   MUTUAL" was refused under Name in the API's sentence.
  - Put out of use on Pilot, then All, showed Pilot marked.
  - Pilot's open-cases link opened the cases list filtered to it, with its one case.
  - That case's page showed Pilot Insurance Group marked Out of use, with its email and phone.
- **Widths of the Insurers page.**
  - 1512: 328, 294, 150, 120, 80 and 240 px, the open cases' heading on two lines, rows 57 px.
  - 1280: the first width with separate Email and Phone columns. Rows are 62 to 77 px.
  - 1024: at first, Email was 77 px and rows were 97 to 140 px. **Found and fixed:** Email and Phone
    now fold under the name below 1280. The name then gets 482 px and rows are 57 to 85 px.
  - 834: the folded table fits 800 px.
  - 402: cards, the manager's two actions each on half of a row.
  - No width scrolls sideways.
- **The Insurance panel's links.** At first they were in the accent red, and emails read like
  warnings. **Found and fixed:** they are quiet now, as on the Insurers page.
- **The light theme**: the Insurers page reads the same.
- **The console** showed no error from the app.
- **The app on 5176**, signed out, against 5003:
  - `/insurance-cases/insurers` went to Sign in.
  - Its only API request went to `http://localhost:5003/api/me`, which answered 401 as expected when
    signed out.
  - It asked nothing of 5001 or 5002, and showed no module error.

### 4.4 The planted breakages: 47 planted, 43 caught

Each breakage changed one rule in a copy of the app outside the worktree, since the owner's apps
hot-reload the worktree. The whole suite ran there, 704 tests, and the file was then written back.

| # | The breakage | Caught |
|---|---|---|
| C1 | the band never marks a line under a value | yes, 3 tests |
| C2 | a marked band still centres its facts | yes |
| C3 | Waiting for is 170px again | yes, 2 |
| C4 | Waiting for's values may wrap on the desktop | yes |
| C5 | a Waiting for value without its class | yes |
| C6 | the picker offers insurers out of use | yes, 4 |
| C7 | Edit case forgets the case's own other insurer | yes |
| C8 | Casco case copies an insurer out of use | yes |
| C9 | clearing a side keeps Handled by on it | yes |
| C10 | Register case sends no insurer | yes, 3 |
| C11 | the find box minds letter case | yes, 8 |
| C12 | the initials no longer look alike | yes, 2 |
| C13 | a word of three letters looks alike | yes |
| C14 | look-alikes from one letter | yes, 2 |
| C15 | an edited insurer is its own look-alike | yes |
| C16 | Use this one on an insurer out of use | yes |
| C17 | an insurer added is not chosen on the case | **no**: in the browser only |
| C18 | editing an insurer does not refresh the cases | yes |
| C19 | a case's write does not refresh the insurers | yes, 2 |
| C20 | a vehicle's deletion does not refresh the insurers | yes |
| C21 | Handled by is sent on Open only | yes |
| C22 | Handled by lists the insurers out of use first | yes |
| C23 | the Handled by refusal is not shown | yes |
| C24 | the same name is a banner, not under Name | yes, 2 |
| C25 | an insurer gone is an unknown failure | yes, 3 |
| C26 | Insurers is offered to managers only | yes, 2 |
| C27 | the Insurers page gives everyone who reads the actions | yes, 3 |
| C28 | a count of 0 is a link too | yes |
| C29 | Show opens on All | yes, 3 |
| C30 | No insurers yet is read from the shown list | yes |
| C31 | the arrows run past the last line | yes |
| C32 | the arrows start from Not chosen, not the chosen insurer | yes |
| C33 | Esc in the find box closes the dialog too | **no**: in the browser only |
| C34 | Enter in the find box is not held back | **no**, and not visible anywhere (below) |
| C35 | every dialog closes on Esc, the one under Add insurer included | **no**: in the browser only |
| C36 | the picker's No insurers yet is never shown | yes |
| C37 | the case's own insurer wins over the list's copy | yes |
| C38 | a case's insurer out of use is not marked | yes |
| C39 | a case's insurer's email is not a mail link | yes, 2 |
| C40 | a phone link keeps its spaces | yes, 4 |
| C41 | a case's insurer's links in the accent again | yes |
| C42 | the Insurers page folds only below 1024 | yes |
| C43 | Edit insurer sends no token | yes |
| C44 | Handled by's options lose the insurer's name | yes, 2 |
| C45 | the insurers are asked for without the permission | yes |
| C46 | the Insurers route needs no permission | yes, 3 |
| C47 | Put out of use calls the activation | yes, after its rule was made one of its own |

- **C47** was not caught in the first run. The window's call was written inside the component. It is
  now the rule `toggleInsurer`, with a test of what each case sends, and the final run caught C47.
- **C9** was caught on the first run because the reset of Handled by had been made a rule of its own,
  `withInsurer`, with its test, just before that run.
- **C17, C33 and C35** are what happens after a press or a key. A server render cannot press either,
  and the dialogs' hook is replaced in these tests. The browser checked all three (§4.3). §5 asks the
  reviewer to check C17 signed in.
- **C34** removes the guard that keeps Enter in the find box from sending the case's form. Nothing
  shows the difference: the form has many fields and no submit button, so Enter never sends it. The
  guard stays for a form that might one day have a single field.

### 4.5 The test suite, and each commit

- **The final state:** `npm run typecheck` clean; `npm test` **704 passed in 63 files**; `npm run build`
  built, with the chunk-size warning the build has had since before this run.
- **Before the run** (`fce8f03`): typecheck clean, 627 passed in 57 files, the build as above.
- **Each commit alone**, exported with `git archive` so nothing untracked came along, and run with the
  worktree's `node_modules`. Every one had 0 type errors and the whole suite green:

  | Commit | Tests |
  |---|---|
  | `305140b` | 635 |
  | `80aa369` | 646 |
  | `8339a55` | 681 |
  | `12436bf` | 686 |
  | `a370aa7` | 700 |
  | `0176a02` | 702 |
  | `6e7b094` | 704 |

### 4.6 The owner's side, untouched

- **The owner's apps and APIs** ran throughout on their own processes, and this run sent no request
  to any of them. It read who listens on each port with `lsof`.

  | Port | Process | Started |
  |---|---|---|
  | 5001, the owner's API | pid 7505 | 2026-09-25 07:41 |
  | 5002, the practice API | pid 59742 | 2026-09-27 12:41 |
  | 5173, the owner's app | pid 24831 | 2026-09-16 07:58 |
  | 5174, the practice app | pid 58932 | 2026-09-27 12:33 |

- **The databases.** Only the names of the databases were listed, to see that `rwrent_r13` existed.
  `rwrent_v1` and `rwrent_check` were never addressed.
- **The backend worktree** is clean at `5604c83`. It was only run, never built or changed. The main
  checkouts were not touched.
- **Mailpit** was not read.

### 4.7 End state

- **The API on 5003 is left running**, pid 72507, started 2026-09-29 07:55:39, from the backend
  worktree's `bin/Release`, over `rwrent_r13`. It holds the seed and the joint check's second run
  (§5.0).
- **Nothing else runs.** This run's Vite on 5176 and its harness on 5175 are stopped, and nothing
  listens on either port. The workspace's launch entries are as they were before the run.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **The stack as this run leaves it:** the API on 5003 over `rwrent_r13`, holding the seed and the
  joint check's second run.
  - **Five insurers:**
    - Baltic Mutual: 3 open cases handled, 5 cases.
    - Meridian Insurance: 1 and 2.
    - Northgate Insurance: 0 and 1.
    - Old Harbour Insurance: out of use.
    - Pilot Insurance Group: in use, added and renamed by Dita. It has
      `claims@pilot-insurance.example` and `+372 600 7700`.
  - **One practice case:** "770 HDV · Practice: the left mirror and its cover knocked off". It is
    Reported and waiting for the insurer. Our insurer is Baltic Mutual. The other party's is Pilot
    Insurance Group, which handles the case, with claim PI-18-0001.
  - **The counts:** Open 6, Waiting for us 2, Closed 2.
- **Start Vite on 5176 from this worktree.** The API trusts only that origin:
  `VITE_API_BASE_URL=http://localhost:5003 npm run dev -- --port 5176 --strictPort`
- **Use a browser profile of its own**, never the owner's. The apps on 5173, 5174 and 5176 share
  `localhost`'s cookies, so signing in on 5176 in the owner's profile signs the owner out of 5173.
- **The seeded people**, all with the seed password:
  - Dita Smite and Karlis Zvaigzne, Fleet Managers;
  - Signe Priede, Company Principal;
  - Toms Rudzitis, Viewer.

### 5.1 At 1512 px

1. **Sign in as Dita and open Insurance cases.** Insurers stands beside Register case. The filters
   read Type, Status, Waiting for and Handled by.
   - Handled by Baltic Mutual on Open: 3 cases.
   - Waiting for us: 1 case.
   - Closed: "No results for these filters".
   - Clear filters clears it.
2. **Insurers.** The breadcrumb reads Insurance cases, Insurers.
   - In use holds four insurers. Out of use holds Old Harbour, marked. All holds five.
   - Baltic Mutual's "3" opens the Open view filtered to it.
   - Northgate shows a plain 0.
3. **Add insurer.**
   - Type "BM": Baltic Mutual stands under "Already on the list, and looks alike", with no Use this
     one here.
   - Type " baltic   MUTUAL" and Add insurer: "Another insurer already has this name." appears under
     Name.
   - Add "Practice Insurance" with an email and a phone: it is on the list.
4. **Edit, and out of use and back.**
   - Edit Practice Insurance and rename it.
   - Put it out of use, answering the window. It leaves In use and is under Out of use, marked.
   - Put it back in use.
5. **The practice case.**
   - The band's labels are on one line; Driver and At fault are level with Waiting for.
   - The Insurance panel shows Baltic Mutual and Pilot Insurance Group, each with its email and phone
     as quiet links.
6. **Edit case on the practice case, the other party's picker.**
   - Pilot Insurance Group is chosen. Open the picker: the find box has the focus.
   - The arrows move through the lines and Enter chooses. Esc closes the list and leaves the dialog
     open.
   - Cancel.
7. **Out of use on a case.** Put Pilot Insurance Group out of use on the Insurers page, then open the
   practice case.
   - Pilot is marked Out of use.
   - Edit case: Pilot is still chosen, marked. Change only What is damaged and save: it is saved.
   - Register case: Pilot is not offered, and "Pilot" in the find box says no insurer holds it.
   - Put Pilot back in use.
8. **Add an insurer from Register case.**
   - In the other party's picker type "Lolkastan", then choose Add an insurer. The window opens over
     the form with Lolkastan typed.
   - Esc closes only the window.
   - Open it again and Add insurer: **Lolkastan is chosen on the case at once**, and Handled by offers
     it.
   - Cancel the case, and "Lolkastan" stays on the list.
   - With "Balt" typed, Add an insurer offers Use this one on Baltic Mutual. It chooses Baltic Mutual
     and closes the window.
9. **Casco case for this accident on 552 KLM.** Our insurer is Baltic Mutual, with Handled by Ours.
10. **Sign in as Toms.**
    - Insurance cases has Insurers and no Register case.
    - The Insurers page has no Add insurer, Edit or Put out of use.
    - The practice case shows the insurers' emails and phones.
11. **A task's page**, for example Prepare 204 JLM: Created by, Due, About and Progress stand on one
    line. A user's page and a rental's band look as before.

### 5.2 At 1024 px

1. On Open, every Waiting for value is on one line.
2. The Insurers page folds Email and Phone under the name. Nothing scrolls sideways.
3. On a case and on a task, the band's labels are level.

## 6. Decisions

Choices this run made where the specification left room, each small to change:

1. **The band's mark** is set by the band itself, when one of its facts has a line under its value.
   So a case still loading, whose facts all read "—", stays centred until the case arrives.
2. **Waiting for is 190 px**, the longest value's width with the cell's padding. It is never wrapped
   from 1024 up.
3. **The picker's find box** ignores letter case, accents and runs of spaces, as the look-alikes do.
   - After typing, Enter takes the first insurer that holds what is typed.
   - The arrows reach Add an insurer too.
   - Tab and a press outside close the list.
4. **When nothing on the list holds what is typed**, the picker says so in one line above Add an
   insurer: "No insurer on the list holds “…”." The specification gave words only for an empty list.
5. **The Add insurer window from a case** is its own window over the form, with its own Refresh.
   Only the dialog on top closes on Esc.
6. **The look-alikes** strip a word's marks before counting its letters, so "P&C" is "pc". Initials
   need a name of two words or more. An edited insurer is not its own look-alike.
7. **Add insurer sends the name as typed.** The server trims it and makes each run of spaces one
   space. A blank email or phone goes as none.
8. **The Insurers page's copy.** The empty states "No insurers in use", "N out of use are under Out
   of use." with Show out of use, and "No insurers out of use" are this run's words. So are the lines
   of the out-of-use window, from the API's own description: "Baltic Mutual will no longer be offered
   on a case." and "The 4 cases that name it keep it, and an edit of one of them may keep it."
9. **Handled by keeps an unknown insurer** from the address as an option of its own, "Not on the
   list", so the filter shows what was asked and the API's refusal stands under it.
10. **The Insurers page folds Email and Phone below 1280**, the line Vehicles folds at, not only below
    1024.
11. **Beyond the specification, every case write refreshes the insurers**, and so does a vehicle's
    deletion, which takes its cases. The Insurers page counts cases, and those writes change the
    counts.
12. **Email and phone links are quiet**, in the ink of other secondary text with the accent under
    the pointer, on a case's page and on the Insurers page. The Open cases count keeps the accent of
    the app's record links.
13. **Edit insurer's stale Refresh** reloads the list. The window reads the insurer from the list as
    it renders, so Refresh re-seeds it from the fresh insurer.

## 7. Deviations

None from §18. Handled by keeps its hint, "Offers the insurers filled in above.", since the API's
refusal still says "Choose an insurer that is filled in."

## 8. Open risks and observations

1. **The owner's apps on 5173 and 5174 hot-reloaded this code as it was written.**
   - Every new module existed before anything imported it.
   - The old endpoint's function and query key were removed only after nothing used them.
   - One exception: F18-1's first edit of `RecordHeader.tsx` used `isValidElement` a moment before
     the next save imported it. On a record page open in either app at that instant, the page would
     have shown an error until the next save, a fraction of a second later.
2. **The practice app on 5174 runs this code against round 12's API.** Its insurance pages show no
   insurer names and have no insurer list until the reviewer upgrades the practice copy to round 13,
   as the owner knows.
   - After the upgrade, the names typed on its cases, among them the owner's "Lolkastan", become
     insurers.
   - The owner's 5001 is round 11, so its app offers no insurance section at all, as before.
3. **Observed, not changed: the cases list at 1024 px scrolls sideways by 8 px.** The table's floor
   of 920 px is wider than the 912 px frame. This predates this run: Follow-up 17 set 920, and this
   run left it.
4. **Observed, not changed: the list's toolbar takes a second row.** It does so when Handled by holds
   a long insurer name, and at 1024 px in any case now that the toolbar has one more filter. A long
   name is cut with an ellipsis at 170 px inside the filter, as the other filters' values are.
5. **Three behaviours are held by the browser, not the suite:**
   - an insurer added from a case is chosen on the case;
   - Esc in the picker closes only the list;
   - Esc in the Add insurer window closes only that window.

   The browser checked all three here, and §5.1 steps 6 and 8 ask the reviewer to check them signed
   in.

## 9. Commits

On `feature/backend-wiring`, after `fce8f03`, in this order:

1. **`305140b`** Wiring 45: A record's band puts every label on one line when one fact has a line under its value, and the cases list keeps each Waiting for value on one line from 1024 px.
   6 files (under `src/`): `pages/followup17.stylesheet.test.ts`; added `pages/followup18.layout.test.ts`; `pages/insurance/InsuranceCases.module.css`; `pages/insurance/InsuranceCases.tsx`; `ui/RecordHeader.module.css`; `ui/RecordHeader.tsx`.

2. **`80aa369`** Wiring 45: The app learns the insurers the company keeps: their six operations and answers, their refusal codes, and the words and look-alike rules the windows use.
   11 files (under `src/`): `api/client.ts`; `api/codes.test.ts`; `api/codes.ts`; `api/dto.ts`; `api/index.ts`; added `api/insurers.test.ts`; added `api/insurers.ts`; `api/queryKeys.ts`; `format/index.ts`; added `format/insurers.test.ts`; added `format/insurers.ts`.

3. **`8339a55`** Wiring 45: A case names its insurers from the list: the pickers of its form with Add an insurer in its own window, the insurer's email and phone on its page, and the tests and fixtures moved to round 13's contract.
   24 files (under `src/`): `api/dto.ts`; `api/insuranceCases.test.ts`; `api/insuranceCases.ts`; `api/queryKeys.ts`; `format/insurance.test.ts`; `format/insurance.ts`; `pages/admin/DeleteRecordDialog.tsx`; `pages/followup17.dialogs.render.test.ts`; `pages/followup17.practice.ts`; `pages/followup17.render.test.ts`; `pages/followup17.support.ts`; added `pages/followup18.dialogs.render.test.ts`; added `pages/followup18.practice.ts`; added `pages/followup18.render.test.ts`; added `pages/followup18.support.ts`; `pages/insurance/CaseDialogs.tsx`; `pages/insurance/CaseRecord.module.css`; `pages/insurance/CaseRecord.tsx`; added `pages/insurance/InsurerDialogs.module.css`; added `pages/insurance/InsurerDialogs.tsx`; added `pages/insurance/InsurerPicker.module.css`; added `pages/insurance/InsurerPicker.tsx`; `pages/insurance/caseAddress.ts`; `ui/Dialog.tsx`.

4. **`12436bf`** Wiring 45: The cases list gains Handled by on every view, from the insurers the company keeps, with an unknown insurer refused under it.
   4 files (under `src/`): `pages/followup18.render.test.ts`; `pages/insurance/InsuranceCases.module.css`; `pages/insurance/InsuranceCases.tsx`; `pages/insurance/caseAddress.ts`.

5. **`a370aa7`** Wiring 45: The Insurers page opens from a button beside Register case: the list with Show, each insurer's open cases linked to the cases it handles, and for a manager Add insurer, Edit and Put out of use or back.
   11 files (under `src/`): `app/routes.test.ts`; `app/routes.tsx`; `pages/followup17.render.test.ts`; `pages/followup18.dialogs.render.test.ts`; added `pages/followup18.phone.render.test.ts`; `pages/followup18.render.test.ts`; `pages/insurance/InsuranceCases.tsx`; `pages/insurance/InsurerDialogs.tsx`; added `pages/insurance/Insurers.module.css`; added `pages/insurance/Insurers.tsx`; `pages/insurance/caseAddress.ts`.

6. **`0176a02`** Wiring 45: What the browser found: the Insurers page folds Email and Phone under the name below 1280 so the name keeps its room at 1024, and a case's insurer's email and phone are quiet links.
   4 files (under `src/`): `pages/followup18.layout.test.ts`; `pages/insurance/CaseRecord.module.css`; `pages/insurance/Insurers.module.css`; `pages/insurance/Insurers.tsx`.

7. **`6e7b094`** Wiring 45: What the planted breakages found: the reset of Handled by when its side is cleared and the call of Put out of use or back become rules of their own, each with its test.
   3 files (under `src/`): `pages/followup18.dialogs.render.test.ts`; `pages/insurance/CaseDialogs.tsx`; `pages/insurance/InsurerDialogs.tsx`.

8. **This report's commit**, `Wiring 46`: `Context/wiring_report.md`, rewritten.
