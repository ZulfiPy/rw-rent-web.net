# Frontend Wiring — Follow-up 11, what the owner found in the full check from an empty app

> Follow-up 11 (`Context/wiring_followups.md` §11): three things the owner found on 2026-09-23 while
> checking the app on real data from an empty database, frontend only. It is the first work after both
> repositories were merged into `main`, on a branch of its own: `followup-11`, created from `main` in
> this worktree and fast-forwarded into `main` by the reviewer after verification. Worktree
> `/Users/zulf/rw-rent-api/rw-rent-web-wiring`. Written 2026-09-23. It replaces Follow-up 10's report,
> which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001 and never wrote to `rwrent_v1`, whose read-only fingerprint is the same at the end as at
> the start. The backend worktree was only built (in Release) and run.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it has shown this run's changes as they
>   were written. All three are app-only and work with the round-9 API the owner's 5001 serves.
> - Every live check used a scratch stack built for this run: `rwrent_check`, freshly seeded, behind the
>   API on 5002 (round-9 Release build, company email domain `rwrent.example`).
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

- **F11-1, a refused field is brought into view.** Every form control now marks itself invalid through
  `invalidProps`, the one shared way, which also sets `aria-invalid`. That is what the shared dialog
  looks for after a field refusal to scroll the field into the middle of its body and focus it. The
  owner's case works: an Active rental on a vehicle in use, submitted from the bottom of the dialog,
  now scrolls back to Vehicle, which is red, focused and carries the API's sentence.
- **F11-2, the new-rental dialog warns before the refusal.** With the initial status Active and a
  vehicle in use chosen, an amber line under Vehicle says at once "This vehicle is in use by Anete
  Kalnina. End that rental first, or plan this one.", "that rental" being a link to it. It blocks
  nothing; the API still decides.
- **F11-3, Delete records opens on Everything.** "Out of use" stays as a filter. When it is empty, it
  says how many records Everything holds ("Nothing out of use here" / "7 active customers are under
  Everything.") and offers "Show everything", which switches the filter.

| | |
|---|---|
| Commits | `8fe6531`, `905aa2f`, `36cd9f3`, `ed22493`, and this report's (§9), on `followup-11` |
| Tests | 360 → **387**, all green: 27 new; 3 existing tests and the render helper they share updated, because they assumed the old default filter (§2.4) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at every one of the four |
| Planted breakages | **42 planted**: 40 caught by the suite; the other 2 act only in a live page, and the browser preview shows both (§4.4) |
| Joint check | **25/25** through the API; the screens rendered from those very answers, all 29 fixtures identical to them |
| The owner's database | unchanged: same fingerprint before and after |

## 2. Implemented

### 2.1 F11-1: every control marks itself through `invalidProps`

**The cause, as §11 found it.** The shared `Dialog` finds the refused field by `[aria-invalid="true"]`,
brings it to the middle of its scrolling body and focuses it. 46 controls marked themselves with
`data-invalid` instead:

- 36 in dialogs, with `data-invalid` alone: painted red, never found. They are in `NewAssignment.tsx`
  (8), `AssignmentDialogs.tsx` (15), `FleetDialogs.tsx` (3), `CompanyProfile.tsx` (6) and
  `SystemAdministrator.tsx` (4).
- 10 on the account screens (`AuthLayout.tsx` 3, `Register.tsx` 5, `SignIn.tsx` 2), which had also
  written `aria-invalid` by hand. Their markup is identical now; only the way it is written changed.

**Six more places marked nothing at all**, so the same refusal was lost there too. They mark
themselves now:

- the assignment note of Edit;
- the assignment note of Correct timeline;
- Grant role's Role select;
- the Initial roles check boxes of Activate, all of them, on a refusal of `roles`;
- the chosen coverage of the new-rental dialog, on a refusal of the driver, the authorization type or
  its start (the coverage block shows the API's sentence under the choices);
- the delete dialog's tick, "I understand this cannot be undone": `CheckCard` takes an `error` and
  marks its box.

**The dialog.** `src/ui/Dialog.tsx` names what it looks for (`INVALID_CONTROL`) and its scroll-and-focus
(`revealFirstInvalid`), which the effect calls after a field refusal as before. Behaviour unchanged; the
tests can now reach it.

### 2.2 F11-2: the warning under Vehicle

`src/pages/fleet/NewAssignment.tsx`:

- `vehicleInUse(vehicle, initialStatus)` answers the chosen vehicle when the initial status is Active and
  the vehicle list's own `availability` is In use, else null. It reads the server's answer only
  (VEHICLE-009); a Reserved vehicle (a planned rental's) is not warned about.
- `VehicleInUse` words it: "This vehicle is in use by \<customer\>. End that rental first, or plan this
  one.", with "that rental" linking to `/rental-assignments/<currentAssignmentId>`. Without a name or a
  rental id in the answer it drops the name or the link.
- It sits under the Vehicle select, in a new amber slot of the shared field: `Field` takes a `warning`
  (`src/ui/Field.tsx`, `.warning` in `Field.module.css`, the `--warn` token, both themes).
- It blocks nothing: with a driver named, Create assignment stays enabled. If the person submits
  anyway, the API's refusal lands under the same field (F11-1), in red below the amber line.

### 2.3 F11-3: Delete records opens on Everything

`src/pages/admin/DeleteRecords.tsx`, with its words in `src/format/recordDeletion.ts`:

- **The default.** Without `show` in the address the page shows Everything: the tabs count Everything,
  the Show filter reads "Everything", and there is nothing to clear. "Out of use" is
  `?show=out-of-use`; there Clear filters appears and leads back to Everything. An address from before,
  `?show=all`, still opens on Everything.
- **The empty list under Out of use.** Its title is "Nothing out of use here". Its body is how many
  records Everything holds, from the server's counts of that filter, worded as the filter counts
  them:
  - "7 active customers are under Everything.";
  - "2 planned or active rental assignments …";
  - "1 open driver authorization is …";
  - "open interruptions", "active vehicles", "active drivers".

  With it, **Show everything** (in the empty state's button form, `EmptyState` gained an `action`)
  switches the filter. If Everything holds none either: "There are no customers under Everything
  either.", and no button. While the counts are still loading: "Everything lists the records still in
  use.", with the button.
- **Everything's own empty list** now says "Nothing to delete" / "There are no customers.". Before,
  the page showed Out of use's sentence under Everything too, telling the reader to switch to the filter
  they were on.

### 2.4 Tests

**27 new tests.** Existing tests were changed only where they assumed the old default filter, as the
run's rules allow. No other existing test was deleted, skipped or weakened.

**The updated tests, each with its old and new expectation:**

| File | Test | Before | Now |
|---|---|---|---|
| `src/pages/followup8.render.test.ts` | the helper `renderPage` | a bare address meant Out of use: default `show` OutOfUse, only that filter's counts in the cache | a bare address means Everything: default `show` Everything, both filters' counts in the cache |
| `src/pages/followup8.render.test.ts` | "the bad-tone banner, the six kinds with their counts, and the Show filter" → "… open on Everything (Follow-up 11)" | at `/delete-records`: the tabs carry the Out of use counts; the page contains "Out of use" | at `/delete-records`: the tabs carry the Everything counts; the filter reads "Everything"; "Out of use" is offered as its option; no Clear filters |
| `src/pages/followup8.render.test.ts` | "nothing out of use of a kind is the empty state; a search that finds nothing says so" | at `?kind=interruptions` (the old default): "Nothing to clean up", "No out-of-use records of this kind. Switch Show to Everything to see the rest." | at `?kind=interruptions&show=out-of-use`: "Nothing out of use here", "4 open interruptions are under Everything.", the Show everything button; the search half unchanged |
| `src/pages/followup10.render.test.ts` | "reads the Delete records page, its rows with their Delete, and Recently deleted without audit links" | at `?kind=vehicles`, which was Out of use, the filter its captured lists were answered under | at `?kind=vehicles&show=out-of-use`: the same lists, the same assertions |

"rental assignments: an Ended rental with its parts, and a Cancelled one with none" in the same file
keeps its body; through the helper it now renders under Everything, with the same rows and assertions.

**The new tests:**

| File | New | What they hold |
|---|---|---|
| `src/pages/followup11.dialogs.render.test.ts` | 17 | F11-1, a test per dialog file with a refusal the scratch API really gave, each marking exactly one control, the one under the API's message: the owner's vehicle refusal (NewAssignment); the refused driver on the chosen coverage; Edit's planned end, Cancel's note, Record interruption's end, Add authorized driver's driver (AssignmentDialogs); New customer's address (FleetDialogs); the Company's email (CompanyProfile); the transfer's target (SystemAdministrator); Grant role's Role and Activate's roles (UserDialogs); the delete dialog's tick; the account screen's email, same markup as before. The two notes that marked nothing, in Edit and Correct timeline. `revealFirstInvalid` run against the dialog's real markup after the owner's refusal: it finds the Vehicle select, centres it and focuses it; with nothing marked it moves nothing. A check read from the sources that no control sets `data-invalid` or `aria-invalid` by hand any more |
| `src/pages/followup11.render.test.ts` | 10 | F11-2: the amber line under Vehicle, its words and link, the select not marked invalid by it, the list's answer it rests on; Create assignment enabled beside it; none for a Planned rental, a free vehicle or no vehicle; `vehicleInUse` on In use, Reserved, Available; the wording without a name or rental. F11-3: the owner's case, an active customer with a planned rental there at once, Ready, taking it; Out of use as a filter with Clear filters; its empty state with the count and the button; none either, and Everything's own empty list; `show=all`; each kind's words, one and many, unknown and zero |

**How they are built.**

- The fixtures, `src/pages/followup11.support.ts`, are the joint check's own answers from the scratch
  API (§4.1), written out as the DTOs. A member the API sends and `dto.ts` does not declare fails the
  typecheck. All 29 were compared with the saved live answers at the end, and none differs.
- A server render cannot submit, so the dialog tests replace the one hook every dialog submits through,
  as Follow-up 10's did. The stand-in answers with the refusal a test names, turned into a failure by
  the app's own `toFailure` under the dialog's own operation. That is what the real hook does, so the
  real dialogs and the real mapping are what is tested.
- A server render runs no effect, so the scroll-and-focus is tested through `revealFirstInvalid` on a
  body that holds the dialog's real markup: its `querySelector` finds the first element carrying the
  attribute the selector names, where the markup places it.

## 3. Not implemented or partial

**Nothing of §11.** Every point is built and tested.

### 3.1 The steps that need a password typed into the app

The signed-in browser steps need the seed password typed into the sign-in page, which this run may not
do. They are left for the owner's reviewer (§5). What they would show was covered here in three ways:

- through the API, by script, as the same people (§4.1);
- rendered from those answers by the real components (§4.2);
- in a browser, on the real screens with those answers in the cache and the refusal answered by a stub
  (§4.3).

## 4. Verification: the joint check

Everything ran on the scratch stack only.

- **The scratch stack**, as `RWRentApi-wiring/Context/round9_report.md` §7 describes it:
  - `rwrent_check` dropped, created, migrated and seeded;
  - the API on 5002 from the backend worktree's Release output, with
    `ApiSecurity__RecordDeleterEmailDomain=rwrent.example`;
  - every command refusing to run unless its connection string names `rwrent_check`.

  The database was seeded afresh before the final run of the joint check, with the API stopped while
  it was reseeded. The backend worktree was only built and run.
- **Guards.** The API client refuses any address but `localhost:5002`. The seed password came from the
  owner for this session and was passed in each command's environment; it is in no file.

### 4.1 Through the API — 25/25

`joint11.py`, in the run's scratchpad, as the seeded Fleet Manager Karlis Zvaigzne, the Principal Signe
Priede and the administrator Arturs Veidenbaums:

- **the vehicle list:** it names who has 204 JLM, Anete Kalnina, and its current rental is her Active
  one; 119 MPR is available and names no rental;
- **the owner's refusal:** an Active rental on 204 JLM for Ilze Berzina, with a named driver, is
  `409 rental_assignments.vehicle_already_active`, "The vehicle already has an active assignment."
  Nothing is created;
- **planning it instead**, as the warning says, is accepted: `201` Planned. It was cancelled again at
  once, with a note;
- **the coverage refusal:** an Active rental on 119 MPR naming the inactive driver Normunds Zarins is
  `409 assignment_authorizations.driver_inactive`. Nothing is created;
- **one field refusal per dialog file**, each changing nothing:

  | Dialog | Refusal |
  |---|---|
  | Edit | a planned end before the planned start: `400` on `PlannedEndAtUtc` |
  | Cancel of an Active rental without history | no note: `400 rental_assignments.correction_note_required` on `CancellationNote`; the rental stayed Active |
  | Record interruption | end before start: `400` on `EndedAtUtc` |
  | Add authorized driver | named, without a driver: `400` on `DriverId` |
  | New customer | a blank address: `400` on `Address` |
  | Edit Company profile | email "not-an-address": `400` on `Email`; the company kept its own |
  | Transfer System Administrator | target "not-an-address": `400` on `TargetEmail` |
  | Grant role | role 99: `400` on `Role` |
  | Activate, Gatis Lapsa | no role: `400` on `Roles` |
  | Delete | without the tick: `400 record_deletions.confirmation_required` on `Confirmed`; the customer stayed |

- **Delete records:**
  - Everything counts at least what Out of use counts, for every kind;
  - the owner's case: Martins Ozols, active with one planned rental, is under Everything, Ready,
    taking it, and not under Out of use;
  - once the one inactive customer, Ventspils Marine Services, was deleted as a practice record, Out of
    use holds no customer and Everything holds 7.

### 4.2 The screens, rendered from those answers

The fixtures of §2.4 are those answers, compared field by field with the saved ones at the end. So the
27 new tests are the render half of the joint check. They feed the answers to the real new-rental
dialog, the rental's own dialogs, the fleet, Company, System Administrator, user and delete dialogs, the
account screen and the Delete records page.

### 4.3 In a browser

- **The app on 5174**, started from this worktree with
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`, and visited in a
  fresh headless browser context with no cookies and no profile:
  - Delete records and Rental assignments sent the signed-out visitor to Sign in;
  - the only API requests went to 5002 (`GET /api/me` → 401);
  - no sign-in was made.
- **A preview on 5175, outside the worktree**, rendered the real new-rental dialog and Delete records
  page with the captured answers in the cache. Its stub transport answers the dialog's one write with
  the captured refusal; nothing could leave the page. I looked at it:
  - at 1280 × 640: the amber line under Vehicle with its link.
  - The owner's case: body scrolled to the bottom (738), Create assignment → one request, then the body
    back at the top, focus on the Vehicle select (`aria-invalid="true"`), the API's sentence under the
    amber line.
  - The same at 375 wide: from 927 back to 0, the Vehicle select focused, no sideways scroll.
  - Delete records at `?kind=customers&show=out-of-use`: "Nothing out of use here", "7 active customers
    are under Everything.", and Show everything, which switched to `?kind=customers` with Everything's
    seven customers, Martins Ozols Ready.
  - Also at 375 wide, and the warning in the light theme (`#7A5A0A` on white).
  - The console showed no errors and no unexpected request.

  The preview was stopped, and the launch entries added for it to the workspace's launch file, outside
  the repositories, were removed again.

### 4.4 The planted breakages — 42 planted, 40 caught by the suite, 2 in the browser

Each breakage was written into a **copy** of the worktree outside it, never into the worktree, so the
owner's app on 5173 could not hot-reload one even for a moment. The whole suite ran on each, and the
file was restored byte for byte.

| | Breakage | Caught by (among others) |
|---|---|---|
| A1 | `invalidProps` no longer sets `aria-invalid` | 16 tests, every dialog file's |
| A2 | the Vehicle select back to `data-invalid` alone | the owner's refusal, the scroll test, the source check |
| A3 | the dialog looks for `data-invalid` | the selector test |
| A4 | the dialog scrolls but does not focus | the scroll test |
| A5 | the dialog focuses but does not scroll | the scroll test |
| A6 | it scrolls the field to the top, not the middle | the scroll test |
| A7 | the dialog's effect no longer calls the scroll | **not by the suite** (below) |
| A8 | the rental dialogs' dates back to `data-invalid` alone | Edit's planned end, Record interruption's end, the source check |
| A9 | Cancel's note back to `data-invalid` alone | the Cancel test, the source check |
| A10 | Add authorized driver's driver marks nothing | its test |
| A11 | the notes of Edit and Correct timeline mark nothing | their test |
| A12 | the fleet addresses back to `data-invalid` alone | New customer's test, the source check |
| A13 | the Company's email back | its test, the source check |
| A14 | the transfer's target back | its test, the source check |
| A15 | Grant role's Role marks nothing | its test |
| A16 | Activate's roles mark nothing | its test |
| A17 | the tick card ignores its error | the delete dialog test |
| A18 | the delete dialog does not pass the tick's refusal | the delete dialog test |
| A19 | the chosen coverage marks nothing | the coverage test |
| A20 | the account screen's email back | the account test, the source check |
| A21 | sign-in sets its marks by hand again | the source check |
| W1 | the warning also for a Planned rental | the Planned case, `vehicleInUse` |
| W2 | the warning also for a Reserved vehicle | `vehicleInUse` |
| W3 | the warning without its link | the warning test, the enabled-submit test |
| W4 | the warning names nobody | the same two |
| W5 | the warning blocks the submit | the enabled-submit test |
| W6 | the warning drawn as an error | the warning test |
| W7 | the field never draws its warning | three tests |
| W8 | the warning reads another vehicle | the same two |
| D1 | the page opens on Out of use again | 5 tests, among them the updated frame test |
| D2 | Everything counts as a filter to clear | the frame test, the owner's case, the filter test |
| D3 | the empty state counts from Out of use's totals | the empty-state tests |
| D4 | Show everything switches to Out of use | **not by the suite** (below) |
| D5 | no button | the empty-state tests |
| D6 | Everything's own empty list reads as Out of use's | its test |
| D7 | the Show options swap their labels | 4 tests |
| D8 | a customer is not called active | the empty-state test, the words test |
| D9 | one record "are" | the words test |
| D10 | rentals called "active" only | the words test |
| D11 | an unknown count read as none | the words test |
| D12 | the empty state's button not drawn | the empty-state tests |
| D13 | the address's Out of use is ignored | 5 tests, among them the updated Follow-up 10 test |

**A7 and D4** are what a live page does: an effect that runs after a render, and where a click leads.
The suite renders on the server, where neither happens. Both were planted in the copy and looked at in
the same preview, built from the copy:

- with A7, the body stayed at the bottom (738 → 761) and the focus stayed off Vehicle: the owner's
  bug, back;
- with D4, Show everything left the page on Out of use with its empty list.

Each was restored and the clean copy behaved as in §4.3. Holding them in the suite would need a DOM in
the tests, a new development dependency, which this run did not add (§8.5).

Every one of the 27 new tests and of the updated tests fails against at least one breakage. D13 was
added after the first run showed that nothing failed the updated Follow-up 10 test. A test that only
checked the captured answers against each other became the first lines of the warning test (§7.5).

### 4.5 The test suite, and each commit

- Typecheck green, `npm test` 387/387 (360 before), `npm run build` green.
- Each commit alone, in a clean copy outside the worktree (`git archive`, `node_modules` linked): the
  whole project typechecks with 0 errors and the full suite passes at every one of the four, with 360
  tests through the third and 387 at the fourth.

### 4.6 The owner's side, untouched

- 5001 and 5173 were never opened, called or signed into, and run on the processes they had.
- `rwrent_v1`'s read-only fingerprint (the row counts of eleven tables and the migrations, and the
  latest write in each) is identical at the start and at the end.
- The backend worktree was only built in Release and run; its Debug output, which 5001 runs from, was
  not touched.

### 4.7 End state

- The scratch API runs on 5002 **for the reviewer**, over `rwrent_check`, domain `rwrent.example`,
  seeded this morning. Beyond the seed:
  - one Planned rental of 204 JLM for Ilze Berzina, planned for 22 November, cancelled at once with the
    note "Follow-up 11 check: planned only to show it is allowed.";
  - the inactive customer Ventspils Marine Services deleted as a practice record, taking its cancelled
    rental of 660 BYH. It heads Recently deleted, and Out of use holds no customer.
- My Vite on 5174 is stopped; the reviewer starts one as §5.0 says.
- The main checkouts are untouched. The worktree is clean, on `followup-11`, and pushed.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. Start it from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173.
- **The people**, all with the seed password:
  - the Fleet Manager `karlis.zvaigzne@rwrent.example`;
  - the Principal `signe.priede@rwrent.example`;
  - the administrator `sysadmin@rwrent.example`.
- **Afterwards:** nothing to undo. Every write these steps try is refused.

### 5.1 The steps

1. **The warning.** As Karlis: Rental assignments → New assignment.
   - Customer Roberts Liepins, Vehicle 204 JLM, Initial status Active: an amber line under Vehicle
     reads "This vehicle is in use by Anete Kalnina. End that rental first, or plan this one."
   - Initial status Planned: the line goes. 119 MPR with Active: no line.
2. **The refusal comes into view.** Back to 204 JLM and Active; an actual start; Select another driver →
   add Janis Krumins.
   - Scroll the dialog to the bottom and press **Create assignment**.
   - The dialog scrolls back up to Vehicle, which is red and has the focus, with "The vehicle already
     has an active assignment." under the amber line. Nothing is created.
3. **The link.** Press "that rental": Anete Kalnina's rental of 204 JLM opens.
4. **Another dialog.** On that rental, Record interruption:
   - fill it in with a note and an Ended at before its Started at;
   - scroll to the bottom and press **Record interruption**: the dialog scrolls to Ended at, red and
     focused, with "EndedAtUtc must be later than StartedAtUtc.";
   - or, as Signe, Company → Edit with the email "not-an-address" and Save changes.
5. **Delete records opens on Everything.** As the administrator:
   - Show reads Everything, and the tabs read 12, 6, 4, 10, 7, 7;
   - Customers lists seven, Martins Ozols Ready with "Takes 1 rental assignment with it";
   - there is no Clear filters.
6. **Out of use.** Show → Out of use:
   - the Customers tab reads 0, "Nothing out of use here", "7 active customers are under
     Everything.";
   - **Show everything** returns to Everything;
   - under Out of use, Clear filters also returns to Everything, and the Rental assignments tab lists
     its six out-of-use rentals.
7. **Phone width** (≤ 402 px):
   - the amber line wraps under Vehicle;
   - the empty state and its button fit;
   - nothing scrolls sideways.

## 6. Decisions needed

None. Choices made where §11 left room, each reversible in a line:

1. **The link is on the words "that rental"**, so the sentence stays exactly §11's.
2. **Only In use is warned about**, as §11 says. A Reserved vehicle (a planned rental's) is not, and a
   Planned new rental is not. The overlap of two Planned rentals stays the API's refusal, now visible.
3. **The warning and the API's refusal can both show**, amber above red, if the person submits
   anyway.
4. **The warning is a slot of the shared `Field`** (`warning`), amber, so another dialog can use it.
5. **The Out of use empty state's words:**
   - the title is "Nothing out of use here";
   - each kind is named as the filter counts it: planned or active rentals, open authorizations and
     interruptions, active vehicles, customers and drivers;
   - zero and unknown each have a sentence of their own.
6. **Everything's own empty list got words of its own**, "Nothing to delete" / "There are no
   customers.", since the old sentence pointed to the filter already chosen.
7. **The address:** `show=out-of-use` for the filter, nothing for Everything. The old `show=all` still
   opens Everything. Everything comes first among the options.
8. **Beyond the 46, six more places** that showed a refusal but marked nothing now mark it (§2.1).
9. **A check read from the sources** keeps any control from setting `data-invalid` or `aria-invalid` by
   hand again.

## 7. Deviations

1. **Exports for the tests:**
   - `CompanyForm` (`CompanyProfile.tsx`) and `Initiate` (`SystemAdministrator.tsx`) are named
     exports;
   - `NewAssignment` takes an optional `initial` (customer, vehicle, status, coverage) and exports
     `Mode`, as `DeleteRecordDialog` already took `initial`.

   None changes what the app does.
2. **The browser preview on 5175**, outside the repositories, with a stub transport. Its launch entries
   in the workspace's launch file were added for it and removed afterwards.
3. **The scratch data changed** as §4.7 lists: one Planned rental made and cancelled, and one inactive
   customer deleted as a practice record, to reach an empty Out of use.
4. **The notes of Edit and Correct timeline** are tested with the live validation answer's envelope,
   keyed to `Note`. No rule of the API refuses those notes today, so there is no live refusal to
   capture; the test holds that the note marks itself when one comes.
5. **27 new tests, not 28.** The breakage run showed that a test checking only that the captured
   answers agree with each other could not fail on its own. Its lines became the start of the warning
   test.
6. **The account screens are not a dialog**, and their markup was already right; they are held by one
   render test of the shared account form and by the source check.

## 8. Open risks

1. **The owner's app already shows this.** 5173 runs from this worktree, which is now on
   `followup-11`, so the owner sees Follow-up 11 before `main` is fast-forwarded. All of it works with
   the round-9 API on 5001; nothing on the backend changed.
2. **The warning reads the vehicle list as the dialog loaded it.** If someone else starts a rental of
   that vehicle meanwhile, no warning shows, and the API's refusal, now brought into view, does the
   job.
3. **Two older limits, unchanged:**
   - the new-rental dialog offers the first 100 vehicles;
   - an empty list's pager reads "1 / 0".
4. **The Out of use words follow the backend's filter** (`RecordDeletionRules`: cancelled or ended,
   stopped, ended, inactive). If that meaning changes, one table in `src/format/recordDeletion.ts`
   follows.
5. **Two behaviours are held by the browser, not by the suite:** the dialog's effect calling the scroll
   (A7) and where Show everything leads (D4). A DOM in the tests (jsdom or similar) would hold them
   there; it is a new development dependency, not added in this run. Option: add one in a later
   follow-up if the owner wants these in the suite.

## 9. Commits

On `followup-11`, from `main` at `ae067ac`:

| Commit | Group | Files |
|---|---|---|
| `8fe6531` | every control marks a refused field the one shared way; the dialog's scroll and focus named | `src/ui/Field.tsx` (the comment), `src/ui/Dialog.tsx`, `src/ui/CheckCard.tsx`, `src/pages/fleet/NewAssignment.tsx` (the controls and the coverage), `src/pages/fleet/AssignmentDialogs.tsx`, `src/pages/fleet/FleetDialogs.tsx`, `src/pages/admin/CompanyProfile.tsx`, `src/pages/admin/SystemAdministrator.tsx`, `src/pages/admin/DeleteRecordDialog.tsx`, `src/pages/users/UserDialogs.tsx`, `src/pages/account/AuthLayout.tsx`, `src/pages/account/Register.tsx`, `src/pages/account/SignIn.tsx` |
| `905aa2f` | the in-use warning under Vehicle | `src/ui/Field.tsx` (the warning slot), `src/ui/Field.module.css`, `src/pages/fleet/NewAssignment.tsx` (the warning and its starting state) |
| `36cd9f3` | Delete records opens on Everything, with the tests that assumed the old default | `src/pages/admin/DeleteRecords.tsx`, `src/format/recordDeletion.ts`, `src/ui/EmptyState.tsx`, `src/pages/followup8.render.test.ts`, `src/pages/followup10.render.test.ts` |
| `ed22493` | the tests, from the scratch stack's answers | `src/pages/followup11.support.ts` (new), `src/pages/followup11.render.test.ts` (new), `src/pages/followup11.dialogs.render.test.ts` (new) |
| this one | the report | `Context/wiring_report.md` |

The two files that carry both F11-1 and F11-2 were committed in two steps: their F11-1 version was put
into the index for the first commit, without rewriting the worktree that 5173 reloads from.
