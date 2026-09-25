# Frontend Wiring — Follow-up 14, Tasks at every screen size

> Follow-up 14 (`Context/wiring_followups.md` §14): the owner's look at Tasks on the practice copy, screen
> size by screen size (the desktop, the iPad Pro 11 upright and sideways, the iPhone 16 Pro), and the six
> details it asked for. Frontend only; the backend and its contract did not change. On
> `feature/backend-wiring` in this worktree (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer
> fast-forwards `main` after verification. Written 2026-09-25. It replaces Follow-up 13's report, which
> git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001, never read or wrote `rwrent_v1` and never read Mailpit. The backend worktree was only
> built (in Release) and run, never changed.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it showed this run's code as it was
>   written. For a few seconds during the writing it would have shown an error on Tasks, had Tasks been
>   open there (§8.1).
> - Every live check used a scratch stack built for this run: `rwrent_check`, created, migrated and
>   seeded by round 11's Release build, behind the API on 5002.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, one
>   list per screen size, on 5174 and 5002.**

## 1. Summary

The tiers, as §14 names them: the desktop from 1024 px (the sideways iPad Pro 11, 1194 px, is desktop),
the folded tablet band 768–1023 px (the upright iPad Pro 11, 834 px), the phone below 768 px (the
iPhone 16 Pro, 402 px).

- **F14-1, Your step on the desktop and the sideways iPad.** Every step is its title, the line under it
  (its due, or "✓ Done" in the done colour once the step is done, in place of the due line), and the
  place of its button. The place is one column of one width (104 px) at the right of Your step, so
  Mark done and Undo are the same width and stand at the same place from step to step and row to row.
  Each button is level with its step's title: its middle is the middle of the title's first line,
  whether the title takes one line or two. The title takes the rest of the width after a fixed 12 px
  gap. Where the API offers no action, the place stays, empty, so nothing else moves. My tasks and
  Involving me draw it with the same component.
- **F14-2, a due date is never cut.** The Due cell's date keeps "24 Sep" and "10:54" whole and may break
  only after "·" or ",": at 834 px "Overdue · 24 Sep" now reads "Overdue ·" over "24 Sep". No due line
  anywhere in the list is held on one line any more, in any view and at any width; Finished's Closed
  time already wrapped and still does.
- **F14-3, Your step on the upright iPad.** Every step reads the same way: its title; under it the due
  line or "✓ Done"; under that its button, always, at the same 104 px for Mark done and Undo, lined up
  with the text on the left; 12 px between one step and the next. A step without an action ends at its
  text.
- **F14-4, the sideways iPad.** No rule of its own: it takes the desktop's layout and F14-1, and nothing
  else.
- **F14-5, the phone's "✓ Done".** It moved from the step box's top-right corner to the line under the
  title, in place of the due line. The boxes and their full-width 44 px buttons did not change.
- **F14-6, the phone's title underline.** It now follows the words on every line: under a two-line
  title ("Handle the windscreen insurance case of 204 JLM") it runs under each line's words, no longer
  across the whole card.
- **The app judges nothing.** Which button a step shows, if any, still comes from the API's
  `canMarkDone` and `canUndo`; the layout only gives each answer its place.

| | |
|---|---|
| Commits | `a87c322`, `c0629bb`, `fd41c52`, `fb59065` (`Wiring 37`) and this report's (`Wiring 38`), on `feature/backend-wiring` (§9) |
| Tests | 480 → **495**, all green: 15 new; 2 existing tests updated on purpose, 5 expectations in all (§2.7) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the four (§4.6) |
| Planted breakages | **30 planted, 30 caught** by the suite (§4.5) |
| Joint check | **36/36** through the API on a freshly seeded database; the 18 recorded answers the tests render identical to a fresh recording (§4.2, §4.3) |
| In a browser | the real pages at 1512, 1194, 834 and 402 px, and at the band's edges 1024, 1023 and 768, in the dark and the light theme; the app on 5174 signed out (§4.4) |

## 2. Implemented

### 2.1 F14-1 and F14-4: Your step from 1024 px up (`src/pages/tasks/Tasks.tsx`, `Tasks.module.css`, `StepAction.tsx`)

- **One piece for a step's text.** `StepText` draws the title and, under it, the due line or, once the
  step is done, "✓ Done" (`DoneMark`) in its place. A list row and a phone card share it, so a done step
  reads the same on every screen.
- **The step in Your step.** `YourStep` draws, in this order: the text, the button's place
  (`yourStepAction`), and a refused mark's sentence under both. The place is drawn for every step; it
  holds Mark done, Undo or nothing, as the API's flags say.
- **Its layout.** `.yourStep` is a grid of two columns: the text (`minmax(0, 1fr)`) and the place
  (`--your-step-button: 104px`, the width "Mark done" needs, 102 px, and two to spare), with a fixed
  12 px gap. The list's button (`data-size="cell"`) takes its place's width and a height of 30 px. The
  title's line is 20 px and the text starts 5 px lower, so the button's middle is the middle of the
  title's first line; measured in the browser, the difference is 0.00 px on every step.
- **Nothing moves.** The place keeps its column when it holds nothing (a step its creator marked), and
  the due line and "✓ Done" are one line of the same height (18 px), so a mark changes only the line's
  words and the button's label.
- **The sideways iPad.** The list's stylesheet has no rule between 1024 and 1279 px, and the Tasks table
  does not take the wide-fold utilities, so 1194 px draws exactly what 1512 px draws.

### 2.2 F14-3: Your step in the folded band

In `@media (max-width: 1023px)` the step's grid has one column: the text, then the place on a line of
its own 8 px under it, at the same 104 px, starting where the text starts. The text loses its 5 px lead
there. Steps stand 12 px apart. A place with nothing in it is not drawn in this band (`:empty`), so a
step without an action ends at its text and the space to the next step stays 12 px. The old rule that
let the button stand beside a short title and drop under a long one (`flex-wrap` on the step's line) is
gone.

### 2.3 F14-2: a due date is never cut

- **The Due cell.** `DueWords` splits the date only after "·" or "," and keeps each piece whole
  (`.keep`), with a real space between the pieces: "Overdue ·" and "24 Sep", "Due today ·" and "15:54",
  "28 Sep," and "10:54". The cell itself (`.due`) is no longer held on one line, so in the folded
  band's 121 px column the date takes a second line where it used to be cut. The words are unchanged.
- **The other due lines.** A step's due line (`.yourStepDue`) is no longer held on one line either; at
  every width the columns hold their widths, so it never needs a second line, and its markup did not
  change. The phone card's due (`.cardDue`) was never held on one line.
- **Finished.** Its Closed time sits under its chip in the table's sub line, which wraps; nothing about
  it changed.

### 2.4 F14-5: the phone card's "✓ Done"

`CardStep` draws `StepText` and then the button: title, due line or "✓ Done", button. The row that put
"Done" in the box's top-right corner (`cardStepLine`) is gone. The button is unchanged: 44 px high, the
box's full width, drawn only when the API offers it.

### 2.5 F14-6: the phone card's title underline

The title link sits inline inside a line of its own (`cardTitleLine`), so its bottom border is drawn
under the words of each line, not under the box. The line carries the size (14 px on a 21 px line) and
a 1 px pad, so a one-line title looks and spaces as before.

### 2.6 What stays

The task's page (its Steps panel keeps its own buttons at their own widths and its "Done · name, time"
chip), the dialogs, the Overview, the words, Finished's columns, the tab counts, and Insurance cases are
unchanged. `canMarkDone` and `canUndo` alone decide the button.

### 2.7 Tests

**The tests whose expectation this run changes on purpose:**

| Test | Before | Now |
|---|---|---|
| `followup12.render` › the Tasks list (F12-2) › My tasks: the API’s rows … your step, people and due | the Due cell held its date as one piece: `Overdue · 24 Sep`, `28 Sep, 10:54`, `05 Oct, 14:54` | the same words in kept pieces with a space between: `Overdue ·` + `24 Sep`, `28 Sep,` + `10:54`, `05 Oct,` + `14:54` (the Due column that cut its date) |
| the same test | Add to Bolt: its due line "No due date", then "Done" beside the button, then Undo | Add to Bolt: "✓ Done" as the line right under the title, no due line, then Undo (the Done label beside the button) |
| `followup13.render` › My tasks takes the open views’ layout (F13-1) › Signe, … her own without a step of hers reads a dim dash | the Due cell held `Due today · 15:54` as one piece | `Due today ·` + `15:54` in kept pieces (the Due column that cut its date) |

No other test changed, and none was deleted, skipped or weakened. The other tests that read "Done"
before "Undo" in a row still pass as they were, since the text still comes before the button.

**The new tests** (15), rendered from round 11's recorded answers (`followup13.support.ts`) at their
moment; what each screen size does with the markup is read from the stylesheet through a small reader
that only tests use (`src/pages/followup14.stylesheet.ts`), since a server render has no layout:

| File | Cases | What they hold |
|---|---|---|
| `followup14.render.test.ts` | 10 | **F14-1:** in Dita's, Signe's and Toms's My tasks and in Toms's and Dita's Involving me, every step is title, then its line (the due exactly as `stepDue` words it, or "✓ Done"), then the button's place, and the place holds exactly the action the flags allow, at cell size; "✓ Done" replaces the due line of a done step that has a date (Car wash, Tell the driver the time) and every Done sits right under a title; the place is drawn and empty where no action is offered, also with every flag false; the stylesheet's two-column grid, the 104 px place, the 12 px gap, the top alignment, the button's full width and 30 px, no width of its own for Undo, the lead that puts the button's middle on the title's first line, the refusal across the step. **F14-4:** the only media queries are 1023 px and the task page's 639 px, and the table takes no wide-fold class. **F14-3:** in the band one column, the place in row 2 at 104 px on the left, no lead, no `flex-wrap` left in any step rule, 12 px between steps, an empty place not drawn, the due line and Done of one height. **F14-2:** every task due in Dita's, Signe's and Toms's My tasks drawn in kept pieces that join to `dueInfo`'s words, each but the last ending in "·" or ","; no due line held on one line; the band's Due column still 121 px; Finished's Closed time in the wrapping sub line |
| `followup14.phone.render.test.ts` | 5 | **F14-5:** every step box in Dita's and Toms's My tasks and Toms's Involving me is title, then due or "✓ Done", then the button the flags allow at card size, or none; the corner row is gone; the creator's mark: Done, no button, no due; the card button's 44 px and full width unchanged. **F14-6:** every card title is the link inside its own line; the link has its border and no display, width or max-width of its own, so its underline follows its words |

## 3. Not implemented or partial

**Nothing of Follow-up 14.** F14-1 to F14-6 are built and tested.

### 3.1 The steps that need a password typed into the app

This run may not type a password into the app, so the signed-in steps in a real browser are the
reviewer's, on 5174 and 5002 (§5). What they look at was also checked here through the API as the same
people (§4.2), and in the real pages drawn from those answers (§4.4).

## 4. Verification: the joint check

### 4.1 The scratch stack

As `RWRentApi-wiring/Context/round11_report.md` §7 describes it: nothing ran on 5002 or 5174 at the
start and `rwrent_check` did not exist. It was created, migrated and seeded by round 11's Release build
of the backend worktree at `1b51206` (round 11's code; clean, level with GitHub; work tasks 8, work
task steps 11), and the API started on 5002 from `bin/Release` with
`ApiSecurity__RecordDeleterEmailDomain=rwrent.example`, trusting `http://localhost:5174`. Every command
sourced an environment script that refuses to run unless its connection string names `rwrent_check`.
The API client refuses any address but `localhost:5002`. The seed password was the one the owner gave
for this session, passed in each command's environment only; it is in no file. The database was seeded
three times: for the recording (§4.3), for the joint check (§4.2), and at the end for the reviewer.

### 4.2 Through the API — 36/36

As Dita, Signe, Toms, Karlis and the administrator, on a fresh seed:

- **Access, as before** (5): the four people hold `Tasks.Use`; the administrator is refused My tasks.
- **Every step the layout draws** (17): in both open views, for each of the four people, every step in
  `yourSteps` is the reader's own and carries its title, due, done time, `canMarkDone` and `canUndo`;
  no step offers both actions, a done step never offers Mark done and a step to do never offers Undo,
  so a button's place never needs two buttons; the seed holds both a step to do with Mark done and a
  done step with Undo.
- **The owner's examples are real answers** (2): Dita's Prepare 204 JLM holds Add to Bolt done with
  Undo over Handover with Mark done; Add to Bolt, Handover, Pick up the repair invoice and Book the
  service appointment are all in the answers.
- **The Due column's forms** (2): the seed holds an overdue task (the parking fine), one due today (the
  rental agreement) and later dates, and tasks without a date come as null (the dim dash).
- **Marks move the forms as the layout shows them** (8): Toms's Car wash is to do with a date and Mark
  done; his mark answers it done by him with Undo; My tasks and Involving me both read it done with
  Undo, its date still in the answer but no longer shown; his Undo brings back its due line and Mark
  done. Dita, the task's creator, marks his Tell the driver the time: he reads it done by her with
  nothing in the button's place, and the server refuses him an Undo there (403
  `tasks.mark_not_yours`); Dita's own row for that task still shows only her own step.
- **The phone and Finished** (2): every step in the open views has one of the three forms the card
  draws; Finished's rows carry their closed time and no step actions.

### 4.3 The recorded answers — 18/18

The 18 answers the tests render (`src/pages/followup13.support.ts`, recorded in Follow-up 13) were
recorded again on a fresh seed today with the same requests and marks, and compared with instants and
concurrency tokens set aside: **18/18 identical**. The tests render what the API gives today.

### 4.4 In a browser

**The real pages.** The app's own code from this worktree, served on 5175 from a folder outside both
repositories with a stand-in transport that answers from the 18 recorded answers (and round 10's
recorded task pages) and sends no request anywhere; a mark or an undo changes the stand-in's lists as
the server would. Personas Dita, Signe, Toms, and Toms after Dita's mark of his step. Measured with a
script (positions, widths, cut cells, sideways scroll) and looked at in screenshots:

- **1512 px, the desktop** (dark and light). Dita's My tasks: all four buttons at one x, 104 px wide,
  each level with its title to 0.00 px, 12 px before each; Undo as wide as Mark done. "Pick up the
  repair invoice" and "Book the service appointment" take two lines (the title has 146 px, §6.1), their
  buttons level with the first line. Steps 44 px tall on one-line titles, 64 px on two; 10 px between
  steps. Due dates on one line, nothing cut, no sideways scroll. **Mark done on Handover:** its line
  turned from its due to "✓ Done" and its button to Undo, at the same top, height, x and width; while
  it worked, "Working…" kept the 104 px; the count on Tasks went 4 → 3 and the progress 1 → 2 of 4.
- **1194 px, the sideways iPad** (dark). The desktop's layout, unchanged: Dita's buttons all at one x,
  104 px, level to 0.00 px; Toms's Involving me the same. Nothing cut, no sideways scroll at the page or
  in the table.
- **1024 px**, the desktop's lowest width: the same layout; the table, whose minimum is 1020 px, scrolls
  sideways inside its panel by 108 px, as it did before this run (§8.2).
- **1023 and 768 px**, the band's edges: every step 77 px tall, title, its line, then its button 8 px
  under the text, starting where the text starts, 104 px; 12 px between steps; "Overdue · 24 Sep" on two
  lines; nothing cut, no sideways scroll.
- **834 px, the upright iPad** (dark and light). As at 1023: Dita's four steps identical in form;
  "Overdue ·" over "24 Sep" in the Due column. Toms after Dita's mark: "Tell the driver the time", "✓
  Done", and the step ends there, no empty space. Signe's Finished: Task, Steps, People, Closed, nothing
  cut.
- **402 px, the iPhone 16 Pro** (dark and light). Cards: every step box is title, its line right under
  it ("✓ Done" or the due), then the button at the box's full inner width (300 px) and 44 px. The
  windscreen case's title takes two lines and its underline runs 276 px under the first line's words
  and 60 px under "204 JLM"; each one-line title's underline is as long as its words. No sideways
  scroll.
- **The task's page** at 1512 px: unchanged, its buttons at their own widths (Undo 79 px, Mark done
  110 px) beside the "Done · name, time" chip.
- **Console:** no error on fresh loads of My tasks, Involving me, Finished and the creator-marked case.
  Three errors from the moments of writing are described in §8.1.

**The app on 5174**, signed out, in the browser pane (not the owner's browser): `/tasks` went to Sign in;
its only API request went to 5002 (`/api/me`, 401), none to 5001.

### 4.5 The planted breakages — 30 planted, 30 caught

Each replaced one exact piece of code or style in a copy of the worktree outside it (so the owner's app
never showed one), the full suite ran, and the piece was written back; the restored copy passes.

| # | Breakage | Caught by |
|---|---|---|
| C1 | Done stands beside the button again, the due line back | 4 tests |
| C2 | a done step keeps its due line, Done under it | 6 (list and phone) |
| C3 | the button's place drawn only when an action is offered | 2 |
| C4 | the button before the step's text | 9 |
| C5 | each button as wide as its label | 1 |
| C6 | the button column sized by its content | 1 |
| C7 | the button centred against the step's text | 1 |
| C8 | the button no longer level with the title | 1 |
| C9 | no fixed gap before the button | 1 |
| C10 | the button's place after the text in the same column | 1 |
| C11 | Involving me's rows lose the button's place | 3 |
| C12 | an action drawn whatever the API says | 10 |
| C13 | the band keeps the button beside the text | 1 |
| C14 | the band's button as wide as its label | 1 |
| C15 | the band's button at the right, not under the text | 1 |
| C16 | an empty place keeps its space in the band | 1 |
| C17 | the old wrapping line comes back | 1 |
| C18 | the step's text keeps its desktop lead in the band | 1 |
| C19 | uneven space between steps in the band | 1 |
| C20 | a rule of its own for the sideways iPad | 1 |
| C21 | the Due cell on one line again | 1 |
| C22 | the Due cell breaks at every space, inside a date too | 3 |
| C23 | the Due cell without kept pieces | 3 |
| C24 | a piece of the date no longer kept whole | 1 |
| C25 | a step's due line held on one line | 1 |
| C26 | the phone card's Done back in the corner | 2 |
| C27 | the phone's button below a touch target | 1 |
| C28 | the phone's button no longer the box's full width | 1 |
| C29 | the title link a box again, its underline under the box | 1 |
| C30 | the title link drawn as an inline box | 1 |

### 4.6 The test suite, and each commit

Final state: typecheck 0 errors, **495/495** tests in 45 files, build green. Each commit alone, from
`git archive` into a folder of its own: `a87c322` 480, `c0629bb` 480, `fd41c52` 480, `fb59065` 495, all
green with 0 type errors.

### 4.7 The owner's side, untouched

The owner's API on 5001 (pid 7505) and the app on 5173 (pid 24831) ran on their own processes
throughout; this run sent them nothing. `rwrent_v1` was not read, as the run's rules require, so no
fingerprint was taken. Mailpit was not read. The backend worktree is clean at `1b51206`.

### 4.8 End state

- The scratch API runs on **5002** (pid 28259) over `rwrent_check`, **freshly seeded** at 09:23 Tallinn
  time after the checks, for the reviewer. Nothing runs on 5174 or 5175.
- The workspace's launch file is as it was.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. Start it from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173. The four widths: a desktop window about
  1512 px wide, then 1194 px (the sideways iPad), 834 px (the upright iPad) and 402 px (the iPhone 16
  Pro), or the devices themselves pointed at the Mac.
- **The people**, all with the seed password: Dita `dita.smite@rwrent.example` (Fleet Manager), Signe
  `signe.priede@rwrent.example` (Company Principal), Toms `toms.rudzitis@rwrent.example` (Viewer).
- **Dates** follow the moment the database was seeded, so they differ from this report's; what matters
  is their form ("Overdue · …", "Due today · …", a date). Late in the evening the rental agreement's
  "Due today" turns into "Overdue".
- **Afterwards:** the steps write practice data to `rwrent_check` only; reseed it if a clean copy is
  wanted. Step D5 changes Toms's view for the later lists, so keep the order.
- **In every list, light and dark:** the theme switch is in the menu; look once in each.

### 5.1 The desktop, about 1512 px

1. **D1, Dita, My tasks.** Your step: Prepare 204 JLM shows Add to Bolt with "✓ Done" under its title
   and Undo at the right, then Handover with its due under it and Mark done; the windscreen case shows
   Pick up the repair invoice, "No due date", Mark done; Book a service shows Book the service
   appointment, "✓ Done", Undo. All four buttons stand in one column, the same width, each level with
   its title's first line; a two-line title keeps its button level with the first line.
2. **D2, a mark.** Mark done on Handover: its due line becomes "✓ Done", its button Undo in the same
   place; nothing else in the row moves; the count on Tasks falls by one. Undo: back.
3. **D3, Involving me** (Dita): the windscreen case in the same form.
4. **D4, Toms, My tasks.** Tell the driver the time (Overdue in red, Mark done), Car wash (its due, Mark
   done), Collect the photos ("✓ Done", Undo): one column, one width.
5. **D5, the creator's mark.** As Dita, open Book a service for 444 WKS and mark Toms's Tell the driver
   the time done on the task's page. As Toms, reload My tasks: that step reads "✓ Done" with an empty
   place at the right; the other rows' buttons stay where they were.
6. **D6, unchanged:** the task's page (its own buttons and the "Done · name, time" chip), Finished's
   columns as Signe (Task, Steps, People, Closed).

### 5.2 The sideways iPad, 1194 px

1. **S1:** as Dita and as Toms, My tasks and Involving me look exactly as at 1512 px: the buttons in one
   column at one width, level with the titles, Done under the titles.
2. **S2:** no list scrolls sideways at this width.

### 5.3 The upright iPad, 834 px

1. **T1, Dita, My tasks.** The parking fine's Due reads "Overdue ·" over its date on two lines, nothing
   cut. Every step in Your step reads its title, its due or "✓ Done", then its button under them, the
   same width for Mark done and Undo, lined up with the text on the left, the same space between steps;
   People sit under Steps.
2. **T2, a mark.** Mark done on Handover: its line becomes "✓ Done", its button Undo, at the same place.
3. **T3, Toms after D5.** Tell the driver the time reads "✓ Done" and ends there, with no button and no
   empty space; Car wash and Collect the photos keep their buttons under their text.
4. **T4, Finished** as Signe: its four columns, nothing cut.

### 5.4 The iPhone 16 Pro, 402 px

1. **P1, Dita, My tasks cards.** Prepare 204 JLM's box for Add to Bolt: title, "✓ Done" under it, Undo
   across the box; Handover: title, its due, Mark done across the box.
2. **P2, the underline.** "Handle the windscreen insurance case of 204 JLM" takes two lines; the
   underline runs under the words of each line, not across the card.
3. **P3, a mark.** Mark done in a box marks the step without opening the task; its line becomes "✓ Done".
4. **P4, Toms after D5.** Tell the driver the time: title, "✓ Done", no button.

## 6. Decisions needed

1. **The title's width in Your step on the desktop.** The column keeps its 290 px (the handover's value;
   §14 did not ask to change it), so after the 104 px place and the 12 px gap the title has 146 px at
   every desktop width. Four seeded step titles need more and take two lines, always the same way, with
   the button level with the first line: Book the service appointment (179 px), Send the claim to the
   insurer (173), Pick up the repair invoice (150) and Apply for the taxi licence (148). Before this run
   "Pick up the repair invoice" fitted on one line only by running up to its button. If the owner wants
   those on one line: a Your step column of about 324 px, the 34 px taken from Task, the only flexible
   column (402 → 368 px at 1512). The app side only; one value in `Tasks.module.css`.

Choices made where §14 left room, each reversible in a line:

1. **The folded band drops an empty place.** From 1024 px up the empty place keeps its column, as F14-1
   asks, so nothing moves sideways. In the band, where the place is a line under the text, an empty
   one would read as extra space between two steps, which F14-3 asks to keep the same; so a step
   without an action ends at its text there (`.yourStepAction:empty`).
2. **Where a date may break.** Only after "·" or ",", so a date's day and month, and its time, stay
   together; a short date that fits keeps one line.
3. **A done step shows no date in the list.** "✓ Done" takes the due line's place, as §14 asks; the date
   is still on the task's page.

## 7. Deviations

None: §14 and the API agree, and nothing of the handover needed changing beyond the Your step cell's
order and the lines named above.

## 8. Open risks

1. **A few seconds of an error while writing.** The Due cell's new piece was saved a few seconds before
   the line that imports `Fragment`; in those seconds the preview logged "Fragment is not defined" three
   times. The owner's app on 5173 reloads from the same files, so had Tasks been open there it would
   have shown the same error until the next save; a reload or a later save cleared it. Nothing of it is
   in any commit; every commit passes on its own (§4.6).
2. **The desktop's lowest width.** At 1024 px the open views' table, whose minimum is 1020 px, scrolls
   sideways inside its panel by 108 px when the menu is collapsed to its icons. This predates this run
   (Follow-up 12 set the minimum, Follow-up 13 gave My tasks the same one) and is not a screen size the
   owner uses; the sideways iPad at 1194 px has room. Not changed.
3. **Layout in a real device's browser.** The positions were measured in the browser pane's Chromium;
   Safari on the iPad may measure text a pixel differently, which could move where a long title wraps,
   never where a button stands. §5.2 and §5.3 are the check on the devices.

## 9. Commits

| Commit | Group | Files |
|---|---|---|
| `a87c322` | a due date is never cut: it takes a second line, breaking only after "·" or ","; the tests that pinned the one-piece Due cell | `src/pages/tasks/Tasks.tsx`, `src/pages/tasks/Tasks.module.css`, `src/pages/followup12.render.test.ts`, `src/pages/followup13.render.test.ts` |
| `c0629bb` | Your step reads the same at every screen size, and the phone card's "✓ Done" moves under the title; the test that pinned Done beside the button | `src/pages/tasks/Tasks.tsx`, `src/pages/tasks/Tasks.module.css`, `src/pages/tasks/StepAction.tsx`, `src/pages/followup12.render.test.ts` |
| `fd41c52` | the phone card's title underline follows its words on every line | `src/pages/tasks/Tasks.tsx`, `src/pages/tasks/Tasks.module.css` |
| `fb59065` | new tests for the six changes at their screen sizes, and the stylesheet reader they use | `src/pages/followup14.stylesheet.ts` (new), `src/pages/followup14.render.test.ts` (new), `src/pages/followup14.phone.render.test.ts` (new) |
| this one | the report | `Context/wiring_report.md` |
