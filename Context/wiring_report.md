# Frontend Wiring: Follow-up 19, the app's half of round 14

> Follow-up 19 (`Context/wiring_followups.md` §19): Add an insurer always in view at the foot of a
> case's insurer picker (F19-1), and the insurance cases on the Delete records page (F19-2), built on
> the backend's round 14 (`RWRentApi-wiring/Context/round14_report.md` §5, the contract). Frontend
> only; the backend was not changed and not rebuilt, only run from its round 14 Release build. On
> `feature/backend-wiring` in this worktree (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the
> reviewer fast-forwards `main` after verification. Written 2026-09-30. It replaces Follow-up 18's
> report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173 or 5174, never signed in
> anywhere, never called 5001 or 5002, never read or wrote `rwrent_v1` or `rwrent_check`, and never
> read Mailpit.
>
> - Both of the owner's apps hot-reload from this worktree, so they showed this run's code as it was
>   written (§8, item 1).
> - **Their APIs are older than round 14.** The owner's API on 5001 answers round 11 and the practice
>   API on 5002 round 13. Until the reviewer upgrades them, the new Insurance cases tab on the Delete
>   records page shows no count, and its list shows its error, "The records could not be loaded" with
>   "Not Found" and Retry (§8, item 2). Everything else on that page works as before.
> - Every live check used this run's own stack: round 14's API on 5003 over `rwrent_r14`, re-created
>   and seeded twice (§4.1), and this run's Vite on 5176 against it.
> - **For the owner's reviewer: §5 lists the signed-in steps, on 5176 against 5003.**

## 1. Summary

- **F19-1, Add an insurer always in view.** The open picker's list still scrolls within 244 px, but
  Add an insurer now stays at its foot, over an opaque ground, whatever the list's length. Only Not
  chosen and the insurers scroll above it, and the line the arrows reach always comes into view above
  the foot, not under it. It is still the list's last option, reached last with the keyboard, and it
  opens the Add insurer window as before.
  - Measured with twelve insurers at 1512 px: without the fix, Add an insurer lay 202 px below the
    list's bottom edge. Now it sits on that edge, and each of the twelve insurers reached with the
    arrows stood clear above it. The same held at 402 px, where a line is 44 px.
- **F19-2, insurance cases on the Delete records page.**
  - **A seventh tab, Insurance cases**, last, with the navigation's shield and its count. Its search
    reads "Plate, damage, driver, insurer or claim". Out of use lists the closed cases, and its empty
    list names the open insurance cases under Everything.
  - **Each case** shows its label linked to the case, with its type and when it happened or was found
    under it; its status with the cases list's chip; when it was closed, or nothing while it is open;
    and the Deletion cell. On the phone it is a card titled with the label.
  - **An open case** is Blocked with "This insurance case is open. Close it first; then it can be
    deleted", with nothing linked beside it, and its Delete does nothing.
  - **What a deletion takes**, each only when not zero: "Takes 2 events, 1 note and 2 photos with it"
    and "Clears the accident link of 1 insurance case".
  - **The delete window** has its description line, its consequences with the numbers, the audit line
    and the tick's hint. After the deletion, the confirmation line gives the answer's counts.
  - **A car's** row, window and confirmation line also say, when not zero, how many cases of other
    cars lose their accident link.
  - **The security audit** names the event "Insurance case · Deleted" and its entity Insurance case,
    and reads the copy as it reads a car's cases: the case's facts, its photos, its events with theirs,
    its notes, and the cases that lost their link.

| | |
|---|---|
| Commits | four `Wiring 49` commits and this report's `Wiring 50`, on `feature/backend-wiring` (§9) |
| Tests | 710 → **742**, all green: 32 new; 4 existing tests changed on purpose, and the backend's two catalogues one test file reads (§2.6) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the four (§4.5) |
| Planted breakages | **40 planted, 40 caught** on the final code; the first run caught 39, and the one missed made a test stronger (§4.4) |
| Joint check | **21/21 twice**, each on a freshly seeded `rwrent_r14` through 5003 (§4.2) |
| In a browser | the real pages at 1512, 1024, 834 and 402 px from a stand-in transport; the app on 5176 signed out against 5003 (§4.3) |

## 2. Implemented

### 2.1 F19-1: the picker's foot (`src/pages/insurance/InsurerPicker.module.css`)

- **Add an insurer** (`.add`) is `position: sticky; bottom: 0` inside the scrolling list, with
  `z-index: 1`, the popover's own ground `var(--surface)`, and a 4 px shadow of that ground over its
  4 px of space above the rule, so no insurer shows through as it scrolls under.
- **The list** (`.options`) keeps its 244 px and gains `scroll-padding-bottom`: 38 px, the foot's
  34 px line and its 4 px of space; 48 px on the phone, where a line is 44 px. The arrows bring the
  line they reach into view with `scrollIntoView({ block: 'nearest' })`, which honours that padding,
  so the line stops above the foot.
- **Nothing else changed.** The markup is the same: one listbox, Add an insurer its last option, with
  the same keys and the same window. Every picker test of Follow-up 18 passes unchanged.

### 2.2 F19-2: the contract (`src/api`)

- `dto.ts`:
  - `DeletableKind` is now every `RecordKind`, the insurance case included. Every table keyed by it
    therefore had to gain a seventh entry, and the typecheck listed each one.
  - The block reason `InsuranceCaseIsOpen` (9).
  - `RecordDeletionTakes` gains `insuranceCaseEvents`, `insuranceCaseNotes`, `insuranceCasePhotos`
    and `accidentLinksCleared`.
  - The new `InsuranceCaseDeletionCandidateResponse`, with the eleven members round 14 sends.
  - `RecordDeletionCandidateCountsResponse.insuranceCases`.
  - `RecordDeletionResponse` gains `deletedInsuranceCaseEventCount`, `deletedInsuranceCaseNoteCount`,
    `deletedInsuranceCasePhotoCount` and `clearedAccidentLinkCount`.
  - The new members are optional, as round 12's are: an older API does not send them, and they read
    as 0, or as no count on the tab.
- `recordDeletions.ts`: the candidate list of kind 7 is `candidates/insurance-cases`.

### 2.3 F19-2: the tab and its rows (`src/pages/admin/DeleteRecords.tsx`, `DeleteRecords.module.css`)

- **The tab**: slug `insurance-cases`, label Insurance cases, icon `shield` (the navigation's), count
  `insuranceCases`, search placeholder "Plate, damage, driver, insurer or claim". Show, Clear filters,
  the pages and Refresh work as on the other tabs.
- **The table**, with the vehicles' floor of 1020 px:

  | Column | From 1024 | Folded band (768–1023) | What it holds |
  |---|---|---|---|
  | Case | the rest | the rest | the label, linked to `/insurance-cases/:id`; under it the type and "Happened" or "Found" with the day, the cases list's own line |
  | Status | 132 px | 120 px | the cases list's chip |
  | Closed | 118 px | 84 px | the day it was closed, in the page's dim mono; empty while open |
  | Deletion | 300 px | 213 px | the verdict, the block sentence, what a deletion takes |

  Status is as wide as the cases list's at every band, not 71% of it, so its widest chip, Under
  review, stays whole (§6, item 1).
- **The phone card**: titled with the label, not in the plate's mono, and opening the case. Its line
  under the title gives the type and time. Its verdict sits top right. Its facts are Status, and
  Closed once closed. Then the block sentence or what goes, and Delete across the card. The title
  takes the lines it needs, as the cases list's card does; the other six kinds keep their one cut
  line (§6, item 3).
- **An open case** is Blocked with reason 9. The API names no record for it, so nothing is linked
  beside the sentence; the row itself opens the case.
- **The empty list under Out of use** reads "11 open insurance cases are under Everything.", with
  Show everything.
- Recently deleted already named kind 7 "Insurance case".

### 2.4 F19-2: the words (`src/format/recordDeletion.ts`, `src/pages/admin/DeleteRecordDialog.tsx`)

- **The block sentence**, reason 9: "This insurance case is open. Close it first; then it can be
  deleted", the API's own sentence without its full stop, as the page writes every block. The
  disabled Delete's title carries it with the full stop.
- **What goes**, in the page's words, each only when not zero:
  - a case: "Takes 2 events, 1 note and 2 photos with it. Clears the accident link of 1 insurance
    case";
  - a car: "Takes 1 insurance case with it. Clears the accident link of 1 insurance case".
- **The delete window of a case:**
  - its line: "770 HDV · Practice: front left door scratched · Usual · Closed 30 Sep";
  - its consequences:
    1. The insurance case is removed permanently.
    2. Its 2 events, 1 note and 2 photos are removed with it. Or, when there are none: Nothing else
       goes with it.
    3. Its car, driver, insurers and every other case stay as they are.
    4. The 1 insurance case that names it as the same accident loses that link and stays. For many:
       "The 2 insurance cases that name it as the same accident lose that link and stay." Left out
       when none does.
    5. The audit line every kind ends with.
  - the tick's hint: "This insurance case and the 2 events, 1 note and 2 photos cannot be restored
    from the app."
- **A car's window** gains, after its cases: "The accident link of 1 insurance case of another car
  is cleared; that case stays." For many: "The accident links of 3 insurance cases of other cars are
  cleared; those cases stay."
- **The confirmation line**, from the answer's counts: "Insurance case deleted: 770 HDV · Practice:
  front left door scratched. 2 events, 1 note and 2 photos went with it. The accident link of 1
  insurance case was cleared. Written to the security audit." A car's line gains the same last
  sentence. An answer without round 14's members reads exactly as before.
- **What a case's deletion refreshes**: the page, the audit, the Overview, the cases, and the
  insurers, whose list counts the cases each insurer handles and names.

### 2.5 F19-2: the security audit (`src/format/labels.ts`, `auditPayload.ts`, `src/pages/audit/AuditEntry.tsx`)

- **The names.** The event catalogue gains `InsuranceCase.Deleted`, read as "Insurance case ·
  Deleted" and offered in the Event type filter. The entity `InsuranceCase` is named Insurance case.
  Without it, the entry's Entity and the list's chip would have shown the raw `InsuranceCase`.
- **The copy.** A case deleted on its own holds the case itself at the top of the entry's copy, with
  its `Photos`, `Events` and `Notes`, and `ClearedAccidentLinks`. The reading of one case moved into
  its own `caseOf`, which reads a car's cases as before and now also this copy. Any other list at the
  top still falls back to the raw payload, as does a car's copy with a case's lists at its top.
- **The entry** shows, after Deleted record, three panels: Deleted photos (the photos the case was
  registered with), Deleted events (each event with its photos under it) and Deleted notes. Then
  Cleared accident links, which says "These cases named the deleted case as the same accident; the
  links were cleared and the cases stay." A car's entry keeps its own words, "These cases of other
  cars named a deleted case as their accident's".

### 2.6 Tests

**32 new tests, 4 existing ones changed on purpose**, and the backend's two catalogues that
`format/labels.test.ts` reads (710 → 742, 63 → 67 files). None was deleted, skipped or weakened.

**The tests changed on purpose:**

| Test | Before | Now |
|---|---|---|
| `api/recordDeletions.test.ts` · "each kind reads its own candidate list" | six paths | seven, `insurance-cases` last |
| same file · "a cascade makes stale what went with the record…" | the page's three keys checked for the six kinds but an insurance case | for all seven kinds |
| `format/recordDeletion.test.ts` · "every kind ends with the audit line…" | the six kinds but an insurance case | all seven |
| `pages/followup17.deletions.render.test.ts` · "its refused deletion is worded by the API itself; a case is never offered as a kind to delete", renamed "…; since round 14 a case is a kind of its own, the seventh tab (Follow-up 19)" | six tabs, none of them Insurance cases | seven, the last Insurance cases with the shield and no count, since round 12's counts hold none; round 12's refusal of the kind is still read as that API gave it |
| `format/labels.test.ts` · the backend's catalogues | its event types and entity types as before | with `InsuranceCase.Deleted` and `InsuranceCase`, which round 14 writes |

**The new tests:**

| File | Tests | What they hold |
|---|---|---|
| `pages/followup19.picker.render.test.ts` | 5 | F19-1: the foot's rules; the scroll padding equal to the foot's height on the desktop and the phone; twelve insurers with Add an insurer the last option; the keys reaching it last; a short list and a reader who may not add, as before |
| `pages/followup19.deletions.render.test.ts` | 17 | the tab, its count, search and columns; Out of use; the empty list; the search; an older API without count and with its error; a closed row, a found one and an open one; the Blocked sentence with nothing linked and its disabled Delete; the takes; the refusals; the Status column's widths; what a deletion refreshes; the window's line, consequences and hint, singular and plural; the confirmation line; a car's row, window and line |
| `pages/followup19.phone.render.test.ts` | 5 | the cards: each titled with its label and opening its case, the title wrapping; a closed card and an open one; only a case's title wraps; Recently deleted's card |
| `pages/followup19.audit.render.test.ts` | 5 | Recently deleted names the kind; the event's and entity's names and the filter; the entry's panels, each read on its own; the copy's shape and its fallbacks; a car's entry keeps its words |

**The fixtures**, `pages/followup19.support.ts`, are round 14's answers from the joint check's first
run (§4.2), typed as the DTOs, so a member the API sends and the types do not declare fails the
typecheck:

- the case list at Out of use, at Everything, and searched for "baltic";
- the counts at both;
- the vehicle list with the practice car;
- the refusal of an open case;
- the practice case's answer, the same deletion refused again, and its entry;
- the practice car's answer and its entry;
- Recently deleted.

## 3. Not implemented or partial

Everything §19 asks for is built. This run could not type the seed password into the app, so the
steps that need it are in §5 for the reviewer.

## 4. Verification

### 4.1 The stack

- **The API.** At the start, round 14's API ran on 5003, pid 82368, over `rwrent_r14`, as round 14's
  acceptance and the reviewer's 28 checks left it.
  - This run used round 14's own scripts, copied into its scratchpad. They refuse any connection
    string that does not name `rwrent_r14`, or that mentions `rwrent_v1`, `rwrent_check` or
    `rwrent_r13`. They stop only a process listening on 5003 that runs from the backend worktree's
    `bin/Release` with `5003` on its command line.
  - With them, `rwrent_r14` was dropped, recreated, migrated as it is (`V11Insurers` last) and
    seeded: seven cases, two of them Closed, and four insurers. The API was started on 5003, pid 7134.
  - This was done twice: before the fixtures were captured, and again before the joint check's second
    run, pid 28391.
  - The backend worktree was not changed and not rebuilt. It is clean at `6239393`, and its
    `bin/Release` is round 14's build.
- **The seed password** was passed through each command's environment only. It is in no file,
  script, log or report.
- **The app.** This run's Vite ran on 5176 from this worktree, with
  `VITE_API_BASE_URL=http://localhost:5003`. It was started from a launch entry outside both
  repositories, which is now removed.
- **The harness.** The real pages were served on 5175 from a folder outside both repositories,
  answered by a stand-in transport that sends nothing anywhere (§4.3).

### 4.2 Through the API, 21/21 twice

A script ran as the seeded people against 5003 only: Dita and Karlis to make the practice records, the
administrator for the deletions page, Signe for the audit.

| Checks | What was proved |
|---|---|
| 1–2 | the setup: Dita's practice case on 770 HDV, registered with a photo, given a note and an event with a photo, then Closed, and a casco case of the same car naming it; Karlis's practice car P19 26C with a case, Closed, which a practice case of 444 WKS names as the same accident |
| 3–4 | Out of use lists the four closed cases, all Ready; Everything lists eleven, the seven open ones Blocked with reason 9, count 1 and no records |
| 5–7 | the takes: the practice case 2 events, 1 note, 2 photos and 1 link; P19 26C's case 1 link; 204 JLM's open case 2 events, 1 note and 2 photos |
| 8–9 | the search "baltic" finds the four cases that name Baltic Mutual; the counts, 4 and 11, agree with the lists |
| 10–11 | P19 26C is Ready, takes its case and clears the link of 1 case of another car; 770 HDV clears none, since only its own casco case names its practice case |
| 12 | 204 JLM's open case is refused 409 `record_deletions.blocked` with the sentence |
| 13–14 | the practice case deleted: 200 with 2 events, 1 note, 2 photos and 1 link, no case of a car; the same deletion again 404 `record_deletions.not_found` |
| 15–17 | Signe reads the `InsuranceCase.Deleted` entry, written against the case; its copy holds 1 registration photo, 2 events with 1 photo between them, 1 note, the casco case's link and no picture; the casco case stays and names no accident |
| 18–19 | P19 26C deleted: 1 case with it and 1 link cleared; its entry names 444 WKS's practice case |
| 20–21 | Recently deleted lists the car, then the case of kind 7; the counts at the end, 9 cases and 10 vehicles |

The first run's answers are the repository's `followup19.support.ts`. The second run, on a fresh seed,
passed the same 21 checks, and its answers had the same members as the first run's, compared member by
member. Then the script made the setup once more, for §5. Neither API log holds a failure or a 500;
each holds the two query notes of older code that round 14's report names.

### 4.3 In a browser

**The real pages** came from the app's own code in this worktree, served on 5175 by a stand-in
transport. It answers from the recorded answers of §2.6 and sends no request anywhere. It keeps the
deletions page's lists in the page's memory, so a deletion can be tried and its row leaves. The
built-in browser pane was used, never the owner's browser. After each resize the page was reloaded
before measuring.

- **F19-1, the picker, with twelve insurers**, in Register case, at 1512 px:
  - The list is 244 px, holding 480 px of lines. Add an insurer sits at 729.8–763.8 px, on the list's
    bottom edge at 763.8. With its fix taken off in the page, it lay at 965.8 px, 202 px below that
    edge.
  - ArrowDown from Not chosen to Add an insurer: each insurer stood clear above the foot, its bottom
    at 725.8 px, 4 px above the foot's rule. The list scrolled from 32 px to 236 px, and Add an
    insurer came last. ArrowUp back to Not chosen: each line in view, the list back at 0.
  - At 402 px: the foot is 44 px and the padding 48 px. All twelve insurers stood clear, and Add an
    insurer came last.
- **The tab's table:**

  | Width | Case, Status, Closed, Deletion, actions | Rows | Sideways |
  |---|---|---|---|
  | 1512 | 529, 132, 118, 300, 123 px | 68–124 px | none |
  | 1024 | 347, 132, 118, 300, 123 px | 68–124 px | the table scrolls 108 px inside its 912 px frame, exactly as the Vehicles tab does (§8, item 3); the page itself does not |
  | 834 | 255, 120, 84, 213, 118 px | 80–120 px | none; the widest chip, Under review, is 101 px within its 120 |
  | 402 | eleven cards, none wider than 358 px | | none |

- **Found and fixed: the phone card's title was cut to one line.** With an ellipsis, "444 WKS ·
  Practice: the other car…" hid what was damaged, which is what tells two cases of one car apart. A
  case's card title now wraps, as the cases list's card does: two lines each at 402 px, none cut.
- **The delete window** of the practice case read as §2.4 gives it. Practice or test record, the tick
  and Delete permanently then gave the confirmation line with its counts. The row left the list, the
  tab's count went from 11 to 10, and Recently deleted listed "Insurance case · 770 HDV · Practice:
  front left door scratched" first. The line's link opened the entry: Insurance case · Deleted, Entity
  Insurance case, the Record line, then Deleted record, Deleted photos, Deleted events with Event 1's
  photo under it, Deleted notes, Cleared accident links, Reason and Raw payload.
- **P19 26C's window** read its case and "The accident link of 1 insurance case of another car is
  cleared; that case stays."
- **The tab strip** scrolls at 834 and 402 px. Opened straight on the seventh tab, the tab stands
  partly past the strip's right edge (§8, item 4).
- **The console** showed no error from the app.
- **The app on 5176**, signed out, against 5003:
  - `/delete-records?kind=insurance-cases` went to Sign in.
  - Its only API requests went to `http://localhost:5003/api/me`, which answered 401, as expected
    when signed out.
  - It asked nothing of 5001 or 5002, and showed no module error.

### 4.4 The planted breakages: 40 planted, 40 caught

Each breakage changed one rule in a copy of the app outside the worktree, since the owner's apps
hot-reload the worktree. The whole suite ran there, 742 tests, and the file was then written back.

| # | The breakage | Caught |
|---|---|---|
| D1 | Add an insurer scrolls away with the list again | yes |
| D2 | the arrows' line may stop under the foot | yes |
| D3 | the foot's ground is see-through | yes |
| D4 | on the phone the arrows' line may stop under the taller foot | yes |
| D5 | the tab loses the navigation's shield | yes, 4 tests |
| D6 | the tab shows the vehicles' count | yes, 3 |
| D7 | the tab's search reads the vehicles' words | yes |
| D8 | the empty list names closed cases under Everything | yes |
| D9 | the tab reads the vehicles' list | yes |
| D10 | an older API's missing count reads as 0 | yes, 2 |
| D11 | the label opens the car, not the case | yes, 3 |
| D12 | the line under the label loses its type and time | yes, 2 |
| D13 | the status chip in one tone for every status | yes |
| D14 | an open case shows a date under Closed | yes |
| D15 | Status at 71% in the folded band cuts Under review | yes |
| D16 | a case's card title is cut to one line again | yes |
| D17 | an open case's card shows Closed with a dash | yes |
| D18 | reason 9 goes unworded | yes, 3 |
| D19 | reason 9 worded as a vehicle's | yes, 3 |
| D20 | a case's events are not counted | yes, 8 |
| D21 | the accident links are not said | yes, 4 |
| D22 | photos are counted as notes | yes, 8 |
| D23 | a case's parts leave every list | yes, 7 |
| D24 | the window's line reads the status, not Closed with the date | yes |
| D25 | the window forgets the cases naming it | yes, 2 |
| D26 | the window forgets what stays | yes, 2 |
| D27 | the window's parts line counts one thing as many | yes |
| D28 | a case's deletion refreshes no case | yes |
| D29 | a case's deletion leaves the insurers' counts stale | yes |
| D30 | the confirmation line forgets the events | yes |
| D31 | the confirmation line forgets the cleared links | yes, 2 |
| D32 | a car's window forgets the links of other cars' cases | yes |
| D33 | a car's window words the links as a case's | yes |
| D34 | the event reads "Insurance Case · Deleted" | yes, 2 |
| D35 | the entity reads InsuranceCase | yes, 3 |
| D36 | the case's copy falls back to the raw payload | yes, 2 |
| D37 | the case's registration photos are not read | yes, 2 |
| D38 | the entry shows an event without its photos | yes, after its test was made stronger |
| D39 | the entry says other cars for a case's own links | yes |
| D40 | a vehicle's copy with a case's lists at its top is accepted | yes |

- **D38 was not caught in the first run.** The entry's test looked for the event's photo anywhere on
  the page, and the Raw payload panel below names it too. The test now reads each panel on its own,
  and checks that the photo stands under its event (`6e66bf4`). The final run, on the final code,
  caught all 40.
- **What only a browser shows**: that the foot stays in view as the list scrolls, and where the
  arrows' line stops. The suite holds the rules that do it, D1 to D4, and the browser measured the
  result (§4.3).

### 4.5 The test suite, and each commit

- **The final state:** `npm run typecheck` clean; `npm test` **742 passed in 67 files**; `npm run build`
  built, with the chunk-size warning the build has had since before this run.
- **Before the run** (`302fb5e`): typecheck clean, 710 passed in 63 files.
- **Each commit alone**, exported with `git archive` so nothing untracked came along, and run with the
  worktree's `node_modules`. Every one had 0 type errors and the whole suite green:

  | Commit | Tests |
  |---|---|
  | `e3a3ccb` | 715 |
  | `3bc73ad` | 737 |
  | `9112e69` | 742 |
  | `6e66bf4` | 742 |

### 4.6 The owner's side, untouched

- **The owner's apps and APIs** ran throughout on their own processes, and this run sent no request
  to any of them. It read who listens on each port with `lsof`.

  | Port | Process | Started |
  |---|---|---|
  | 5001, the owner's API | pid 7505 | 2026-09-25 07:41 |
  | 5002, the practice API | pid 96963 | 2026-09-29 09:10 |
  | 5173, the owner's app | pid 24831 | 2026-09-16 07:58 |
  | 5174, the practice app | pid 58932 | 2026-09-27 12:33 |

- **The databases.** Only `rwrent_r14` was addressed. `rwrent_v1` and `rwrent_check` were never
  addressed, and `rwrent_r13` was left as it was.
- **The backend worktree** is clean at `6239393`. It was only run, never built or changed. The main
  checkouts were not touched.
- **Mailpit** was not read.

### 4.7 End state

- **The API on 5003 is left running**, pid 28391, started 2026-09-30 15:30:44, from the backend
  worktree's `bin/Release`, over `rwrent_r14`. It holds the seed, the joint check's second run and the
  practice records made for §5 (§5.0).
- **Nothing else runs.** This run's Vite on 5176 and its harness on 5175 are stopped, and nothing
  listens on either port. The workspace's launch entries are as they were before the run.

## 5. For the owner's reviewer: the signed-in steps

### 5.0 Before and after

- **The stack as this run leaves it:** the API on 5003 over `rwrent_r14`.
  - **Thirteen insurance cases, four of them Closed:**
    - the seed's 400 NDP and 119 MPR;
    - **"770 HDV · Practice: front left door scratched"**, Closed. It has a registration photo, a
      note, an event with a photo and its closing event, and a casco case of the same car names it;
    - **"P19 26C · Practice: the bonnet dented"**, Closed, with a photo. A practice case of 444 WKS
      names it as the same accident.
  - **The open ones:** the seed's five and four practice cases. Two practice cases appear twice each,
    "444 WKS · Practice: the other car of the same accident" and "770 HDV · Practice: the casco claim
    of the same door": the older one of each is from the second run, whose deletions left it naming
    nothing.
  - **Eleven vehicles**, among them the practice car **P19 26C · Fiat Panda 2020**, Ready.
  - **Recently deleted:** the second run's P19 26C and its practice case of 770 HDV, by Arturs
    Veidenbaums.
  - **The seed's four insurers.**
- **Start Vite on 5176 from this worktree.** The API trusts only that origin:
  `VITE_API_BASE_URL=http://localhost:5003 npm run dev -- --port 5176 --strictPort`
- **Use a browser profile of its own**, never the owner's. The apps on 5173, 5174 and 5176 share
  `localhost`'s cookies, so signing in on 5176 in the owner's profile signs the owner out of 5173.
- **The seeded people**, all with the seed password:
  - the administrator, Arturs Veidenbaums (`sysadmin@rwrent.example`), who may delete records;
  - Dita Smite, Fleet Manager;
  - Signe Priede, Company Principal, who reads the audit.

### 5.1 At 1512 px

1. **Sign in as the administrator and open Delete records.** Seven tabs; the last is Insurance cases,
   with the shield and 13.
2. **Insurance cases.**
   - Thirteen cases. The search box reads "Plate, damage, driver, insurer or claim".
   - Show Out of use: four cases, all Ready, and the tab reads 4. Clear filters.
3. **The practice case of 770 HDV, front left door.**
   - Its label is a link, with "Usual · Happened 28 Sep" under it.
   - The Closed chip, the day it was closed, and Ready.
   - "Takes 2 events, 1 note and 2 photos with it. Clears the accident link of 1 insurance case".
4. **204 JLM · Windscreen cracked by a stone.**
   - Blocked, with "This insurance case is open. Close it first; then it can be deleted" and nothing
     linked beside it.
   - Its Delete does nothing, and its title gives the same sentence.
   - "Takes 2 events, 1 note and 2 photos with it".
5. **Click the practice case's label.** The case's page opens, with no delete button on it. Of the
   two cases "770 HDV · Practice: the casco claim of the same door", note the one whose page lists
   the practice case under Same accident. Go back.
6. **Delete on the practice case.**
   - The window's line: "770 HDV · Practice: front left door scratched · Usual · Closed 30 Sep".
   - The five consequences of §2.4, and the tick's hint naming the 2 events, 1 note and 2 photos.
   - Choose a reason, tick, and Delete permanently. The confirmation line reads: "Insurance case
     deleted: … 2 events, 1 note and 2 photos went with it. The accident link of 1 insurance case was
     cleared."
   - The row leaves, the tab reads 12, and Recently deleted lists it first.
7. **That casco case**, on Insurance cases: its page has no Same accident panel any more. It stays,
   and only its link was cleared.
8. **The confirmation line's link**, or Recently deleted's: the entry.
   - Its title and Event read "Insurance case · Deleted"; Entity reads Insurance case.
   - The panels: Deleted record, Deleted photos, Deleted events with the first event's photo under
     it, Deleted notes, and Cleared accident links naming the casco case, with "These cases named the
     deleted case as the same accident".
9. **Vehicles, P19 26C.**
   - "Takes 1 insurance case with it. Clears the accident link of 1 insurance case".
   - Delete: the window says its 1 insurance case goes with it, and that "The accident link of 1
     insurance case of another car is cleared; that case stays."
   - Delete it. The confirmation line ends "1 insurance case went with it. The accident link of 1
     insurance case was cleared."
10. **Security audit, as Signe.** The Event type filter offers "Insurance case · Deleted". It finds
    the case's entry, whose Entity chip reads Insurance case.
11. **A case reopened after the list loaded.**
    - As the administrator, open Insurance cases on Delete records.
    - In another tab, as Dita, add an event that reopens "400 NDP · Right mirror broken by a passing
      van".
    - Back on the first tab, Delete it and confirm. The window says "This insurance case is open.
      Close it first; then it can be deleted." with Refresh. Refresh shows it Blocked.
12. **The picker, as Dita.**
    - On the Insurers page, add three practice insurers. Six are then in use, and their lines need
      more than the list's 244 px.
    - Register case: open Our insurer. **Add an insurer stands at the foot of the list, in view,
      before any scrolling.**
    - Scroll the list: the insurers pass under it.
    - With the arrows, go to the last insurer: it stands above the foot, whole. One more ArrowDown
      reaches Add an insurer, and Enter opens the Add insurer window with what was typed.
    - Do the same in Safari on the Mac, with the keyboard (§8, item 6).
    - Cancel both windows.

### 5.2 On the tablet and the phone

1. **At 834 px**, on Insurance cases: the table folds to Case, Status, Closed and Deletion, and
   nothing scrolls sideways. Under review's chip is whole on 552 KLM's case.
2. **At 402 px:**
   - Each case is a card whose title is the whole label, on as many lines as it needs.
   - An open case's card gives the sentence in the warn ink, with nothing linked, and Delete across
     the card does nothing.
   - A closed case's card gives Status and Closed.
   - Recently deleted's cards name "Insurance case · …".
3. **On the iPhone, the picker** with those six insurers: Add an insurer stands at the foot as the
   list opens, and stays there while a finger scrolls the insurers under it. A tap on it opens the
   Add insurer window.

## 6. Decisions

Choices this run made where the specification left room, each small to change:

1. **Status is 132 px, and 120 px in the folded band**, as the cases list's is. The page's other
   columns fold to 71%, which would leave 94 px and cut Under review, 101 px wide.
2. **Closed holds the day alone**, "30 Sep", in the page's dim mono as its periods are. The column's
   head says what it is.
3. **A case's phone card title wraps**, as the cases list's card title does. What is damaged is what
   tells two cases of one car apart, and on one cut line it was lost. The other six kinds keep their
   one cut line.
4. **The words §19 did not give**, in the page's existing voice:
   - the window's second, third and fourth consequences, and "Nothing else goes with it." for a case
     with no events, notes or photos;
   - a car's line for the links, "The accident link of 1 insurance case of another car is cleared;
     that case stays.";
   - the confirmation's "The accident link of 1 insurance case was cleared.", as it says "The driver
     link of 1 customer record was cleared.";
   - the empty list's "11 open insurance cases are under Everything.".
5. **An open case's window line would read its status**, "Casco · Repair". An open case never
   reaches the window, since its Delete does nothing.
6. **The picker's foot is sticky inside the one list**, rather than a second list under it. The
   listbox, its keys, its ids and every test of Follow-up 18 stay as they were. The scroll padding is
   what keeps the arrows' line above the foot.
7. **The audit sets a case's own photos, events and notes as three panels at the top**, as a rental's
   parts are, rather than one panel holding one case. A car's entry keeps its cases each in a group.
8. **A case's deletion refreshes the insurers too**, beyond the page, the audit, the Overview and the
   cases, since the Insurers page counts the cases each insurer handles and names.

## 7. Deviations

None from §19.

## 8. Open risks and observations

1. **The owner's apps on 5173 and 5174 hot-reloaded this code as it was written.** Each module
   existed before anything imported it. Twice a page read a style a fraction of a second before the
   next save wrote it: Status's width and the case card's wrapping title. Either one read as no style
   for that instant, with no error.
2. **What 5173 and 5174 show until the reviewer upgrades their APIs to round 14:**
   - On Delete records, the seventh tab, Insurance cases, shows no count. Opening it shows "The
     records could not be loaded" with "Not Found" and Retry. An API without the route answers 404
     with no body: 5003 answers so for a route it does not have, and a test renders exactly that.
   - A car's row, window and line say nothing of accident links: the members are absent and read as
     0.
   - Nothing else changes there. The other six tabs, their deletions and the audit work as before,
     and F19-1's picker needs nothing of the API.
   - On 5173, whose API grants no insurance permission, the picker is not reachable at all, as before.
3. **Observed, not changed: at 1024 px the page's tables scroll sideways inside their frame.** The
   Insurance cases table and the Vehicles table both scroll 108 px: their floor is 1020 px and the
   frame 912 px. The stylesheet's note says every table fits under the collapsed rail; at 1024 px
   none of the widest does. This predates this run.
4. **Observed, not changed: a tab at the end of the strip, opened straight from its address, stands
   partly past the strip's edge.**
   - The strip brings the active tab into view at its first paint, before the counts arrive, and the
     counts then widen every tab.
   - Opened on Insurance cases, the tab stood 129 px past the edge at 834 px and 127 px at 402 px.
   - Drivers did the same before this run, 79 px at 834.
   - A tap on a tab shows it whole. The strip is shared by every record page, so it was left as it
     is. A fix would bring the active tab into view again once the counts arrive.
5. **What the suite does not hold:** where the list's foot and the arrows' line stand as the list
   scrolls. The rules that place them are tested; the browser measured the result (§4.3), and §5.1
   step 12 asks the reviewer to look signed in.
6. **Safari was not measured.** The built-in browser pane is Chromium; the owner's Mac, iPad and
   iPhone use Safari.
   - The foot stays in view by `position: sticky`, which Safari has long supported.
   - The arrows' line stops above the foot because `scrollIntoView` honours the list's
     `scroll-padding-bottom`. Safari's support for that is newer.
   - On a Safari that does not honour it, the foot still stays in view, and only a line reached with
     the arrows could stop under it until the next key. On a phone or tablet the arrows are not used.
   - §5.1 step 12 asks for a look in Safari with the keyboard.

## 9. Commits

On `feature/backend-wiring`, after `302fb5e`, in this order:

1. **`e3a3ccb`** Wiring 49: In a case's insurer picker, Add an insurer stays at the foot of the open list, always in view, and only Not chosen and the insurers scroll above it.
   3 files (under `src/`): added `pages/followup19.picker.render.test.ts`; `pages/insurance/InsurerPicker.module.css`; `pages/insurance/InsurerPicker.tsx`.

2. **`3bc73ad`** Wiring 49: The Delete records page gets a seventh tab, Insurance cases, where a closed case can be deleted with its events, notes and photos and an open one is Blocked until an event closes it, and a car's deletion also says which accident links it clears.
   12 files (under `src/`): `api/dto.ts`; `api/recordDeletions.test.ts`; `api/recordDeletions.ts`; `format/recordDeletion.test.ts`; `format/recordDeletion.ts`; `pages/admin/DeleteRecordDialog.tsx`; `pages/admin/DeleteRecords.module.css`; `pages/admin/DeleteRecords.tsx`; `pages/followup17.deletions.render.test.ts`; added `pages/followup19.deletions.render.test.ts`; added `pages/followup19.phone.render.test.ts`; added `pages/followup19.support.ts`.

3. **`9112e69`** Wiring 49: The security audit names a case's deletion Insurance case · Deleted and reads its copy as it reads a car's cases: the case, its photos, its events with theirs, its notes, and the cases that lost their accident link.
   5 files (under `src/`): `format/auditPayload.ts`; `format/labels.test.ts`; `format/labels.ts`; `pages/audit/AuditEntry.tsx`; added `pages/followup19.audit.render.test.ts`.

4. **`6e66bf4`** Wiring 49: The audit entry's test reads each panel on its own, so an event shown without its photo is caught although the raw payload below still names it.
   1 file: `src/pages/followup19.audit.render.test.ts`.

5. **This report's commits**, `Wiring 50`: `Context/wiring_report.md`, rewritten, then its Safari note and the reviewer's Safari and touch steps.
