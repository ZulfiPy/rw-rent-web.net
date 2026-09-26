# Frontend Wiring — Follow-up 15, the Tasks list's widths and its phone cards

> Follow-up 15 (`Context/wiring_followups.md` §15): the owner's second look at Tasks on the practice copy,
> with more practice tasks. On the desktop Your step gets wider and Task narrower; on the phone a task's
> card follows the other lists' cards. Frontend only; the backend, its contract and the title's limit
> (TASK-001, 200 characters) did not change. On `feature/backend-wiring` in this worktree
> (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main` after verification.
> Written 2026-09-26. It replaces Follow-up 14's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001, never read or wrote `rwrent_v1` and never read Mailpit. The backend worktree was only
> built (in Release) and run, never changed.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it showed this run's code as it was
>   written. Every change to the two Tasks files was made in a copy outside the worktree, typechecked and
>   tested there, and copied in as a whole file, so the owner's app never loaded a half-written file.
> - Every live check used a scratch stack built for this run: `rwrent_check`, created, migrated and
>   seeded by round 11's Release build, behind the API on 5002, with practice tasks added through its API.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, one
>   list per screen size, on 5174 and 5002.**

## 1. Summary

- **F15-1, the desktop and the sideways iPad.** In My tasks and Involving me, Task and Your step now
  share what Steps (150 px), People (200 px) and Due (170 px) leave, half each, and Your step never
  gets less than 330 px. At 1512 px each takes 346 px, so "Book the service appointment" and "Pick up
  the repair invoice" stand on one line beside their buttons; at 1920 px each takes 550 px; at 1194 px
  Your step keeps 330 px and Task takes 232 px, and nothing scrolls sideways. A long task title wraps
  inside Task, nothing cut. Follow-up 14's button column (one width, level with the title) is as it
  was. The table's minimum width is as it was (1020 px), so it scrolls sideways nowhere it did not
  before.
- **F15-2, the phone.** A task's card is now the other lists' card (`src/ui/cards.module.css`), as the
  Vehicles and Drivers cards are: the title in bold without a line under it (this replaces Follow-up
  14's underline), what the task is about and who gave it in grey under it, a Finished card's chip at
  the top right where their status chips stand, and the facts in two columns: Steps with its progress
  bar on the left, Due (or Closed) flush with the card's right edge, label and value right-aligned.
  The reader's step boxes are exactly as they were. Tapping the card still opens the task.
- **Nothing else changed:** the tablet band (768–1023), the task's page, the dialogs, the Overview, the
  words, Finished's columns, Insurance cases. The server still decides everything.

| | |
|---|---|
| Commits | `bf653b3`, `9f4eed5`, `e011a42`, `f3f4528` (`Wiring 39`) and this report's (`Wiring 40`), on `feature/backend-wiring` (§9) |
| Tests | 495 → **509**, all green: 14 new; 6 existing tests updated on purpose (§2.4) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the four (§4.6) |
| Planted breakages | **20 planted, 20 caught** by the suite (§4.5) |
| Joint check | **22/22** through the API with the practice tasks; the recorded answers identical to a fresh recording, 6/6 (§4.2, §4.3) |
| In a browser | the real pages at 1920, 1512, 1366, 1280, 1194 and 1024 px and at 402 px beside a Vehicles card, light and dark; the tablet band unchanged at 834; the app on 5174 signed out (§4.4) |

## 2. Implemented

### 2.1 F15-1: the widths from 1024 px up (`src/pages/tasks/Tasks.module.css`, `Tasks.tsx`)

- **The rule.** `.cYour { width: max(var(--your-step-min), (100cqw - var(--fixed-columns)) / 2) }` on the
  open views' table (`.withSteps`), with `--fixed-columns: 520px` (Steps 150, People 200, Due 170) and
  `--your-step-min: 330px`. Task keeps `width: auto` and so takes the rest: the other half, or what
  Your step's 330 px leaves when the frame is narrower than 1180 px.
- **Measured on the list's own frame.** `100cqw` is the width of the list's scroll frame, which now
  carries `container-type: inline-size` (`tableFrame`). The rail takes 64 px from 1024 to 1279 px,
  246 px from 1280, and a person may also open or fold it by hand, so the screen's width would not say
  how much room the table has; the frame does. The app already sizes by its container elsewhere
  (Security audit, User directory, the record panels).
- **Why 330 px.** The cell's pads (28 px), Follow-up 14's button place (104 px) and its gap (12 px)
  leave 186 px for the step's title, which holds "Book the service appointment" (179 px in the list's
  type), the longest seeded title of that length.
- **The floor.** The table's minimum width stays 1020 px, so where the frame is narrower (1024 px, and
  1280 to 1319 px with the rail open) the table scrolls inside its panel exactly as before, by the same
  amount; there Your step keeps its 330 px and Task takes 170 px.
- **A long title** wraps inside Task as before (`overflow-wrap: anywhere` on the title), never cut.
- **The tablet band** keeps its own fixed widths (Your step 206 px), which override the rule below
  1024 px; Finished's table (`.plain`) has no Your step and is unchanged.

### 2.2 F15-2: the phone card (`Tasks.tsx`, `Tasks.module.css`)

- **Built from the shared card.** `cards.card` with `cards.cardLink` (the hover of a card that opens a
  record), `cards.head` with `cards.heading`, `cards.title` for the title link, `cards.sub` for what
  the task is about and "from" its creator, the chip after the heading, `cards.facts` with a left
  `cards.fact` (Steps, its value and the progress bar) and a right `cards.fact cards.cardFactEnd` (Due
  or Closed). The card's own `card`, `cardHead`, `cardHeading`, `cardTitleLine`, `cardSub`,
  `cardFacts` grid, `cardFact`, `cardValue` and `cardDue` rules are gone.
- **What stays the task card's own**, because the shared card has no word for it: `cardOpens` (the
  pointer, since the whole card opens the task), `cardTitle` (only `overflow-wrap: anywhere`, so a
  title of up to 200 characters wraps anywhere instead of widening the card), `cardValueDim` (the grey
  of "No steps" and "No due date"), and the tones of Overdue and Due today on the card's value, written
  as `.cardFacts .toneBad` and `.cardFacts .toneWarn` so that they beat the shared value's colour
  whichever stylesheet the browser loads first.
- **The step boxes** (`cardSteps`, `cardStep`, their 44 px buttons) and the "Your step(s)" label are
  untouched.

### 2.3 What stays

The tablet band, the task's page, the dialogs, the Overview, the words, Finished's columns, Insurance
cases, the title's limit of 200 characters (the dialog's field and the server's rule), and every
decision the server makes.

### 2.4 Tests

**The tests whose expectation this run changes on purpose:**

| Test | Before | Now |
|---|---|---|
| `followup12.phone.render` › the task cards on a phone › no table; each card opens its task … | Due's value in the card's own `cardDue` class: `>Due</span><span class="_cardDue_…">28 Sep, 10:54`; the overdue fine as `_cardDue_ … _toneBad_` | Due in the shared right-hand fact: `_cardFactEnd_` › `_factLabel_` "Due" › `_factValue_` "28 Sep, 10:54"; the overdue fine as `_factValue_ … _toneBad_` (the task card's own styles) |
| `followup12.phone.render` › the task cards on a phone › Finished: the chip beside the title … | Closed's value in `cardDue` | Closed in the shared right-hand fact, `_factLabel_` "Closed" › `_factValue_` "22 Sep, 20:10" (the task card's own styles) |
| `followup13.phone.render` › My tasks cards on a phone (F13-2) › Signe … | the agreement's Due as `_cardDue_ … _toneWarn_` | as `_factValue_ … _toneWarn_` (the task card's own styles) |
| `followup12.render` › the tones win over a line’s own colour (read from the stylesheet) | the stylesheet holds a `.cardDue {` rule before the tones | it holds `.cardFacts .toneBad {` and `.cardFacts .toneWarn {`, the card's tones by scope; `.due` and `.yourStepDue` and the last two rules as before (the task card's own styles) |
| `followup14.phone.render` › a task title on a phone card (F14-6) › the title is a link inside a line of its own … | every title link inside `_cardTitleLine_` | every title link is `_title_ _cardTitle_` right inside the head's `_heading_`; no `_cardTitleLine_` (the card title's line from Follow-up 14) |
| `followup14.phone.render` › the same describe › the underline belongs to the words … | `.cardTitle` with `border-bottom: 1px solid var(--line-3)` and a hover colour; `.cardTitleLine` at 14 px | `.cardTitle` is only `overflow-wrap: anywhere`; no `.cardTitleLine` and no `.cardTitle:hover` rule (the card title's line from Follow-up 14) |

The describe of the last two is renamed "a task title on a phone card (F14-6, replaced by F15-2)". No
other test changed, and none was deleted, skipped or weakened.

**The new tests** (14), rendered from the scratch API's answers with the practice tasks in them
(`src/pages/followup15.support.ts`, §4.3); the widths each frame gives are worked out from the
stylesheet's own values through Follow-up 14's stylesheet reader, since a server render has no layout:

| File | Cases | What they hold |
|---|---|---|
| `followup15.render.test.ts` | 8 | **F15-1:** the width rule, its two values, and 520 px being exactly Steps, People and Due; Task `auto`; the frame a container; at every frame the browser measured Your step at least 330 px, equal to Task from 1180 px of frame, 330 below it (1920: 550 and 550; 1512: 346 and 346; 1194: 330 and 232); at 1512 the title's room of at least 179 px beside the button, and 186 px at the floor; the floor 1020 px, no sideways scroll at 1920, 1512 (menu open or folded), 1366 and 1194, and at 1280 and 1024 the scroll as before with Task at 170; the list drawn in its frame, the 171-character title in the wrapping title class, never the one-line cut; Toms's practice steps (11, 81 and 72 characters), the overdue one in red and the one Dita marked with an empty place. **Unchanged:** the band's 206 px, 582 px floor and fixed layout; Finished's columns without Your step |
| `followup15.phone.render.test.ts` | 6 | **F15-2:** every card of Dita's and Toms's My tasks is the shared card that opens its task, with the shared head, the bold title link and the grey sub lines, and none of the old card classes; Steps with its bar on the left and Due flush right in the shared facts; the dim "No steps" and the red Overdue; the same skeleton as a Vehicles card rendered beside it (card, head, heading, title, sub; facts with a left and a flush-right fact); a Finished and a Cancelled card with their chips where status chips stand and Closed flush right; the step boxes as they were (the long overdue step, the one Dita marked); the task card's own styles only those the shared card has no word for |

## 3. Not implemented or partial

**Nothing of Follow-up 15.** F15-1 and F15-2 are built and tested.

### 3.1 The steps that need a password typed into the app

This run may not type a password into the app, so the signed-in steps in a real browser are the
reviewer's, on 5174 and 5002 (§5). What they look at was checked here through the API as the same
people (§4.2) and in the real pages drawn from those answers (§4.4).

## 4. Verification: the joint check

### 4.1 The scratch stack and the practice tasks

As `RWRentApi-wiring/Context/round11_report.md` §7 describes it: nothing ran on 5002 or 5174 at the
start and `rwrent_check` did not exist. It was created, migrated and seeded by round 11's Release build
of the backend worktree at `1b51206` (clean; work tasks 8, work task steps 11), and the API started on
5002 from `bin/Release` with `ApiSecurity__RecordDeleterEmailDomain=rwrent.example`, trusting
`http://localhost:5174`. Every command sourced an environment script that refuses to run unless its
connection string names `rwrent_check`; the API client refuses any address but `localhost:5002`; the
seed password was the one the owner gave for this session, passed in each command's environment only.

**The practice tasks**, added through the API as Dita after each seeding, as the owner's reviewer did:

- "Collect the winter tyres for 204 JLM and 552 KLM from the Mustamäe storage, check the tread depth on
  every tyre and book the fitting at the workshop before the first frost" (171 characters), about
  vehicle 204 JLM, due in six days, with four steps: Toms's "Add to Bolt" (11 characters, due in two
  days); Toms's "Ask the storage for the tyre hotel receipt and photograph each tyre's tread depth"
  (81 characters, due a day ago, so overdue); Dita's own "Book the fitting at the workshop" (32);
  Toms's "Tell both drivers when the fitting is booked and where to bring the cars" (72), which Dita, the
  task's creator, then marked done.
- "Renew the parking permit", due in nine days, with Toms's "Pay the permit fee in the city portal"
  (37 characters).

The database was seeded three times: for the recording, for the comparison and the joint check, and at
the end for the reviewer, each time with the practice tasks added.

### 4.2 Through the API — 22/22

As Dita, Signe, Toms, Karlis and the administrator:

- **Access, as before** (5): the four people hold `Tasks.Use`; the administrator is refused My tasks.
- **The practice tasks as their people read them** (9): the long title comes whole, 171 characters, to
  its creator and to Toms; the server puts it first in Toms's My tasks, by his overdue step; his Your
  step holds 11, 81 and 72 characters in the creator's order; Add to Bolt to do and due later with Mark
  done; the 81-character step overdue with Mark done; the step Dita marked done by her with no action
  of his, and the server refuses him an Undo there (403 `tasks.mark_not_yours`); Dita's Your step in
  her own task is only her own step; the short task's permit-fee step with Mark done.
- **What the phone card draws** (5): every open task carries its title, what it is about, its creator,
  its progress and its due or none; the Due fact meets an overdue date, a later one and none; Signe's
  Finished holds a Finished and a Cancelled task, each with its closed time; the strip's counts with
  the practice tasks (Dita 7 in My tasks, Toms 5 and 5 to do); Karlis reads none of them.
- **The title's limit is the server's, unchanged** (3): a title of 201 characters is refused (400) with
  the error on the title; one of exactly 200 is taken whole; that task was cancelled again.

### 4.3 The recorded answers — 6/6

`src/pages/followup15.support.ts` holds Dita's and Toms's counts, My tasks and Involving me with the
practice tasks in them, recorded on 2026-09-26. On a second fresh seed with the practice tasks made
again, the same six answers were recorded again and compared with instants, tokens and ids set aside
(the practice tasks get new ids each time; each id was replaced by the order it first appears in):
**6/6 identical**.

### 4.4 In a browser

**The real pages.** The app's own code from this worktree, served on 5175 from a folder outside both
repositories with a stand-in transport that answers from the recorded answers (and, for the phone
comparison, the Vehicles and Drivers lists recorded from the scratch API) and sends no request anywhere.
Each width was loaded fresh: the browser pane's simulated resize does not tell the app's screen-size
listener, so after a resize the rail kept its former state until a reload. Measured with a script and
looked at in screenshots, dark and light.

**The widths on the desktop**, Dita's My tasks, the frame being the width the list gets:

| Screen | Rail | Frame | Task before → now | Your step before → now | Sideways scroll |
|---|---|---|---|---|---|
| 1920 | open | 1620 | 810 → **550** | 290 → **550** | none |
| 1512 | open | 1212 | 402 → **346** | 290 → **346** | none |
| 1512 | folded by hand | 1394 | 584 → **437** | 290 → **437** | none |
| 1366 | open | 1056 | 246 → **206** | 290 → **330** | none |
| 1280 | open | 970 | 210 → **170** | 290 → **330** | 50 px inside the panel, as before |
| 1194 (sideways iPad) | folded | 1082 | 272 → **232** | 290 → **330** | none |
| 1024 | folded | 912 | 210 → **170** | 290 → **330** | 108 px inside the panel, as before |

The "now" values are measured. The "before" values follow from the old widths (Your step 290 px, Task
the rest, the same floor); at 1512 the old state was also measured before the change, in Toms's list:
Task 392 and Your step 290 in a frame of 1202 px, the frame being 10 px narrower when the page shows a
scrollbar (now 341 and 341 there).

- **Step titles.** At 1920 and 1512 every step title of Dita's is on one line beside its button,
  "Book the service appointment", "Pick up the repair invoice" and "Book the fitting at the workshop"
  included. At 1194 and below, where Your step has 330 px, titles of about 30 characters fit and "Book
  the fitting at the workshop" (32) takes two lines. Toms's 81-character step takes three lines at
  1512 (four before), the 72-character one three.
- **The long title** wraps in Task: 4 lines at 1512, 3 at 1920, 7 at 1194, nothing cut.
- **Buttons** stand in one column at one x in every row at every width, as Follow-up 14 made them.
- **The tablet band** at 834: Task 366, Steps 107, Your step 206, Due 121, People under Steps, fixed
  layout, no scroll: as before.
- **Finished** at 1512: Task 632, Steps 170, People 240, Closed 170: as before.

**The phone at 402, beside a Vehicles card** (dark and light). Both cards are 358 px wide in the panel,
with 14 px and 16 px of padding and 9 px between their parts; both titles are 14 px in weight 600 with
no line under them. The left facts (Body, VIN; Steps) start 16 px in from the card's edge; the right
facts (Fuel, In use; Due, Closed) end flush with the card's right padding, 0 px, label and value
right-aligned. The task card's Steps shows its bar under "1 of 4 done"; Dita's parking fine reads "No
steps" in the dim grey and "Overdue · 25 Sep" in red, weight 500. Signe's Finished cards carry their
Finished and Cancelled chips at the top right, as Vehicles carries Available, In use and Reserved, and
"Closed" flush right. The 171-character title wraps across the card; its three step boxes are as they
were, the overdue one in red and the one Dita marked with "✓ Done" and no button. No sideways scroll.

**Console:** no error from the app on any of these pages; the only errors were the browser pane's own
start-up messages.

**The app on 5174**, signed out, in the browser pane (not the owner's browser): `/tasks` went to Sign in;
its only API request went to 5002 (`/api/me`), none to 5001.

### 4.5 The planted breakages — 20 planted, 20 caught

Each replaced one exact piece in a copy of the worktree outside it, the full suite ran, and the piece
was written back; the restored copy passes.

| # | Breakage | Caught by |
|---|---|---|
| D1 | Your step back to a fixed 290 px | 1 test |
| D2 | Your step's floor lowered to 290 px | 3 |
| D3 | Your step takes a third of the spare width, not half | 1 |
| D4 | the fixed columns counted without People | 3 |
| D5 | the frame is no container, the half measured on the screen | 1 |
| D6 | the list drawn outside its frame | 1 |
| D7 | the table's floor raised, so it scrolls where it did not | 1 |
| D8 | Task given a fixed width of its own | 1 |
| D9 | the folded band takes the desktop's width | 1 |
| D10 | a long task title cut to one line | 1 |
| D11 | Finished's Steps column changed | 1 |
| E1 | the card is not the shared card | 12 |
| E2 | Due in the left column again, not flush right | 5 |
| E3 | the title carries a line again | 2 |
| E4 | the title not drawn as the other cards draw theirs | 3 |
| E5 | what the task is about without the shared sub line | 1 |
| E6 | an overdue date on the card may lose its red to the shared value colour | 2 |
| E7 | the facts not in the shared two-column grid | 3 |
| E8 | "No steps" not dim | 2 |
| E9 | the step boxes changed | 1 |

### 4.6 The test suite, and each commit

Final state: typecheck 0 errors, **509/509** tests in 47 files, build green. Each commit alone, from
`git archive` into a folder of its own: `bf653b3` 495, `9f4eed5` 495, `e011a42` 495, `f3f4528` 509, all
green with 0 type errors.

### 4.7 The owner's side, untouched

The owner's API on 5001 (pid 7505) and the app on 5173 (pid 24831) ran on their own processes
throughout; this run sent them nothing. `rwrent_v1` was not read, as the run's rules require. Mailpit
was not read. The backend worktree is clean at `1b51206`.

### 4.8 End state

- The scratch API runs on **5002** (pid 75389) over `rwrent_check`, **freshly seeded** at 06:47 Tallinn
  time on 2026-09-26 **with the practice tasks** of §4.1, for the reviewer. Nothing runs on 5174 or
  5175.
- The workspace's launch file is as it was.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. Start it from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173. After changing the window's width,
  reload the page, so the menu rail takes the state of the new width.
- **The people**, all with the seed password: Dita `dita.smite@rwrent.example` (Fleet Manager), Signe
  `signe.priede@rwrent.example` (Company Principal), Toms `toms.rudzitis@rwrent.example` (Viewer).
- **The practice tasks** are already there (§4.1): the winter tyres task with its long title, and
  "Renew the parking permit". Dates follow the moment they were made.
- **Afterwards:** the steps write nothing unless a button is pressed; reseed and rerun the practice
  script's steps if a clean copy is wanted.
- **Light and dark:** the theme switch is in the menu; look once in each.

### 5.1 The desktop, about 1512 px, menu open

1. **D1, Toms, My tasks.** Task and Your step are about equally wide. The winter tyres task is first;
   its title wraps in Task over about four lines, nothing cut. Its Your step: "Add to Bolt" with Mark
   done; the long step ("Ask the storage …") with "Overdue" in red and Mark done; "Tell both drivers …"
   with "✓ Done" and no button. All buttons in one column.
2. **D2, Dita, My tasks.** Every step title on one line beside its button, among them "Book the service
   appointment", "Pick up the repair invoice" and "Book the fitting at the workshop".
3. **D3, the menu folded.** Press "Collapse menu": Task and Your step both grow, still equal. Open it
   again.
4. **D4, a wider screen** (about 1920 px, if at hand): both about 550 px.
5. **D5, unchanged:** Signe's Finished (Task, Steps, People, Closed) and a task's own page.

### 5.2 The sideways iPad, 1194 px

1. **S1, Dita.** Nothing scrolls sideways. Your step is about 330 px and Task about 230 px; "Book the
   service appointment" and "Pick up the repair invoice" on one line; the winter tyres title wraps over
   about seven lines inside Task.
2. **S2, Toms.** The same; the buttons in one column.

### 5.3 The desktop's lowest width, 1024 px

1. **L1.** The table scrolls sideways inside its panel, as it did before this run; Your step keeps
   about 330 px.

### 5.4 The iPhone 16 Pro, 402 px

1. **P1, a Vehicles card first.** Open Vehicles and look at a card: the plate in bold, Body on the
   left, Fuel flush right.
2. **P2, Dita, Tasks.** The task cards look the same: the title in bold with no line under it, what it
   is about and "from" in grey, Steps with its bar on the left, Due flush right with its label and
   value right-aligned. The parking fine: "No steps" in grey, "Overdue · …" in red.
3. **P3, Toms, the winter tyres card.** The title wraps across the card; the three step boxes are as
   before: Add to Bolt and the long overdue step with Mark done, "Tell both drivers …" with "✓ Done"
   and no button.
4. **P4, Signe, Finished.** Each card's Finished or Cancelled chip at the top right; "Closed" flush right.
5. **P5, taps.** Tapping a card opens its task; Mark done in a box marks the step without opening it.

## 6. Decisions needed

1. **Task at the narrowest desktop frames.** Where the frame is under 1020 px (1024 px, and 1280 to
   1319 px with the menu open) the table scrolls sideways inside its panel, as before, and Task now
   has 170 px there (210 before), since Your step keeps its 330. If the owner wants no scroll at those
   widths: fold People under Steps, as the tablet band does, while the frame is under about 1180 px.
   The app side only.
2. **Step titles over about 30 characters** take two lines where Your step is at its 330 px (1194 px and
   below; for example "Book the fitting at the workshop", 32 characters). A larger floor would take
   the width from Task, which at 1194 px has 232 px.

Choices made where §15 left room, each reversible in a line:

1. **Half each.** "Shared between Task and Your step" is read as equal halves of what the fixed columns leave.
2. **Measured on the list's frame**, not the screen, because the menu rail's width changes with the
   screen and by hand.
3. **The table's floor unchanged** (1020 px), so nothing scrolls where it did not before; the first try
   raised it to 1060 px, which made 1366 px scroll by 4 px and 1280 px by 90, and was taken back.
4. **The whole card still opens the task**, with the shared card's hover (`cardLink`), as Follow-up 12
   made it.

## 7. Deviations

None: §15 and the API agree.

## 8. Open risks

1. **Older browsers.** The width rule uses container units, which Safari has had since version 16 and
   Chrome since 105; in an older browser the rule is dropped and Task and Your step size by their
   content, as a table without widths does. The owner's devices are newer.
2. **The measurements** were taken in the browser pane's Chromium; Safari on the iPad may measure text a
   pixel differently, which could move where a title wraps, never a column's width. §5.2 is the check
   on the device.

## 9. Commits

| Commit | Group | Files |
|---|---|---|
| `bf653b3` | the practice API's answers with the practice tasks, recorded for the tests | `src/pages/followup15.support.ts` (new) |
| `9f4eed5` | on the desktop Task and Your step share the spare width, Your step never under 330 px | `src/pages/tasks/Tasks.module.css`, `src/pages/tasks/Tasks.tsx` |
| `e011a42` | the phone card drawn like the Vehicles and Drivers cards; the tests that pinned the old card | `src/pages/tasks/Tasks.tsx`, `src/pages/tasks/Tasks.module.css`, `src/pages/followup12.phone.render.test.ts`, `src/pages/followup12.render.test.ts`, `src/pages/followup13.phone.render.test.ts`, `src/pages/followup14.phone.render.test.ts` |
| `f3f4528` | new tests for both items | `src/pages/followup15.render.test.ts` (new), `src/pages/followup15.phone.render.test.ts` (new) |
| this one | the report | `Context/wiring_report.md` |
