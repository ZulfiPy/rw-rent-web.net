# Frontend Wiring: Follow-up 22, the app speaks to a person

> Follow-up 22 (`Context/wiring_followups.md` §22): the phone number's Estonian example (F22-1), the
> screen shown when the server cannot be reached (F22-2), the facts only a developer reads off the
> record pages (F22-3), and no sentence a person reads naming the API, the backend, an endpoint, a
> payload, HTTP or a status number (F22-4). The app only: nothing in `RWRentApi-wiring` changed but the
> latest message. On `feature/backend-wiring` in this worktree
> (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main` after
> verification. Written 2026-10-02. It replaces Follow-up 21's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173 or 5174, never called 5001 or
> 5002, and never read or wrote `rwrent_v1` or `rwrent_check`. Nothing was sent to the server, to
> `https://rw-rent.net` or to `https://api.rw-rent.net`, and nothing under `deploy/` or of the
> deployment's documents was changed.
>
> - Both of the owner's apps hot-reload from this worktree, so they show this run's words (§8, item 1).
> - Every live look used this run's own stack: round 16's API on 5003 over `rwrent_r16`, this run's
>   Vite on 5176 against it, a second Vite on 5177 pointed at a port where nothing answers, and the
>   harness of the real pages on 5175 (§4.1).
> - **For the reviewer: §2.5 lists every sentence changed, before and after, with its file, and §5
>   lists the signed-in steps on 5176 against 5003.**

## 1. Summary

- **F22-1.** Create account shows `+372 5000 0000` as the phone number's example. No other field of
  the app shows a country's example.
- **F22-2.** When the server cannot be reached the app shows "RW-Rent cannot be reached right now"
  and "Check your internet connection and reload this page. If it stays like this, try again in a
  few minutes.", and nothing under them. The error's own text is no longer shown.
- **F22-3.** The rental's page no longer shows the concurrency token, and the user's page no longer
  shows the security version. What the app sends with a correction did not change. The audit entry's
  last panel is titled "The entry as stored".
- **F22-4.** No sentence a person reads names the API, the backend, an endpoint, a payload, HTTP,
  JSON, a UUID, concurrency or a status number.
  - The eight §22 lists read as it words them.
  - Reading every text of the app found six more texts of the kind, in four places, reworded the
    same plain way: the Profile's "Your effective access" window, the note on ending a user's
    session, the note on activating a rental nobody may drive yet, and the audit entry's panel for
    values it cannot set out.
  - A test reads every text of the app, 6,707 of them, and fails on any of those words, the rightful
    exceptions aside, each named in the test with what it is.

| | |
|---|---|
| Commits | two `Wiring 55` commits and this report's `Wiring 56`, on `feature/backend-wiring` (§9) |
| Texts changed | **22**: 4 removed with their two facts, 18 reworded or replaced (§2.5) |
| Tests | 786 before, **807** now, all green: 21 new, 4 changed on purpose (§2.6) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the two (§4.4) |
| Planted breakages | **29 planted, 29 caught**, at least one for each item; one control, the word in a comment only, rightly let through (§4.3) |
| In a browser | Create account on 5176 against 5003; the unreachable screen with nothing answering; the rental, the user and an audit entry through the harness (§4.2) |

## 2. Implemented

### 2.1 F22-1 (`src/pages/account/Register.tsx`)

The phone field's placeholder is `+372 5000 0000`. A test reads every text of the app for a
country's calling code and finds this one alone.

### 2.2 F22-2 (`src/App.tsx`, `src/App.module.css`)

- The screen's title and body are §22's. The line under them, which showed the error's own text,
  "Failed to fetch" or "HTTP 502", is gone, and its style with it.
- The screen is shown as before, when asking who is signed in fails with anything but "not signed
  in": the request never arriving, or a server on the way answering in the API's place.

### 2.3 F22-3 (`AssignmentRecord.tsx`, `UserRecord.tsx`, `AuditEntry.tsx`)

- **The rental's Privileged corrections panel** lost the fact "Concurrency token" with its hint. It
  keeps "Last changed". Both corrections still send the token with the request, as before.
- **The user's Account panel** lost the fact "Security version" with its hint. Six facts are left,
  and the panel now sets them three to a row: with four to a row, as it was, the two places the wide
  fact filled stood empty.
- **The audit entry's last panel** is titled "The entry as stored". Its stored content is shown as it
  is stored, as before.

### 2.4 F22-4

- **The eight sentences §22 lists** read as it words them, in the files it names.
- **Found by reading every text the app holds,** and reworded the same way with no change of meaning:
  - the Profile's "Your effective access" window named the frontend and `GET /api/me`;
  - the note on ending one of a user's sessions named the endpoint, as the suspend note did;
  - the note on activating a rental with no authorized driver named the api;
  - the audit entry's panel for an entry whose values it cannot set out was titled "Payload" and
    spoke of an "Unrecognised payload shape" and "raw values".
- **How the reading was done:** a script walked every source file with the TypeScript parser and
  listed each string, each template's words and each piece of JSX text: 6,712 texts in 128 files, the
  imports' paths aside.
  Those with a named word were read one by one; the rest were searched for other words of the same
  kind, which §8 item 2 lists.

### 2.5 Every sentence changed, before and after

All paths are under `src/`.

| # | Item | File | Before | After |
|---|---|---|---|---|
| 1 | F22-1 | `pages/account/Register.tsx` | +371 20 000 000 | +372 5000 0000 |
| 2 | F22-2 | `App.tsx` | The API did not answer | RW-Rent cannot be reached right now |
| 3 | F22-2 | `App.tsx` | The app could not reach the RW-Rent API. Start it and reload this page. | Check your internet connection and reload this page. If it stays like this, try again in a few minutes. |
| 4 | F22-3 | `pages/fleet/AssignmentRecord.tsx` | Concurrency token | removed with its fact |
| 5 | F22-3 | `pages/fleet/AssignmentRecord.tsx` | Sent with each correction; a stale token returns 409 Conflict. | removed with its fact |
| 6 | F22-3 | `pages/users/UserRecord.tsx` | Security version | removed with its fact |
| 7 | F22-3 | `pages/users/UserRecord.tsx` | Increments on credential and access changes. | removed with its fact |
| 8 | F22-3 | `pages/audit/AuditEntry.tsx` | Raw payload | The entry as stored |
| 9 | F22-4 | `api/problem.ts` | The API refused this change because the record no longer accepts it. | This change was refused because the record no longer accepts it. |
| 10 | F22-4 | `pages/users/UserDialogs.tsx` | Signing in stops immediately and every active session ends. The endpoint takes no reason, so none is recorded. | Signing in stops immediately and every active session ends. No reason is asked for here, so none is recorded. |
| 11 | F22-4 | `pages/admin/CompanyProfile.tsx` | If any user, vehicle, customer, driver or assignment references the Company, the API refuses the delete with a conflict. | If any user, vehicle, customer, driver or assignment refers to the Company, the delete is refused. |
| 12 | F22-4 | `pages/fleet/Vehicles.tsx` | Exact year; the API accepts 1900 or later. | Exact year, 1900 or later. |
| 13 | F22-4 | `pages/fleet/AssignmentDialogs.tsx` | Closes the assignment. Open driver authorizations are stopped by the backend. | Closes the assignment. Open driver authorizations are stopped with it. |
| 14 | F22-4 | `pages/account/Profile.tsx` | What the API reports for your account right now. | Your roles and what they allow, as they are right now. |
| 15 | F22-4 | `pages/fleet/FleetDialogs.tsx` | The API rejects a driver link on a business customer. | A business customer cannot be linked to a driver. |
| 16 | F22-4 | `pages/account/Profile.tsx` | A successful change refreshes your session. | You stay signed in after the change. |
| 17 | F22-4, found | `pages/account/Profile.tsx` | The frontend renders actions from the permissions returned by GET /api/me, not from role names. | What you can do in the app follows these permissions, not the names of your roles. |
| 18 | F22-4, found | `pages/users/UserDialogs.tsx` | The session ends at once and is recorded as “Revoked by administrator”. The endpoint takes no reason, so the audit entry records none. | The session ends at once and is recorded as “Revoked by administrator”. No reason is asked for here, so the audit entry records none. |
| 19 | F22-4, found | `pages/fleet/AssignmentDialogs.tsx` | No driver is authorized yet. The api refuses activation until this assignment has coverage. | No driver is authorized yet. Activation is refused until this assignment has coverage. |
| 20 | F22-4, found | `pages/audit/AuditEntry.tsx` | Payload, a panel's title | Recorded values |
| 21 | F22-4, found | `pages/audit/AuditEntry.tsx` | Parsing, that panel's one label | Reading |
| 22 | F22-4, found | `pages/audit/AuditEntry.tsx` | Unrecognised payload shape — see the raw values below | These values could not be set out here. See the entry as stored, below. |

The list was made by comparing every text of the app at `7e29926` with every text now: these 22 and
nothing else changed, but for the dash that stood for a missing token, which went with its fact.

### 2.6 Tests

**21 new test cases, 4 changed on purpose** (786 before, 807 now).

| File | Cases | What they hold |
|---|---|---|
| `pages/followup22.words.test.ts` | 6 | every text of the app read with the TypeScript parser: none holds a named word, the rightful exceptions aside; each exception still needed and no more of them; the error's own message never reaching a screen for an answer of the API; each of the 22 sentences of §2.5, the new one in its file and the old one nowhere; the one country's example |
| `pages/followup22.render.test.ts` | 9 | Create account's placeholder; the unreachable screen alone, and the app showing it for a request that never arrived and for a 502, with no error text; the rental's corrections panel without the token, both corrections still sending it; the user's Account panel without the version, six facts three to a row; the audit entry's last panel and its panel for values it cannot set out |
| `pages/followup22.sentences.render.test.ts` | 6 | the refusal with no message of its own; the suspend and end-session notes; ending a rental and activating one nobody may drive; the year's hint; a business customer's linked driver; the Profile's Access panel |

**The rightful exceptions,** each named in the test: the addresses the app calls, in `src/api/`, and
six single texts. Those are the type `application/json` it sends requests in; the ending
`.concurrency_conflict` of a code it compares; the member name `ConcurrencyToken` in the audit's
stored content; an error's own message for the programmer's console, `HTTP` and the status; a
programmer's mistake caught at start; and the 500-euro deductible, a sum of money.

**Changed on purpose,** all four for sentence 22:

| Test | Expected before | Expects now |
|---|---|---|
| `followup8.render.test.ts`, "a copy the reader does not recognise falls back to the ordinary payload views" | the markup contains "Unrecognised payload shape" | it contains "These values could not be set out here." |
| `followup9.render.test.ts`, two cases, and `followup19.audit.render.test.ts`, one | the markup does not contain "Unrecognised payload shape" | it does not contain "These values could not be set out here." |

The last three still passed with the old words, which no longer exist anywhere; they were changed so
that they go on saying something.

## 3. Not implemented or partial

Nothing of §22. Other sentences that sound written for a developer, without any of the words §22
names, were left and are listed in §8 item 2.

## 4. Verification

### 4.1 The stack

- **The API:** round 16's, on 5003, pid 84422, over `rwrent_r16`, as round 16 left it.
- **The app:** this run's Vite on 5176 from this worktree, with `VITE_API_BASE_URL=http://localhost:5003`.
- **Nothing answering:** a second Vite on 5177 with `VITE_API_BASE_URL=http://localhost:5999`, a port
  nothing listens on.
- **The harness:** Follow-up 20's, on 5175, the app's real pages from this worktree with a stand-in
  transport that sends nothing anywhere.
- All three ran from launch entries added to the workspace's `.claude/launch.json` for the run and
  removed after it; the file is as it was. All three are stopped.

### 4.2 In a browser

- **Create account on 5176, signed out, against 5003:** the phone field's example reads
  `+372 5000 0000`. The page's only API request went to `http://localhost:5003/api/me`, 401.
- **The unreachable screen on 5177:** the app asked `http://localhost:5999/api/me`, got no answer,
  and showed "RW-Rent cannot be reached right now", the body, and nothing in the mono type.
- **Through the harness, as the administrator:**
  - the rental's Corrections tab: Privileged corrections shows its two buttons, "Last changed" with
    the person and the time, and the warning; no token;
  - the user's page: Account shows First name, Last name, Login email, then Email ownership, Phone,
    Company, with no empty place. With four to a row the picture showed a grey gap, which is why the
    row is three.
- **Through the harness, as the Principal:** an audit entry's panels end with "Reason" and "The entry
  as stored".
- **Not looked at in a browser:** the dialogs of §2.5's sentences 10 to 19. They need a sign-in on
  5176, which §5 gives the reviewer; the tests render each one.

### 4.3 The planted breakages: 29 planted, 29 caught

Each changed one thing in a copy of the commit taken with `git archive`, never the worktree; the
whole suite and the typecheck ran in the copy; the files were then written back, and the copy ran
clean at the end, 807 green. A breakage counts as caught only when a test failed.

| # | The breakage | Caught by |
|---|---|---|
| M1 | the Latvian example is back on Create account | the render test; the sentences' list; the one example |
| M2 | another field gains a country's example | the one example; the sentences' list |
| M3 | the unreachable screen's old title is back | the screen's three tests; the words test |
| M4 | the screen tells the person to start the server | the screen's three tests; the sentences' list |
| M5 | the error's own text is shown under the body again | the screen's three tests |
| M6 | the concurrency token is back on the rental's page | the corrections panel's test; the words test |
| M7 | the security version is back on the user's page | the Account panel's test; the sentences' list |
| M8 | the audit entry's panel is titled "Raw payload" again | the panel's test; the words test |
| M9 | a correction no longer sends the token | the test of what a correction sends |
| M10 | the user's Account panel keeps four to a row | the Account panel's test |
| M11 | the audit entry's unreadable values are a "payload shape" again | its test; `followup8`'s; the words test |
| M12 | a refusal without a message names the API | its test; the words test |
| M13 | suspending a user names the endpoint | the notes' test; the words test |
| M14 | deleting the Company names the API and a conflict | the words test; the sentences' list |
| M15 | the year's hint names the API | its test; the words test |
| M16 | ending a rental names the backend | its test; the words test |
| M17 | the Access panel names the API | its test; the words test |
| M18 | a business customer's driver link names the API | its test; the words test |
| M19 | changing the password speaks of refreshing the session | the sentences' list |
| M20 | "Your effective access" names the frontend and `GET /api/me` | the words test; the sentences' list |
| M21 | ending a session names the endpoint | the notes' test; the words test |
| M22 | activating a rental names the api | its test; the words test |
| M23 | a page's description newly names the API | the words test |
| M24 | a placeholder newly names a payload | the words test; a test of the Tasks page |
| M25 | a sentence gains a status number, 409 | the words test; the sentences' list |
| M26 | a label names JSON | the words test |
| M27 | a label names a UUID | the words test |
| M28 | a message names concurrency | the words test; four tests of the stale banner |
| M29 | a message names HTTP | the words test |

**The control, not a breakage:** the words "API", "concurrency", "HTTP" and "JSON payload" put into a
comment only. The suite stayed green, 807, as it should: a comment is not a text a person reads.

### 4.4 The test suite, and each commit

- `npx vitest run`: **807 passed**, 75 files. `tsc -b --noEmit`: 0 errors.
- Each commit exported alone with `git archive`, typechecked and tested:

| Commit | Type errors | Tests |
|---|---|---|
| `39bf489` | 0 | 795 |
| `d2ecee8` | 0 | 807 |

### 4.5 The owner's side, untouched

- 5001 is pid 83735 and 5002 pid 83612, as at the start; neither was called.
- 5173 is pid 24831 and 5174 pid 58932, as at the start; neither was opened.
- `rwrent_v1` and `rwrent_check` were never addressed.

### 4.6 End state

- **The API on 5003 is left running**, pid 84422, over `rwrent_r16`. This run signed in there as the
  administrator, Dita and Signe once, to read what the reviewer's steps name, and wrote nothing else.
- **Nothing else of this run runs.** Nothing listens on 5175, 5176 or 5177.

## 5. For the reviewer: the signed-in steps

### 5.0 Before you start

- **The stack:** the API on 5003 over `rwrent_r16`, round 16's seed and its practice registrations.
- **Start Vite on 5176 from this worktree.** The API trusts only that origin:
  `VITE_API_BASE_URL=http://localhost:5003 npm run dev -- --port 5176 --strictPort`
- **Use a browser profile of its own**, never the owner's. The apps on 5173, 5174 and 5176 share
  `localhost`'s cookies, so signing in on 5176 in the owner's profile signs the owner out of 5173.
- **The seeded people**, all with the seed password: the administrator, Arturs Veidenbaums
  (`sysadmin@rwrent.example`); Signe Priede, Company Principal; Dita Smite, Fleet Manager.

### 5.1 Signed out

1. **Create account**, `http://localhost:5176/register`: the phone field's example is
   `+372 5000 0000`.
2. **The unreachable screen.** Start a second Vite that points at nothing:
   `VITE_API_BASE_URL=http://localhost:5999 npm run dev -- --port 5177 --strictPort`, and open
   `http://localhost:5177`. "RW-Rent cannot be reached right now", its body, and no line under them.
   Stop it again.

### 5.2 As Dita

3. **Vehicles, More filters:** under Manufacturing year, "Exact year, 1900 or later."
4. **Rental assignments, the planned rental of 444 WKS, Martins Ozols: Activate.** The note reads
   "No driver is authorized yet. Activation is refused until this assignment has coverage." Cancel.
5. **The active rental of 482 TKL, Baltic Freight Partners: End assignment.** Under the title,
   "Closes the assignment. Open driver authorizations are stopped with it." Cancel.
6. **Customers, Baltic Freight Partners, Edit:** under Linked driver, "A business customer cannot be
   linked to a driver." Cancel.
7. **Your profile.**
   - The Access panel: "Your roles and what they allow, as they are right now."
   - Show permissions: "What you can do in the app follows these permissions, not the names of your
     roles." Close.
   - Change password: "You stay signed in after the change." Cancel.

### 5.3 As Signe

8. **Users, Toms Rudzitis.** The Account panel holds six facts in two rows of three: First name, Last
   name, Login email, then Email ownership, Phone, Company. No "Security version".
9. **Suspend:** the note reads "Signing in stops immediately and every active session ends. No
   reason is asked for here, so none is recorded." Cancel.
10. **Users, Dita Smite, Sessions, the action that ends one session:** "The session ends at once and is recorded
    as “Revoked by administrator”. No reason is asked for here, so the audit entry records none."
    Cancel.
11. **Security audit, any entry:** the last panel is titled "The entry as stored", with Before and
    After as they are stored and the line that the history is append-only.

### 5.4 As the administrator

12. **Rental assignments, any rental, Corrections:** Privileged corrections shows Correct parties,
    Correct timeline, "Last changed" and the warning. No "Concurrency token".
13. **Correct timeline on it, with a reason, and save:** it saves, so the token still goes with the
    request. Or cancel, and take the test's word for it.
14. **Company, Delete Company:** "If any user, vehicle, customer, driver or assignment refers to the
    Company, the delete is refused." Cancel.

## 6. Decisions

Choices this run made where the specification left room, each small to change:

1. **What counts as a text a person reads:** every string, template and piece of JSX text in the
   app's source, the tests and their fixtures aside, comments not included. Reading all of them
   costs a handful of named exceptions and leaves no doubt about what was skipped.
2. **A status number** is one of HTTP's own: 400, 401, 403, 404, 405, 408, 409, 410, 413, 415, 422,
   429, 500, 502, 503, 504. So "1900 or later" and "100 items" are numbers, and "the 500-euro
   deductible" is the one sum of money that had to be named.
3. **The wording of the six texts found,** §2.5's 17 to 22, in the manner of §22's eight: the same
   fact, without the machine. Sentence 18 follows §22's own words for the suspend note.
4. **The audit entry's panel for values it cannot set out** is titled "Recorded values", the title
   the same place carries when it can set them out, and points at "the entry as stored, below", the
   panel's new name.
5. **The user's Account panel sets three facts to a row.** §22 asks only that the fact goes; the gap
   it left was seen in the browser and closed.
6. **The unreachable screen takes no text at all** from the error, and its mono style is removed, so
   no later change can show one there by passing it.

## 7. Deviations

None from §22.

## 8. Open risks and observations

1. **The owner's apps on 5173 and 5174 hot-reloaded this code as it was saved,** each file swapped
   in whole after the suite passed in a scratch copy.
2. **Sentences that still sound written for a developer, left because they hold none of the words
   §22 names.** Each is one the owner may want reworded in a later follow-up:
   - **A permission's code name** in fourteen "no access" lines, such as "Reading drivers needs
     Drivers.Read." and "This area needs SystemAdministration.Transfer.", on the lists and record
     pages of vehicles, customers, drivers, rentals, registrations, the Company, the security audit
     and the administrator's page.
   - **"Server sessions"**, a panel's title on the user's page, and "Ends this server session
     immediately." on the Profile.
   - **"token"**: "Consuming the single-use token from your link. This takes a moment." on the two
     checking screens; "Completing the reset needs the account email, the link token and your new
     password."; "Issues a fresh single-use token and invalidates the previous one." and "Withdraws
     the pending transfer and invalidates its token." on the administrator's page.
   - **"in one request"**: "Starts a new authorization as this one stops, in one request."
   - **"Entity id"**, a label on the audit entry.
3. **The browser's and a server's own words can still reach a form,** though not the unreachable
   screen:
   - a request that never arrives shows the browser's text in the form's alert, "Failed to fetch" in
     Chrome and "Load failed" in Safari; the sign-in page has its own plain sentence for it but shows
     the browser's first;
   - a server on the way that answers for the API with no sentence gives the status's name, such as
     "Bad Gateway", and one that answers with a page instead of data gives the parser's complaint.
   Both are rare on the live site and outside §22's words. One plain sentence for every answer that
   is not the API's own would close them.
4. **The security audit's stored content still names what it names,** as §22 says it stays: its
   members, "ConcurrencyToken" among them, are shown as stored in "The entry as stored".
5. **What the suite does not hold:** that a sentence without any named word is plain. The words test
   holds the words; whether a new sentence speaks to a person is still a reader's judgement.

## 9. Commits

On `feature/backend-wiring`, after `7e29926`, in this order:

1. **`39bf489`** Wiring 55: The phone number's example on Create account is Estonian, the screen shown when the server cannot be reached speaks to a person and shows no technical line, and the rental's concurrency token and the user's security version leave their pages, the audit entry's last panel titled The entry as stored.
   10 files (under `src/`): `App.module.css`; `App.tsx`; `pages/account/Register.tsx`; `pages/audit/AuditEntry.tsx`; `pages/fleet/AssignmentRecord.tsx`; `pages/users/UserRecord.tsx`; `pages/followup8.render.test.ts`; `pages/followup9.render.test.ts`; `pages/followup19.audit.render.test.ts`; added `pages/followup22.render.test.ts`.

2. **`d2ecee8`** Wiring 55: No sentence a person reads names the API, the backend, an endpoint or a status number: the eight the specification lists and three more found by reading every text of the app are reworded plainly, and a test reads every text to keep it so.
   9 files (under `src/`): `api/problem.ts`; `pages/account/Profile.tsx`; `pages/admin/CompanyProfile.tsx`; `pages/fleet/AssignmentDialogs.tsx`; `pages/fleet/FleetDialogs.tsx`; `pages/fleet/Vehicles.tsx`; `pages/users/UserDialogs.tsx`; added `pages/followup22.sentences.render.test.ts` and `pages/followup22.words.test.ts`.

3. **This report's commit**, `Wiring 56`: `Context/wiring_report.md`, rewritten.
