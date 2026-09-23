# Frontend Wiring — what remains

> **The single document of the frontend wiring phase.** The phase is implemented and verified
> (commits `2a2cece` … `53df077` on `feature/backend-wiring`, 2026-09-15/16): the app runs on the
> real API, the mock is gone, every screen reads the projections the backend serves, the account area
> is a port of the prototype (`Context/prototype/RW-Rent.dc.html`, the design source, stays in this
> folder), and the three follow-ups are in. The phase's specification, plan, follow-up ledger and
> reports were removed as implemented; git history keeps them. What is still to do is below.
>
> Working folders: this app in `/Users/zulf/rw-rent-api/rw-rent-web-wiring` (branch
> `feature/backend-wiring`); the backend in `/Users/zulf/rw-rent-api/RWRentApi-wiring` (same branch
> name). The main checkouts stay untouched until the merge gate (§3) opens. Rewritten 2026-09-16.

## 1. The owner's manual check (the gate before the merge)

Deferred by the owner on 2026-09-16. Decided the same day: the app ships without Tasks and Insurance
cases for now (their brainstorm is parked), and an **independent testing phase** runs first, by a
separate agent in a fresh session, against both the API and the app as they are: brief in
`Context/testing_brief.md`, report in `Context/testing_report.md`. Its findings become the next
follow-ups on the side they name. After that, and after the seed data is replaced with real data,
the owner works through the tables of §2 on their devices, with the accounts listed there (or the real
ones by then), the app at `http://localhost:5173`, the API at `http://localhost:5001`, emails at
`http://localhost:8025`, the seed password kept outside the repository. Differences from the
prototype found there become the next follow-up.

**2026-09-23: the owner's full check starts from an empty app**, at their request, with everything
built (rounds 2–9, follow-ups up to 10, the deletion feature complete): the owner registers the
administrator and the other accounts themselves, confirms them in Mailpit, activates them with
different roles, enters their own data and checks the app as its users. The reviewer took a copy of
the previous real data first (`~/rwrent-backup-2026-09-23-0727.sql`, outside the repository), emptied
`rwrent_v1`, applied the six migrations and restarted the API on 5001 from the round-9 build with the
company's email domain `rwrent.ee`; the practice copy (5002, 5174, `rwrent_check`) was removed. The
reviewer runs the one terminal step the check needs (the bootstrap of the administrator). Findings go
into a new follow-up here.

## 2. Verification tables and accounts

### 2.1 Account screens — prototype screen → app route → what to compare

| Prototype screen | App route | What to compare |
|---|---|---|
| `signin` | `/sign-in` | title, the two fields, "Forgot password?" on the password's label row, the black Sign in with its arrow, "No account yet? Create one", the footer line, the art panel |
| `register` | `/register` | the two names on one row, the phone placeholder, the four-rule checklist filling in as you type (four rules by the owner's decision; the prototype still shows five) |
| `register-submitted` | `/register` after Create account | the mail glyph, both facts, the two actions |
| `confirm-checking` · `confirm-done` · `confirm-bad` | `/confirm-registration-email` | the glyph and its colour, the fact list, the mono `code:` line |
| `resend` | `/confirm-registration-email?resend=1` | title and body; the app adds the password field the API requires (backlog item 1) |
| `pending` | `/sign-in` as a confirmed but unactivated account | five facts, the warn hourglass |
| `rejected` · `expired` · `suspended` | `/sign-in` as each account | glyph, colour, actions |
| `session-expired` | `/sign-in` after a session is revoked elsewhere | the warn clock, "Sign in again", and that it returns to the page you were on |
| `rate-limited` | `/sign-in` after repeated attempts | the `HTTP 429` mono line |
| `forgot` · `forgot-sent` | `/reset-password` | the email field with its note, "Send reset link", then the outgoing-mail screen |
| `reset` · `reset-bad` | `/reset-password` from the emailed link | the token note with its key glyph, the checklist, then the unusable screen with the API's code |
| `transfer-accept` | `/accept-administrator-transfer` | title, body, the existing-password field and its note (backlog item 1 for the two fields the API does not take) |
| `profile` · Profile | `/profile` | the two panels, "Update phone", "Show permissions" |
| `profile` · Sign-in & security | `/profile?tab=security` | both panels, their notes, the dialogs behind Change password and Change email |
| `profile` · Your sessions | `/profile?tab=sessions` | the six columns, the Current chip and "This device", "Revoke other sessions" |
| `noaccess` | any route as an account with no permissions | the info banner, both panels, the empty navigation |

### 2.2 Every other screen — compare with the mock's rendering, and what to try

| Screen | Compare with the mock's rendering | Try |
|---|---|---|
| Overview | metric cards, Needs attention, assignment mix, activity card | the counts: 4 active of 12, 2 planned, 2 vehicles available of 8 active, 3 registrations |
| Needs attention | the same five rows in the same order | open each row; the two interruptions and the planned handover without a driver |
| Rental assignments | coverage column, Interrupted chip, model and type sub-lines | filter by status; filter by a planned or started date range; open 552 KLM (collective coverage, one open interruption) |
| Assignment record | Parties, Lifecycle, Notes, the two tabs, Corrections | cancel a Planned assignment with a note; then read Notes and Corrections |
| Assignment record, Active | the mistaken-activation cancel | cancel without a note: the message appears under the note field, not above the form |
| Vehicles | availability chips and their sub-lines | in use 482 TKL, 770 HDV, 552 KLM, 204 JLM; reserved 444 WKS and 335 SNB; retired 881 GRT, 660 BYH |
| Vehicle record | the same chip as the list, rental history | open 444 WKS from the list |
| Drivers | personal identifier, licence, address columns | search; open Janis Krumins |
| Driver record | the authorization history table | vehicle, customer and status come from the row; the audit panel shows the creation |
| Customers, Customer record | unchanged | open a business and a private customer |
| User directory, User record | Registered column, roles, sessions | open Dita Smite (four role rows) and Imants Gailis (the rejection reason); grant a role with an expiry date and revoke it |
| Registrations | All lifecycle states in one page | the five people; then each single-status filter; activate Gatis Lapsa with a role |
| Security audit | list filters, entity chips | filter by event type and by entity type; open any row |
| Audit entry | the payload diff | open the Registration · Activated entry: the role grant reads "Viewer — no expiry" |
| System Administrator | transfers table | the one open transfer to Liga Brice, Awaiting acceptance; Resend asks for your password |

### 2.3 Seeded accounts (same password for all, set by the owner when seeding)

| Role | Email | Name | What they see |
|---|---|---|---|
| System Administrator | `sysadmin@rwrent.example` | Arturs Veidenbaums | everything, including Corrections and the System Administrator page |
| Company Principal | `signe.priede@rwrent.example` | Signe Priede | the company's records, role administration, the company's audit history |
| Fleet Manager | `karlis.zvaigzne@rwrent.example` | Karlis Zvaigzne | fleet and rental work, registrations to review |
| Viewer | `toms.rudzitis@rwrent.example` | Toms Rudzitis | read-only across the fleet |
| Viewer + Fleet Manager | `dita.smite@rwrent.example` | Dita Smite | four role rows in her record, one of them expiring |
| Suspended | `raivis.dumins@rwrent.example` | Raivis Dumins | cannot sign in; the Account suspended screen says why |

## 3. Merge gate

Both `feature/backend-wiring` branches merge into their `main` only after the owner's manual check
(§1) passes with the wired backend and the wired app running together. Until then the main
checkouts stay untouched, both branches keep receiving the next phases' commits, and the developer
database keeps the seeded dataset.

## 4. Backlog — known, not scheduled

1. The prototype file is out of date in two places (decisions 5 and 6): its transfer-acceptance
   screen shows an email and a new-password field the API does not take, and its resend screen lacks
   the password field the API requires. The app is right; the prototype is the reference for looks
   only. Correct the file if it is ever edited again.
2. ~~The Button `block` variant's light-theme contrast~~ — closed: testing run 1 found the
   combination is not used anywhere in the app, and the real phone sheet button measured 16.6:1.
3. `GET /api/me` is cached for a minute after a full page load: a role granted or revoked while
   someone is signed in reaches them at the next reload or after that minute.
4. The build is a single chunk over the bundler's size warning (about 560 kB); code splitting is a
   hosting-time decision.
5. The shell's open-work queue runs three list requests on every page; cheap on the seeded data,
   the first thing to look at if a page ever feels slow.
7. ~~The transfer-acceptance screen after a wrong password~~ — done 2026-09-18 as F7-5: the form
   stays, with one message that names both possible causes.
6. Tasks and Insurance cases are sample-data placeholders (`src/pages/overview/sample.ts`,
   `src/pages/simple/`). The owner parked their design on 2026-09-16 (facts gathered: the prototype
   defined only a queue stub for each; the backend has nothing; the vehicle carries no policy,
   road-tax or inspection dates). The app ships without them until that phase is opened.
8. **Next phase, not yet brainstormed: the full change history and a deletions page.** The owner
   decided on 2026-09-19 that every change on every record is tracked (who, what, when, the old and
   the new value), and on 2026-09-20 that a record that is not needed can really be deleted, on one
   separate page and not by a delete button on every screen, allowed only by the System
   Administrator (whether the administrator alone presses it or gives the right to a chosen person
   was asked on 2026-09-20). The facts, the three dead ends of today's rules and the points to
   settle are in the backend's backlog, item 21. The two are designed together because they must
   agree on what is left of a deleted record. On this side it will mean a history view on each
   record page and the one deletions page. Decided 2026-09-20: the right to delete is given only by
   the System Administrator and only to a user in the company's email domain (`@rwrent.ee`). The
   owner's order: Claude Design first prototypes the deletions page as the administrator sees it
   (the prompt was handed over on 2026-09-20; prototype only, no React, no zip); when the owner
   confirms it, the prototype of how the right is given follows. The confirmed prototype file
   replaces `Context/prototype/RW-Rent.dc.html`, and the implementation agent ports from it.
   **2026-09-21: the owner looked at the prototype of the page: "it looks fine", "the base is good",
   and no further rounds on the prototype.** Any remaining changes to the look are made in the React
   app by the implementation agent, on the owner's directions. The owner's condition for the
   handover: only what belongs to Delete records is taken, because Claude Design's copy of the React
   app predates the wiring and would bring older versions of other components. The handover asked of
   Claude Design therefore contains no React at all: one zip with the approved prototype file, a
   handover note for this one feature (how to reach every state, reused pieces, new pieces, layout
   values at 1512 / 834 / 402, the copy deck, anything invented), the new CSS rules alone, and the
   added mock data. It is unpacked beside the repositories, never into them; the implementation
   agent builds the page from it inside the current app, as the account screens were ported.
   The handover arrived on 2026-09-21 and is filed in `Context/prototype/` (`RW-Rent.dc.html`
   replaced, `delete-records/` added); the prototype changed only for this feature. Decided the
   same day: the right to delete is given in a dialog of its own, not in the Grant role dialog, and
   it gets no prototype: it is described in a specification and judged in the app. Order: first the
   page for the administrator (§8 below), checked by the owner, then the giving of the right.

## 5. Testing — where it stands (2026-09-17)

Run 1 (2026-09-16) found T-001…T-006. They were fixed by the backend's round 3 and by the app's
Follow-ups 4 and 5 (commits `9127ea1` … `d9d4f07`): the permission of a page now comes from the
route that matched, out of one table the routes and the navigation are both generated from
(`src/app/routes.tsx`); every dialog submission passes one synchronous gate; the four emailed-link
pages start over on every arrival; the refusal codes the app knows were checked against the
backend's catalogues. Run 2 (`Context/testing_report.md`, 2026-09-17, 3 h 21 min) confirmed all of
them fixed, including 540 spellings of the guarded addresses, walked the first start on an empty
database from nothing to a returned rental and an offline recovery without a defect, and found three
new Major defects: T-007 on the backend (its round 4, `RWRentApi-wiring/Context/round4_spec_and_plan.md`)
and T-008 and T-009 here (§6). The sections that specified Follow-ups 4 and 5 were removed as
implemented and tested; git history keeps them. The agreed order from here: this one fix round, the
reviewer's verification with the tester's own steps, then the owner's check on real data (§1), then
the merge (§3).

## 6. Follow-up 6 — testing run 2's frontend findings

> **Status: IMPLEMENTED 2026-09-18** (commits `a800dc4` Wiring 19 and `e89beef` Wiring 20; report
> `Context/wiring_report.md`). The agent, working under rules that forbid it to type a real password
> into a page, ran the refused-then-corrected pattern on every public form and the T-007 race, and
> handed the signed-in checks over. The reviewer ran those the same day in a headless browser: on
> `/sign-in` a wrong password then the right one gives two requests (401, then 200) and lands on the
> Overview; on a real reset link a weak password then a strong one gives two requests (400, then 204)
> and "Password changed"; three Enters on the phone dialog send one request; as the administrator,
> the timeline correction of the tester's assignment saved with the dates untouched answers 200, the
> note changed and all four stored instants byte-identical (the controls showed minutes, the request
> carried the stored microseconds). Typecheck, 167 tests and the build are green. One leftover, on
> the transfer-acceptance screen, is backlog item 7 (§4). The reproduction steps of both findings are
> in `Context/testing_report.md` §2.2.

- F6-1. **A form can be submitted again after it was refused (T-008, Major).** After one refused
  request the sign-in form is dead: a wrong password, then the right one, sends nothing until the
  page is reloaded. The same on the reset form after a weak password, and on every public form.
  Cause, confirmed in the code: `SignIn.tsx`, `Register.tsx` and `ResetScreen` in `AuthLayout.tsx`
  call `gate.attempt` and nothing ever calls `gate.settle`; only the dialogs' hook and sign-out
  settle theirs. Follow-up 4 added the gate and tested that it closes; nothing tested that it opens.
  Change: make forgetting impossible. The gate is owned by one small hook that wraps a mutation and
  settles it in `onSettled`, success or failure, and every public form submits through it;
  `ResetScreen` takes a gated submit from its caller instead of owning a gate that cannot know when
  the request ended. Tests: refused then corrected makes two calls; a success keeps the gate shut
  only until it settles; a rate-limited answer reopens it too.
- F6-2. **An instant the person did not touch is sent exactly as it is stored (T-009, Major).** The
  date-time controls show minutes; stored instants can carry seconds. Every dialog that prefills an
  instant converts it to minutes and back, so saving a correction without touching the dates sends
  four changed instants, and the timeline correction of a seeded assignment answers
  `409 corrections.timeline_invalid` with no field marked. It applies wherever a stored instant is
  prefilled (`src/pages/fleet/AssignmentDialogs.tsx`): the planned-dates update, the authorization
  correction, the interruption update and correction, the timeline correction. Change: one helper in
  `src/format/datetime.ts` keeps the stored instant when the control still shows what it was
  prefilled with and converts only a control the person changed; an emptied control is still null.
  Tests: an untouched instant with seconds and with microseconds comes back byte-identical; a
  changed control converts as today, in both offset seasons; an emptied one is null.
- F6-3. Tests as named above; typecheck, tests and build green; reviewed screens keep their markup
  and CSS; no new runtime dependency.
- F6-4. **The joint check**, against the round-4 API and the seeded database; ask the owner for the
  seed password in your first message if it is not in the environment, and wait. The tester's own
  steps for T-008 on `/sign-in` and on a real reset link from Mailpit, then the same
  refused-then-corrected pattern on every other public form (register, the resend screen, the
  forgotten-password request, the email-change confirmation where it can be refused, the transfer
  acceptance with a wrong then a right password); the tester's own steps for T-009 on assignment
  `2d7b5c86-0007-42d7-92d7-000000000007`, then every other prefilled-instant dialog saved without
  touching its dates on a seeded record, and once with one date changed; T-004 again on the phone
  and the interruption dialogs, one request each; the backend's T-007 steps once through two browser
  sessions if the app can produce them. Re-seed with `--replace true`; leave both apps running.
- F6-5. Report: `Context/wiring_report.md` rewritten for this run, the joint check's outcomes in its
  verification section. Commits `Wiring 19: …` for the change with its tests and `Wiring 20: …` for
  the report. This document is not edited by the agent.

## 7. Follow-up 7 — what the owner finds while checking on real data

> **Status: first batch IMPLEMENTED 2026-09-18** (backend round 5 `43bea2e`…`bcafa5e`; app `0f5ae10`
> Wiring 21 and `e578893` Wiring 22; report `Context/wiring_report.md`). The agent may not type a
> password into a page, so the reviewer ran the signed-in checks on sample data in a headless
> browser: as the Principal the audit page says nothing about UTC, carries "Times in Tallinn time.",
> shows local times, shows the sign-out beside the sign-ins, and names the administrator on his
> entries with no "System" label; the assignment dialog's note reads "This customer has no linked
> driver record. Link one on the customer's record." with its link; the customer's record offers
> "Link driver record" and opens the dialog on that section; a new customer with a driver's
> personal ID gets that driver proposed. Backend 161 + tests green twice, app 227 tests, typecheck
> and build green. The database was then wiped to empty for the owner's next round. Two questions
> from the reports wait for the owner: names on the Overview's activity card (report §3.1), and
> audit entries for a user's own session revocations (backend backlog item 19). The owner
> walked the go-live sequence on this Mac (empty database, the dedicated administrator bootstrapped,
> the company "RW-Rent OÜ" created, the daily account activated as Company Principal) and checked
> the app on real data. The four things they found, plus backlog item 7, are this batch. It runs in
> the same agent run as the backend's round 5 (`RWRentApi-wiring/Context/round5_spec_and_plan.md`),
> after it, in this worktree, against the API rebuilt from that round. F7-3 is the backend's; F7-4's
> app half uses the names round 5 adds. The owner has allowed the real data of 2026-09-18 to be
> replaced by the sample data for the agent's checks; the check continues on real data afterwards.
>
> **Status: second batch IMPLEMENTED 2026-09-19, verified 2026-09-20** (backend round 6
> `fed99c2`…`501e75d`; app `8a7e5ac` Wiring 23 and `6200b58` Wiring 24; report
> `Context/wiring_report.md`). Everything ran on the scratch stack (the API on 5002 over the seeded
> `rwrent_check`, the app on 5174); the owner's data in `rwrent_v1` was read only, and its records
> and people were the same before and after. Backend 161 + 425 tests green twice, app 253 tests,
> typecheck and build green; the owner's API on 5001 serves the round-6 contract. The reviewer ran
> the report's password steps in a headless browser with its own contexts: the vehicle, customer,
> driver, assignment and company pages read "Created" and "Last changed" with the person and the
> local time, nothing says "Last updated" any more, and a seeded vehicle reads "Not changed since it
> was created"; Karlis and then Signe changed one vehicle's colour in the app and "Last changed"
> named each of them in turn while "Created" stayed; every authorization and interruption row reads
> "Recorded by Karlis Zvaigzne", as table rows and as phone cards at 700 pixels; the administrator's
> Corrections tab names the last changer; the Overview's activity card reads "Dita Smite · 19 Sep,
> 09:41" on each row; Dita ended one other session and then every other session from her profile,
> each leaving exactly one entry the Principal reads under the filters "Session · Revoked" and
> "Session · Others revoked", the ended sessions answered 401, the entry page reads "Sessions ended
> 2", and with no other session the button is disabled ("This is your only active session.") and
> nothing is written. One remark went to the backend backlog (item 22): the ended-sessions count
> includes sessions that had already lapsed, so it can exceed what the profile page showed. The
> scratch stack was removed after the check (5174 and 5002 stopped, `rwrent_check` dropped).

- F7-1. **Times shown in UTC where the owner reads local time.** Seen on the Security audit page
  (column "OCCURRED (UTC)", the page description says "All times UTC"): entries read three hours
  earlier than the clock on the wall. The app does this by design, inherited from the prototype:
  operational screens render Europe/Tallinn through `formatLocal`, while the audit list and entry
  page, the sessions tab, the System Administrator page's transfer times and the Overview's activity
  card render UTC through `formatUtc`, `formatUtcHuman` and `formatUtcLabelled`
  (`src/format/datetime.ts`; used in `src/pages/audit/SecurityAudit.tsx`, `AuditEntry.tsx`,
  `src/pages/admin/SystemAdministrator.tsx`, the profile's sessions tab, `src/pages/overview/Overview.tsx`).
  Owner's expectation: the same local time everywhere a person reads a time. Change: those
  surfaces render Europe/Tallinn like the rest of the app, the "(UTC)" column heading and the "All
  times UTC" description go, and one small note names the zone where a page used to say UTC; the
  API keeps speaking UTC and nothing sent to it changes. Tests: the formatting helpers on a fixed
  instant in both offset seasons. Side: frontend.
- F7-2. **"The customer will drive" is greyed out although the driver exists.** The owner created a
  vehicle, a driver and a private customer with identical details (same personal ID, phone, email),
  then opened New rental assignment: the option "The customer will drive" was disabled with the note
  "This customer is not registered as a driver". Cause: a customer and a driver are two records, and
  the option needs the customer's own driver link (CUSTOMER-012, `driverId`), which is set in the
  customer's edit dialog under "Driver link" and was empty. The rule is right; the app did not help:
  the note says the person is not registered as a driver when they are, and points nowhere; the
  customer's record page shows "Not linked" without an action; the customer dialog does not suggest
  the driver record that carries the same personal ID. Change: (a) the assignment dialog's note
  reads "This customer has no linked driver record. Link one on the customer's record." and links to
  it; (b) the customer's record page gets a "Link driver record" action on its Driver link panel that
  opens the edit dialog on that section; (c) in the customer dialog, when a private customer's
  personal ID equals an existing driver's, that driver is proposed as the link (still a choice, never
  automatic). Workaround used on 2026-09-18: edit the customer, pick the driver under Driver link,
  save. Side: frontend.
- F7-3. **A Company Principal sees their sign-ins but not their sign-outs** (backend; backend backlog
  item 18). The audit page is Company-scoped by rule (AUDIT-008): a Principal sees only entries
  stamped with the Company, so registration events, the bootstrap, the administrator's own sessions
  and `Company.Created` are rightly invisible to them. But on 2026-09-18 the database shows
  `Authentication.SessionCreated` for the Principal's own account stamped with the Company while
  every `Authentication.Logout` of the same account carries none, so the Principal's list shows two
  sign-ins and no sign-out. A session's end belongs to the same Company as its start. Side: backend.
- F7-4. **An actor the reader may not see is labelled "System".** In the Principal's audit list the
  entry "Registration · Activated" names the actor "System", although the administrator did it. The
  app resolves actor names from the user directory the reader is allowed to see, the administrator
  is outside the Company and therefore absent from it, and `SecurityAudit.tsx` falls back to the
  label "System" for any actor it cannot name (`nameOf(a.actorUserId, 'System')`). "System" must be
  reserved for entries with no human actor at all (the technical actor: the bootstrap, background
  cleanup). For a real person the reader may not see, the label reads "Outside your company" or, if
  the backend can tell, "System Administrator". Option worth weighing on the backend: an
  `actorDisplayName` on the audit entry, so a Company-scoped reader sees the person's name without
  reading the directory. Side: frontend, with a backend option.
- F7-5. **The transfer-acceptance screen after a wrong password** (backlog item 7, option (a),
  folded in here). On `/accept-administrator-transfer` the code `system_administrator.transfer_not_usable`
  no longer replaces the form: the form stays, with a message in the existing alert slot that names
  both possible causes ("The password did not match, or this link can no longer be used. Check the
  password and try again; if it keeps failing, ask the administrator for a new link."). The
  dead-link screen stays for the codes that can only mean a dead link. Tests: the outcome mapping
  for that code on that page.

**F7-4, the app's half.** With `actorDisplayName` and `targetDisplayName` on the audit entries
(round 5), the audit list, the audit entry page and the Overview's activity card name the actor and
the target from the entry itself; the link to a user record stays only when the reader may open it;
"System" appears only when the entry has no human actor (`actorDisplayName` null). `dto.ts` follows
the live OpenAPI document.

**Tests** for every item; typecheck, tests and build green; reviewed screens keep their markup and
CSS; no new runtime dependency.

**The joint check**, against the round-5 API and the sample dataset (re-seed with `--replace true`;
ask the owner for the seed password in your first message if it is not in the environment, and
wait): as the seeded Principal, sign in and out and see both entries in the audit with local times
(F7-1, F7-3); read the seeded activation entry and see the administrator's name, not "System"
(F7-4); create a private customer with the personal ID of an existing driver and see the driver
proposed, decline, then link from the customer's record page, then see "The customer will drive"
available on a new assignment (F7-2), and see the new note and its link when the customer has no
link; on the transfer-acceptance link (an API resend as the administrator), a wrong password keeps
the form with the new message, then the right password accepts (F7-5; then re-seed). Every route
once as each role afterwards.

**End state.** When the joint check is done, leave the database **empty and migrated** for the
owner's next round of checking on real data: stop the API, `DROP DATABASE rwrent_v1 WITH (FORCE)`,
`CREATE DATABASE rwrent_v1 OWNER rwrent`, `dotnet ef database update`, start the API again from the
round-5 build, clear Mailpit, and leave both apps running. The commands are in the backend README,
"From the sample data to real data".

**Report.** `Context/wiring_report.md` rewritten for this run, the joint check's outcomes in its
verification section. Commits `Wiring 21: …` for the change with its tests and `Wiring 22: …` for
the report. This document is not edited by the agent.

### Second batch (collected from 2026-09-18, built 2026-09-19, verified 2026-09-20)

The owner confirmed on real data that F7-1 to F7-4 work (local times, the driver link proposed and
findable, the sign-out visible to the Principal, the administrator named). New observations:

- F7-6. **Daily work leaves no visible trace of who did it (owner's question, awaiting a decision).**
  As the Principal the owner created a rental (899LGR, started 2025-02-12), authorised the driver and
  recorded a past interruption, then looked for them in the Security audit and found only sessions
  and the activation. That is by design: the Security audit holds security events, cancellations and
  privileged corrections (ASSIGN-015 says no other assignment operation is audited). The database
  does store who created and last changed every record (`created_by_user_id`, `updated_by_user_id`),
  but the API hands the app only the instants, not the person, and no record page shows it. Options:
  (a) every record page shows "Created by … on …" and "Last changed by … on …", with the names added
  to the record responses the way round 5 added them to the audit entries; (b) a separate activity
  history of business operations. Recommendation: (a). Sides: backend (names on the responses) and
  frontend (two facts per record page).
- **Owner decisions of 2026-09-19 on the three questions.** (1) F7-6: yes, and in the owner's words
  "of course, we need to track every change and who made the change". At the least every record
  page shows who created it and who last changed it, with the names on the record responses. The
  owner's wording reaches further than that, to a full history of every change on each record; that
  scope is being confirmed with them and, if wanted, is a phase of its own with a brainstorm, not an
  item of this batch. (2) F7-7: yes, the Overview's "Recent security activity" card names the person
  on each row, in the card's existing small-text style, from `actorDisplayName`. (3) F7-8: yes, a
  person's own session revocations from the profile page are written to the security history
  (backend backlog item 19: `Session.Revoked` and `Session.OthersRevoked`, stamped with the owner's
  Company, in the same save as the revocation; the app lists them and gets labels for them).

**Second batch built 2026-09-19** (its specification was removed from here as implemented; the
report and the code carry it). F7-6: the five record pages show "Created" and "Last changed" with
the person and the local time, and each authorization and interruption row of an assignment shows
"Recorded by"; the names come from `createdByDisplayName` and `updatedByDisplayName` (backend
AUDIT-010), and "System" appears only for the technical actor. F7-7: the Overview's activity card
names the person on each row. F7-8: `Session.Revoked` and `Session.OthersRevoked` have labels and
filters, and the entry page reads the count as "Sessions ended". Rule kept from this batch: checks
never run on the owner's data; they run on a scratch stack (API 5002 over a seeded `rwrent_check`,
app 5174 started with `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174
--strictPort`) in a browser profile of their own, because `localhost` cookies are shared across
ports and a sign-in on 5174 in the owner's profile would sign them out of 5173.

## 8. Follow-up 8 — the Delete records page

> **Status: IMPLEMENTED 2026-09-21, verified the same day** (backend round 7, 35 commits up to
> `eca6ed1`; app `2f73fe8`…`9ddf236` Wiring 25 in seven grouped commits and `d88d38e` Wiring 26;
> report `Context/wiring_report.md`). Its specification was removed from here as implemented; the
> report, the rules (`DELETE-001…` in the backend's `business_rules.md`) and the code carry it. The
> agent's report said "pushed" while GitHub did not have the eight commits; the reviewer pushed them
> after the check. Typecheck, 305 tests and the build are green. The reviewer ran the report's
> password steps in a headless browser on the scratch stack (API 5002 over a seeded `rwrent_check`,
> app 5174): a Principal has no entry and the address answers "Not available to you"; the
> administrator has it after System Administrator; the banner, the six tabs with counts, Show
> changing the counts and bringing Clear filters, the search cleared and Show kept on a change of
> kind; a blocked vehicle, a driver with both reasons in one sentence and the only open
> authorization of an Active rental, each with its reason, its linked records and a disabled
> Delete… carrying the reason; "Nothing to clean up"; a deletion through the dialog (the submit
> locked until a reason and the tick, and a note for Other), after which the row leaves, the count
> drops, the confirmation line and Recently deleted show it and the link opens an entry with the
> Record fact, its hint and "Deleted record"; "This rental is active" with its parts counted; a
> conflict raised by a Fleet Manager planning a rental on the vehicle while the dialog was open,
> shown as "This vehicle now has a rental assignment. Refresh the list." with Refresh, after which
> the row is Blocked; at 402 pixels cards with full-width 44-pixel buttons, no sideways scroll, the
> dialog as a sheet and Recently deleted as cards; the audit's filter offering the six events, a
> Principal reading them, and a rental's entry showing "Deleted authorizations" and "Deleted
> interruptions". The owner's API, app and data were never used; `rwrent_v1` holds no deletion.
> Open from the run, both for the backend's next round: the record label of an interruption reads
> the reason's API name ("ScheduledMaintenance"; the owner was asked whether it should read in
> words), and a blocking authorization cannot link to its rental because the API's blocking record
> does not carry the rental's id. `Context/prototype/delete-records/` stays until the owner's own
> check of the page is done, then it is removed.

**What the page is** (kept for the next reader): `/delete-records`, permission `Records.Delete`,
administrator only until the right can be given (the next piece: a dialog of its own, only by the
administrator, only to the company's email domain). The server decides what is Ready or Blocked;
the app words it. The app has no toast: a confirmation line replaces it. A blocked Delete… is the
disabled-with-reason button. A refusal because the record became blocked or left the list is shown
with Refresh. Audit links are links only for a reader of the audit.

## 9. Follow-up 9 — the Delete records page follows the hierarchy of deletion

> **Status: IMPLEMENTED 2026-09-22, verified the same day** (backend round 8 `119b498`…`a6ff854`;
> app `fe58b91`…`f02ae81` Wiring 27 in four grouped commits and `91eee2e` Wiring 28, pushed and
> level with GitHub; report `Context/wiring_report.md`). Its specification was removed from here as
> implemented; the report, the DELETE rules in the backend's `business_rules.md` and the code carry
> it. Typecheck, 330 tests and the build are green. The reviewer built a small world on the scratch
> stack (a vehicle, a customer linked to a driver, an ended rental with two drivers and an
> interruption, a planned rental) and drove the page in a headless browser: Ready rows read "Takes 2
> rental assignments, 2 driver authorizations and 1 interruption with it", the linked driver "Takes 1
> driver authorization with it. Clears the driver link of 1 customer record", a bare row "Nothing
> else goes with it"; once the planned rental was started, the rental, its vehicle, its customer and
> its only driver all turned Blocked with the right sentence, the running rental linked under it and
> Delete… disabled, while the other driver stayed Ready; the vehicle's and the customer's dialogs
> count what goes and who stays, the driver's names the cleared link, and the tick's hint names the
> numbers; the driver's deletion left the customer with its link cleared and the rental with its
> other driver, its confirmation line reported both, its entry shows "Deleted authorizations" and
> "Cleared customer links", and the Principal reads "Driver authorisation · Removed with driver" with
> "The authorization went when this driver was deleted; the rental stays."; the customer's deletion
> took both rentals and their parts, the vehicle stayed, and its entry groups "Rental assignment 1 ·
> …" with their parts; a rental started while the vehicle's dialog was open was refused in the API's
> own sentence with Refresh, after which the row was Blocked; at 402 pixels the cards carry the takes
> line and the reason with no sideways scroll. The owner's API on 5001 was then restarted from the
> round-8 build, so the owner's app and API agree; `rwrent_v1` holds no deletion.

**What the page is** (kept for the next reader): `/delete-records`, permission `Records.Delete`,
administrator only until the right can be given (the next piece). The server decides what is Ready
or Blocked and what a deletion takes along; the app words it. A running rental is never deleted and
has to be ended first; a vehicle or a customer goes with its rentals and their parts; a driver goes
with their authorizations and clears a customer's link to them. The app has no toast: a
confirmation line replaces it. A blocked Delete… is the disabled-with-reason button. A refusal
because the record became blocked or left the list is shown with Refresh. Audit links are links
only for a reader of the audit.

**The owner's directions after trying the page** (collected for Follow-up 10, the app's half of
the backend's round 9, which also brings the role that gives the right):

1. The row button reads "Delete", not "Delete…" (2026-09-22). Also on the phone card.

## 10. Follow-up 10 — the Record deleter role in the app, and the owner's directions on the page

> **Status: IMPLEMENTED 2026-09-22, verified the same day** (backend round 9 `b4ff03b`…`432700a`;
> app `db8b13c`…`3c5aa91` Wiring 29 in five grouped commits and `d09f3b7` Wiring 30, pushed and
> level with GitHub; report `Context/wiring_report.md`). Its specification was removed from here as
> implemented; the report, the ROLE and PROFILE rules in the backend's `business_rules.md` and the
> code carry it. Typecheck, 360 tests and the build are green. The reviewer drove the app in a
> headless browser on the scratch stack: the administrator finds "Give the delete right" beside
> "Grant role" on Toms's Roles tab, the dialog names him, warns that every deletion is audited and
> that only an address in the company's domain can hold the right, shows his login email and the
> optional expiry; "Grant role" still offers only Viewer, Fleet Manager and Company Principal; after
> the grant the button disappears, the history's top row reads "Record deleter" with Expiry and
> Revoke, and the page and the directory read "Record deleter, Viewer"; the Principal has no such
> button and sees the row without actions; Toms sees "Delete records" in his navigation, the page
> with its row buttons reading "Delete" (on the phone cards too), his profile names the role, the
> email-change dialog tells him beforehand that the address must stay in the company's domain and
> his change to an outside address is refused with the API's sentence; the administrator revokes the
> right through the row's Revoke with a reason, the row reads Revoked and the button is back. The
> owner's API on 5001 was then restarted from the round-9 build with the company's domain set to
> `rwrent.ee`, so the owner's app and API agree; `rwrent_v1` holds no deletion and no Record deleter.
> The owner's directions of §9 (the "Delete" button) are done.

**What it is** (kept for the next reader): the role "Record deleter" wherever roles are named; the
administrator's own action "Give the delete right" on a person's Roles tab, with an optional expiry;
Expiry and Revoke on such a row for the administrator only; the API's refusals shown in its own
words (an address outside the domain, no domain set); the profile's email-change dialog warns a
holder and shows the refusal on the new address.

## 11. Follow-up 11 — what the owner finds in the full check from an empty app

> **Status: COLLECTING (from 2026-09-23).** The owner checks everything from an empty app (§1).
> Findings are recorded here as they come and handed over as one batch.

- **F11-1. A refusal placed under a field that is scrolled out of view goes unnoticed** (owner,
  2026-09-23, bug). Creating an Active rental for 899LGR while it already has an Active rental: the
  API refuses with `rental_assignments.vehicle_already_active`, the app maps it to `vehicleId` and
  writes "The vehicle already has an active assignment." under the Vehicle field at the top of the
  dialog, but the owner had scrolled down to "Create assignment" and nothing visible happened. The
  Activate dialog's form-level refusal ("The change was refused") was seen at once. **Cause:** the
  shared `Dialog` scrolls the first invalid control into view and focuses it, finding it by
  `[aria-invalid="true"]` (`src/ui/Dialog.tsx`, the effect after the focus trap), but 46 controls in
  the app mark themselves invalid with `data-invalid` only, not through `invalidProps`
  (`src/ui/Field.tsx`), so the scroll never finds them: `NewAssignment.tsx`, `AssignmentDialogs.tsx`,
  `FleetDialogs.tsx`, `CompanyProfile.tsx`, `SystemAdministrator.tsx` and the account pages. **Fix:**
  every form control marks itself invalid with `invalidProps` (which also tells a screen reader), so
  the existing scroll-and-focus works in every dialog; a render test per dialog file that a field
  refusal sets `aria-invalid`, and one test that the dialog scrolls to it. Side: frontend only.
- **Explained, no change (owner's question, 2026-09-23): what happens when a planned rental's start
  time arrives.** Nothing automatic: the planned start is an expectation (ASSIGN-010); the rental
  stays Planned until someone activates it (the actual handover time) or cancels it. From three days
  before its planned start the Overview's open-work queue lists it as "Planned handover — <plate>",
  and it stays there once the date has passed. Activating it while the vehicle still has an Active
  rental is refused ("The vehicle already has an active assignment."); the Active rental has to be
  ended first (ASSIGN-004).
