# Frontend Wiring — Follow-up 9, the Delete records page follows the hierarchy of deletion

> Follow-up 9 (`Context/wiring_followups.md` §9): the app's half of the backend's round 8, which the
> owner decided on 2026-09-21 and the reviewer verified on 2026-09-22. The contract is the live
> OpenAPI document of the scratch API, explained by `RWRentApi-wiring/Context/round8_report.md` §5 and
> the DELETE rules in `RWRentApi-wiring/Context/business_rules.md`. Worktree
> `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`. Written 2026-09-22.
> It replaces Follow-up 8's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001 and never wrote to `rwrent_v1`, whose read-only fingerprint is the same at the end as at
> the start.
>
> - The API on 5001 still serves round 7. The reviewer restarts it only after this follow-up is
>   verified.
> - The owner's app on 5173 hot-reloads from this worktree, so until then its Delete records page
>   meets an API that does not send what the page now reads (§8.1).
> - Every live check used the scratch stack round 8 left running: the API on 5002 over `rwrent_check`,
>   from the round-8 Release build.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

The Delete records page now shows round 8's rules, and it words them without deciding any of them.

- **The rules.** A running rental is never deleted and has to be ended first. A vehicle or a
  customer is blocked only while one of its rentals runs, and otherwise goes with all of them. A
  driver is blocked only while holding the only open cover of a running rental, and otherwise goes
  with their authorizations and clears a customer's link.
- **The Deletion cell and the phone card.** Every row says, under its verdict, what a deletion would
  take along ("Takes 2 rental assignments, 2 driver authorizations and 1 interruption with it" /
  "Clears the driver link of 1 customer record" / "Nothing else goes with it"). A blocked row names
  the running rentals in its way, each a link to the rental.
- **The dialog.** It counts what goes in its consequences and in the tick's hint.
- **After a deletion.** The confirmation line reports what went, from the deletion's own answer.
- **A refusal.** A record that became blocked is refused in the API's own sentence, with Refresh.
- **The security audit.** It reads round 8's copies: a vehicle's or a customer's rentals, a driver's
  authorizations and cleared customer links, and the new "Removed with driver" entry.

| | |
|---|---|
| Commits | four `Wiring 27` commits and this report's `Wiring 28`, pushed (§9) |
| Tests | 305 → **330**, all green: 25 new, 15 of Follow-up 8's tests rewritten to round 8's rules (§2.6); the only other existing-test change is the event catalogue literal |
| Breakages | 32 deliberate breakages, **32 caught**; every new or rewritten test fails against at least one |
| Typecheck, build | green. The app code typechecks at every commit; the whole project, tests included, typechecks from the tests commit on. The build's chunk-size warning predates this run |
| Joint check on 5002 | **28/28** API checks, each rule once in each direction; **22/22** screens rendered from those live answers |
| New runtime dependency | none |
| `Context/prototype`, `wiring_followups.md` | untouched |
| The owner's side | 5001 and 5173 never used; `rwrent_v1` unchanged |

## 2. Implemented

### 2.1 The contract (`src/api/dto.ts`), §9 point 1

- **`RecordDeletionBlockReason`** keeps 4 (`OnlyOpenAuthorizationOfActiveRental`) and gains 5
  `RentalIsRunning`, 6 `HasRunningRental` and 7 `DriverHoldsOnlyOpenAuthorizationOfRunningRental`.
  Values 1–3 are gone.
- **`RecordDeletionInfo`** gains `takes` (`RecordDeletionTakes`: `rentalAssignments`,
  `driverAuthorizations`, `interruptions`, `customerLinksCleared`).
- **`RecordDeletionResponse`** gains `deletedRentalAssignmentCount` and `clearedCustomerLinkCount`.
  Its two older counts are documented as counting everything that went.
- **Checked against the API.** The fixtures are the API's answers typed as these DTOs, so a member the
  API sends and `dto.ts` does not declare fails the typecheck. None does.

### 2.2 The words (`src/format/recordDeletion.ts`), §9 point 2

- **The four reasons**, singular and plural:
  - 4 unchanged: "An active rental must keep at least one authorization";
  - 5: "This rental is running. End it first; then it can be deleted";
  - 6: "A running rental refers to this vehicle|customer. End it first", or "2 running rentals refer
    to this customer. End them first";
  - 7: "This driver holds the only open authorization of a running rental", or "… of 2 running
    rentals".
- **`takesSentence`** builds the takes sentence: the records that go in the order rentals,
  authorizations, interruptions, then the cleared links, only the parts that are not zero, or
  "Nothing else goes with it".
- **`deletionConsequences(kind, takes)`, `cannotBeRestored(kind, takes)` and `wentWith(response)`**
  build the dialog's consequences, the tick's hint and the confirmation's middle sentence.
- **`deletionRefusal(code, apiDetail)`** takes the API's `detail` as the bold line of a blocked
  refusal.

### 2.3 The page (`src/pages/admin/DeleteRecords.tsx`), §9 points 3 and 5

- **The Deletion cell.** The chip as before. Under it:
  - for a Blocked row, the reason with its running rental(s), then the takes sentence;
  - for a Ready row, the takes sentence.

  A blocked row keeps its takes sentence because the numbers stay true once the block is lifted.
- **The phone card** carries the same lines: the reason in the warn ink, the links, and the takes
  sentence as a quiet line.
- **The blocking records.** Every one is a running rental now, so every one links to
  `/rental-assignments/{id}`. Follow-up 8's special case — a blocking authorization opening its
  driver's page — is gone, and that open item of Follow-up 8 is settled.
- **Unchanged:** the Parts column of rentals.
- **The confirmation line**: "Customer deleted: <label>. 2 rental assignments, 2 driver
  authorizations and 1 interruption went with it. Written to the security audit." The middle
  sentence appears only when something went, and the cleared links have one too.

### 2.4 The dialog (`src/pages/admin/DeleteRecordDialog.tsx`), §9 points 4, 5 and 6

- **No running-rental banner.** The "This rental is active" variant is removed: a running rental
  never reaches the dialog Ready, and the API refuses it anyway.
- **The consequences** are built from the row's `takes`, with exact counts:
  - a rental: its own parts, as before;
  - a vehicle or a customer: "Its 2 rental assignments, with 2 driver authorizations and 1
    interruption, are removed with it." and who stays (§7.1);
  - a driver: "Their 2 driver authorizations are removed from the rentals they were on; those rentals
    stay." and "The link of 1 customer record to this driver is cleared; the customer stays.";
  - every kind keeps the audit line.
- **The tick's hint** names the numbers: "This vehicle and the 2 rental assignments, 2 driver
  authorizations and 1 interruption cannot be restored from the app.", or only the record when
  nothing goes.
- **Invalidation grows with the cascade:**
  - a vehicle's or a customer's deletion also makes stale the rentals, the interruptions and the
    drivers' histories;
  - a driver's also makes stale the customers and the rentals.
- **`record_deletions.blocked`** keeps its stale-style banner with Refresh. Its text is now the API's
  own `detail`, e.g. "One of its rental assignments is running (Active). End it first; then the
  record can be deleted with its rentals." A record that left the list keeps the app's words.

### 2.5 The security audit, §9 point 7

- **`AUDIT_EVENTS`** gains `DriverAuthorization.RemovedWithDriver`, labelled "Driver authorisation ·
  Removed with driver". The event filter offers it.
- **`deletedRecord`** (`auditPayload.ts`) learns round 8's copies:
  - `RentalAssignments` on a vehicle's or a customer's entry, each with its own `RecordLabel`,
    `Authorizations` and `Interruptions`;
  - `Authorizations` and `ClearedCustomerLinks` on a driver's entry;
  - the flat copy of a `RemovedWithDriver` entry, with `DeletedWithRecordLabel`.

  Any other shape falls back as before: an unknown list, a rental carrying an unknown list, a link
  without a name, a `RemovedWithDriver` copy without the driver or with a list.
- **The entry page** (`AuditEntry.tsx`):
  - **"Deleted rental assignments"**: one titled group per rental ("Rental assignment 1 · F9O D09 ·
    Lake House D09F"), with its parts as quieter sub-groups;
  - **"Cleared customer links"**: one line per customer;
  - **"Removed with driver"**: a fact naming the driver, with the authorization's copy as "Deleted
    record";
  - **a driver's authorizations** use the existing "Deleted authorizations" panel.

### 2.6 Tests, §9 point 8

330 tests, all green: 25 new, and 15 of Follow-up 8's rewritten.

**The fixtures were captured again.** Follow-up 8's fixtures were round-7 answers. They no longer
typecheck against round 8's contract: they lack `takes`, and some use reasons 1–3. So they were
captured again from the round-8 scratch API, not edited by hand.

- `src/pages/followup8.support.ts` keeps Follow-up 8's names where a record still plays its part.
  - `customerBlocked` is now Baltic Freight Partners: Daugava Construction has no running rental any
    more and is Ready.
  - `driverBlockedTwice` is gone, since no driver carries two blocks now.
  - `driverReadyWithAuthorization` (Laura Ozola) is new.
- `src/pages/followup9.support.ts` holds the round-8 scenarios:
  - a vehicle and a customer that take rentals, and a customer and a driver blocked by two running
    rentals;
  - a driver with authorizations and a customer link;
  - the deletions and their entries, a `RemovedWithDriver` entry, and the API's refusals.

**The rewritten tests: Follow-up 8's tests of the rules round 8 replaced, old and new expectation.**

| # | Test (old → new name) | Old expectation | New expectation |
|---|---|---|---|
| 1 | `recordDeletion` "rental assignments that refer to a vehicle, or to a customer" → "a running rental that refers to a vehicle, or to a customer" | "1 rental assignment refers to this vehicle" / "2 … refer to this customer" | "A running rental refers to this vehicle. End it first" / "2 running rentals refer to this customer. End them first", also from the API's count |
| 2 | "driver authorizations that refer to a driver" → "a driver who holds the only open authorization of a running rental, or of several" | "1 driver authorization refers to this driver" | "This driver holds the only open authorization of a running rental" / "… of 2 running rentals" |
| 3 | "a customer record linked to a driver" → "a customer record linked to a driver blocks nothing: its link is what the deletion clears" | block "A customer record is linked to this driver record" | takes "Clears the driver link of 1 customer record" / "2 customer records", and the combined driver sentence |
| 4 | "the two driver reasons at once make one sentence joined with 'and'" → "a running rental is refused by its own reason" | the two reasons in one sentence | "This rental is running. End it first; then it can be deleted" (round 8 gives a record one block at most) |
| 5 | "a rental's consequences count its own parts, in the singular and the plural" (name kept) | parts from `{authorizations, interruptions}` | the same three sentences from the row's `takes` |
| 6 | "every kind ends with the audit line, and the others say what stays" → "…; a vehicle, a customer and a driver say what they take along" | "No rental assignment refers to this vehicle, so nothing else changes." and the driver's twin | the rentals line with numbers, who stays, "Nothing else goes with it." for zero, the driver's authorizations and link lines |
| 7 | "a record that became blocked, or left the list, is refused with its own sentence and Refresh" → "… in the API's own words; one that left the list in the app's" | the app's own title per kind ("This vehicle now has a rental assignment.") | the API's `detail` as the title; a record that left the list unchanged |
| 8 | `recordDeletions` "a record that became blocked is refused with its own sentence and Refresh" → "… in the API's own sentence for its reason, with Refresh" | "This vehicle now has a rental assignment." | the captured refusal's own sentence |
| 9 | `followup8.render` "vehicles: an inactive one nothing refers to is Ready, one two rentals refer to is Blocked and names them" → "vehicles: … one with a running rental is Blocked and names it" | "2 rental assignments refer to this vehicle", both rentals linked | reason 6 naming its one running rental, the takes sentence; the Ready row "Nothing else goes with it" |
| 10 | "customers: … a rental that blocks a business customer" → "… a running rental that blocks …" | a count sentence on Daugava Construction | reason 6 on Baltic Freight Partners, linking its running rental |
| 11 | "drivers: both of a driver's blocks in one sentence, the linked customer and the authorization named" → "drivers: the only open cover of a running rental blocks a driver and names that rental; a link does not block" | two blocks; the authorization linked to the driver's page | reason 7 linking the running rental; the link in the takes sentence; Laura Ozola Ready |
| 12 | dialog "names the record, warns that it cannot be undone, and says what it does" (name kept) | "No rental assignment refers to this vehicle, so nothing else changes." | "Nothing else goes with it." and the tick "This vehicle cannot be restored from the app." |
| 13 | "an Active rental says so instead, and counts the parts that go with it" → "a rental's dialog has no running-rental variant any more, and counts the parts it takes" | the "This rental is active" banner | the ordinary banner; the parts from `takes`; the tick names them |
| 14 | `followup8.phone` "a blocked card writes its reason, names the records in the way…" → "… names the running rental in the way…" | "2 rental assignments refer to this vehicle" | "A running rental refers to this vehicle. End it first" |
| 15 | "a rental card spans its parts…, and a driver card carries both of its blocks" → "…, and a driver card carries its block and what it would take" | the two-block sentence | reason 7 and the takes sentence |

**Two smaller changes to existing tests:**

- Three `recordDeletions` tests changed only their call, `deletionFailure(kind, error)` →
  `deletionFailure(error)`, with the same expectations.
- `labels.test.ts`'s backend event catalogue gains `DriverAuthorization.RemovedWithDriver`.

**The 25 new tests:**

| File | New | What they hold |
|---|---|---|
| `src/format/recordDeletion.test.ts` | 3 | the takes sentence in its order, singulars and plurals, and "Nothing else"; the tick's hint; the confirmation's middle sentence |
| `src/format/deletedRecord.test.ts` | 5 | a vehicle's and a customer's rentals, a driver's authorizations and cleared links, a `RemovedWithDriver` copy, eight round-8 shapes that fall back |
| `src/api/recordDeletions.test.ts` | 1 | what each cascade makes stale |
| `src/pages/followup9.render.test.ts` | 14 | a Ready vehicle and driver with their takes; a Blocked row of each reason with its rental links (the plurals from the API's counts); the dialogs of a vehicle, a customer and a driver with the numbers in the consequences and the tick; the confirmation line; the event filter; the entries of a customer with rentals, a driver with cleared links, and a `RemovedWithDriver` entry |
| `src/pages/followup9.phone.render.test.ts` | 2 | a Ready card with its takes line; a blocked card with its reason, both rental links, its takes line and a disabled Delete… |

**Every new or rewritten test can fail.**

- 32 breakages were planted one at a time and run against the deletion tests. Each file was
  restored byte for byte. **All 32 were caught.**
- Their JSON reports show every new or rewritten test failing against at least one breakage.
- One new test first failed against none: the reason-4 row. Its rental is also linked from the row's
  Rental column, so it could not see a broken blocker link. Its check now looks inside the Deletion
  cell, and the broken link is caught.
- What the breakages covered:
  - each reason's words and plural; the noun of reason 6;
  - the takes sentence's links, order and "Nothing else";
  - the vehicle's and the driver's consequences; the tick; the confirmation and its links;
  - the takes line in the cell and on the card; the rental links;
  - the API's refusal words;
  - the reader's lists, its nested-list guard, its link guard and its `RemovedWithDriver` event;
  - the entry's link panel, rental title and "Removed with driver" fact; the event catalogue;
  - the cascade's invalidation; a dialog counting nothing; the running-rental banner coming back.

## 3. Not implemented or partial

### 3.1 The steps that need a password typed into the app

The browser steps of the joint check need the seed password typed into the sign-in page. The
implementing agent may not do that, so they go to the owner's reviewer, on 5174 and 5002 (§5).
Everything the page shows was also checked in three other ways:

- rendered by the test suite from answers captured on the scratch stack;
- rendered again from the joint check's live answers (§4.2);
- looked at in a browser through a preview outside the worktree (§4.3).

- **Side that has to change:** none; it is a working rule.
- **Option:** the reviewer runs §5.

Nothing else of §9 is partial.

## 4. Verification: the joint check

Everything ran on the scratch stack only, as the seeded administrator, with the seeded Fleet
Manager building records and the seeded Company Principal reading the audit.

- **The scratch API** was used as round 8 left it: the API on 5002 over `rwrent_check`, from the
  round-8 Release build. It already held round 8's check records and the reviewer's probe records.
  It was not reseeded.
- **Guards.** The API client refuses any address but `localhost:5002`. The seed password came from
  the owner for this session and was passed in each command's environment; it is in no file.

### 4.1 Through the API: each rule once in each direction — 28/28

`joint9.py`, in the run's scratchpad:

- **a running rental:**
  - Blocked by reason 5, naming itself, taking its cover and interruption;
  - refused as `record_deletions.blocked` in the API's own sentence;
  - ended, it is Ready and deletes, answering exactly what the list said;
- **a vehicle:**
  - with a Planned, an Ended and a Cancelled rental, Ready, taking 3 rentals, 3 covers and 1
    interruption; it deletes with the same numbers, and the Principal reads its three rentals;
  - with an Ended and a running rental, Blocked by reason 6, naming only the running one and still
    counting both;
- **a customer with two running rentals:**
  - Blocked by 6 with a count of 2, and their driver by 7 with a count of 2;
  - one ended, still Blocked by 1; both ended, Ready; it deletes with the same numbers;
  - the vehicles and the driver stay;
- **a driver with a cover beside a colleague's and a linked customer:**
  - Ready, taking 2 authorizations and 1 link; deletes with the same numbers;
  - the customer stays with the link cleared; the Principal reads the copy;
  - the running rental's own history holds the `RemovedWithDriver` entry, and the rental runs on
    under the colleague;
- **the only open cover of a running rental:** Blocked by 4, and its driver by 7; a second cover
  frees both;
- **an interruption:** Ready, taking nothing, labelled "Car repair · …";
- **a conflict raised by the data:** a vehicle Ready when read, then claimed by a running rental, is
  refused in the API's own sentence;
- **Recently deleted** lists the run's deletions newest first, the driver once;
- **every tab's count** agrees with its list under both filters;
- **the audit's event filter** finds `RemovedWithDriver` for the Principal.

### 4.2 The screens, rendered from those live answers — 22/22

`joint/joint9.live.test.ts`, run from outside the worktree with a scratch config that reuses the
app's sources. It fed the live answers to the real components:

- every live row through the page: its chip, its reason, a link to each running rental, the disabled
  Delete… with the reason, and its takes sentence;
- the dialogs of the live vehicle and driver;
- the four live confirmation lines;
- Recently deleted with the driver once;
- the two live refusals, in the API's words with Refresh;
- the live entries of the vehicle, the customer and the driver, and the `RemovedWithDriver` entry.

### 4.3 In a browser

- **The app on 5174.** It was started against 5002, from this worktree: `VITE_API_BASE_URL=
  http://localhost:5002 npm run dev -- --port 5174 --strictPort`. `/delete-records` sent the
  signed-out visitor to Sign in, and the app's requests went to 5002 only. No sign-in was made.
  5174 is stopped.
- **The preview on 5175.** A preview outside the worktree rendered the real page, dialog and entries
  with the captured answers in the cache, with no API. I looked at it:
  - at 1512: every column fits;
  - at 834: nothing scrolls sideways, and the Deletion cell wraps its reason, links and takes;
  - at 375: cards with their own Delete…, the reason in warn ink, and the takes line;
  - the vehicle and driver dialogs, and the three new audit views;
  - the console showed no errors.

  It was stopped afterwards. The two launch entries added for 5174 and 5175 to the workspace's
  launch file, outside the repositories, were removed again.

### 4.4 The test suite, and each commit

- Typecheck green, `npm test` 330/330, `npm run build` green.
- Each commit alone, in a clean copy outside the worktree:
  - the app code typechecks at every commit;
  - the whole project typechecks from `f02ae81` on;
  - before that commit, the 43 errors are Follow-up 8's tests and fixtures still in round 7's shape.

  A planted error proved the check real.

### 4.5 The owner's side, untouched

- 5001 and 5173 were never opened, called or signed into, and run on the processes they had.
- `rwrent_v1`'s read-only fingerprint — the row counts of eleven tables and the latest write in ten
  of them — is identical at the start and at the end.
- The backend worktree was only read.

### 4.6 End state

- The scratch API runs on 5002 **for the reviewer**, over `rwrent_check`. It holds the joint check's
  records and a practice driver for step 5.6: Dace Ozolina, Ready, taking 2 authorizations and
  clearing her own customer record's link.
- My Vite on 5174 and the preview on 5175 are stopped.
- The main checkouts are untouched.
- The worktree is clean and pushed.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

1. **Use a separate browser profile, or a headless browser.** Both stacks share the cookie names and
   the key ring, and a browser does not separate `localhost` cookies by port. Signing in on 5174 in
   the owner's profile would sign the owner out of 5173.
2. Start the scratch app from this worktree:

   ```bash
   VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort
   ```

3. Afterwards, stop it with `kill $(lsof -ti tcp:5174)`. The scratch API on 5002 stays until the
   review is over.

### 5.1 The steps

Sign in as `sysadmin@rwrent.example` unless a step says otherwise, then Administration → Delete
records, with Show set to **Everything**.

1. **The running rental.** Rental assignments: 204 JLM · Anete Kalnina is Blocked.
   - It reads "This rental is running. End it first; then it can be deleted".
   - The rental itself is linked under the reason.
   - It reads "Takes 1 driver authorization and 1 interruption with it".
   - Its Delete… is disabled, with the reason as its hint.
2. **A vehicle with a running rental.** Vehicles: 482 TKL reads "A running rental refers to this
   vehicle. End it first", links 482 TKL · Baltic Freight Partners, and reads "Takes 2 rental
   assignments, 2 driver authorizations and 1 interruption with it".
3. **The plurals.**
   - Customers: Two Cars D09F reads "2 running rentals refer to this customer. End them first", with
     two links.
   - Drivers: Ilmars Kronbergs reads "This driver holds the only open authorization of 2 running
     rentals".
   - Anete Kalnina reads reason 7 and "Takes 1 driver authorization with it. Clears the driver link
     of 1 customer record".
4. **A Ready row.** A row with nothing below it reads "Nothing else goes with it", for example
   Normunds Zarins under Drivers.
5. **A customer who takes rentals.**
   1. Customers: open Delete… on Daugava Construction (Ready, "Takes 2 rental assignments with it").
   2. The dialog reads "Its 2 rental assignments are removed with it." and "The vehicles and drivers
      of those rentals stay as they are.".
   3. The tick's hint reads "This customer and the 2 rental assignments cannot be restored from the
      app.".
   4. Choose a reason, tick, and delete.
   5. Expect the line "Customer deleted: Daugava Construction. 2 rental assignments went with it.
      Written to the security audit.".
   6. Its link opens the entry, which shows "Deleted rental assignments" with "Rental assignment 1 ·
      …" and "Rental assignment 2 · …".
6. **A driver who takes authorizations and clears a link.**
   1. Drivers: open Delete… on Dace Ozolina (Ready, "Takes 2 driver authorizations with it. Clears
      the driver link of 1 customer record").
   2. The dialog names both.
   3. Delete. The line reads "2 driver authorizations went with it. The driver link of 1 customer
      record was cleared.".
   4. Customers: Dace Ozolina is still there.
   5. The entry shows "Deleted authorizations" (two) and "Cleared customer links".
   6. In Security audit, filter on "Driver authorisation · Removed with driver" and open the newest
      entry: it names her under "Removed with driver".
7. **A conflict with Refresh.**
   1. Open Delete… on an active vehicle with no rentals, such as 400 NDP (its rental went with the
      fixture capture) or J904E01 · Skoda Scala 2023.
   2. As `karlis.zvaigzne@rwrent.example`, in a second separate profile, start a running rental on
      it.
   3. Submit the dialog.
   4. Expect the banner "One of its rental assignments is running (Active). End it first; then the
      record can be deleted with its rentals." with Refresh. Refresh closes the dialog and the row is
      Blocked.
8. **The phone.** Narrow below 768 pixels: every card shows its takes line; a blocked card shows the
   reason in warn ink with its rental links.
9. **Who sees the page.** Signed in as `signe.priede@rwrent.example` (Company Principal), the page is
   still "Not available to you". The Principal can open the audit entries of steps 5 and 6.

## 6. Decisions needed

None to finish this follow-up. The words that are the app's own, where §9 gave none, are listed in
§7 and can be changed on the owner's word.

## 7. Deviations

1. **Who stays is named per kind.** §9 gives "The customers, vehicles and drivers of those rentals
   stay as they are." for a vehicle or a customer. But the deleted vehicle is one side of every
   rental it takes, so the app says:
   - for a vehicle, "The customers and drivers of those rentals stay as they are.";
   - for a customer, "The vehicles and drivers of those rentals stay as they are.";
   - "that rental" in the singular.
2. **Words §9 does not give, in the app's own style:**
   - "Nothing else goes with it." in the dialog when a vehicle, a customer or a driver takes nothing;
   - "End them first" after a plural reason 6;
   - the confirmation's "The driver link of 1 customer record was cleared.";
   - the hint under "Removed with driver" ("The authorization went when this driver was deleted; the
     rental stays.");
   - the descriptions of the two new audit panels.
3. **The takes sentence** has no final full stop, like the block sentence it sits under; two
   sentences join with ". ".
4. **The tick's hint does not name cleared links.** A link is not a record that could be restored.
5. **`blockSentence`** would join several blocks as sentences rather than with "and". Round 8 gives
   a record one block at most, so this is never seen.
6. **The table's takes sentence** uses the same quiet sub-line style as the reason; on a card the
   reason is warn-coloured and the takes line quiet.
7. **The fixtures were captured again** from the round-8 API (§2.6). The scratch data holds earlier
   checks' records, so the counts in the fixtures are larger than the seed's. The capture deleted the
   seeded 400 NDP rental and made its own records, as Follow-up 8's capture did.
8. **The scratch stack was not reseeded.** It was used as round 8 and the reviewer left it; §5 names
   records that exist in it now.

## 8. Open risks

1. **Until the reviewer restarts 5001, the owner's Delete records page on 5173 will not work.** The
   owner's app hot-reloads from this worktree and now expects round 8's answers (`takes`, reasons
   5–7). The API on 5001 still sends round 7's, so the page cannot render its rows. The owner should
   not open Delete records on 5173 until the restart. The rest of the app is not affected.
2. **Cookies are shared between 5173 and 5174** in one browser profile (§5.0). Only a reviewer who
   ignores §5.0 can trip on it, but the price is the owner being signed out.
3. **The interruption reasons' words live in two places**, the app's labels and the backend's label
   words (round 8). A reason renamed in one and not the other would make the page and the audit label
   differ.
4. **Long entries.** The entry of a vehicle or a customer with a long history lists every rental with
   all its facts, which makes a long page. On this data that is nothing.

## 9. Commits

| Commit | Group | Files |
|---|---|---|
| `fe58b91` | the round-8 contract and its words, and the dialog that uses them | `src/api/dto.ts`, `src/format/labels.ts`, `src/format/recordDeletion.ts`, `src/pages/admin/DeleteRecordDialog.tsx` |
| `4a3b81a` | the page says what each deletion takes along, links every running rental, reports what went | `src/pages/admin/DeleteRecords.tsx`, `src/pages/admin/DeleteRecords.module.css` |
| `6118f67` | the security audit reads round 8's copies | `src/format/auditPayload.ts`, `src/pages/audit/AuditEntry.tsx`, `src/pages/audit/AuditEntry.module.css` |
| `f02ae81` | the tests follow round 8 | `src/pages/followup8.support.ts`, `src/pages/followup9.support.ts`, `src/format/recordDeletion.test.ts`, `src/format/deletedRecord.test.ts`, `src/api/recordDeletions.test.ts`, `src/format/labels.test.ts`, `src/pages/followup8.render.test.ts`, `src/pages/followup8.phone.render.test.ts`, `src/pages/followup9.render.test.ts`, `src/pages/followup9.phone.render.test.ts` |
| this one | the report | `Context/wiring_report.md` |
