# Frontend Wiring — Follow-up 13, My tasks holds everything a person is part of

> Follow-up 13 (`Context/wiring_followups.md` §13): the app's half of the owner's My tasks decision,
> the backend's half being round 11 (`RWRentApi-wiring/Context/round11_report.md`, §5 the contract: no
> operation, shape, code or enum changed; My tasks and its count hold new members), verified and in
> `main`. Frontend only, on `feature/backend-wiring` in this worktree
> (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main` after
> verification. Written 2026-09-25. It replaces Follow-up 12's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere,
> never called 5001, never read or wrote `rwrent_v1` and never read Mailpit. The backend worktree was
> only built (in Release) and run, never changed.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it showed this run's code as it was
>   written; its API on 5001 already serves round 11, so the owner's My tasks now shows others' tasks
>   in the new layout.
> - Every live check used a scratch stack built for this run: `rwrent_check`, created, migrated and
>   seeded by round 11's Release build, behind the API on 5002.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

- **F13-1, the table.** My tasks takes Involving me's layout and widths: Task (with "from" its creator
  when someone else created it), Steps, **Your step** (the reader's own steps, each with Mark done or
  Undo exactly as the API's `canMarkDone` and `canUndo` say, Done when the step is done, and a dim
  dash when the reader has no step in the task), People, Due. On the tablet it folds as Involving me
  does: People go under Steps.
- **F13-2, the phone.** A My tasks card shows the reader's own steps with their 44px buttons, as an
  Involving me card does; a card without a step of the reader's shows none.
- **F13-3, nothing else.** The tab's count still reads `myTasks` (the server now counts the new
  members); the words, the empty states, the navigation's count, the Overview, the task's page and the
  dialogs are unchanged. Finished keeps its own columns.
- **The app judges nothing.** Which tasks My tasks holds, their order, which steps are the reader's and
  which action each offers all come from the API; a step the task's creator marked reads Done with no
  action for its person because the API says so.

| | |
|---|---|
| Commits | `6753df8`, `fa2b6a0`, `049f210` (`Wiring 35`) and this report's (`Wiring 36`), on `feature/backend-wiring` (§9) |
| Tests | 468 → **480**, all green: 12 new; 5 existing tests moved to round 11's answers as the run's rules allow (§2.4) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the three (§4.6) |
| Planted breakages | **12 planted, 12 caught** by the suite (§4.5) |
| Joint check | **37/37** through the API on a freshly seeded database; the 18 recorded answers identical in a second fresh recording (§4.2, §4.3) |
| In a browser | the app on 5174 signed out; the real pages at 1512, 834 and 402 in a preview outside the repositories (§4.4) |

## 2. Implemented

### 2.1 F13-1: the table (`src/pages/tasks/Tasks.tsx`, `Tasks.module.css`, `taskAddress.ts`)

- **Which views carry the reader's steps** is a property of each view in `TASK_TABS`, `yourSteps`:
  true for My tasks and Involving me, false for Finished. The list and the phone card read it; nothing
  asks for a view by name any more to decide the layout.
- **The columns** of the open views: Task (auto), Steps 150, Your step 290, People 200, Due 170; the
  table's minimum width 1020. The class that sets it is now `withSteps` (it was `involving`).
- **Your step** lists `yourSteps` as the API gives it, in its order, each with its title, its due line
  (Overdue and Due today in their tones while the step is to do), Done when it is done, and the action
  the API allows; a row whose `yourSteps` is empty (one's own task with no step of one's own) shows a
  dim dash.
- **"from"** stands under a task someone else created, as before, now also in My tasks.
- **The folded band (768–1023)** is Involving me's: Steps 107, Your step 206, Due 121, People folded
  into a line under Steps, the action moving under the step's text.

### 2.2 F13-2: the phone card

The card's "Your step" or "Your steps" section, with a card-sized Mark done or Undo per step
(`data-size="card"`, 44px), is drawn for the open views; tapping the button marks the step and does not
open the task, as on Involving me.

### 2.3 F13-3: what stays

`TASKS_DESCRIPTION`, the empty states ("No open tasks" with New task on My tasks), the no-results
state, the strip and its counts (`myTasks`, `involvingMe`, `finished`), the navigation's count and the
Overview's tile and card (the to-do count), the task's page, the dialogs, and every request the page
makes are unchanged. Insurance cases is untouched.

### 2.4 Tests

**The answers.** `src/pages/followup13.support.ts` holds round 11's answers as the scratch API gave
them on 2026-09-25 (§4.3): the four people's counts and My tasks, Dita's and Toms's Involving me, Toms's
My tasks filtered on Overdue, his to-do list, and two marks with what followed (Toms marks Car wash;
Dita, the creator of "Book a service", marks Toms's "Tell the driver the time"). Its clock is
`R11_CAPTURED_AT`. Follow-up 12's `followup12.support.ts` is unchanged: it stays round 10's answers for
everything round 11 did not change; its `myTasks` numbers and its My tasks lists are round 10's and no
assertion reads them any more.

**The tests whose expectation this run changes on purpose** (each now reads round 11's answers, at
their moment):

| Test | Before | Now |
|---|---|---|
| `followup12.render` › the Tasks list › the header, the strip with the server’s counts, … | Dita's counts `{ myTasks: 4, involvingMe: 1, finished: 1, toDo: 4 }`; My tasks 4 in the strip; "4 tasks" | `{ myTasks: 5, involvingMe: 1, finished: 1, toDo: 4 }`; My tasks 5; "5 tasks" |
| `followup12.render` › the Tasks list › My tasks: the API’s rows … (renamed "… progress, your step, people and due") | round 10's four rows; the columns Task, Steps, People, Due and **no** Your step; the dates of round 10's recording | round 11's five rows, Signe's windscreen case third with "from Signe Priede" and Dita's step "Pick up the repair invoice" with Mark done; the columns Task, Steps, **Your step**, People, Due; Prepare 204 JLM with Add to Bolt Done and Undo, Handover with Mark done; the key fobs with three dim dashes (Your step, People, Due); the dates of round 11's recording |
| `followup12.render` › the Tasks list › each view’s empty list … | My tasks and Involving me rendered from Toms's recorded My tasks, empty in round 10 (`view1Toms`) | the same two empty states rendered from an empty list of the test's own (`EMPTY_PAGE`); Finished still from Toms's recorded Finished, which is still empty |
| `followup12.render` › the Overview’s Open tasks › the count follows a mark: Toms’s card … | round 10's counts and to-do lists; "Toms has no task of his own": `countsToms.myTasks` is 0 | round 11's; `r11CountsToms.myTasks` is 3 while the tile reads 2 to do, which proves the tile is the to-do count more plainly; after his mark 1 to do and no Car wash, as before |
| `followup12.phone.render` › the task cards on a phone › no table; each card … (renamed "… due and the reader’s steps") | round 10's four cards; Prepare 204 JLM's card **without** "Your step" | round 11's five cards; Prepare 204 JLM's card with "Your steps", two steps, Undo and Mark done at card size; the windscreen card "from Signe Priede" with "Your step" and Mark done; the fine's card without a step section |

No other test changed, and none was deleted, skipped or weakened.

**The new tests** (12):

| File | Cases | What they hold |
|---|---|---|
| `followup13.render.test.ts` | 9 | the two open views carry the reader's steps and Finished does not; **Toms**, who created nothing: the strip's 3, the five columns, the rows in the server's order and the same tasks as his Involving me, "from" on each, Tell the driver Overdue in red with Mark done, Car wash with Mark done, Collect the photos Done with Undo, People under Steps; **Signe**: her agreement due today in amber with a dim dash for Your step, Dita's task "from Dita Smite" with her step and Mark done, her own case with her done step and Undo; the table's `withSteps` width, Your step's column and People folding on the tablet; after Toms's own mark Done with Undo, after Dita's mark of his step Done with **no** action and the task moved last as the server orders it; with every flag false no action at all, Done where done; the Due filter's answer with "from"; Karlis's recorded empty My tasks as the empty state with New task; the count on Tasks still the to-do count (2) while My tasks holds 3 |
| `followup13.phone.render.test.ts` | 3 | Toms's three cards, each "from" its creator with his step's 44px action; a step marked by the task's creator shows Done on the card with no button; Signe's own task without her step has no step section, her step in Dita's task has one |

## 3. Not implemented or partial

**Nothing of Follow-up 13.** F13-1 to F13-3 are built and tested.

### 3.1 The steps that need a password typed into the app

This run may not type a password into the app, so the signed-in steps in a real browser are the
reviewer's, on 5174 and 5002 (§5). Everything they look at was also checked here through the API as
the same people (§4.2), and in the real pages from those answers (§4.4).

## 4. Verification: the joint check

### 4.1 The scratch stack

As `RWRentApi-wiring/Context/round11_report.md` §7 describes it: nothing ran on 5002 or 5174 at the
start and `rwrent_check` did not exist. It was created, migrated (seven migrations, `V9WorkTasks` last)
and seeded by round 11's Release build of the backend worktree at `5b7a4c7`, clean (work tasks 8, work
task steps 11), and the API started on 5002 from `bin/Release` with
`ApiSecurity__RecordDeleterEmailDomain=rwrent.example`, trusting `http://localhost:5174`. Every command
sourced an environment script that refuses to run unless its connection string names `rwrent_check`.
The API client refuses any address but `localhost:5002`. The seed password came from the owner for this
session and was passed in each command's environment; it is in no file.

### 4.2 Through the API — 37/37

`joint13.py`, in the run's scratchpad, as Dita Smite, Signe Priede, Toms Rudzitis, Karlis Zvaigzne and
the administrator, making the requests the My tasks page makes (`View=1&PageNumber=1&PageSize=20`, the
counts, the filters, the marks):

- **who uses tasks:** the four hold `Tasks.Use`; the administrator does not and is refused the counts
  and My tasks (403), so the app asks nothing;
- **My tasks as each reads it:** Toms 3/3/0 with 2 to do, Dita 5/1/1 with 4, Signe 3/1/2 with 2,
  Karlis nothing; each list in the server's order, its total the strip's count; the tasks of others in
  it exactly Involving me's, each with its creator's name and the reader's steps; every step in Your
  step the reader's own, with `canMarkDone` and `canUndo`; Dita's parking fine and key fobs without a
  step of hers (the dim dash); Prepare 204 JLM with Add to Bolt done and Undo, Handover with Mark done;
- **the filters on the mixed list:** Toms's Overdue is Book a service, by his overdue step; his search
  "204 jlm" finds the two tasks about 204 JLM; Dita's No due date is her key fobs and her service
  booking;
- **a mark from a My tasks row:** Toms marks Car wash: the answer has it done by him with Undo; the task
  stays in My tasks, the to-do count falls to 1 while My tasks stays 3; Undo brings both back;
- **the creator's mark:** Dita marks Toms's Tell the driver the time; Toms reads it done by her with
  neither Mark done nor Undo, the task moves last in his My tasks, and his undo is refused
  `403 tasks.mark_not_yours`, the sentence the row would show;
- **nothing else changed:** Finished is Dita's one, Signe's two, Toms none; Toms's to-do list is Car wash
  alone after Dita's mark.

All 37 passed on the first run, on a freshly seeded database.

### 4.3 The recorded answers

`capture13.py` recorded the 18 answers of §2.4 on a freshly seeded database; after another fresh seed it
recorded them again, and `compare13.py` compared them member by member once the instants (which follow
the moment of seeding) and the concurrency tokens were set aside: **18 of 18 identical.**

### 4.4 In a browser

- **The app on 5174**, started from this worktree with
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`, visited signed out
  in the app's built-in browser, no sign-in made: `/tasks` sent the visitor to Sign in, no cookie was
  set, and the only API request went to 5002 (`GET /api/me` → 401). It was stopped afterwards.
- **A preview on 5175, outside the repositories**: the real app from this worktree with a stand-in
  transport that answers from the recorded answers as the chosen person and sends nothing anywhere.
  Looked at:
  - at **1512**: Dita's My tasks with its five rows and the five columns, Signe's case "from Signe
    Priede" with Mark done, the dim dashes; Mark done on her step in Signe's case turned it into Done
    with Undo; as Toms, Mark done on Car wash turned it into Done with Undo, its progress to 2 of 4 and
    the count on Tasks from 2 to 1; Signe's Involving me and Finished as before (Finished: Task, Steps,
    People, Closed);
  - at **834**: the folded band: Steps 107, Your step 206, Due 121, People under Steps, nothing
    scrolling sideways;
  - at **402**: the cards, Dita's "Your steps" with full-width 44px Undo and Mark done, the windscreen
    card "from Signe Priede"; tapping Mark done on Handover marked it without leaving the list and moved
    the count from 4 to 3; nothing scrolling sideways;
  - no error in the console.

  **One look defect was seen there, and it is not new** (§8.1): at 834 an overdue task's Due reads
  "Overdue · 24 S…": the text needs about 7 pixels more than the 121px Due column (the handover's
  width) gives it. The column is the same for all three views and has been since Follow-up 12, so
  Follow-up 12's My tasks and Involving me cut it the same way; §13 asks for nothing else to change, so
  it is left as it is and proposed for the next batch.

  The preview's stand-in first handed back the same objects it changed in place, so after a mark the
  row's progress and the count did not move while the step did; the stand-in now answers with fresh
  copies, as a real API does, and they followed. It was the stand-in's fault, not the app's: the app
  had asked again for the counts and the list after the mark. The preview was stopped, and the two
  launch entries added for it and for 5174 to the workspace's launch file, outside the repositories,
  were removed again.

### 4.5 The planted breakages — 12 planted, 12 caught

Each breakage was written into a **copy** of the worktree outside it, never into the worktree, so the
owner's app on 5173 could not hot-reload one even for a moment. The whole suite ran on each, and the
file was restored byte for byte; the restored copy passes.

| | Breakage | Caught by |
|---|---|---|
| B1 | My tasks keeps round 10's columns, without Your step | 11 tests |
| B2 | Finished takes the open views' columns | the views' flags test |
| B3 | a row without the reader's step leaves Your step empty, no dim dash | Dita's rows, Signe's rows |
| B4 | a My tasks card shows no steps, as in round 10 | the four My tasks phone tests |
| B5 | People do not fold on the tablet in My tasks | the width-and-folding test |
| B6 | the people line under Steps only on Involving me | Toms's rows, the width-and-folding test |
| B7 | My tasks keeps the narrow table | the width-and-folding test |
| B8 | an action drawn whatever the API says | 7 tests, among them "nothing offered, nothing drawn" and the creator's-mark tests |
| B9 | no "from" in My tasks | Dita's, Toms's and Signe's rows, the Due filter test, Finished |
| B10 | the app hides the reader's done steps, judging for itself | 7 tests |
| B11 | the My tasks tab shows Involving me's count | the strip test, Signe's rows |
| B12 | a My tasks card shows only the steps still to do | 5 phone tests |

### 4.6 The test suite, and each commit

- `npm run typecheck`: 0 errors. `npx vitest run`: **480 tests, 43 files, all green.** `npm run build`:
  green (the chunk-size warning predates this run).
- **Each commit alone**, from a clean copy outside the worktree (`git archive`): typecheck 0 errors and
  the whole suite green at `6753df8` (468), `fa2b6a0` (468) and `049f210` (480).

### 4.7 The owner's side, untouched

The owner's API on 5001 (pid 7505, restarted by the reviewer on round 11) and the app on 5173 (pid
24831) ran on their own processes throughout; this run sent them nothing. `rwrent_v1` was not read,
as the run's rules require, so no fingerprint was taken this time. Mailpit was not read.

### 4.8 End state

- The scratch API runs on **5002** (pid 12830) over `rwrent_check`, **freshly seeded** after the checks,
  for the reviewer. Nothing runs on 5174 or 5175.
- The workspace's launch file is as it was.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. Start it from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173.
- **The people**, all with the seed password: Dita `dita.smite@rwrent.example` (Fleet Manager), Signe
  `signe.priede@rwrent.example` (Company Principal), Toms `toms.rudzitis@rwrent.example` (Viewer),
  Karlis `karlis.zvaigzne@rwrent.example` (Fleet Manager).
- **Dates** follow the moment the database was seeded, so they differ from the ones in this report.
- **Afterwards:** the steps write practice data to `rwrent_check` only; reseed it if a clean copy is
  wanted.

### 5.1 The steps

1. **Toms, who created nothing.** Tasks opens on My tasks with 3, Involving me 3; the count on Tasks
   reads 2. Three rows, each "from" its creator: Book a service (his Tell the driver the time Overdue in
   red, Mark done), Prepare 204 JLM (Car wash, Mark done), the windscreen case (Collect the photos Done,
   Undo).
2. **A mark from My tasks.** Mark done on Car wash: the row shows Done and Undo, its progress goes up by
   one, the count on Tasks falls to 1, and Involving me shows the same. Undo: back to 2.
3. **Dita, with tasks of her own.** My tasks 5: the parking fine first (Overdue, red; a dim dash in Your
   step), Prepare 204 JLM (Add to Bolt Done with Undo, Handover with Mark done), Signe's windscreen case
   "from Signe Priede" with Pick up the repair invoice and Mark done, the key fobs (three dim dashes),
   Book a service (Book the service appointment Done with Undo).
4. **The creator's mark.** As Dita, open Book a service and mark Toms's Tell the driver the time done.
   As Toms: in My tasks that step reads Done with neither Mark done nor Undo, and the task is now last.
5. **Signe.** My tasks 3: Prepare the rental agreement (Due today in amber, a dim dash in Your step),
   Dita's Prepare 204 JLM "from Dita Smite" with Apply for the taxi licence and Mark done, her own
   windscreen case with Send the claim to the insurer Done and Undo.
6. **Karlis.** My tasks empty: "No open tasks" with New task.
7. **Tablet width** (about 834 px): My tasks folds as Involving me does, People under Steps, nothing
   scrolling sideways. (An overdue Due is cut to "Overdue · 24 S…", as it was before, §8.1.)
8. **Phone width** (about 402 px): Toms's My tasks cards each with "from", "Your step" and a 44px button;
   the button marks the step without opening the task; a tap elsewhere on the card opens the task.
9. **Unchanged:** Finished (Task, Steps, People, Closed), Involving me, the Overview's Open tasks tile
   (Toms: 2 to do, not 3), the task's page and the dialogs.

## 6. Decisions needed

None. Choices made where §13 left room, each reversible in a line:

1. **A property of the view, not its name.** `TASK_TABS` says which views carry the reader's steps
   (`yourSteps`), and the list and the card read it, so My tasks and Involving me cannot drift apart.
2. **Round 11's answers in a file of their own.** Re-recording Follow-up 12's fixtures would have moved
   every date its tests read, and those tests assert nothing round 11 changed; so round 11's answers sit
   in `followup13.support.ts` with their own clock, and only the tests that pinned round 10's My tasks
   moved to them. Where a test used a recorded answer as an empty list, it has an empty list of its own.
3. **The Due column at 834 left as it is** (§4.4, §8.1): not part of §13, and a width the handover set.

## 7. Deviations

None: the API and §13 agree, and nothing of the handover was needed beyond Involving me's layout,
which the app already had.

## 8. Open risks

1. **An overdue Due is cut at the tablet width**, "Overdue · 24 S…" in the 121px Due column, in all
   three views, since Follow-up 12. A proposal for the next batch: let the Due column take 128px in
   the folded band (Task, the only flexible column, gives the 7px), or let the date wrap under
   "Overdue". The app side only.
2. **Follow-up 12's fixtures keep round 10's My tasks numbers** for the tests of things round 11 did
   not change (the Overview's and the sidebar's to-do counts, Involving me, Finished, the task's page).
   They are recorded answers of an earlier server; a test that starts to read their My tasks members
   would read round 10's.

## 9. Commits

| Commit | Group | Files |
|---|---|---|
| `6753df8` | round 11's answers for My tasks, recorded from the practice API | `src/pages/followup13.support.ts` (new) |
| `fa2b6a0` | My tasks takes Involving me's columns and phone cards; the tests that pinned round 10's My tasks read round 11's answers | `src/pages/tasks/Tasks.tsx`, `src/pages/tasks/Tasks.module.css`, `src/pages/tasks/taskAddress.ts`, `src/pages/followup12.render.test.ts`, `src/pages/followup12.phone.render.test.ts` |
| `049f210` | new tests for My tasks as round 11 fills it | `src/pages/followup13.render.test.ts` (new), `src/pages/followup13.phone.render.test.ts` (new) |
| this one | the report | `Context/wiring_report.md` |
