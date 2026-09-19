# Frontend Wiring — Follow-up 7, second batch (the owner's check on real data)

> The second batch of Follow-up 7 (`Context/wiring_followups.md` §7, "Second batch"):
> - F7-6: who created and who last changed each record.
> - F7-7: the person on each row of the Overview's activity card.
> - F7-8: a person's own session revocations in the security history.
>
> It ran in the same agent run as the backend's round 6
> (`RWRentApi-wiring/Context/round6_report.md`), after it, against the API rebuilt from that round.
> Worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`. Written
> 2026-09-19. It replaces the first batch's report, which git history keeps (`e578893`).
>
> **The owner's data was never touched.** It is in `rwrent_v1`, behind the API on 5001 and the app
> on 5173. Every check of this run used the scratch stack: the API on 5002 over the seeded
> `rwrent_check`. **For the owner's reviewer: §5 lists the steps that need the seed password typed
> into the app, on 5174 and 5002.** The implementing agent may not type a password into a page. Every
> other step of the joint check ran and passed.

## 1. Summary

| Commit | What |
|---|---|
| `8a7e5ac` | Wiring 23: who created and who last changed each record, the person on each activity row, the own-revocation entries |
| (this one) | Wiring 24: this report |

- `npm run typecheck` is clean.
- `npx vitest run` is green: **253 tests across 23 files**, up from 227 across 20. §2.5 lists the 26
  new ones.
- `npm run build` is green, with the chunk-size warning it already had (565.25 kB before, 565.71 kB
  now).
- `package.json` is unchanged, and no `.module.css` file was touched. Markup was added only where
  the items ask for it: one "Recorded by" line per authorization and interruption row, and the name
  on the activity card's small line. The two record facts reuse the existing `Fact` and its second
  line.

**F7-6.** The five record pages show "Created" and "Last changed" in the record facts they already
had, each with the person's name and then the local time. The pages are the vehicle, the customer,
the driver, the assignment and the company. A record nobody changed says "Not changed since it was
created". Every authorization and interruption row of an assignment says "Recorded by" and the
name, as a table row and as a phone card. "System" appears only where the record names nobody,
which is the technical actor.

**F7-7.** Each row of the Overview's "Recent security activity" card names the person on its small
line, before the time: "Dita Smite · 19 Sep, 09:41". The technical actor reads "System".

**F7-8.** `Session.Revoked` and `Session.OthersRevoked` have their labels ("Session · Revoked",
"Session · Others revoked") and are offered in the audit's event filter. The entry page reads the
revoke-others count as "Sessions ended".

The joint check ran on the scratch stack. All 44 API checks passed on fresh records, created by
Karlis Zvaigzne and changed by Signe Priede, with Dita Smite's own revocations. The app's screens
were then rendered from those live answers (§4.3), and they show what §4.3's table lists.

## 2. Implemented

### 2.1 F7-6 — who created and who last changed each record

- **The record facts.** The Record panel of the vehicle, customer, driver and company pages, and
  the assignment's Lifecycle panel, had "Created" (a time) and "Last updated" (a time or "Never").
  They now read:
  - **Created**: the creator's name, with the local time on the fact's second line;
  - **Last changed**: the last changer's name with the local time, or "Not changed since it was
    created".

  The wording is the ledger's. The `Fact` component already had the second line (`sub`), so no
  markup was added. The assignment's Corrections tab repeats the last-changed fact beside the
  concurrency token, and it changed the same way (§7.1).
- **The rows.** On an assignment's "Authorized drivers" tab, each row says "Recorded by <name>" in
  its secondary text, under the driver's name and licence. On the "Interruptions" tab, it sits under
  the reason chip, the cell that stays visible at every width (§7.2). Below 768 pixels the rows are
  cards, and the line joins each card's secondary text.
- **The driver's history.** Its synthetic "Created" row said "Not recorded" for the acting user. It
  now names the creator the record carries, as the Record panel below it does (§7.3).
- **The names.** Everything comes from the record's own `createdByDisplayName` and
  `updatedByDisplayName` (backend AUDIT-010), through `src/format/recordNames.ts`:
  - `createdByName`: the name, or "System" when the record names nobody. Every record has a
    creator, so that is the technical actor.
  - `lastChangedByName`: "Not changed since it was created" while `updatedAtUtc` is empty;
    otherwise the name, or "System".
  - `recordedBy`: the row line.

  No user id is on the record, so the names are not links.

### 2.2 F7-7 — the person on each activity row

`Overview.tsx` adds `auditActorName(entry)` to each row: the entry's own actor name, or "System"
for the technical actor. It goes on the row's existing small line, the card's small-text style,
before the time: `{who} · {when}`. The card's filter of routine sign-ins and sign-outs is
unchanged.

### 2.3 F7-8 — the two own-revocation entries

- `src/format/labels.ts`: the Session group of the event catalogue gains `Revoked` and
  `OthersRevoked`. The catalogue drives both the labels and the event filter.
- `src/format/auditPayload.ts`: `RevokedCount`, the after-payload of `Session.OthersRevoked`, is
  labelled "Sessions ended". The entry page's "Recorded values" panel shows it as a fact, for
  example "Sessions ended 3". The page's markup is unchanged.

### 2.4 `dto.ts` follows the round-6 document

- The seven record responses gain `createdByDisplayName?: string | null` and
  `updatedByDisplayName?: string | null`, as the live `/openapi/v1.json` of the round-6 build
  declares them: nullable, not required.
- `DriverAuthorizationHistoryItemResponse` and `InterruptionListItemResponse` used to extend the
  record types. They now extend them without the two names, as the live schemas list them.
- **One older mismatch surfaced and was corrected.** `RentalAssignmentResponse` extended the list
  item, and so claimed its four coverage counts: `openAuthorizationCount`, `openNamedDrivers`,
  `hasOpenCollectiveAuthorization` and `openInterruptionCount`. The API's record has never carried
  them. The record type now omits them. No code read them from a record; the assignments list and
  the Overview's planned-work check read them from list items. The render fixtures (§2.5) are the
  API's own responses, typed as the DTOs, and that is how the mismatch surfaced.

### 2.5 Tests, and whether they can fail

New:

- `src/format/recordNames.test.ts` (7): the creator's name or "System"; the last changer's name,
  "System", or "Not changed since it was created", which wins whatever a name says; the row line.
- `src/format/labels.test.ts` (+1, and two entries in its list of the backend's event types): both
  new types labelled and offered in the filter. The list was re-read from the backend's source, and
  it matches exactly.
- `src/format/auditPayload.test.ts` (+1): `{"RevokedCount": 3}`, spaced exactly as the API stores
  it, reads "Sessions ended 3".
- `src/pages/followup7b.render.test.ts` (15): the five record pages, the assignment's tabs, the
  driver's history, the activity card, the entry page and the audit list, each rendered to markup
  with the real permission provider and router:
  - creator, changer and times;
  - "Not changed since it was created";
  - "System" only for the technical actor, and never on a record people made;
  - "Recorded by" on every row;
  - the activity rows, with "System";
  - "Sessions ended";
  - both labels in the list and the filter.
- `src/pages/followup7b.phone.render.test.ts` (2): the authorization and interruption cards below
  768 pixels, with the tier set by a `vi.mock` of `useTier`.
- `src/pages/followup7b.support.ts`: the shared render harness, and the fixtures. The fixtures are
  the round-6 API's own responses from the scratch stack: a vehicle, customer, driver and assignment
  Karlis created and Signe changed, a seeded vehicle nobody changed, the company, and Dita's two
  entries.

Nine deliberate breakages were each caught. Every file was restored byte for byte, and a hash of
the tree matched the one taken before.

| # | Breakage | Failing test files |
|---|---|---|
| FM1 | a creator without a name is not "System" | recordNames, the render tests |
| FM2 | a record never changed names a changer anyway | recordNames, the render tests |
| FM3 | the interruption row loses its line | the render tests |
| FM4 | the activity card drops the person | the render tests |
| FM5 | the catalogue forgets `Session.OthersRevoked` | labels, the render tests |
| FM6 | the count keeps its raw name | auditPayload, the render tests |
| FM7 | the driver history says "Not recorded" again | the render tests |
| FM8 | the vehicle keeps "Last updated" | the render tests |
| FM9 | the phone authorization card loses its line | the phone render test |

No existing test was changed, skipped or weakened. Round 5's render tests pass unchanged.

## 3. Not implemented or partial

### 3.1 The steps that need a password typed into the app

The implementing agent may not type a password into a web page, not even the seed password. The
signed-in screens were therefore checked two ways:

- rendered by the test suite (§2.5);
- rendered from the live answers of the joint check (§4.3).

The same screens in a browser, signed in on the scratch app, are the owner's reviewer's steps in
§5.

*Side:* the checking run. *Option:* the reviewer runs §5 with a headless browser, in a browser
profile separate from the owner's (§8.1).

Everything else in the batch was built.

## 4. Verification — the joint check

All of it ran on the scratch stack: the API on 5002, `rwrent_check`, seeded sample data. The
people are the seeded ones:

- Karlis Zvaigzne (Fleet Manager) creates.
- Signe Priede (Principal) changes, and reads the audit.
- Toms Rudzitis (Viewer) reads.
- Dita Smite revokes her own sessions.

The seed password came from the owner for this session only, through the environment of each
command.

### 4.1 The record reads through the API

The acceptance script ran once more, after the app was finished, on fresh records. All 44 checks
passed:

| Checks | What | Result |
|---|---|---|
| 1–3 | a seeded vehicle and the seeded company, read by the Viewer | created by "Karlis Zvaigzne" and by "Arturs Veidenbaums"; the Viewer's `GET /api/users/<administrator>` answers 403, yet the name reaches him |
| 4–11 | Karlis creates a vehicle, a customer, a driver, an active assignment with one authorization, a second authorization and an interruption | every create response and every read names "Karlis Zvaigzne"; nothing changed yet |
| 12–18 | Signe changes the five records, stops the first authorization and updates the interruption | every response names "Signe Priede" with an instant inside the request's window |
| 19–28 | the Viewer reads everything back, including the assignment's own two lists | "Signe Priede" with the instant; the untouched authorization names only Karlis |
| 29–34 | the six lists | no item carries a name |

### 4.2 The two own-revocation entries

| Checks | What | Result |
|---|---|---|
| 35–37 | Dita ends one other session from her profile, then the same one again | 1 session ended, then 0; the ended session answers 401 |
| 38–39 | Dita ends every other session, then again | 3 ended (the two made here, one left by an earlier run), then 0 |
| 40–41 | Signe reads `Session.Revoked` | exactly one new entry: actor and target "Dita Smite", the session, the Company |
| 42–44 | Signe reads `Session.OthersRevoked` | exactly one new entry, against Dita's current session, with the Company and `{"RevokedCount": 3}`, the same count the response gave; opens by id |

The unhappy paths are the repeats in checks 37 and 39. A revocation that ends nothing writes
nothing.

### 4.3 The app's screens, rendered from those live answers

The joint check saved what the Viewer and the Principal read at the end of §4.1. The app's own
pages were then rendered from it. The test file and its config were kept outside the worktree,
because part 3 changes nothing there. The pages show:

| Screen | What it shows |
|---|---|
| Vehicle, customer, driver, assignment | Created: Karlis Zvaigzne, 19 Sep, 09:41 · Last changed: Signe Priede, 19 Sep, 09:41 |
| Company | Created: Arturs Veidenbaums, 23 Nov 2025, 08:21 · Last changed: Signe Priede, 19 Sep, 09:41 |
| Assignment, Authorized drivers | "Recorded by Karlis Zvaigzne" on both rows |
| Assignment, Interruptions | "Recorded by Karlis Zvaigzne" |
| Overview, activity card | "Session · Others revoked — Dita Smite · 19 Sep, 09:41", "Session · Revoked — Dita Smite · 19 Sep, 09:41", "Company · Updated — Signe Priede · 19 Sep, 09:41", … |
| Entry page of `Session.OthersRevoked` | Event: Session · Others revoked · Actor: Dita Smite · Sessions ended: 3 |
| Entry page of `Session.Revoked` | Event: Session · Revoked · Actor: Dita Smite |

### 4.4 The screens rendered by the test suite

These are the 17 render tests of §2.5, from the captured round-6 responses, and all passed. They
add the cases the live data did not hold:

- a record nobody changed;
- a record created or changed last by the technical actor;
- a row the technical actor recorded;
- the phone cards;
- the driver's history row;
- the event filter.

### 4.5 The owner's side, untouched

- `rwrent_v1`: the row counts and latest-change instants of eleven tables are identical before the
  backend round (09:20) and after the joint check.
- The owner's API on 5001 runs the round-6 build over `rwrent_v1`, healthy. It was restarted once,
  by round 6 (six seconds).
- The owner's app on 5173 was not restarted; it has run since 16 Sep. It runs from this worktree
  with hot reload, so it took the new screens as they were written. It serves the changed modules
  (200), and `recordNames.ts` carries the new wording.

### 4.6 End state

| Port | What | State |
|---|---|---|
| 5001 | the owner's API, round-6 build, `rwrent_v1` | running (restarted by round 6) |
| 5173 | the owner's app | running, untouched |
| 5002 | the scratch API, round-6 build, `rwrent_check` | **left running for the reviewer** |
| 5174 | the scratch app | not running; the reviewer starts it (§5.0) |

`rwrent_check` holds the seed plus the records of the acceptance runs (§7.5). Mailpit was not used
and not cleared: none of this batch's checks sends mail, and its messages may be the owner's.

### 4.7 How it was run

- API checks: `r6_acceptance.py` through a client that can only reach port 5002. Passwords came from
  the environment.
- Renders: vitest with `react-dom/server`, the real `AccessProvider` and `MemoryRouter`, and a query
  cache pre-filled with the API's answers.
- Owner-side checks: read-only `psql` counts, `/health` and HTTP status reads.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

1. **Use a separate browser profile, or a headless browser.** Both stacks run from the same backend
   worktree, with the same cookie names (`RWRent.Auth`, `RWRent.Antiforgery`) and the same key
   ring, and a browser does not separate `localhost` cookies by port. Signing in on 5174 in the
   owner's profile would sign the owner out of 5173 (§8.1).
2. Start the scratch app from this worktree:

   ```bash
   VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort
   ```

3. When you are done, stop it (`kill $(lsof -ti tcp:5174)`). Tear down the scratch stack when the
   review is over: stop the API with `kill $(lsof -ti tcp:5002)`, then run
   `DROP DATABASE rwrent_check WITH (FORCE)` from the `rwrent_v5_postgres` container.

### 5.1 The steps

The records made by the acceptance have plates starting with "R6"; pick the newest.

1. **Karlis's record, changed by Signe.** Sign in as `signe.priede@rwrent.example`. Open the newest
   "R6…" vehicle. The Record panel reads "Created: Karlis Zvaigzne" with a time on the second line,
   and "Last changed: Signe Priede" with a time. Do the same on its customer, its driver (the
   driver's history, visible to the Principal, names Karlis on its Created row) and its rental
   assignment (Lifecycle panel).
2. **Nobody changed it.** Open a seeded vehicle other than the R6 ones, for example "119 MPR". It
   reads "Created: Karlis Zvaigzne" and "Last changed: Not changed since it was created".
3. **The rows.** On that R6 assignment:
   - "Authorized drivers": each row has "Recorded by Karlis Zvaigzne" under the driver.
   - "Interruptions": the line is under the reason.
   - Narrow the window below 768 pixels: the cards carry the same line.
   - "Corrections" (the administrator, `sysadmin@rwrent.example`): "Last changed" beside the
     concurrency token.
4. **The company.** On the Company page: "Created: Arturs Veidenbaums", "Last changed: Signe Priede".
5. **A change in the app, by a second person.** As Karlis (`karlis.zvaigzne@rwrent.example`), edit
   that vehicle (the colour, say) and save. The Record panel's "Last changed" now reads "Karlis
   Zvaigzne" with the new time. Sign in as Signe, edit it again: "Signe Priede".
6. **The activity card.** As Signe, on the Overview: each row of "Recent security activity" reads
   "<name> · <time>", Dita's rows among them.
7. **Own revocations, in the app.** Sign in as `dita.smite@rwrent.example` in two separate contexts.
   From the first, on Profile → Sessions:
   - press "Revoke" on the other session: the entry is `Session.Revoked`;
   - sign in once more elsewhere, then press "Revoke other sessions" and confirm: the entry is
     `Session.OthersRevoked`.

   As Signe, in Security audit, filter "Session · Revoked" and then "Session · Others revoked". Each
   shows Dita's entry, named. Open the second: "Sessions ended" with the number the profile page
   reported.
8. **Nothing to revoke.** As Dita, press "Revoke other sessions" again with no other session:
   Signe's list gains no entry.

## 6. Decisions needed

None.

## 7. Deviations

1. **The Corrections tab's fact changed too.** The ledger names the record facts. The assignment's
   Corrections tab shows the same "Last updated" fact beside the concurrency token, so it became
   "Last changed" with the name, so one page never says both.
2. **Where "Recorded by" sits.** The From and Period columns are 136 pixels wide, and a name there
   would wrap. The line sits under the driver in the authorization row, in the wide Driver column.
   In the interruption row it sits under the reason chip, the one cell that stays visible at every
   width; the Note column folds away.
3. **The driver's history row.** Its synthetic Created row now names the creator instead of "Not
   recorded". This was not asked, but left as it was, the row would contradict the Record panel on
   the same page.
4. **The assignment record's type** omits the list item's four counts (§2.4). This is type-only,
   and it was found by the API-typed fixtures.
5. **The acceptance ran five times on the scratch stack:** four during the backend round (three
   stopped by faults in the script) and once for this joint check. Each run made its own records, so
   `rwrent_check` holds several R6 sets, and Dita's revoke-others counts include sessions an earlier
   run left open.
6. **The live render ran from outside the worktree**, with a scratch config reusing the app's own
   sources, because part 3 changes nothing in the worktree.

## 8. Open risks

1. **Cookies are shared between 5173 and 5174** in one browser profile (§5.0). Only a reviewer who
   ignores §5.0 can trip on it, but the price is the owner being signed out.
2. **The ended-sessions count counts sessions, not devices in use.** Revoke-others ends every
   session not yet revoked, including ones that had already lapsed by idle time. The seeded ones
   show this, and the backend report has the details.
3. **Names are read-time names.** After a name correction, an older record shows the new name.
4. **An API older than round 6** would send no names, and the pages would then read "System"
   everywhere. The app and the API are deployed together, and 5001 runs round 6.
5. **Hot reload reached the owner's app as the code was written.** The owner's app on 5173 runs
   from this worktree, so it saw each edit as it landed. No broken state was saved at a checkpoint:
   the typecheck, tests and build passed before the commit.
