# Frontend Wiring — Follow-up 8, the Delete records page

> Follow-up 8 (`Context/wiring_followups.md` §8): the app's half of the deletion of records, built
> against the backend's round 7 (`RWRentApi-wiring/Context/round7_spec_and_plan.md` §5–§7, its report
> §5), which the owner approved before this run. Design source: `Context/prototype/delete-records/`
> (the handover, its reference CSS and mock data) with `Context/prototype/RW-Rent.dc.html`; where the
> handover and §8 disagree, §8 wins, and it does. Worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`,
> branch `feature/backend-wiring`. Written 2026-09-21. It replaces Follow-up 7's second-batch report,
> which git history keeps.
>
> **The owner's side was never touched.** The API on 5001 serves the round-7 build over the real data
> in `rwrent_v1`, and the owner's app on 5173 runs from this worktree with hot reload. This run never
> opened 5173, never signed in anywhere, never called 5001, and never wrote to `rwrent_v1`, whose
> read-only fingerprint is the same at the end as at the start. Every live check used the scratch
> stack: the API on 5002 over the seeded `rwrent_check`. **For the owner's reviewer: §5 lists the
> steps that need the seed password typed into the app, on 5174 and 5002.** The implementing agent
> may not type a password into a page; every other step of the joint check ran and passed.

## 1. Summary

The System Administrator has a new page, **Delete records**, under Administration after System
Administrator. It removes, for good, records the company no longer needs: rental assignments,
driver authorizations, interruptions, vehicles, customers and drivers.

- The page is the handover's: the bad-tone banner "Deleted means gone", six tabs with their counts,
  the filter row (search, Show: Out of use / Everything, Clear filters), one table per kind, phone
  cards that carry their own action, the delete dialog, and Recently deleted.
- **The server decides.** Whether a row is Ready or Blocked, why, and which records stand in the way
  all come from the API. The app only words the answer with the handover's sentences and never
  re-implements a rule.
- After a deletion the dialog closes, the row leaves, the counts and Recently deleted reload, and
  one confirmation line names what went ("Vehicle deleted: … Written to the security audit.").
- The security audit learns the six deletion events: its filter offers them, and a deletion's entry
  shows the record it named and the whole copy it keeps, a rental's parts included.

| | |
|---|---|
| Commits | seven `Wiring 25` commits and this report's `Wiring 26`, pushed (§9) |
| Tests | 253 → **305**, all green; 52 new; the only existing tests changed are the three catalogue literals |
| Breakages | 26 deliberate breakages of the new code, **26 caught** by the new tests |
| Typecheck, build | green; every commit also typechecks on its own; the build's chunk-size warning predates this run |
| Joint check on 5002 | **53/53** API checks of the handover's §a; **20/20** screens rendered from those live answers |
| New runtime dependency | none |
| The owner's side | 5001 and 5173 never used; `rwrent_v1` unchanged |

## 2. Implemented

### 2.1 The page (`src/pages/admin/DeleteRecords.tsx`, `DeleteRecords.module.css`)

- **Route and navigation.** `/delete-records`, permission `Records.Delete` (added to `PERMISSIONS`),
  navigation entry "Delete records", icon `delete_sweep`, after System Administrator.
- **The frame.** `RecordBanner` (bad tone) for "Deleted means gone"; `RecordTabs` for the six kinds,
  each with the count the API gives under the current Show; the list panel from `list.module.css`
  with `SearchInput`, `SelectFilter` "Show" and `ClearFilters` (which appears once Show is
  Everything or a search is typed, and resets both).
- **The URL.** `kind`, `show`, `search`, `page` and `size` live in the address. Changing the kind
  resets the search and the page, and keeps Show.
- **The tables**, one column set per kind, with the handover's headers, widths and min-widths
  (1220 / 1180 / 1180 / 1020 / 1020 / 1040). Rows open their record (a rental, a vehicle, a customer,
  a driver; an authorization or an interruption opens its rental on the matching tab). Cells use
  `table.module.css`, the quiet link (`quietLink`) and `Chip`.
- **The Deletion cell.** A Ready (ok, round dot) or Blocked (warn, square dot) chip. A blocked row
  adds the reason under the chip and the first five records in the way, each a link where it has a
  page.
- **Delete… on the row.** `Button tone="danger" small`, its hint "Delete this <kind>". On a blocked
  row it is the app's disable-with-reason button: disabled, with the reason and a full stop as its
  hint.
- **The portrait band (768–1023).** Parts (rentals) and Billing impact (interruptions) fold, the
  fixed widths shrink to 71%, and the auto column takes the rest. The Deletion cell wraps its reason;
  Actions keeps its width (§7.4).
- **The phone tier (below 768).** Cards from `cards.module.css`. Each card has:
  - the identifying text as a quiet dark link, with its line under it;
  - the verdict chip;
  - the fact grid (a rental's Parts across the card);
  - for a blocked card, the reason in the warn ink with its links;
  - its own full-width Delete…, which is not one big button.
- **The empty state.** "Nothing to clean up", icon `inventory_2`. A search that finds nothing uses
  the prototype's no-result state instead.
- **Recently deleted.** A `Panel` with a `data-panel` table that never folds (880px), headed When,
  Who, What and Reason, newest first. On the phone it becomes cards with a Deleted chip and Open
  audit entry. What reads "<Kind> · <record label>"; Reason reads the chosen reason, with the note
  after a dash.

### 2.2 The dialog (`src/pages/admin/DeleteRecordDialog.tsx`)

Modelled on the app's `DeleteCompany`:

- title "Delete <kind>", its description the record's identifying line, icon `delete_forever`, bad
  tone, width 560;
- a bad-tone banner: "This cannot be undone", or "This rental is active" for an Active rental;
- the handover's consequences, with a rental's own parts counted from the row;
- the Reason select, the Note (required for Other, optional otherwise, "Stored with the audit
  entry.");
- the lifted `CheckCard` for "I understand this cannot be undone";
- Delete permanently (`danger-solid`, `delete_forever`), `submitBlocked` until there is a reason, a
  note when the reason is Other, and the tick.

A success invalidates the page's lists, counts and history, the audit, the overview, and that
kind's ordinary queries. A rental's deletion also refreshes the vehicles (their availability), the
interruptions and the drivers' authorization histories.

### 2.3 Where the app wins over the prototype (§8, "Where the app wins")

1. **No toast.** A confirmation line above the table, in the panel note's vocabulary: "<Kind> deleted:
   <record label>. Written to the security audit." The last sentence is the link to the entry for a
   reader with `SecurityAudit.ReadCompany`. It goes at the next deletion, a change of kind or a
   reload.
2. **Blocked Delete…** is the `blockedReason` button: pressing it does nothing.
3. **Local times everywhere.** No page source says UTC (`surfaces.test.ts` stays green).
4. **`DialogNote` gains a `bad` tone** from the existing banner recipe. "This rental is active"
   replaces "This cannot be undone" for an Active rental.
5. **`CheckCard` moved** from `AssignmentDialogs.tsx` into `src/ui/CheckCard.tsx`, unchanged. Both
   dialogs import it.
6. **Refusals.**
   - A record that became blocked (`record_deletions.blocked`) or left the list
     (`record_deletions.not_found`) comes back like the concurrency conflict: the stale banner with
     the handover's sentence ("This vehicle now has a rental assignment." / "Refresh the list.") and
     Refresh, which reloads the lists and closes the dialog.
   - The concurrency conflict keeps its shared banner.
   - Field refusals reach their fields through `codes.ts`, op `record-delete`.
7. **The interruptions search** reads "Note, plate or customer".
8. **Audit links** — in Recently deleted and in the confirmation line — are links only for a reader
   with `SecurityAudit.ReadCompany`, plain text otherwise.

### 2.4 The two additions outside the page

- **`AUDIT_EVENTS`** gains `RentalAssignment.Deleted`, `DriverAuthorization.Deleted` (label "Driver
  authorisation · Deleted", the app's spelling), `Interruption.Deleted`, `Vehicle.Deleted`,
  `Customer.Deleted` and `Driver.Deleted`. The list shows them, and the event filter offers them.
- **The audit entry of a deletion** (`AuditEntry.tsx`, the reader `deletedRecord` in
  `auditPayload.ts`):
  - a "Record" fact with the copy's `RecordLabel` and the hint "The record was deleted, so there is
    nothing to open.";
  - the reason as usual;
  - instead of "Recorded values", a panel "Deleted record" with the copy's scalar members as facts,
    without `RecordLabel`, `DeletionReason` and `DeletionNote`;
  - for a rental, "Deleted authorizations" and "Deleted interruptions", one titled group of facts
    per part.

  The reader learns this one shape. Every other payload, a malformed copy included, renders exactly
  as before.

### 2.5 The contract (`src/api/dto.ts`, `src/api/recordDeletions.ts`, `queryKeys.ts`)

- `dto.ts` follows the live OpenAPI document of the scratch API: the five enums, the six candidate
  rows, the verdict with its blocks, the counts, the deletions list, and the request and answer of a
  deletion. It includes round 7's §5 extras: `rentalAssignmentLabel` on the two part candidates, the
  customer's `identifier`, and the validation codes `kind_invalid` and `record_id_required`.
- The fixtures are the API's answers typed as these DTOs, so a member the API sends and `dto.ts`
  does not declare fails the typecheck. None does.
- `recordDeletions.ts` carries the four calls, and `qk.recordDeletions` carries their keys under one
  prefix.

### 2.6 Shared pieces lifted or extended

| Piece | Change | Why |
|---|---|---|
| `src/ui/CheckCard.tsx` | moved out of `AssignmentDialogs.tsx`, unchanged | §8, 5 |
| `DialogNote` | `tone="bad"`, with CSS from the existing bad banner | §8, 4 |
| `Failure` (`problem.ts`), `FailureBanner` | a stale failure may carry its own `detail`; without one, the words are exactly as before | §8, 6: the deletion's sentence in the stale banner |
| `useActionMutation` | an optional `refusal` reader tried before `toFailure`; every existing caller is unchanged | a 404 reaches the app without its code in `toFailure`, so `not_found` needs the dialog's own reading |

### 2.7 Tests, and whether they can fail

52 new tests, 305 in all, green.

| File | Tests | What they hold |
|---|---|---|
| `src/format/recordDeletion.test.ts` | 12 | each block reason in singular and plural, the combined driver sentence, periods, parts, the dialog's descriptions and consequences, the refusal sentences, the reason read back |
| `src/format/deletedRecord.test.ts` | 6 | the copy of a vehicle and of a rental with parts, the reading order, local times, and nine malformed copies falling back as today |
| `src/api/recordDeletions.test.ts` | 6 | the field refusals' mapping, the captured 400 under the note, `blocked` and `not_found` with Refresh, the concurrency conflict untouched, the six list paths |
| `src/pages/followup8.render.test.ts` | 22 | the frame, each kind's table with Ready and Blocked rows, the empty and no-result states, the refused page, the dialog normal and for an Active rental with the submit blocked and unblocked, the bad banner, the refusal with Refresh, the confirmation line and Recently deleted with and without the audit permission, the two audit additions, a malformed copy's fallback |
| `src/pages/followup8.phone.render.test.ts` | 5 | the phone cards with their own action, a blocked card, the rental and driver cards, Recently deleted as cards, with and without the audit permission |
| `src/app/routes.test.ts` | +1 | only the administrator opens `/delete-records`, by any spelling |

The fixtures (`src/pages/followup8.support.ts`) were captured on the scratch stack and are typed as
the DTOs.

**The three literals** (§8, "Tests"):

- `routes.test.ts`: the administrator's persona gains `Records.Delete`, and a gated-destination
  assertion names the new page.
- `labels.test.ts`: the backend's event and entity catalogues gain the six events and the three
  entity types they are written against.
- `codes.test.ts`: the backend's code catalogue gains the ten `record_deletions` codes.

No other existing test changed.

**Every new test can fail.** Twenty-six deliberate breakages were planted one at a time, each run
against the new test files alone, and each restored byte for byte. **All 26 were caught**, and the
tree was identical after the run. The first run missed one: a blocker link to the driver's page.
The assertion it tested was weak, because the row's own name also links there. It was tightened to
require the authorization's label as that link, and caught on the rerun. The breakages:

- wrong joins, verbs and wording in the block sentences;
- a refusal left unworded;
- the audit copy's label repeated, its order lost, an unknown array accepted;
- a blocked Delete… enabled;
- every row Ready;
- links shown without the audit permission;
- the tick not required;
- the wrong banner for an Active rental;
- the old interruptions placeholder;
- a deletion event forgotten;
- the Record fact dropped;
- the route open to the audit permission;
- the page ignoring its permission;
- a phone card without its action;
- the field codes unmapped;
- Refresh withheld;
- the stale banner ignoring its sentence;
- a warn banner;
- a blocker without its link;
- the empty state renamed.

## 3. Not implemented or partial

### 3.1 The steps that need a password typed into the app

The joint check's browser steps need the seed password typed into the sign-in page. The
implementing agent may not do that, so they go to the owner's reviewer, on 5174 and 5002 (§5).
Everything the page shows was checked another way: rendered by the test suite from answers captured
on the scratch stack, rendered again from the joint check's live answers (§4.2), and looked at in a
browser through a preview outside the worktree (§4.3).

- **Side that has to change:** none. This is a working rule.
- **Option:** the reviewer runs §5.

### 3.2 A blocking authorization links to the driver, not to its rental

A driver blocked by driver authorizations lists them. The handover links each one to its rental's
Authorized drivers tab.

- **Why not:** the API's blocking record (`RecordDeletionBlockingRecordResponse`) carries the
  authorization's id and label, not its rental's id, and an authorization has no page of its own. The
  link opens the blocked driver's own page instead, which lists every authorization of that driver.
- **Side that has to change:** the backend.
- **Option:** add the rental's id to the blocking record of a driver authorization, and the app then
  links to `/rental-assignments/{id}?tab=coverage`.

## 4. Verification — the joint check

On the scratch stack only, as the seeded administrator. The scratch database was rebuilt from the
seed before the check, exactly as round 7's report §7 gives it:

- Release build and migrations;
- the seed with the seed password from the session;
- the API on 5002 trusting `http://localhost:5174`.

Every command refused to run unless its connection string named `rwrent_check`, and the API client
refused any address but `localhost:5002`.

### 4.1 Through the API: the handover's §a — 53/53

`joint_check.py`, in the run's scratchpad. The seeded Fleet Manager first created and put out of use
a Citroen Berlingo and a customer, Edijs Balodis, because the seed has no inactive vehicle and no
inactive customer without rentals. Then:

- **the six tabs** under both filters: every tab's count equals its list's total (12 checks);
- **Show and search:** Out of use leaves an active vehicle out, and the interruptions search reads
  the note;
- **every row of §a the API can show**, each with the verdict the page words:
  - rentals: the Cancelled 770 HDV with no parts (Ready), and the Ended 400 NDP with one
    authorization and one interruption;
  - authorizations: Laura Ozola's stopped one (Ready), and Anete Kalnina's on 204 JLM, Blocked as
    the only open one of an Active rental;
  - interruptions: the two ended ones (Ready);
  - vehicles: the inactive Citroen (Ready), and 881 GRT and 660 BYH, Blocked by one rental each;
  - customers: Edijs Balodis (Ready), and Ventspils Marine Services (Blocked);
  - drivers: Normunds Zarins (Ready), Laura Ozola (blocked by an authorization), and Anete Kalnina
    (blocked by an authorization and a customer's driver link);
  - the Active 204 JLM, for the dialog's other banner;
- **a conflict from the data itself:** a new vehicle, Ready when the list was read, then given a
  planned rental, is refused as `record_deletions.blocked`;
- **one deletion of each kind**, the Ended rental taking its own authorization and interruption,
  then a second deletion of the same record refused as `record_deletions.not_found`;
- **the empty state:** Interruptions under Out of use is empty once both ended interruptions are
  gone;
- **Recently deleted** lists the six deletions, newest first;
- **the audit:** its filter finds each of the six event types, and the Company Principal reads each
  entry with its copy — the rental's with its two parts.

**Not shown through the API, because they are not API states:**

- the prototype's toast — the app has none, and shows the confirmation line instead;
- the failure injected from the prototype's panel — the conflict the data raises is checked
  instead;
- a driver blocked by a customer's link alone — the seed has no such driver; the combined case is
  shown, and the sentence for the link alone is covered by the wording tests.

### 4.2 The app's screens, rendered from those live answers — 20/20

`joint/joint.live.test.ts`, run from outside the worktree with a scratch Vitest config that reuses
the app's sources. It fed the live answers of §4.1 to the real components and checked:

- every §a row in its kind's table, with the chip, the reason and the enabled or disabled Delete…;
- the empty Interruptions tab;
- Recently deleted with the six live deletions and their links;
- the audit entry of the live rental deletion, with its parts;
- the two live refusals with their sentence and Refresh;
- the dialog of the live Active rental.

### 4.3 The page in a browser

I cannot sign in, so a preview outside the worktree rendered the real page with the captured answers
in its cache. It ran on port 5175, used no API, and was stopped afterwards. I looked at it in the
app's own browser pane:

- **at 1512:** every column fits, and nothing pans;
- **at 834:** Billing impact and Parts fold, the Deletion reasons wrap, and Delete… keeps its label;
- **on a phone:** cards with their own action, and Recently deleted as cards.

Two faults were found and fixed. A card title's underline ran past its text. The Open audit entry
icon sat off its line.

The real app was also started on 5174 against 5002. `/delete-records` sent the signed-out visitor
to Sign in, as it should. The run stopped there and stopped the server.

### 4.4 The test suite

Typecheck green; `npm test` 305/305; `npm run build` green.

### 4.5 The owner's side, untouched

- 5001 and 5173 were never opened, called or signed into, and their processes are the ones that ran
  before the run.
- `rwrent_v1`'s read-only fingerprint — the row counts of eleven tables and the latest write in ten
  of them — is identical at the start and at the end.
- The backend worktree was only read and built from, in Release.
- The seed password is in no file.

### 4.6 End state

- The scratch API runs on 5002 over `rwrent_check`, holding the joint check's state, **for the
  reviewer**.
- My Vite on 5174 and the preview on 5175 are stopped.
- Both main checkouts are untouched.
- The worktree is clean and pushed.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

1. **Use a separate browser profile, or a headless browser.** Both stacks share the cookie names and
   the key ring, and a browser does not separate `localhost` cookies by port. Signing in on 5174 in
   the owner's profile would sign the owner out of 5173 (§8.1).
2. Start the scratch app from this worktree:

   ```bash
   VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort
   ```

3. Afterwards, stop it with `kill $(lsof -ti tcp:5174)`. When the review is over, stop the scratch
   API with `kill $(lsof -ti tcp:5002)`, then run `DROP DATABASE rwrent_check WITH (FORCE)` from the
   `rwrent_v5_postgres` container.

### 5.1 The steps

The joint check has already deleted six records on the scratch stack (§4.1), so Interruptions is
empty under Out of use, and Recently deleted has six rows.

1. **Who sees the page.**
   - Sign in as `signe.priede@rwrent.example` (Company Principal): Administration has no Delete
     records, and opening `/delete-records` shows "Not available to you — Opening this page needs
     Records.Delete."
   - Sign in as `sysadmin@rwrent.example`: the entry sits after System Administrator.
2. **The frame.** The banner "Deleted means gone"; six tabs with counts; Rental assignments first,
   under Out of use.
   - Switch Show to Everything: the counts change, and Clear filters appears.
   - Type a search, then change the tab: the search clears, Show stays.
3. **Blocked rows.**
   - Vehicles, Everything: 881 GRT reads "Blocked", "1 rental assignment refers to this vehicle", and
     links to its rental. Its Delete… is disabled, with the reason as its hint.
   - Drivers, Everything: Anete Kalnina carries both reasons in one sentence, with a link to the
     customer.
   - Driver authorizations, Everything: Anete Kalnina · 204 JLM reads "An active rental must keep at
     least one authorization".
4. **The empty state.** Interruptions, Out of use: "Nothing to clean up".
5. **A deletion in the app.**
   1. Rental assignments: open Delete… on 770 HDV · Daugava Construction (Cancelled, no parts).
   2. Check the dialog: title "Delete rental assignment", the record line, the banner "This cannot be
      undone", the consequences, Reason, Note, and the tick. Delete permanently stays disabled until
      a reason and the tick are given; choosing Other also requires a note.
   3. Choose "Practice or test record", tick, and press Delete permanently.
   4. Expect: the dialog closes; the row leaves; the tab count drops by one; the line "Rental
      assignment deleted: 770 HDV · Daugava Construction. Written to the security audit." appears;
      Recently deleted gains the row at the top.
   5. Follow the link: the entry shows the Record fact with its hint, and the Deleted record panel.
6. **An Active rental.** Rental assignments, Everything: Delete… on 204 JLM · Anete Kalnina. The
   banner reads "This rental is active". Cancel.
7. **A conflict with Refresh.**
   1. As the administrator, open Delete… on a Ready vehicle. Create one as
      `karlis.zvaigzne@rwrent.example` in a second profile first if none is left.
   2. As Karlis, create a planned rental on that vehicle.
   3. Back in the dialog, fill it in and press Delete permanently.
   4. Expect: the banner "This vehicle now has a rental assignment. Refresh the list." with Refresh.
      Refresh closes the dialog and reloads the list, where the vehicle is now Blocked.
8. **The phone.** Narrow below 768 pixels: each row is a card with its own full-width Delete…, and
   Recently deleted is cards. Below 640, the dialog is a sheet.
9. **The audit.** In Security audit, the Event type filter offers the six "· Deleted" events.
   "Rental assignment · Deleted" finds the joint check's rental deletion; open it to see Deleted
   authorizations and Deleted interruptions, one group each.

## 6. Decisions needed

1. **The interruption's record label carries the reason's API name.** Round 7's §7 defines the
   interruption label as "<reason name> · <plate> · <customer>", and the backend writes the enum's
   name. So Recently deleted, the confirmation line and the audit's Record fact read, as the joint
   check's deletion does, "Interruption · ScheduledMaintenance · 482 TKL · Baltic Freight Partners".
   The page's own rows and dialog word the reason ("Scheduled maintenance"). Options:
   - the backend writes the reason's words into the label, for new deletions only (older entries
     keep theirs); or
   - it stays as it is.

   The app should not rewrite a label the server wrote.

## 7. Deviations

1. **The tab counts follow Show, not the search.** The counts endpoint takes the filter alone (round
   7's §7). The prototype's counts also narrowed with the search.
2. **Recently deleted shows the newest 20, with no pager.** The handover shows none.
3. **The phone card's Delete…** is the app's block button (`Button block tone="danger"`): the neutral
   frame with the tone in the label. The handover's card used the filled danger recipe. The app's
   existing piece was kept.
4. **Actions keeps 118px in the portrait band.** The handover's 71% would leave 84px, which clips
   Delete….
5. **The app's words where they differ from the prototype's:**
   - a customer's type reads "Private", not "Private person";
   - the refused page is the app's lock state ("Not available to you"), not "HTTP 403 · policy";
   - the hint of a Delete permanently still waiting for the tick is "Confirm that you understand this
     cannot be undone." — the handover has no sentence for that case.
6. **A deleted record's facts are in a fixed reading order:** the record's own members by name, then
   who created and last changed it, then the identifiers. Postgres returns the copy's keys in its own
   storage order, which reads as noise.
7. **The Record fact on a deletion's entry spans the grid's full width**, so the Event panel's other
   six facts keep their two rows of three.
8. **The page checks `Records.Delete` itself** as well as the route guard. It then shows the same
   lock state and sends no request. This is also what the refused-page test renders.
9. **The joint check's render half and the visual preview ran from outside the worktree**, with
   scratch configs that reuse the app's sources, so the worktree holds only the page's own code.

## 8. Open risks

1. **Cookies are shared between 5173 and 5174** in one browser profile (§5.0). Only a reviewer who
   ignores §5.0 can trip on it, but the price is the owner being signed out.
2. **The page is live on real data.** The owner's app hot-reloads from this worktree, and the API on
   5001 serves round 7. The administrator can delete real records from the moment this is pushed —
   and could while it was being written.
   - A deletion cannot be undone; the audit entry keeps its copy.
   - A copy of `rwrent_v1` before a first real deletion is cheap insurance (the backend README, the
     go-live section).
3. **One line has no test.** `useActionMutation`'s call to the dialog's refusal reader is covered
   only through the reader itself (`deletionFailure`, tested). The node test environment runs no
   mutation. The joint check's live refusals went through the same reader.
4. **The phone preset used was 375 pixels wide**, not the handover's 402. Both are on the card tier,
   where nothing depends on the exact width.

## 9. Commits

| Commit | Group |
|---|---|
| `2f73fe8` | the round-7 contract: `dto.ts`, `recordDeletions.ts`, `queryKeys.ts`, `client.ts`, `index.ts`, and `Records.Delete` in `permissions.ts` |
| `8076643` | shared pieces: `CheckCard.tsx` (lifted), `AssignmentDialogs.tsx`, `Dialog.tsx`, `Dialog.module.css`, `problem.ts`, `useActionMutation.ts` |
| `4a8f08d` | the words: the reason and kind labels in `labels.ts`, `recordDeletion.ts`, `format/index.ts` |
| `7c2d69d` | the security audit: the six events in `labels.ts`, `auditPayload.ts`, `AuditEntry.tsx`, `AuditEntry.module.css` |
| `e6764d8` | the dialog: `DeleteRecordDialog.tsx`, `codes.ts`, and the `codes.test.ts` catalogue |
| `6a7de67` | the page: `DeleteRecords.tsx`, `DeleteRecords.module.css`, and the route in `routes.tsx` |
| `9ddf236` | the tests: `recordDeletion.test.ts`, `deletedRecord.test.ts`, `recordDeletions.test.ts`, `followup8.support.ts`, `followup8.render.test.ts`, `followup8.phone.render.test.ts`, and the catalogues in `routes.test.ts` and `labels.test.ts` |
| this one | `Context/wiring_report.md` |
