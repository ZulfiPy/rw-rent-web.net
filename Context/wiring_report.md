# Frontend Wiring — Follow-up 7 (the owner's check on real data, first batch)

> Follow-up 7 answers what the owner found while checking the app on real data
> (`Context/wiring_followups.md` §7): F7-1 times in UTC, F7-2 the customer's driver link, F7-4 an
> actor labelled "System", and F7-5 the transfer-acceptance screen after a wrong password. F7-3 is
> the backend's. It ran in the same agent run as the backend's round 5
> (`RWRentApi-wiring/Context/round5_report.md`), after it, against the API rebuilt from that round.
> Worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`. Written
> 2026-09-18. It replaces Follow-up 6's report, which git history keeps (`e89beef`).
>
> **For the agent that checks this run: §5 lists what is still yours to run.** The database is
> empty on purpose (the owner's end state). Re-seed only before the owner starts entering real
> data again, and leave it empty afterwards (§5.0). The joint check covered every step that needs no
> real password, and all of them passed. The steps that need a real password typed into the app
> were not run (§3.3), because the implementing agent may not type one into a web page.

## 1. Summary

| Commit | What |
|---|---|
| `0f5ae10` | Wiring 21: local time everywhere, the driver link made findable, audit names from the entry, the transfer form kept after a wrong password |
| (this one) | Wiring 22: this report |

`npm run typecheck` is clean. `npx vitest run` is green: **227 tests across 20 files**, up from 167
across 15; §2.5 lists the 60 new ones. `npm run build` is green, with the chunk-size warning it
already had (backlog item 4). `package.json` is unchanged. No `.module.css` file was touched. The
markup of the reviewed screens changed only where the follow-up asks: the additions of §2.2, the
wording that named UTC, and the name cells of §2.3, which use the existing name and dim styles.

**F7-1.** Every surface that rendered UTC now renders Tallinn time. The audit, session and transfer
columns keep their compact "yyyy-MM-dd HH:mm" shape, so the tables keep their widths. The "(UTC)"
headings and "All times UTC" notes are gone, and one note, "Times in Tallinn time.", names the zone
where a page used to say UTC. **F7-2.** The closed "The customer will drive" option now says what is
missing and links to the customer's record. That record offers "Link driver record", which opens
the edit dialog on its Driver link section. The customer dialog proposes the driver whose personal
ID matches, as a choice. **F7-4.** The audit surfaces take the actor's and the target's names from
the entry. The Principal now reads the administrator's name, and "System" means the technical actor
only. **F7-5.** A wrong password on the transfer acceptance keeps the form, with one message that
names both possible causes.

The joint check passed everything that needs no typed password: 16 API checks as the seeded people,
the transfer page in the browser, a sweep of every route's data as each of the five roles, and 22
tests that render each changed screen from a filled query cache. One thing is recorded rather than
built: the Overview's activity card names nobody, and adding names would change a reviewed screen
(§3.1). The database is left empty and migrated, as the owner asked (§4.7).

## 2. Implemented

### 2.1 F7-1 — local time wherever a person reads a time

- `src/format/datetime.ts` gains `formatLocalStamp`, the "2026-09-18 13:39" stamp in
  Europe/Tallinn, the same shape `formatUtc` gave these columns. It also gains `LOCAL_TIME_NOTE`,
  "Times in Tallinn time.", the one note that names the zone. The UTC helpers stay, because their
  existing tests may not be deleted, but no screen uses them (a test says so, §2.5).
- Every surface that rendered UTC now renders local time, and says so once where it used to say UTC:
  - the Security audit list: table, phone cards, heading "Occurred";
  - the audit entry page: the Event panel, and the payload values, whose field labels no longer end
    in "(UTC)";
  - the Profile's sessions tab and a user record's sessions tab: "Started", "Last seen", "idle until",
    the revocation time;
  - the System Administrator page: "Since", the transfer table and phone blocks, headings
    "Initiated" and "Expires";
  - the Overview's activity card, in the app's humanized local style;
  - the driver's audit trail and the assignment's correction history;
  - the assignment's Lifecycle panel, whose note pointed to UTC values in the audit trail.
- Nothing sent to the API changed. The API keeps speaking UTC.

### 2.2 F7-2 — the customer's driver link, findable

- `src/pages/fleet/driverLink.ts` holds the two decisions, testable without a page:
  - `customerDriveBlock` returns why "The customer will drive" is closed. For a private customer
    with no link: "This customer has no linked driver record." with "Link one on the customer's
    record." linking to `/customers/{id}`.
  - `proposedDriverLink` returns the active driver whose personal ID equals the one entered,
    compared trimmed, as the API stores both. It proposes only while the customer has no link.
- The new-assignment page renders that note. The link sits inside the existing reason line.
- The customer record's Driver link panel gets a small "Link driver record" action, like the
  Identity panel's "Edit". It shows only for a private customer without a link, and only to a
  reader who may change customers. It opens the edit dialog with the Driver link select focused and
  scrolled into view.
- The customer dialog shows the proposal inside the Driver link section. It uses the existing
  section note, reading "Janis Krumins has the same personal identifier.", with a "Link Janis
  Krumins" button. Nothing is chosen for the person: the select still reads "Not linked" until they
  press it. Declining is saving without it.

### 2.3 F7-4 — the entry names its actor and its target

- `dto.ts` follows the live OpenAPI document: `actorDisplayName` and `targetDisplayName`, both
  nullable strings, on `SecurityAuditResponse`.
- `src/format/auditNames.ts`:
  - `auditActorName` gives the entry's name, or "System" when the entry carries none, which is the
    technical actor.
  - `auditTargetName` gives the target's name, or null when the entry is about no user.
- The audit list, the audit entry page, the driver's trail and the assignment's correction history
  all use them.
- A name links to the user record only when the reader's own directory holds that user, as before.
  A named person outside it (the administrator, for a Principal) is plain text, not dimmed. "System"
  stays dimmed.
- The two record pages no longer read the user directory at all: it was there only to find names.
- The role history on a user's record carries ids and no names. A grantor outside the reader's
  directory now reads "Outside your company", the owner's wording in F7-4, instead of "System".
  "System" is kept for the technical actor's fixed id.

### 2.4 F7-5 — the transfer acceptance keeps its form after a wrong password

- The endpoint answers a wrong password with `system_administrator.transfer_not_usable`, the same
  code as a dead link. It does so on purpose.
- `transferAcceptView` in `src/pages/account/failure.ts` decides what the page shows. For that code:
  the form, with "The password did not match, or this link can no longer be used. Check the
  password and try again; if it keeps failing, ask the administrator for a new link." in the
  existing alert slot.
- The dead-link screen stays for a link without a token and for `transfer_not_found`.
- `isExpiredLink` is unchanged for the pages that use it.

### 2.5 Tests, and whether they can fail

60 new tests, 227 in all:

- `src/format/datetime.test.ts` (+9): the stamp in summer (+3) and winter (+2); a local calendar day
  across midnight; an offset instant; the API's microseconds; the stamp's shape and its time slice;
  an empty value; the Overview's humanized local time across midnight in both seasons; the note.
  One existing describe title, "audit and sessions surfaces render UTC", now reads "the UTC stamp
  (no surface renders it since Follow-up 7)". Its assertions are unchanged.
- `src/format/auditPayload.test.ts` (4): payload instants in both seasons, a role grant's expiry, the
  labels without "(UTC)", a plain value untouched.
- `src/format/auditNames.test.ts` (8): the actor and target names, "System" only without a name,
  "Outside your company" for an unlisted grantor.
- `src/pages/fleet/driverLink.test.ts` (8): the note and its link for each kind of customer; the
  proposal compared trimmed, never for an inactive driver, a linked customer or an empty ID.
- `src/pages/account/failure.test.ts` (+5): the transfer page's mapping for each answer, including
  the live problem body of `transfer_not_usable`.
- `src/pages/surfaces.test.ts` (4): reads every screen's source (55 files) and fails if one formats
  or says UTC, or names anybody "System" by itself.
- `src/pages/followup7.render.test.ts` (22): each changed screen rendered to markup with
  `react-dom/server`, which is already a dependency. The pages render inside the real permission
  provider and router, from a query cache holding API-shaped answers: the audit list and entry
  page, the Overview's card, the System Administrator page, both sessions tabs, the role history,
  the driver's trail, the assignment's correction history and Lifecycle panel, the customer
  record's action, the dialog's proposal, and the new-assignment note.

Teeth, checked by breaking the code and restoring it byte for byte (`cmp`) before the commit:

- the stamp switched back to UTC and every actor named "System": 9 of the 22 render tests failed;
- the record's action, the proposal and the note's link removed: 3 failed;
- a UTC column and a "System" fallback put back into two pages: the scan's three checks failed.

## 3. Not implemented or partial

### 3.1 The Overview's activity card names no actor

F7-4's app half names three surfaces that "name the actor and the target from the entry itself".
One of them is the Overview's "Recent security activity" card. That card names nobody: in the
prototype and in the app it shows the event and its time only. So it never showed "System", and
there is no name on it to take from the entry. Adding the actor's name would change a reviewed
screen's markup, which this run's rules forbid. The card got F7-1's local time and nothing else.

- *Side:* frontend, the owner's decision.
- *Option:* one more line per row, "by Arturs Veidenbaums", in the card's existing small-text style
  (§6.1).

### 3.2 The joint check's F7-4 step reads the Principal's own activation

The joint check says: "read the seeded activation entry and see the administrator's name". In the
sample data, the one seeded `Registration.Activated` (Toms Rudzitis) was performed by Signe
Priede, the Principal herself. The API rightly names her. The administrator's case was checked on
the three seeded entries the administrator wrote, and on a fresh activation of Gatis Lapsa by the
administrator, which is the owner's own situation (§4.2).

- *Side:* the seed, if the owner wants the sample data to show it. That is backend backlog item 1,
  out of scope here.

### 3.3 The steps that need a real password typed into the app

The implementing agent may not type a real password into a web page, even the seed password the
owner supplied. So these steps were not run in the browser:

- signing in as the seeded people and seeing F7-1, F7-3 and F7-4 on the screens;
- the customer dialog's proposal, and the new assignment's note with its link, in the page;
- the transfer acceptance with the right password typed into the form;
- every route once as each role in the browser.

What was run instead:

- every one of those steps' data through the API, with the password in a script (§4);
- the screens rendered from API-shaped data by the test suite (§2.5);
- the transfer page in the browser as far as the wrong password (§4.4).

§5 is the numbered list for the checking agent.

## 4. Verification — the joint check

Against the API started from round 5's build (`bcafa5e`) and the sample dataset, re-seeded with
`--replace true`. Each API step is a script call as the seeded person, through the same endpoints
the screens use.

### 4.1 F7-3 and F7-1 — the Principal's sign-in and sign-out

| Step | Result |
|---|---|
| Signe Priede signs in, then out (`POST /api/auth/logout`) | 204 |
| Her next session reads `GET /api/security-audit?TargetUserId=…` | the ended session's `Authentication.SessionCreated` and `Authentication.Logout`, both with the Company |
| What the app shows for them | 2026-09-18 12:26 (the API says 09:26 UTC): three hours later, the wall clock's time |

### 4.2 F7-4 — who the Principal sees

| Step | Result |
|---|---|
| The seeded `Registration.Activated` | actor "Signe Priede", target "Toms Rudzitis" (the sample data's actor, §3.2) |
| The administrator's seeded entries | "Arturs Veidenbaums" on `Company.Updated`, `DriverAuthorization.Corrected`, `RentalAssignment.TimelineCorrected` |
| Every entry the Principal reads (16) | all carry an actor name |
| The Principal opens the administrator's record | 403, as before |
| The administrator activates Gatis Lapsa as Viewer | 200 |
| The Principal reads that activation | actor "Arturs Veidenbaums", target "Gatis Lapsa" |

### 4.3 F7-2 — the driver link, as Karlis Zvaigzne (Fleet Manager)

| Step | Result |
|---|---|
| A driver fit for it | Janis Krumins: active, adult, personal ID 050381-10228, linked to no customer |
| A private customer with that personal ID, the proposal declined (`driverId` null) | 201 |
| Linking the driver, as the dialog sends it (`PUT /api/customers/{id}`) | 200, `driverId` set |
| "The customer will drive": an Active assignment naming the customer's own driver | 201, on 119 MPR |
| Unhappy path: a second customer taking the same driver link | 409 `customers.driver_link_conflict`, which the dialog shows under the field |

### 4.4 F7-5 — the transfer acceptance, in the browser

| Step | Result |
|---|---|
| The administrator resends the open transfer to Liga Brice (API) | 200; Mailpit holds the one link |
| `/accept-administrator-transfer` with no token | the dead-link screen, "This transfer link cannot be used" |
| The real link | the form |
| A wrong password (made up, 22 characters), Accept transfer | one `POST …/transfers/accept` → 400; **the form stays**, with the two-cause message in the alert slot |
| The right password with the same link (API; §3.3) | 204: the link still worked after the wrong attempt |
| The same link again (API) | 400 `transfer_not_usable` |
| Accept transfer in the page again, on the now used link | one more `POST` → 400; the form and the message stay |

Re-seeded afterwards: the acceptance had made Liga Brice the administrator.

### 4.5 Every route once as each role — the data behind each screen

Each seeded role signed in and called every route's endpoints, 18 routes. The route table's
permission (`src/app/routes.tsx`) says whether the route opens for the role, and the API answered
accordingly each time:

| Account | Routes open | Result |
|---|---|---|
| `sysadmin@` (System Administrator) | 18 of 18 | every answer 200 |
| `signe.priede@` (Principal) | 17 of 18 | 200, and 403 on the System Administrator's transfers |
| `karlis.zvaigzne@` (Fleet Manager) | 15 of 18 | 200 where open, 403 where closed |
| `toms.rudzitis@` (Viewer) | 14 of 18 | as its permissions say; see below |
| `dita.smite@` (Viewer + Fleet Manager) | 15 of 18 | 200 where open, 403 where closed |

One answer is not a 403 where the route is closed. The Viewer's registrations query answers 200
with an empty list. By REGISTRATION-007 a directory reader sees only admitted people, and the
app's own route permission (`Users.ReviewRegistrations`) keeps the page closed to the Viewer. The
Fleet Manager's same query lists the five registrations.

### 4.6 The screens, rendered

The 22 render tests of §2.5 are the joint check's substitute for the signed-in browser. They show,
with the sample data's people:

- **F7-1:** the local stamps in both seasons, the headings without "(UTC)", the zone's note where
  the panel carries it, and no "UTC" anywhere in the markup.
- **F7-4:** the administrator named for the Principal with no link to a record they cannot open;
  directory users linked; "System" once, for the technical actor; "Outside your company" in the role
  history.
- **F7-2:** "Link driver record" only for an unlinked private customer and a reader who may change
  it; the proposal naming Janis Krumins, with "Not linked" still selected; the note linking to
  `/customers/c1`, gone once the customer is linked.

### 4.7 End state

As §7's "End state" asks, with the README's commands:

- **The API** was stopped; `rwrent_v1` dropped with `WITH (FORCE)` and created again, owned by
  `rwrent`; `dotnet ef database update` applied all six migrations. The API was started again from
  round 5's build (`RWRentApi-wiring/src/RWRentApi.Api/bin/Debug/net10.0`, built at `bcafa5e`) and
  answers `/health` 200 on 5001.
- **The database** holds six migrations and one application user, the technical system account.
  It has no human account and no identity account; no Company, vehicle, customer, driver or
  assignment; no audit entry and no session.
- **Mailpit** is cleared: 0 messages.
- **The app** answers 200 on 5173. The browser pane is on `/sign-in`.
- **The owner's first real records** (one Company, the administrator and the Principal, one
  vehicle, customer, driver and assignment) were replaced by the sample data, as the owner allowed.
  A `pg_dump` copy was taken first. It is `owner-real-data-2026-09-18-before-round5.sql`, mode 600,
  in the implementing session's scratchpad
  (`/private/tmp/claude-501/-Users-zulf-rw-rent-api/322d1439-27e0-467c-850f-91b903d014c9/scratchpad`),
  outside every repository. It lasts only as long as that temporary folder.

### 4.8 How it was run

- The password came from the owner for this session only. It was held in the environment, used
  only by the API scripts, and appears in no file, no log and no commit.
- The transfer link came from an API resend as the administrator, read from Mailpit, which was
  emptied first. The wrong password typed into the page was made up; it is nobody's credential.
- The scripts are in the implementing session's scratchpad (`j7_api.py`, `rwapi.py`, `links.py`),
  not in a repository. §5 repeats every step in the app.

## 5. For the checking agent: what to run with the seed password

### 5.0 Before and after

- The database is empty on purpose: the owner will walk the go-live sequence on it again. **If the
  owner has already entered real data, do not re-seed**, because `--replace true` replaces
  everything. Ask the owner first.
- Otherwise re-seed from the backend worktree, with the environment of its README exported and the
  seed password in `RWRENT_DEV_SEED_PASSWORD`:
  `dotnet run --project src/RWRentApi.Api --no-build -- seed-development-data --password "$RWRENT_DEV_SEED_PASSWORD" --replace true`.
- When done, return to the empty state, with the README's "From the sample data to real data" step
  1:
  1. stop the API;
  2. `DROP DATABASE rwrent_v1 WITH (FORCE)`;
  3. `CREATE DATABASE rwrent_v1 OWNER rwrent`;
  4. `dotnet ef database update`;
  5. start the API;
  6. clear Mailpit (`DELETE http://localhost:8025/api/v1/messages`).

### 5.1 The steps

1. **F7-3 and F7-1 as the Principal.**
   - Sign in as `signe.priede@rwrent.example`, sign out, sign in again.
   - Open Security audit. The newest rows are your sign-in, sign-out and sign-in. The Occurred
     column reads the wall clock's time, three hours after UTC in summer. Its heading is "Occurred".
     The page description ends "Times in Tallinn time.".
   - Open the sign-out entry. The Event panel says "Times in Tallinn time.", and the Actor is "Signe
     Priede", linked.
   - On the phone width (375 px) the cards show the local stamp with no " UTC".
2. **F7-4 as the Principal, after an activation by the administrator.**
   - As `sysadmin@rwrent.example`, Registrations: activate Gatis Lapsa as Viewer. Sign out.
   - As Signe, Security audit, "Registration · Activated" for Gatis: the Actor is "Arturs
     Veidenbaums" in plain text, not linked and not "System"; the target is "Gatis Lapsa", linked.
     The entry page shows the same.
   - The seeded "Company · Updated", "Driver authorization · Corrected" and "Rental assignment ·
     Timeline corrected" also read "Arturs Veidenbaums". The seeded activation of Toms reads "Signe
     Priede": that is the sample data (§3.2).
   - Users → Karlis Zvaigzne → Roles: the Fleet Manager grant reads "Outside your company".
   - Overview: "Recent security activity" says "Times in Tallinn time." and shows local times.
3. **F7-2 as `karlis.zvaigzne@rwrent.example`.**
   - Customers → Add customer, Private individual, with personal identifier `050381-10228` (Janis
     Krumins's) and a fresh email and phone.
   - In Driver link, "Janis Krumins has the same personal identifier." appears with "Link Janis
     Krumins", and the select still says "Not linked". Do not press it: Create customer.
   - New rental assignment with that customer: "The customer will drive" is greyed, with "This
     customer has no linked driver record. Link one on the customer's record." Follow the link.
   - On the record, the Driver link panel offers "Link driver record". Press it: the edit dialog
     opens with the Driver link select focused and in view. Choose Janis Krumins and Save.
   - New rental assignment with that customer: "The customer will drive" is open. Create it (Active,
     now) on an available vehicle.
4. **F7-5, last** (it makes Liga Brice the administrator).
   - As the administrator, System Administrator → Resend on the open transfer (your password).
   - Open the Mailpit link. Type a wrong password of 12 or more characters and press Accept
     transfer. The form stays, with "The password did not match, or this link can no longer be
     used…".
   - Replace it with Liga Brice's password (the seed password) and press Accept transfer: "Transfer
     accepted". A second request is sent, so the form was still usable.
   - Re-seed afterwards.
5. **Every route once as each role.** As each of `sysadmin@`, `signe.priede@`, `karlis.zvaigzne@`,
   `toms.rudzitis@` and `dita.smite@`:
   - open every navigation entry and one record of each kind;
   - check that no screen says UTC, times read local, audit rows name people, and "System" appears
     only for the technical actor. The seed has no technical-actor entry. `recover-system-administrator`
     makes one if wanted.
6. **Return to the empty state** (§5.0).

## 6. Decisions needed

1. **Should the Overview's activity card name the actor?** (§3.1.) It shows the event and its time,
   as the prototype does. Recommendation: leave it. The card is a glance, and the audit page names
   everyone one click away. If you want names there, it is one line per row in the card's existing
   small text.
2. **The backend's round 5 asks one for you:** whether a user's own session revocations should
   appear in the audit history. See `round5_report.md` §4.

## 7. Deviations

1. **F7-4 reaches two audit surfaces and one role surface beyond the three it names.** The driver's
   audit trail and the assignment's correction history show audit entries too, and named them from
   the directory ("Unknown user", "System"). They now take the names from the entry, and those two
   pages no longer load the directory. The role history labelled the administrator "System" for the
   same reason. It carries no names, so it uses the owner's own fallback, "Outside your company".
2. **F7-1 reaches two surfaces beyond the five it names:** the driver's trail and the assignment's
   correction history. Also the assignment's Lifecycle note, which pointed to "original UTC values"
   in a trail that no longer shows UTC. The audit payload's field labels lost "(UTC)".
3. **The proposal (F7-2c) appears only while the customer has no link, and only for an active
   driver.** An inactive driver cannot be chosen in the link list. A customer who is already linked
   is not second-guessed.
4. **"Link driver record" (F7-2b) shows only on an unlinked private customer, and only to a reader
   who may change customers.** A linked customer changes the link through Edit, as before.
5. **Render tests stand in for the signed-in browser.** They use `react-dom/server`, already a
   dependency, and plain `createElement`, so neither the test include pattern nor any configuration
   changed. `Coverage` in `NewAssignment.tsx` is exported so its note can be rendered.
6. **The UTC helpers stay** (`formatUtc`, `formatUtcHuman`, `formatUtcLabelled`). No screen uses them,
   and their tests may not be deleted. One test group's title was reworded; no assertion changed.
7. **The joint check adapted two steps.** F7-4 read the administrator's own entries and a fresh
   activation (§3.2). F7-5's right password went through the API with the same link (§3.3).
8. `Context/wiring_followups.md` was not edited.

## 8. Open risks

1. **The page header's description is not in the render tests.** The list pages' headers are set
   from an effect, which a server render does not run. The scan test guarantees they no longer say
   UTC. That they say "Times in Tallinn time." is for the checking agent's eyes (§5.1, step 1).
2. **A mistyped transfer password counts as a failed sign-in.** Five in a row lock Liga's account
   for 15 minutes (LOGIN-005), and the page keeps showing the same message. During a lockout neither
   the password nor a new link helps until the lock ends. The message cannot say so without saying
   which cause it was.
3. **The proposal compares personal IDs exactly, after trimming**, as the API stores them. The same
   person's ID written differently (another separator, a space inside) is not proposed. The
   person can still choose the driver in the list.
4. **A link to a user record still depends on the first 100 directory entries**, as before this
   follow-up. With more people than that, a person beyond them is named but not linked.
5. **Names are read-time names** (backend report §11): an older entry shows a person's current
   name.
