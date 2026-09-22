# Frontend Wiring — Follow-up 10, the Record deleter role in the app

> Follow-up 10 (`Context/wiring_followups.md` §10, with the owner's direction collected under §9): the
> app's half of the backend's round 9, which the owner decided on 2026-09-20 to 2026-09-22 and the
> reviewer verified on 2026-09-22. The contract is the live OpenAPI document of the scratch API,
> explained by `RWRentApi-wiring/Context/round9_report.md` §5 and the ROLE, DELETE and PROFILE rules in
> `RWRentApi-wiring/Context/business_rules.md`. Worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`,
> branch `feature/backend-wiring`. Written 2026-09-22. It replaces Follow-up 9's report, which git
> history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001 and never wrote to `rwrent_v1`, whose read-only fingerprint is the same at the end as at
> the start.
>
> - The API on 5001 still serves round 8. The reviewer restarts it on the round-9 build only after
>   this follow-up is verified, with `ApiSecurity__RecordDeleterEmailDomain=rwrent.ee` in its
>   environment.
> - The owner's app on 5173 hot-reloads from this worktree. Against the round-8 API it changes in one
>   visible way only, the row button of Delete records now reading "Delete" (§8.1).
> - Every live check used the scratch stack round 9 left running: the API on 5002 over `rwrent_check`,
>   from the round-9 Release build, with the company's email domain `rwrent.example`.
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

The right to delete is now a role in the app, "Record deleter", and the app words what the server
decides about it without deciding any of it.

- **The role everywhere roles are named.** The user directory, its role filter, the user record, the
  profile and the chips name it "Record deleter", ranked below Viewer.
- **Giving the right.** On a person's Roles tab the System Administrator finds "Give the delete right"
  beside Grant role, for an Active account outside the administrator's protection that does not hold
  the role yet. It opens a dialog of its own: who it makes a Record deleter, a warning that every
  deletion is audited with their name and that only an address in the company's email domain can
  hold the right, the person's login email, and an optional expiry.
- **Refusals in the API's words.** An address outside the domain, or an installation without a domain,
  is refused in the dialog's banner with the API's own sentence.
- **Changing and taking it back.** Expiry and Revoke on a Record deleter row appear only for the
  administrator; a Company Principal reads the row without actions. Grant role still offers only
  Viewer, Fleet Manager and Company Principal.
- **The email change.** A holder is told beforehand that the new address must stay in the company's
  domain, and the API's refusal lands under the new address.
- **A Record deleter with no other role** reaches the Delete records page and their profile; the
  Overview shows its restricted states as for any missing permission.
- **The owner's direction.** The row button of Delete records reads "Delete", in the table and on the
  phone card.

| | |
|---|---|
| Commits | `db8b13c`, `7702181`, `0263c8a`, `c106436`, `3c5aa91`, and this report's (§9) |
| Tests | 330 → **360**, all green: 30 new; 8 existing tests updated for the new label (and one renamed); the code catalogue and the route personas extended |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at every one of the five |
| Planted breakages | **30 planted, 30 caught**; every new or updated test fails against at least one |
| Joint check | **18/18** through the API; the screens rendered from those very answers |
| The owner's database | unchanged: same fingerprint before and after |

## 2. Implemented

### 2.1 The contract and the words, §10 points 1 and 2

- **`src/api/dto.ts`:** `ApplicationUserRole.RecordDeleter = 5`.
- **`src/permissions/permissions.ts`:** `Roles.ManageRecordDeleter`, the permission that gives, changes
  and revokes the role, the System Administrator's alone. `Records.Delete`'s comment names the role.
- **`src/format/labels.ts`:** `ROLE_LABEL[5] = 'Record deleter'`, rank 0, below Viewer. So a Viewer who
  may also delete is, in the sidebar's one word, a Viewer; someone who holds only the role is a
  Record deleter. Every place that names roles (the directory and its role filter, the user record,
  the profile, the access screens, chips) shows it with no further change: the filter already lists
  every value of the enum.
- **`src/api/codes.ts`:**
  - `email_change.outside_company_domain` → `newEmail`, under the profile's email-change operation
    `profile-email`;
  - `roles.email_domain_not_allowed` and `roles.email_domain_not_configured` listed as deliberately
    form-level refusals (`FORM_LEVEL_CODES`, part of `KNOWN_CODES`). They name no input, so a 409 with
    either becomes the dialog's red banner, "The change was refused", with the API's own sentence
    under it: the domain for the first, the missing setting for the second.

### 2.2 The Roles tab, §10 point 3 (the panel) and point 4

`src/pages/users/UserRecord.tsx`:

- **The panel's actions.** Grant role as before, and beside it **"Give the delete right"** (icon
  `delete_sweep`) for a reader with `Roles.ManageRecordDeleter`, when the person is Active, is not the
  protected System Administrator, and does not hold an effective Record deleter role
  (`effectiveRoles`, the server's own answer). Both sit in the panel's action slot and wrap under the
  heading at phone width.
- **The note.** For a reader who may give the right it ends "… The delete right is given with its own
  action."; a Principal's note is unchanged.
- **`canManageRole`** answers a Record deleter row from `Roles.ManageRecordDeleter`, before the Company
  Principal and Viewer/Fleet Manager rules. So Expiry and Revoke appear on an effective Record deleter
  row for the administrator only, in the table and on the phone card; a Principal sees the row
  without actions and still manages the Viewer and Fleet Manager rows as before.

### 2.3 The dialog, §10 point 3

`src/pages/users/UserDialogs.tsx`, a dialog of its own (`record-deleter-grant`), modelled on Grant role:

- title "Give the delete right", icon `delete_sweep`;
- description "Makes Toms Rudzitis a Record deleter, who may delete records for good on the Delete
  records page.";
- a warn-tone note: "Every deletion they make is written to the security audit with their name and
  reason. Only an address in the company's email domain can hold the right.";
- the person's login email as a fact;
- the optional expiry in Grant role's words and form (a date, "Leave empty for no expiry. The chosen
  date is the last valid day.", sent as the end of that day, Europe/Tallinn);
- submit "Give the delete right" (`primary`).

What it sends is one small exported function, `recordDeleterGrant(date)`: role 5, and the expiry or
null. It submits as its own operation, and a success closes the dialog and reloads the history, the
person's record, their sessions and the audit, as every user dialog does. A refusal because of the
domain or the missing setting is the banner of §2.1. Grant role keeps offering only Viewer, Fleet
Manager and Company Principal.

### 2.4 The profile, §10 point 5

`src/pages/account/Profile.tsx`, the email-change dialog (now also a named export, for the tests):

- when the signed-in person holds the role (`me.roles` includes 5), the description adds "Because you
  hold the delete right, the new address must stay in the company's email domain.";
- the API's refusal, `400 email_change.outside_company_domain`, arrives with `errors.NewEmail`, so it
  lands under "New email address" in the API's words, with the field marked invalid and no banner. A
  refusal carrying only the code lands on the same field through the code table (§2.1).

### 2.5 The owner's direction on the Delete records page, §10 point 6

`src/pages/admin/DeleteRecords.tsx`: the row button reads **"Delete"**, not "Delete…", in the table and
on the phone card; its hint and its disabled reason are unchanged. The page's comment and a comment in
`src/format/recordDeletion.ts` follow.

### 2.6 Tests, §10 point 7

**30 new tests**, and existing tests updated only where §10 allows: the catalogue literals and the old
"Delete…" label. No other existing test was deleted, skipped or weakened.

**The updated tests, each with its old and new expectation:**

| File | Test | Before | Now |
|---|---|---|---|
| `src/api/codes.test.ts` | the backend's catalogue (`BACKEND_CODES`) | users, rental assignments, authorizations, interruptions, drivers, record deletions | the same, plus the thirteen `roles.*` codes of `RoleAssignmentErrors.cs` and `email_change.outside_company_domain` |
| `src/app/routes.test.ts` | the persona `SYSTEM_ADMINISTRATOR` | … `Records.Delete` | … `Records.Delete`, `Roles.ManageRecordDeleter` |
| `src/app/routes.test.ts` | "only the administrator may open Delete records …" → "only the administrator and a Record deleter may open Delete records, by any spelling (Follow-ups 8 and 10)" | three roles refused, the administrator admitted | the same, and a new persona `RECORD_DELETER` (`Records.Delete` alone) admitted, by two spellings |
| `src/format/labels.test.ts` | the imports | — | the role label and rank, for the new tests |
| `src/pages/followup8.render.test.ts` | rental assignments; driver authorizations; vehicles (three tests) | `button(…, 'Delete…')` | `button(…, 'Delete')` |
| `src/pages/followup8.phone.render.test.ts` | "… its own full-width Delete…" | a danger button ending `Delete…</button>`; no disabled button containing `Delete…` | the same with `Delete</button>`; the negative check now also requires the label to end the button, so it keeps its bite |
| `src/pages/followup8.phone.render.test.ts` | "… holds a disabled Delete…" | the name only | the name only: "… holds a disabled Delete" |
| `src/pages/followup9.render.test.ts` | a Ready vehicle; a running rental; a customer with two running rentals (three tests) | `button(…, 'Delete…')` | `button(…, 'Delete')` |
| `src/pages/followup9.phone.render.test.ts` | "… above its own Delete…" | no disabled button containing `Delete…` | no disabled button ending `Delete</button>` |

`can.test.ts` holds persona lists too; §10 does not name it and none of its assertions concerns the
new role, so it is unchanged.

**The new tests:**

| File | New | What they hold |
|---|---|---|
| `src/api/codes.test.ts` | 2 | the email refusal lands on `newEmail` under `profile-email`; the two grant refusals are the form-level list, known to the catalogue, and resolve to no input under the new dialog's operation or Grant role's |
| `src/app/routes.test.ts` | 1 | a Record deleter with no other role reaches exactly the ungated pages and Delete records, and the menu offers them Delete records alone |
| `src/format/labels.test.ts` | 2 | "Record deleter" in the label and in a list of roles; the rank below Viewer, in both orders, alone and beside Fleet Manager |
| `src/pages/followup10.render.test.ts` | 12 | the Roles tab for the administrator: the action beside Grant role and the note's sentence; no second offer to a holder, whose effective row has Expiry and Revoke while a revoked row has none; not offered for a suspended account nor on the administrator's own record; the revocation's reason at the end. For a Principal: the row without actions, no offer for a holder or a non-holder, Grant role kept, the Viewer row still managed. The name in the directory row and its role filter, in the record's header and in the profile's Roles fact, in the API's order. A bare Record deleter: the Delete records page with each row's "Delete" and Recently deleted without audit links; the Overview's restricted states |
| `src/pages/followup10.dialogs.render.test.ts` | 11 | the dialog's title, description, warn note, email and expiry, and its primary button; its own operation and the reloads; the request with and without an expiry, the dated one equal to the instant the API stored for the live grant; the outside-domain and no-domain refusals as the banner in the API's words; Grant role's three options; the Expiry and Revoke dialogs naming a Record deleter assignment; the holder's sentence, and none for a non-holder; the email refusal on the new address with no banner, also when it carries only its code |
| `src/pages/followup10.phone.render.test.ts` | 2 | on a phone the Record deleter card carries Expiry and Revoke for the administrator, none for a Principal |

**How they are built.**

- The fixtures, `src/pages/followup10.support.ts`, are the joint check's own answers from the scratch
  API (§4.1), written out as the DTOs. A member the API sends and `dto.ts` does not declare fails the
  typecheck. All eighteen were compared with the saved live answers at the end: none differs. One more,
  the no-domain refusal, cannot be provoked on the scratch stack, whose domain is set; it is the
  backend's own sentence from `RoleAssignmentErrors.cs`, in the API's conflict envelope, and says so.
- The shared render helper (`followup7b.support.ts`) takes an optional `me`, so a page can be rendered
  as Toms instead of the Principal; without it nothing changes.
- A server render cannot submit, so the dialog tests replace the one hook every dialog submits through.
  The stand-in records the operation and reloads the dialog passes, and answers with the refusal a test
  names, turned into a failure by the app's own `toFailure` under the dialog's own operation. That is
  what the real hook does, so the real dialog and the real mapping are what is tested.

## 3. Not implemented or partial

**Nothing of §10.** Every point is built and tested.

### 3.1 The steps that need a password typed into the app

The browser steps of the joint check need the seed password typed into the sign-in page, which this
run may not do. They are left for the owner's reviewer (§5). What they would show was covered here in
three ways:

- through the API, by script, as the same people (§4.1);
- rendered from those answers by the real components (§4.2);
- looked at in a preview of the real screens with those answers in the cache (§4.3).

## 4. Verification: the joint check

Everything ran on the scratch stack only.

- **The scratch API** was used as round 9 and its review left it: the API on 5002 over `rwrent_check`,
  round-9 Release build, domain `rwrent.example`. It was not reseeded. Its data already held round 9's
  acceptance and the reviewer's probe, so Toms's history carries three earlier Record deleter
  assignments, all revoked.
- **Guards.** The API client refuses any address but `localhost:5002`; Mailpit was read only for this
  run's own addresses. The seed password came from the owner for this session and was passed in each
  command's environment; it is in no file.

### 4.1 Through the API — 18/18

`joint10.py`, in the run's scratchpad, as the seeded administrator Arturs Veidenbaums, with the
Principal Signe Priede and the Fleet Manager Karlis Zvaigzne:

- **before:** the administrator's permissions carry `Roles.ManageRecordDeleter` and never the role;
  the served document names 5 `RecordDeleter`; Toms Rudzitis is a Viewer without the right;
- **the Principal's grant:** `403 roles.forbidden`;
- **the grant:** 201, effective, no expiry. Toms's record, history and directory row carry the role,
  and the Principal reads the same history. His own `GET /api/me` holds Viewer, Record deleter and
  `Records.Delete`; he reads the six lists, the counts and the deletions made;
- **one deletion:** the Fleet Manager builds a practice vehicle, "F107CB41C · Practice Follow-up ten
  2026"; Toms finds it Ready and deletes it; it heads his Recently deleted, and the Principal reads the
  entry by "Toms Rudzitis";
- **a grant with an expiry** to Dita Smite, its expiry changed through the row action, the Principal's
  expiry change and revocation of it refused `403 roles.forbidden`, then revoked by the administrator;
- **the outside address:** the grant to the practice Viewer `outside.practice.bb86bb@example.com` is
  `409 roles.email_domain_not_allowed`, "The Record deleter role can be given only to a user whose
  email address is in the company's domain, rwrent.example.";
- **a bare Record deleter:** with his Viewer role revoked for the check, Toms holds `Records.Delete`
  alone, reads the page and Recently deleted, is refused `/api/vehicles`, and the Overview's counts are
  all null. His Viewer role was then granted again;
- **his email change:** to `toms.rudzitis@example.com`, `400 email_change.outside_company_domain` on
  `NewEmail`; to `toms.rudzitis.f10@rwrent.example`, accepted and confirmed from Mailpit, and back to
  his own address the same way;
- **the revocation** with a reason: Toms is a Viewer again, refused the page, and the row keeps its
  reason.

### 4.2 The screens, rendered from those answers

The fixtures of §2.6 are those answers, compared field by field with the saved ones at the end. So the
30 new tests are the render half of the joint check. They feed the answers to the real Roles tab,
dialogs, directory, record, profile, Delete records page and Overview, as the administrator, the
Principal, Toms holding the role, and Toms holding it alone.

### 4.3 In a browser

- **The app on 5174.** A Vite on 5174 was already running from this worktree against 5002,
  `VITE_API_BASE_URL=http://localhost:5002 … --port 5174 --strictPort`, started earlier in the day
  as the owner's practice copy. It is exactly the setup §10 asks for, so I used it rather than
  replace a process that is not mine (§7.1). A gated page sent the signed-out visitor to Sign in, and
  the app's only API request went to 5002 (`GET /api/me` → 401). No sign-in was made.
- **The preview on 5175.** A preview outside the worktree rendered the real screens with the captured
  answers in the cache. It installs no API transport, so nothing it did could leave the page. I looked
  at it:
  - at 1512: the Roles tab with both actions, the Record deleter rows, the dialog;
  - at 375: the Roles cards, the two actions wrapped under the heading, the Record deleter card with
    Expiry and Revoke, and no sideways scroll;
  - the holder's email dialog with its sentence;
  - the bare holder's Delete records page with each row's "Delete";
  - the console showed no errors.

  It was stopped afterwards, and the launch entry added for it to the workspace's launch file, outside
  the repositories, was removed again.

### 4.4 The planted breakages — 30/30

Each breakage was written into a **copy** of the worktree outside it, never into the worktree: the
owner's app on 5173 hot-reloads from the worktree, so none of them could reach it, even for a moment.
The round's test files and Follow-up 8's and 9's page tests were run on each one, and the file was
restored byte for byte.

| | Breakage | Caught by (among others) |
|---|---|---|
| F1 | the role is named "Record Deleter" | 11 tests: the directory, record, profile, dialogs, phone cards |
| F2 | the role ranks above Viewer | the rank test |
| F3 | `Roles.ManageRecordDeleter` missing from the catalogue | the typecheck (3 errors) — it is a type-only fact |
| F4 | the email refusal has no field of its own | the code test, the code-only field test |
| F5 | one grant refusal forgotten in the form-level list | the form-level test |
| F6 | the grant refusals pinned to a field | both banner tests, the form-level test |
| F7 | a Principal may change a Record deleter assignment | the Principal's row, the phone card |
| F8 | the delete right offered to a Principal | the Principal's non-holder case (added after the first run missed this breakage, §7.4) |
| F9 | offered again to its holder | the holder test |
| F10 | offered whatever the account | the suspended and administrator cases |
| F11 | the note without its sentence | the administrator's action test |
| F12 | a revoked row keeps its actions | the holder test, the end-of-history test |
| F13 | every row needs the delete-right permission | the Principal's Viewer row |
| F14 | the dialog makes a Viewer | the dialog test |
| F15 | the note not a warning | the dialog test |
| F16 | no address in the dialog | the dialog test |
| F17 | the chosen expiry dropped | the request test |
| F18 | the dialog grants Viewer | the request test |
| F19 | the dialog submits as Grant role | the operation test |
| F20 | a success does not reload the history | the operation test |
| F21 | Grant role also offers the delete right | Grant role's options |
| F22 | the holder sentence shown to everyone | the non-holder test |
| F23 | the holder sentence shown to nobody | the holder test |
| F24 | the email dialog under another operation | the code-only field test |
| F25 | the new address shows no refusal | both email refusal tests |
| F26 | the row button reads "Delete…" again | 8 tests: seven of the updated label tests and the bare holder's page |
| F27 | audit links for a reader without the audit | the bare holder's page, and two earlier tests of Recently deleted |
| F28 | the Overview shows the locked audit card open | the bare holder's Overview |
| F29 | Delete records asks for another permission | both routes tests, and an earlier one |
| F30 | a Ready row's Delete disabled too | four label tests, among them the one whose check is only negative |

Every one of the 30 new tests and the 8 updated label tests fails against at least one breakage.

### 4.5 The test suite, and each commit

- Typecheck green, `npm test` 360/360 (330 before), `npm run build` green.
- Each commit alone, in a clean copy outside the worktree (`git archive`, `node_modules` linked): the
  whole project typechecks with 0 errors and the full suite passes at every one of the five, with 335
  tests through the fourth and 360 at the fifth. The same typecheck reported F3's three errors, so the
  check is real.

### 4.6 The owner's side, untouched

- 5001 and 5173 were never opened, called or signed into, and run on the processes they had.
- `rwrent_v1`'s read-only fingerprint — the row counts of twelve tables and the latest write in eleven
  of them — is identical at the start and at the end.
- The backend worktree was only read.

### 4.7 End state

- The scratch API runs on 5002 **for the reviewer**, over `rwrent_check`, domain `rwrent.example`.
  - Toms Rudzitis is a Viewer again, with the joint check's Record deleter assignment revoked
    ("Follow-up 10 check: the practice is over."). So "Give the delete right" is offered on his Roles
    tab.
  - Dita Smite holds her Viewer and Fleet Manager roles; her dated Record deleter assignment is
    revoked.
  - `outside.practice.bb86bb@example.com` is an active Viewer outside the domain.
- The practice Vite on 5174, pointing at 5002, is still running as I found it (§7.1). My preview on
  5175 is stopped.
- The main checkouts are untouched. The worktree is clean and pushed.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **Where:** the app on **5174** against the API on **5002** only. The practice Vite already serves
  it; if it is gone, start it from this worktree with
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **Browser:** a browser profile of its own, because localhost cookies are shared across ports and a
  sign-in on 5174 must never meet the owner's session on 5173.
- **The people**, all with the seed password:
  - the administrator `sysadmin@rwrent.example`;
  - the Principal `signe.priede@rwrent.example`;
  - the Viewer `toms.rudzitis@rwrent.example`.
- **Afterwards:** revoke the delete right you gave (step 7), so the next reader finds the stack as
  described in §4.7.

### 5.1 The steps

1. **The action beside Grant role.** As the administrator: Users → Toms Rudzitis → Roles.
   - "Grant role" and "Give the delete right" stand side by side;
   - the panel's note ends "The delete right is given with its own action.";
   - the earlier Record deleter rows are Revoked, without actions.
2. **The dialog.** Give the delete right:
   - title "Give the delete right";
   - "Makes Toms Rudzitis a Record deleter, who may delete records for good on the Delete records
     page.";
   - the amber note, his login email, and "Expires · optional" with "Leave empty for no expiry. The
     chosen date is the last valid day.";
   - leave the date empty and press **Give the delete right**: the dialog closes, a new row "Record
     deleter · Effective · No expiry" heads the history, the header's Effective roles name Record
     deleter, and the button is gone.
3. **Expiry through the row action.** On that row, Expiry: choose a date and save. The row shows it;
   change it back to empty if you like.
4. **An address outside the domain.** Users → Outside Practice (`outside.practice.bb86bb@example.com`)
   → Roles → Give the delete right → press the button. A red banner reads "The change was refused"
   with "The Record deleter role can be given only to a user whose email address is in the company's
   domain, rwrent.example."; nothing is granted.
5. **As Toms.** Sign out; sign in as Toms.
   - The menu offers Delete records; the page lists records, and each row's button reads **Delete**
     (also at phone width, on the card).
   - Profile → Change email: the description adds "Because you hold the delete right, the new address
     must stay in the company's email domain."
   - Type `toms.rudzitis@example.com` and the password, then send. The API's sentence "While you hold
     the Record deleter role your email address must stay in the company's domain, rwrent.example."
     appears under New email address, with no banner. Cancel.
6. **As the Principal.** Sign in as Signe → Users → Toms → Roles.
   - The Record deleter row has no Expiry and no Revoke;
   - there is no "Give the delete right";
   - the note does not mention it;
   - the Viewer row still has its actions.
7. **Taking it back.** As the administrator, Revoke on Toms's Record deleter row, with a reason. The
   row turns Revoked with the reason, and "Give the delete right" is offered again.
8. **Phone width** (≤ 402 px):
   - the Roles tab's two actions wrap under the heading;
   - the Record deleter card carries Expiry and Revoke for the administrator only;
   - nothing scrolls sideways.

## 6. Decisions needed

None. Four choices made where §10 left room, each reversible in a line:

1. **The expiry is a date, not a date-time.** §10 says "a date-time … in the vocabulary of the Grant
   role dialog", and that dialog asks for a date, the last valid day, sent as the end of that day. I
   followed the dialog, its words included ("Leave empty for no expiry"). The live grant with an expiry
   stored exactly the instant the dialog sends for its date (a test holds this).
2. **The fact reads "Login email"**, as the user record's Account panel calls the address.
3. **The dialog's tone is Grant role's** (`ok`), with the warning carried by the warn-tone note §10
   names; the new panel button has the default tone beside Grant role's primary one.
4. **The offer depends on `effectiveRoles`** from the person's record, the server's own answer, rather
   than on the history rows.

## 7. Deviations

1. **No Vite of my own on 5174.** One was already listening there, started from this worktree at
   10:17 with `VITE_API_BASE_URL=http://localhost:5002 --port 5174 --strictPort`: the owner's
   practice copy. It is the setup §10 describes, so I used it, and I left it running at the end rather
   than stop a process I did not start. The owner allowed replacing the practice copy for round 9's
   run, not for this one. The reviewer can use it as it is.
2. **The breakages ran in a copy of the worktree**, not in the worktree as Follow-up 9's did, so the
   owner's app on 5173 never hot-reloaded a breakage.
3. **The no-domain refusal is written from the backend's source**, not captured (§2.6).
4. **F8 was missed on the first run.** The Principal's tests rendered Toms while he held the role, so
   the offer was hidden for him anyway. A case with a person who does not hold it was added and the
   whole check run again; F30 was added afterwards for the updated label tests' negative checks.
5. **The render helper gained an optional `me`, and the email dialog a named export**, both for the
   tests; neither changes what the app does.

## 8. Open risks

1. **The owner's app on 5173 meets the round-8 API until the restart.** The round-8 API sends no role 5
   and no `Roles.ManageRecordDeleter`, so the new action, the Record deleter rows and the holder's
   sentence simply do not appear. The one visible change is the owner's own direction: the row button
   reads "Delete". Nothing breaks.
2. **The restart needs the domain.** The owner's API must start with
   `ApiSecurity__RecordDeleterEmailDomain=rwrent.ee`; without it the dialog will show "…
   ApiSecurity:RecordDeleterEmailDomain is empty on this installation." for every grant. That is
   correct, but not what the owner wants.
3. **The confirmation page's generic outcome.** If the API refuses a confirmation link because its
   holder must stay in the domain, `/confirm-email-change` shows its usual "This confirmation link
   cannot be used" screen, with the code line `email_change.outside_company_domain`, rather than the
   API's sentence. It is reachable only in a race: a grant ends the session that asked for the change,
   and the link is bound to that session. §10 does not cover this page. Option: an outcome of its own
   for that code, worded by the API, in a later follow-up.
4. **The role's name is written twice**, in the app's labels and in the API's messages ("Record
   deleter"). They agree today.

## 9. Commits

| Commit | Group | Files |
|---|---|---|
| `db8b13c` | the role, its permission, its name and its refusals | `src/api/dto.ts`, `src/permissions/permissions.ts`, `src/format/labels.ts`, `src/api/codes.ts`, `src/api/codes.test.ts`, `src/format/labels.test.ts`, `src/app/routes.test.ts` |
| `7702181` | the dialog of its own and the row actions on the Roles tab | `src/pages/users/UserRecord.tsx`, `src/pages/users/UserDialogs.tsx` |
| `0263c8a` | the holder's email change | `src/pages/account/Profile.tsx` |
| `c106436` | the row button reads Delete, with the tests that read its label | `src/pages/admin/DeleteRecords.tsx`, `src/format/recordDeletion.ts`, `src/pages/followup8.render.test.ts`, `src/pages/followup8.phone.render.test.ts`, `src/pages/followup9.render.test.ts`, `src/pages/followup9.phone.render.test.ts` |
| `3c5aa91` | the screens rendered from the scratch stack's answers | `src/pages/followup7b.support.ts`, `src/pages/followup10.support.ts` (new), `src/pages/followup10.render.test.ts` (new), `src/pages/followup10.dialogs.render.test.ts` (new), `src/pages/followup10.phone.render.test.ts` (new) |
| this one | the report | `Context/wiring_report.md` |
