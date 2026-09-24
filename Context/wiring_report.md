# Frontend Wiring — Follow-up 12, Tasks in the app

> Follow-up 12 (`Context/wiring_followups.md` §12): the app's half of Tasks, the backend's half being
> round 10 (`RWRentApi-wiring/Context/round10_report.md`, §5 the contract), verified and in `main`.
> Frontend only, on `feature/backend-wiring` in this worktree
> (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main` after
> verification. Written 2026-09-24. It replaces Follow-up 11's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere,
> never called 5001 and never wrote to `rwrent_v1`; its read-only fingerprint is the same at the end
> as at the start. The backend worktree was only built (in Release) and run, never changed.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it shows this run's code. Its API on
>   5001 still serves round 9, whose `GET /api/me` holds no `Tasks.Use`: the owner sees no Tasks
>   entry, no Open tasks tile or card, and the app asks nothing about tasks, as §12 says it must be
>   until the reviewer upgrades 5001. Insurance cases is unchanged.
> - Every live check used a scratch stack built for this run: `rwrent_check`, created, migrated and
>   seeded by round 10's Release build (the prototype's eight tasks), behind the API on 5002.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

- **F12-1.** `/tasks` and `/tasks/:taskId` need `Tasks.Use`, which joins the app's permissions. The
  sample Tasks page and its sample rows are gone. Insurance cases stays exactly as it was, "Under
  development", in the navigation, on its page and on the Overview.
- **F12-2, the list.** The header "Tasks" with New task; the strip My tasks / Involving me / Finished
  with the server's counts and "Times in Tallinn time."; the search and the Due filter; each view's
  columns in the order the API gives; the reader's own steps with Mark done or Undo on Involving me;
  paging; the empty states and the no-results state; the phone cards. The view, the search, the
  filter and the page are in the address.
- **F12-3, a task's page.** The breadcrumb back to the view it came from; the hero with the status,
  Created by, Due (Overdue or Due today in their tones), About (the record as a link, or
  "Vehicle · deleted record") and Progress; Edit, Finish task and Cancel task only when the API says
  `canChange`; the finished and cancelled banners; Description; Steps, each with " (you)", its due,
  its state and the action the API allows; Record; the "not shared with you" and not-found states.
- **F12-4, New task and Edit task,** one dialog: the Task section and the Steps section with Add step,
  move up, move down and remove. An edit sends every step with its id in the order shown, so a done
  step keeps its mark. Every refusal lands where it belongs: a field's under the field, a step's under
  that step's row, a record that is gone under the record's select, a lost race as the stale banner
  with Refresh, the rest in the banner. After Create the new task's page opens.
- **F12-5.** Finish task names the steps still open, in the warn tone; Cancel task has its optional
  Why and "Keep task". Mark done and Undo are single actions; a refusal shows the API's sentence under
  its step.
- **F12-6 and F12-7.** The count on Tasks (sidebar and phone drawer) is the to-do count; the Overview's
  Open tasks tile reads it and its card lists the to-do items. Without `Tasks.Use` none of this shows
  and nothing is asked. Every write refreshes the task, the three views, the counts and the to-do list,
  so the count and the Overview follow a mark at once.
- **The app judges nothing.** Who may mark, undo or change is read from `canMarkDone`, `canUndo`,
  `canChange` and `viewerIsCreator`; an empty title, a step without a person, a step due after the
  task are the API's refusals, never the app's own checks.

| | |
|---|---|
| Commits | `8a73732`, `ac3b89a`, `b669aad`, `0c04526`, `a71ce3a`, `c2e62e6` (`Wiring 33`) and this report's (`Wiring 34`), on `feature/backend-wiring` (§9) |
| Tests | 387 → **468**, all green: 81 new; 5 existing tests updated as the run's rules allow, 1 extended (§2.8) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at every one of the six (§4.5) |
| Planted breakages | **66 planted, 66 caught** by the suite (§4.4) |
| Joint check | **44/44** through the API, on a freshly seeded database; the 70 fixtures compared with a second fresh run (§4.1, §4.2) |
| In a browser | the real pages at 1512, 834 and 402, dark and light, in a preview outside the repositories; two look defects found there and fixed (§4.3) |
| The owner's database | unchanged: same fingerprint before and after |

## 2. Implemented

### 2.1 The API layer

- `src/api/dto.ts`: the round-10 contract as the OpenAPI document serves it, members and optionality
  from its `required` arrays: the four enums (`WorkTaskStatus`, `WorkTaskAboutKind`, `WorkTaskView`,
  `WorkTaskDueFilter`), `WorkTaskResponse`, `WorkTaskStepResponse`, `WorkTaskListItemResponse`,
  `WorkTaskToDoItemResponse`, `WorkTaskCountsResponse`, `WorkTaskPersonResponse`, the requests, and
  the two queries. `WorkTaskQuery` has no sort field: the API refuses one.
- `src/api/tasks.ts`: the eleven operations. `src/api/queryKeys.ts`: `qk.tasks`, one prefix for the
  task, the views, the counts, the to-do list and the people.
- `src/api/codes.ts`: `tasks.about_record_not_found` names `aboutRecordId` for `task-create` and
  `task-edit`. It is a 404, so `src/api/problem.ts` now reads a 404 whose code the op's table maps as
  a field refusal too; any other 404 is read as before.
- `src/permissions/permissions.ts`: `Tasks.Use`.

### 2.2 The words (`src/format/tasks.ts`)

From the handover's copy deck: "Vehicle · 204 JLM" (the app adds the kind's word to the API's
`aboutLabel`), "Vehicle · deleted record" when `aboutRecordExists` is false; "Overdue · 23 Sep",
"Due today · 17:00", "27 Sep, 12:00", a step's "Due 26 Sep, 16:00" and "No due date", with Tallinn's
day deciding what "today" is; "1 of 4 done", "1 of 4 steps done", "No steps"; "Signe Priede, Toms
Rudzitis +1"; "from Dita Smite"; "Done · Dita Smite, 23 Sep, 14:10"; " (you)"; the finish warning
"2 steps are not done: Car wash (Toms Rudzitis), Handover (Dita Smite)."; the banners "Finished by …
on …" and "Cancelled by … on …" with the reason or "No reason given."; the About lists' options
("204 JLM · Hyundai Kona Electric", " · inactive", "552 KLM · Nordwind Logistics · Active").

### 2.3 F12-1 and F12-6: the routes, the count, the Overview

- `src/app/routes.tsx`: both routes need `Tasks.Use`; the navigation entry carries the count `tasks`.
  The router's guard and the navigation filter already hide a gated page from a reader without its
  permission, so the System Administrator and a Record deleter alone see no Tasks entry.
- `src/app/AppShell.tsx`: the count is `toDo` of `GET /api/tasks/counts`, drawn as the other counts
  (sidebar expanded and the phone drawer), none when zero.
- `src/pages/tasks/taskAddress.ts` holds `useTaskCounts`, enabled only with `Tasks.Use`.
- `src/pages/overview/Overview.tsx`: the Open tasks tile ("to do", opening Tasks) and card (the to-do
  list's first 100, earliest due first, each row a link to its task with the tile's tone for overdue
  or due today, "No open tasks" when empty) show only for a holder; the Insurance tile and card are
  untouched. `src/pages/overview/sample.ts` keeps only the insurance rows;
  `src/pages/simple/Placeholders.tsx` only Insurance cases.

### 2.4 F12-2: the list (`src/pages/tasks/Tasks.tsx`)

Built with the app's list vocabulary as Delete records was: `PageHeader` with New task, `RecordTabs`
(compact: below 640 the tabs drop their icons and tighten to `8px 11px`, so all three fit), the
toolbar's `SearchInput` and `SelectFilter`, the shared table with its row navigation, `Pagination`,
`EmptyState`. The column sets and widths are the handover's: My tasks and Finished Task / Steps 170 /
People 240 / Due or Closed 170 (min 800), Involving me Task / Steps 150 / Your step 290 / People 200 /
Due 170 (min 1020); at 768–1023 fixed layout at 71% and, on Involving me, People folds into a line
under Steps. Below 768 each task is a card that opens its task when tapped, with Steps and its bar,
Due or Closed, and on Involving me the reader's steps, each with a 44px Mark done or Undo.

### 2.5 F12-3: a task's page (`src/pages/tasks/TaskRecord.tsx`)

`RecordHeader` with the hero band (`stackActions`: below 640 the three buttons take a row each),
`RecordBanner` (now also `ok` and `mute`, and without a body for a finished task), `Panel`, `FactGrid`.
The steps are the handover's numbered rows. The About link is offered only to a reader who may open
that record's page; a gone record is named, never linked. A refused read answers: `tasks.not_shared`
→ "This task is not shared with you" in a panel titled Task; `tasks.not_found` → "That task is not
available" with the API's "This task no longer exists.", without Try again.

### 2.6 F12-4 and F12-5: the dialogs (`src/pages/tasks/TaskDialogs.tsx`)

- **New task and Edit task** (720 wide): the shared `Dialog`, `Field`, `invalidProps` and the one
  mutation hook every dialog submits through. About offers the kinds whose list the reader may read,
  then that kind's own list (the first 100, inactive ones marked); an edit keeps the task's record
  offered even beyond the first 100 or once deleted ("deleted record"), so an unchanged reference is
  kept (round 10, decision 1). A step's Person is `GET /api/tasks/people` with " (you)"; a step's
  person no longer offered stays shown on that step.
- **What is sent** is built by `createRequest` and `updateRequest`, which the tests read: the form as
  it is (a blank title goes blank; a step without a person goes with the empty identifier, so the API
  answers "Every step needs a person." rather than a binding error); an edit's every step with its id
  in the order shown; an instant the person did not touch as it was stored (T-009).
- **Where a refusal lands:** fields under their field; `steps[i].title`, `steps[i].responsibleUserId`,
  `steps[i].dueAtUtc` under that row's field, and `steps[i].id` on the row, found by where the row
  stood when it was sent (`stepMessage`), so a row moved after a refusal keeps its message;
  `steps` (more than 30) under the Steps section; the gone record under its select; `tasks.not_found`
  as "The change was refused" with the API's sentence (`taskRefusal`); `tasks.closed` and
  `tasks.creator_only` as the shared conflict and forbidden banners; `tasks.concurrency_conflict` as
  the stale banner with Refresh, which reloads the task and re-seeds the dialog.
- **Finish task** (500, ok tone): "Finish this task? It leaves everyone’s open list." or the warn note
  naming the open steps and "Finish anyway?", and the two consequences. **Cancel task** (520, mute
  tone): the optional Why, "Keep task" (the shared `Dialog` takes a `cancelLabel`), Cancel task.
- **Mark done and Undo** (`src/pages/tasks/StepAction.tsx`): offered exactly as `canMarkDone` /
  `canUndo` say; one request at a time through the app's submit gate; the answer or the refusal
  refreshes every task query; a refusal's API sentence stays under its step, the button stays for a
  retry.

### 2.7 Shared pieces extended (existing callers unaffected)

`EmptyState` (body optional), `RecordTabs` (`compact`), `RecordBanner` (body optional; `ok` and `mute`
tones in `record.module.css`), `Dialog` (`cancelLabel`), `RecordHeader` (`stackActions`), `rowNav`
(typed for any element, so the phone card opens its task as a row does).

### 2.8 Tests

**81 new tests.** Existing tests were changed only where they asserted the old ungated Tasks page or
its sample rows, as the run's rules allow, plus one catalogue extended. None was deleted, skipped or
weakened.

**The updated tests, each with its old and new expectation:**

| File | Test | Before | Now |
|---|---|---|---|
| `src/app/routes.test.ts` | "the pages open to every signed-in persona need nothing" | `/tasks` among them, needing nothing | `/overview`, `/needs-attention`, `/insurance-cases`, `/profile`; Tasks needs `Tasks.Use` (new tests below) |
| `src/app/routes.test.ts` | "a Viewer keeps the pages a Viewer reads and is refused the rest" | body unchanged; `/tasks` reachable because it needed nothing | body unchanged; `/tasks` reachable because the test's Viewer now holds `Tasks.Use`, as round 10's `GET /api/me` gives it. The persona `VIEWER` gained `Tasks.Use` (and with it the Fleet Manager and the Principal); `SYSTEM_ADMINISTRATOR` is built without it |
| `src/app/routes.test.ts` | "a Record deleter with no other role reaches the ungated pages and Delete records, nothing else" | reachable: overview, needs-attention, **tasks**, insurance-cases, delete-records, profile | the same without `/tasks` |
| `src/app/routes.test.ts` | "an account with no permission at all reaches only the ungated pages" | overview, needs-attention, **tasks**, insurance-cases, profile | the same without `/tasks` |
| `src/pages/followup10.render.test.ts` | "sees the Overview’s restricted states, as for any missing permission" | contains "Open tasks" (the sample card) | does not contain "Open tasks" (the Record deleter alone does not hold `Tasks.Use`); contains "Unresolved insurance cases" |
| `src/api/codes.test.ts` | "no entry names a code the backend does not have" (extended) | the backend catalogue of users, rentals, authorizations, interruptions, drivers, deletions, roles, email change | the same plus the 14 codes of round 10's `WorkTaskErrors.cs` |

**The new tests:**

| File | New | What they hold |
|---|---|---|
| `src/app/routes.test.ts` | 3 | Tasks and a task's page need `Tasks.Use` by any spelling; the three roles open them, the administrator, a Record deleter alone and nobody do not; the entry carries its count and is offered to a holder only; Insurance cases still offered to everyone |
| `src/format/tasks.test.ts` | 13 | every word of §2.2, the Tallinn day around midnight UTC, one and many |
| `src/api/taskRefusals.test.ts` | 5 | the API's own refusals read by the app: a step's fields with their index, the gone record under its select on both writes and nowhere else, not found as a refused change, closed, forbidden, stale; the mark refusals' sentences |
| `src/pages/followup12.render.test.ts` | 26 | the list's three views as Dita, Toms and Signe (header model, strip counts, zone, search, filter, rows in the API's order, cells, Your step with the API's rights, Done without an action, chips and Closed, every empty state, no results, the Due filter from the address); a task's page as creator and as a step's person, after a mark, overdue and due today, no steps, finished, cancelled with and without a reason, a deleted record, no read permission, not shared, not found; the Overview's tile and card for Dita and Toms before and after his mark, and for the administrator (no tile, no card, every task query disabled); the sidebar count; one prefix invalidates every task query; the tone rules last in the stylesheet |
| `src/pages/followup12.dialogs.render.test.ts` | 17 | New task's sections; About's lists per kind with inactive marked; a step row's Person with " (you)" and its buttons; the shape refusal on the title and the row; a step due after the task on that row only; the gone record and a kind without a record under the select; Edit opened on the task with the done step's line; a person no longer offered; the kept deleted record; the edit's refusals; not found; the stale banner; Finish with and without open steps; Finish refused; Cancel with Keep task, its Why refusal, Keep task enabled beside a stale record |
| `src/pages/followup12.phone.render.test.ts` | 6 | the cards (no table, each opening its task, Steps with its bar, Due or Closed in its tone, No due date, the pager, the compact strip); Involving me's steps with 44px actions; "Your steps" for two; Finished's chip and Closed; the count in the phone's drawer, none at zero |
| `src/pages/followup12.actions.test.ts` | 11 | what New task, Edit task and Cancel task send (blank title and no person as they are, times in UTC, ids in the order shown, a removed step absent, untouched instants as stored); a step's refusal found by the row sent; Mark done and Undo through their real hook and a stand-in transport: offered as the API says, the request path, every task query refreshed and nothing else, on success and on refusal; the one refresh prefix |

**How they are built.**

- The fixtures, `src/pages/followup12.support.ts`, are the joint check's own answers from the scratch
  API (§4.1), 70 of them, generated from its saved JSON and typed as the DTOs, so a member the API
  sends and `dto.ts` does not declare fails the typecheck.
- The seed's times follow the moment it was seeded, so each render test sets the clock to the moment
  the answers were given (`CAPTURED_AT`), and "Overdue" or "Due today" read as they did then.
- `src/pages/followup12.harness.ts` renders a page from a cache holding those answers, a refused read
  included (not shared, not found), and hands back the cache so a test can read what the page asked
  for and whether it was enabled.
- A server render runs no effect, so the page header's model is caught as the page hands it over, and
  the dialogs' one submit hook is replaced as in Follow-ups 10 and 11: it answers with the API's
  refusal a test names, read by the dialog's own `refusal` and `toFailure` under its own op.

## 3. Not implemented or partial

**Nothing of §12.** Every point is built and tested.

### 3.1 The steps that need a password typed into the app

The signed-in browser steps need the seed password typed into the sign-in page, which this run may not
do. They are left for the owner's reviewer (§5). What they would show was covered in three ways: through
the API as the same people (§4.1); rendered from those very answers by the real components (§4.2); and
in a browser, on the real pages with a stand-in transport answering from those answers (§4.3).

## 4. Verification: the joint check

Everything ran on the scratch stack only.

- **The scratch stack**, as `RWRentApi-wiring/Context/round10_report.md` §7 describes it: nothing ran
  on 5002 or 5174 at the start; `rwrent_check` did not exist. It was created, migrated (seven
  migrations, `V9WorkTasks` last) and seeded by round 10's Release build (work tasks 8, work task
  steps 11), and the API started on 5002 from `bin/Release` with
  `ApiSecurity__RecordDeleterEmailDomain=rwrent.example`, trusting `http://localhost:5174`. Every
  command sourced an environment script that refuses to run unless its connection string names
  `rwrent_check`. The backend worktree was built with `-c Release` only, at `1fd603b`, clean.
- **Guards.** The API client refuses any address but `localhost:5002`. The seed password came from
  the owner for this session and was passed in each command's environment; it is in no file.

### 4.1 Through the API — 44/44

`joint12.py`, in the run's scratchpad, as Dita Smite, Signe Priede, Toms Rudzitis, Karlis Zvaigzne and
the administrator, making every request the Tasks pages make:

- **who uses tasks:** the four hold `Tasks.Use`; the administrator does not and is refused the counts
  and the to-do list (403);
- **the seed as the pages read it:** Dita 4/1/1 with 4 to do, Signe 2/1/2 with 2, Toms 0/3/0 with 2;
  Toms's Involving me in the server's order by his own open step; a search that finds nothing; the
  search on "204 jlm" finding the record's text; Due Overdue finding the parking fine; the people
  Dita, Karlis, Signe, Toms;
- **the rights, as each reader reads them:** Toms on Prepare 204 JLM may mark Car wash only and change
  nothing; Dita, its creator, may change it, undo the done step and mark the rest; Karlis is refused
  Order two spare key fobs (`403 tasks.not_shared`); an unknown task is `404 tasks.not_found`;
- **a mark:** Toms marks Car wash (done by him, Undo offered), his count falls to 1 at once, marking it
  again is `409 tasks.step_already_done`, he undoes it and his count is back to 2;
- **a practice task created by Dita** about 119 MPR with steps for Toms and Signe: 201, hers to change;
  her My tasks, their Involving me and to-do counts follow; Toms marking Signe's step is
  `403 tasks.step_not_yours`; Dita marks Toms's step, and Toms undoing her mark is
  `403 tasks.mark_not_yours`, so he reads it done by Dita with neither action;
- **an edit** that renames and moves Toms's done step, gives Signe's to Karlis and adds a third: the
  mark stays, positions 1 to 3, a blank description is none;
- **the edit's refusals, each changing nothing:** a step due after the task (`400
  tasks.step_due_after_task` on `Steps[1].DueAtUtc`), a changed record that does not exist
  (`404 tasks.about_record_not_found`), Toms editing (`403 tasks.creator_only`);
- **a lost race:** two marks of the same task at the same moment, one `409 tasks.concurrency_conflict`;
- **finish** with steps open: Finished, those steps stay not done; a mark after it and a second finish
  are `409 tasks.closed`; it is under Finished for Dita, Toms and Karlis;
- **cancel:** the note kept trimmed; without a note, none;
- **a record deleted since:** a practice vehicle, a task about it, the vehicle deleted by the
  administrator on the deletions page: the task keeps the kind and the id, its label is none and
  `aboutRecordExists` false; an edit that keeps the reference is accepted.

The first run was 43/44: the one failure was the script's own expectation, which misspelled a seeded
title. Corrected, the check ran again on a freshly seeded database: **44/44**.

### 4.2 The screens, rendered from those answers

The fixtures of §2.8 are the first run's answers: the capture of the reads and the refusals
(`capture12.py`, which changes nothing) and the joint check's writes. After the database was seeded
afresh, both scripts ran again and every answer was compared with its fixture, member by member, once
the instants (which follow the moment of seeding) and the generated identifiers were set aside: **all
70 identical but one**, the practice task's finish, whose open steps depend on which of the two
simultaneous marks won the race, which differs from run to run by nature.

### 4.3 In a browser

- **The app on 5174**, started from this worktree with
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`, visited signed out
  in the app's built-in browser (no sign-in was made): `/tasks` sent the visitor to Sign in, and the only
  API request went to 5002 (`GET /api/me` → 401).
- **A preview on 5175, outside the repositories.** The real app from this worktree with a stand-in
  transport that answers from the fixtures of §4.2 as the chosen person (Dita, Signe, Toms, Karlis, the
  administrator); it sends nothing anywhere. Looked at:
  - at **1512**: My tasks, Involving me and the task's page with their columns (Task / Steps 170 /
    People 240 / Due 170; Involving me 150 / 290 / 200 / 170) and the 112px green bar; Mark done on a
    step, then Done with Undo; a refused mark's sentence under its step; Edit task (720), a step moved
    down keeping its "Done · …" line; the stale banner with Refresh and Save disabled; Finish task with
    its warn note, then the ok banner and the page read-only; the Overview's tile ("4 to do") and card;
  - at **834**: the folded band (107 / 206 / 121, People under Steps), the hero on two rows;
  - at **402**: the strip without icons, all three tabs fitting; the cards with 44px buttons; a tapped
    card opening its task; New task as the bottom sheet (radius 18 18 0 0), the refusal on the title
    and the step row, the title focused; the task's page with one fact per row and the three buttons
    one per row;
  - the **light theme**: a cancelled task's mute banner and the Involving me list;
  - the **administrator**: no Tasks entry, `/tasks` "Not available to you", no Open tasks on the
    Overview, and no tasks request in the stand-in's log;
  - After Create: the new task's page opens, its breadcrumb leading to My tasks;
  - no sideways scrolling at any width; no error or warning in the console.

  **Two look defects were found there and fixed**, neither visible to a server render:
  1. "Overdue" was drawn in the Due cell's grey: the cell's own colour came later in the stylesheet at
     the same specificity. The tone rules are now the stylesheet's last, and a test reads the file to
     keep them there (§2.8).
  2. At 834 the Your step cell (206px, the handover's) cut the due line beside the button ("Due 25
     Sep, 14:0"). In the folded band the action now moves under the step's text.

  The preview was stopped, and the two launch entries added for it and for 5174 to the workspace's
  launch file, outside the repositories, were removed again.

### 4.4 The planted breakages — 66 planted, 66 caught

Each breakage was written into a **copy** of the worktree outside it, never into the worktree, so the
owner's app on 5173 could not hot-reload one even for a moment. The whole suite ran on each, and the
file was restored byte for byte.

| | Breakage | | Breakage |
|---|---|---|---|
| A1 | the edit forgets the record's refusal | L10 | no-results reads as an empty view |
| A2 | a 404 never lands under a field | L11 | the search longer than the API takes |
| A3 | a 404 read with the create's table whatever the op | L12 | one step's label for several |
| A4 | the gone record becomes a banner | L13 | New task offered on the wrong empty view |
| A5 | a refused mark reads the title, not the sentence | L14 | Overdue asks for no due date |
| A6 | `Tasks.Use` not among the permissions | L15 | a row forgets its view |
| R1 | the list open to everyone again | L16 | Finished shows Due, not Closed |
| R2 | a task's page open to everyone | L17 | the tone rules lost |
| R3 | no count on the entry | P1 | actions for the creator of a closed task |
| R4 | the entry counts My tasks | P2 | " (you)" after everyone |
| R5 | the counts asked for without `Tasks.Use` | P3 | the banners' tones swapped |
| O1 | the tile without `Tasks.Use` | P4 | no words for no reason |
| O2 | the tile reads My tasks | P5 | a gone record still linked |
| O3 | the card in reverse order | P6 | linked without the record's read |
| O4 | no "from" on the card | P7 | not shared reads as not available |
| O5 | a row opens the list, not its task | P8 | retry offered on a task that is gone |
| O6 | the to-do list asked for without `Tasks.Use` | P9 | the creator's order called yours |
| L1 | Involving me reads another view | P10 | the hero loses Overdue and Due today |
| L2 | the rows re-ordered by the app | P11 | a gone record reads as nothing |
| L3 | every step offers its action | P12 | the breadcrumb forgets the view |
| L4 | the two rights swapped | D1 | the edit sends new steps (marks lost) |
| L5 | never "from" | D2 | a step without a person sent as text |
| L6 | three names before the rest | D3 | an untouched step date rounded |
| L7 | the bar filled wrong | D4 | a refusal placed by position, not by the row sent |
| L8 | the Due cell loses its tone | D5 | inactive records not marked |
| L9 | the Due filter is not a filter to clear | D6 | the kept record not offered |
| D7 | a person no longer offered dropped | D8 | finishing without naming the open steps |
| D9 | Cancel task closes with "Cancel" | D10 | an empty Why sent as text |
| D11 | no " (you)" among the people | D12 | a step title marks itself by hand |
| D13 | About offers two kinds | F1 | a write refreshes the counts only |
| F2 | a refused mark leaves the stale state | F3 | Undo sends a mark |
| F4 | the counts outside the prefix | U1 | the strip not compact |
| U2 | an empty paragraph in a bodiless banner | U3 | the ghost button's label fixed |

Two tests were strengthened after a first look at what they held, before the run: the Overview's tile
is also read for Toms (whose My tasks is 0 and to-do 2, where Dita's are both 4), and a card with two
of the reader's steps holds "Your steps". The request builders, the step message and the refresh were
made functions the tests call (§2.6), because a server render cannot submit a dialog.

### 4.5 The test suite, and each commit

- Typecheck green, `npm test` 468/468 (387 before), `npm run build` green.
- Each commit alone, in a clean copy outside the worktree (`git archive`, `node_modules` linked): the
  whole project typechecks with 0 errors and the full suite passes at every one of the six, with 387
  tests through the fourth, 390 at the fifth and 468 at the sixth.

### 4.6 The owner's side, untouched

- 5001 and 5173 were never opened, called or signed into, and run on the processes they had.
- `rwrent_v1`'s read-only fingerprint (every table's row count and a hash of its rows) is identical at
  the start and at the end; it still has six migrations and no task table.
- The backend worktree was only built in Release and run; its Debug output, which 5001 runs from, was
  not touched (`bin/Debug` still dated 2026-09-22).

### 4.7 End state

- The scratch API runs on 5002 **for the reviewer**, over `rwrent_check`, domain `rwrent.example`,
  **seeded afresh after every check of this run**: it holds the seed, with the prototype's eight tasks,
  and nothing since but the sign-ins of one last read of the counts (Dita 4/1/1 with 4 to do, Signe
  2/1/2 with 2, Toms 0/3/0 with 2, the administrator refused).
- My Vite on 5174 is stopped; the reviewer starts one as §5.0 says.
- The main checkouts are untouched. The worktree is clean, on `feature/backend-wiring`, and pushed.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. Start it from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173.
- **The people**, all with the seed password: Dita `dita.smite@rwrent.example` (Fleet Manager), Signe
  `signe.priede@rwrent.example` (Company Principal), Toms `toms.rudzitis@rwrent.example` (Viewer),
  Karlis `karlis.zvaigzne@rwrent.example` (Fleet Manager), the administrator `sysadmin@rwrent.example`.
- **Afterwards:** the steps write practice data to `rwrent_check` only; reseed it if a clean copy is
  wanted.

### 5.1 The steps

1. **The count.** As Dita: the sidebar's Tasks reads 4; the Overview's Open tasks tile reads 4 "to do",
   and the card lists Reassign the parking fine (Overdue, red), Handover, Pick up the repair invoice
   ("from Signe Priede") and Order two spare key fobs ("No due date").
2. **The list.** Tasks: My tasks 4, Involving me 1, Finished 1; four rows, the fine first with its
   Overdue date in red; "Times in Tallinn time." beside the tabs. Search `zzz`: "No results for these
   filters" with Clear filters. Due → Overdue: the fine alone.
3. **As a step's person.** As Toms: Tasks reads 2. Involving me: three rows, each "from" its creator;
   Tell the driver the time is Overdue with Mark done; Collect the photos is Done with Undo. Mark done
   on Car wash: the row shows Done and Undo, the count falls to 1 at once, and the Overview's card no
   longer lists it. Undo: back to 2.
4. **A task's page as a step's person.** Toms opens Prepare 204 JLM: no Edit, Finish or Cancel; "In the
   order the creator set."; "Toms Rudzitis (you)" on Car wash, the only step with Mark done; the
   breadcrumb leads back to Involving me.
5. **New task.** As Dita, New task: Create with nothing typed → "Enter a title for the task." under
   Title. Add a step and Create → the step's Title and Person say what they need. Fill it in: About
   Vehicle offers every vehicle, "660 BYH · Fiat Tipo · inactive" among them; a task Due before a step's
   Due → "A step cannot be due after the task." under that step. Create a valid one with a step for
   Toms: its page opens, and Toms's count goes up by one.
6. **Edit.** On Prepare 204 JLM, Edit: move Add to Bolt down; its "Done · Dita Smite, …" line moves
   with it; Save changes; the step is still done.
7. **Finish and cancel.** Finish task on Prepare 204 JLM: the warn note names the three open steps;
   Finish: the green banner "Finished by Dita Smite on …", no actions, no Mark done. Cancel task on
   another of her tasks with a Why: "Keep task" closes without a change; Cancel task shows the grey
   banner with the Why. Both are under Finished.
8. **Not shared.** As Karlis, open the address of Order two spare key fobs (copied from Dita's list):
   "This task is not shared with you".
9. **The administrator.** No Tasks entry; `/tasks` is "Not available to you"; no Open tasks tile or card.
10. **Phone width** (≤ 402 px): the tabs without icons, all three fitting; cards with 44px Mark done;
    New task as a bottom sheet; the task's page with one fact per row; nothing scrolls sideways.

## 6. Decisions needed

None. Choices made where §12 and the handover left room, each reversible in a line:

1. **The finished and cancelled banners name the task's last changer** (`updatedByDisplayName`). A
   closed task accepts no change, so its last change is its closing; the prototype named the creator,
   who is the same person by the API's rule.
2. **A step without a person is sent with the empty identifier,** so the API's own "Every step needs a
   person." answers; an empty string would have been refused by the request's binding in technical
   words.
3. **A refused edit of a task that no longer exists** reads "The change was refused" with the API's
   sentence, as a closed task's refusal does.
4. **A step's refusal follows its row** if the rows are moved after it.
5. **About offers the kinds whose list the reader may read** (a task's own kind always); the four roles
   that use tasks read all four. The record's link needs that record's read permission too.
6. **A change of view keeps the search and the Due filter** and starts at the first page; a task's page
   carries its view in the address (`?tab=involving`) so the breadcrumb leads back to it.
7. **The Overview's card lists the first 100 to-do items**, its count being the list's total; the tile
   shows "—" while the count loads.
8. **Mark done and Undo carry the step's title in their accessible name** ("Mark done: Car wash").
9. **In the folded band the Your step action moves under the step's text** (§4.3, 2).
10. **The dialog's step row** is the app's dialog card (`--surface-2` with the app's own fields), not the
    prototype's inset card with its custom select, so the fields read as every other dialog's.

## 7. Deviations: where the handover and the API differ, the API wins

1. **The search takes 50 characters**, the API's limit (the prototype allowed 100).
2. **The search reads the record's text, not the kind's word** (round 10, decision 4): "204 JLM" finds
   the task, "vehicle" alone does not.
3. **Dates are the app's own:** "04 Oct, 20:08" with the day in two digits, as everywhere in the app.
4. **No toasts.** After Create the page opens; after a mark the row changes; after Finish or Cancel the
   banner appears.
5. **The stale banner's second line** is the app's shared "Refresh to load the current values, then try
   again." (the prototype said "save again").
6. **The dialogs judge nothing before sending.** The prototype checked the title, the steps and the due
   dates itself; here each is the API's refusal, in the API's words, which are the prototype's.

## 8. Open risks

1. **The owner's app already runs this code.** 5173 hot-reloads from this worktree. With the round-9
   API on 5001 it shows no Tasks at all, as intended, until the reviewer upgrades 5001 (backup, then
   `V9WorkTasks`, then the round-10 build). After the upgrade, Tasks appears for every holder of
   `Tasks.Use` at once, with no app release needed.
2. **The count and the lists follow the reader's own writes at once**, and another person's at the
   next read (a page opened, a write made); nothing polls.
3. **Two simultaneous marks of one task** answer one of them with the concurrency refusal (round 10,
   decision 3); the app shows its sentence under the step, and the button stays for a retry.
4. **The About lists and the people list offer the first 100** records of a kind, as the new-rental
   dialog does; an edit keeps its own record offered beyond them.

## 9. Commits

On `feature/backend-wiring`, from `b0c0308`:

| Commit | Group | Files |
|---|---|---|
| `8a73732` | the API layer knows tasks | `src/api/dto.ts`, `src/api/tasks.ts` (new), `src/api/queryKeys.ts`, `src/api/client.ts`, `src/api/index.ts`, `src/api/codes.ts`, `src/api/problem.ts`, `src/api/codes.test.ts` (extended), `src/permissions/permissions.ts` |
| `ac3b89a` | the words of tasks | `src/format/tasks.ts` (new), `src/format/index.ts` |
| `b669aad` | the shared pieces the pages need | `src/ui/EmptyState.tsx`, `src/ui/RecordTabs.tsx`, `src/ui/record.module.css`, `src/ui/Dialog.tsx`, `src/ui/RecordHeader.tsx`, `src/ui/RecordHeader.module.css`, `src/ui/rowNav.ts` |
| `0c04526` | the Tasks pages and dialogs | `src/pages/tasks/` (new): `Tasks.tsx`, `TaskRecord.tsx`, `TaskDialogs.tsx`, `StepAction.tsx`, `taskAddress.ts`, `Tasks.module.css`, `TaskRecord.module.css`, `TaskDialogs.module.css` |
| `a71ce3a` | Tasks takes its place in the app | `src/app/routes.tsx`, `src/app/AppShell.tsx`, `src/pages/overview/Overview.tsx`, `src/pages/overview/Overview.module.css`, `src/pages/overview/sample.ts`, `src/pages/simple/Placeholders.tsx`, `src/app/routes.test.ts`, `src/pages/followup10.render.test.ts` |
| `c2e62e6` | the tests, from the scratch stack's answers | `src/pages/followup12.support.ts`, `src/pages/followup12.harness.ts`, `src/pages/followup12.render.test.ts`, `src/pages/followup12.dialogs.render.test.ts`, `src/pages/followup12.phone.render.test.ts`, `src/pages/followup12.actions.test.ts`, `src/format/tasks.test.ts`, `src/api/taskRefusals.test.ts` (all new) |
| this one | the report | `Context/wiring_report.md` |
