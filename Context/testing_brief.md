# RW-Rent — Testing Brief for the Independent Testing Agent

> **Status: OWNER-CONFIRMED — TESTING AUTHORIZED (2026-09-16).** This is the one document of the
> testing phase. It is both the specification (what must be tested and what "good" looks like) and
> the plan (how the phase runs, in what order, and what you hand back). You are an independent
> tester in a fresh session: you did not build this system, you have no loyalty to it, and the owner
> depends on what you find. Read this whole file before you touch anything.
>
> Working folders: the app in `/Users/zulf/rw-rent-api/rw-rent-web-wiring` (branch
> `feature/backend-wiring`) and the API in `/Users/zulf/rw-rent-api/RWRentApi-wiring` (same branch
> name). **Only these two folders, and only the running instances started from them, are under
> test.** Both are read-only for you except the one report file named in §11. The main checkouts
> `/Users/zulf/rw-rent-api/rw-rent-web` and `/Users/zulf/rw-rent-api/RWRentApi` are never touched,
> never started, never tested. Docker compose runs only from `/Users/zulf/rw-rent-api/RWRentApi`.
>
> **You test both sides**: the API directly, and the app in a browser, always against each other.
>
> If you have worked on this codebase before, forget it: since then the authentication was rebuilt
> (V6), the API gained a wiring phase of new fields, filters and endpoints, and the app was rebuilt
> from a design prototype and switched from a mock to the real API. Trust only the files in the two
> folders and the running system, never your memory of an earlier version.

## 1. The mission, in the owner's words

The owner has run a vehicle-rental operation for more than five years and knows the right order of
every step by heart. The person who replaces them during a vacation does not. That person will press
buttons in the wrong order, type the wrong thing, do the same action twice, leave a form open for an
hour, and use two tabs at once. The owner wants every one of those cases handled, found now, before
the app goes into production, not discovered by a customer.

So the bar is not "the happy path works". The bar is: **every function the backend and the frontend
provide, in every order it can be attempted, with every kind of input, by every role, on every
screen size, and the two sides agree with each other at all times.** The unit and integration tests
that exist (368 API tests, 118 rule tests, 91 app tests) prove what their authors thought of. They
are not the measure of coverage. You are.

You are expected to be interested in the outcome. A tester who reports "all pass" after a smoke run
has failed the assignment. A tester who finds nothing must show, scenario by scenario, what was
tried and why it held.

## 2. What RW-Rent is

A single-company fleet operations platform. One **operating Company** owns a fleet of **Vehicles**
and rents them to **Customers** (businesses or private individuals). A rental is a **Rental
Assignment**: one customer, one vehicle, a lifecycle Planned → Active → Ended (or Cancelled).
Who may drive the car during the rental is recorded as **Driver Authorizations** on the assignment:
either named **Drivers** (people with a licence) or one collective authorization for a business
customer's own drivers. Periods when the rental is disturbed (accident, repair, sickness, no
insurance…) are **Interruptions** with a billing impact. Staff are **Application Users** with roles
(Viewer, Fleet Manager, Company Principal, System Administrator) that map to code-owned permission
bundles. People register themselves, confirm their email, and are activated by staff with roles.
Security-relevant actions and **privileged corrections** of historical records are written to a
**Security Audit** history. Sessions are tracked on the server and can be revoked.

The **API** (ASP.NET Core 10, PostgreSQL) is the only source of truth: every rule is enforced there.
The **app** (React) is a client of the API and nothing else; it must never allow what the API
refuses, and must render what the API answers. When the two disagree, that is a finding.

## 3. Out of scope, and what is known already

**Not part of this phase.** Tasks and Insurance cases: the app shows a queue page and an Overview
card for each with sample rows and an "Under development" notice; the backend has nothing for them.
The product ships without them for now. Do not test them, do not report them. Billing calculation
(interruption impacts are recorded, never computed). Production topology (origins, TLS, cookie
domains, the real email provider). Performance under load.

**Known and accepted, do not re-report as new** (you may confirm them in one line each):

| Where | Item |
|---|---|
| API | Instants carrying a time-zone offset (`…+03:00`) answer 500 instead of 400; the app now sends UTC everywhere. Scheduled after the merge. |
| API | Seeded people report their sample registration date as "password last changed" (the seed writes no password history). |
| API | `Company.Created` / `Company.Deleted` audit entries carry no Company. Registration events carry none either, so a Company Principal does not see them. |
| API | The seeded audit rows all carry the Company, including registration events a real Principal would not see. Seed revision pending. |
| App | `GET /api/me` is cached for one minute: a role granted or revoked reaches a signed-in person at the next reload or after that minute. |
| App | Single 560 kB bundle; code splitting is a hosting decision. |
| App | The shell's open-work queue runs three list requests on every page. |
| App | The prototype file is wrong in two places (transfer acceptance shows fields the API does not take; resend lacks the password field). The app is right. |
| App | The `block` button variant with the primary tone may have poor light-theme contrast on phone sheets. Please check this one and report what you see. |
| App | The "Access pending" screen has no seeded way in: revoke a Viewer's only role to reach it. |

**Deliberate behaviours** that may look odd but are by design: a deliberate sign-out shows the plain
sign-in form; a session ended elsewhere shows the "Session expired" screen and returns you to the
page you left; the API answers 401 for an unknown session and the app treats any 401 as the end of
the session; vehicles are retired, never deleted; assignments, authorizations and interruptions are
historical and never deleted; the Overview's activity card hides routine sign-in and sign-out
events while the audit page shows everything.

### 3.1 What changed most recently — look hardest here

Defects hide in fresh code. In the last days, on these branches: the app switched from a mock
backend to the real API (cookies, antiforgery, the 401 handling that ends a session); the whole
account area was ported from the prototype (sixteen sign-in outcome screens, registration, the
emailed links, password reset, email change, the profile with sessions, the transfer acceptance);
the API gained `availableVehicles` on the overview summary and `passwordChangedAtUtc` /
`pendingEmail` on `GET /api/me`; every instant the app sends was changed to UTC after two rounds of
500s; assignment cancellation gained its own note field and an audit entry; audit payload keys were
changed to PascalCase at every level; privileged corrections and cancellations were given the
operating Company; the drivers list, the assignment list and record, the vehicle availability, the
security-audit filters and entry page, `GET /api/interruptions`, the transfers list and the
registrations multi-status filter were added or reshaped for the app; a routing change was made so
that sensitive endpoints answer unsupported content types with a problem body. Every one of these
deserves the adversary's and the accountant's attention.

## 4. Where the truth is — read these before testing

1. `RWRentApi-wiring/Context/business_rules.md` — the rule catalogue, the contract you test against.
   Every rule has an id. The sections and their ids: Driver (DRIVER-001…011), Vehicle
   (VEHICLE-001…009), Assignment (ASSIGN-001…015), Driver Authorization (AUTH-001…010), Interruption
   (INTERRUPT-001…013), Application User (USER-001…021), Customer (CUSTOMER-001…016), Operating
   Company (COMPANY-001…011), Roles and Company Principal protection (ROLE-001…020),
   Self-registration (REGISTRATION-001…013), System Administrator (SYSTEM-001…017), Authentication
   and passwords (LOGIN-001…008, PASSWORD-001…009, PROFILE-001…003), Sessions (SESSION-001…015),
   Audit and corrections (AUDIT-001…008, CORRECTION-001…010), Email (EMAIL-001…004).
2. `RWRentApi-wiring/README.md` — how the API runs, the security configuration, the sample-data
   command, the wiring-phase additions (the derived fields, filters and endpoints the app uses).
3. `http://localhost:5001/openapi/v1.json` — the live contract: every endpoint, every schema, every
   policy. Appendix A lists the endpoints for planning.
4. `rw-rent-web-wiring/README.md` — how the app runs, the account area, the rules the code enforces.
5. `rw-rent-web-wiring/src/api/dto.ts` — the enum names and numeric values the API uses (statuses,
   roles, reasons), and the request/response shapes as the app understands them.
6. `rw-rent-web-wiring/Context/wiring_followups.md` §2 — the owner's own check tables (screen by
   screen, what to compare and what to try) and the seeded accounts. Fold those tables into your
   plan; they are the minimum, not the maximum.
7. `rw-rent-web-wiring/Context/prototype/RW-Rent.dc.html` — the design reference for looks only.
8. `RWRentApi-wiring/Context/backlog.md` and `wiring_followups.md` §4 — the known items of §3.

## 5. The environment

### 5.1 What runs where

| Piece | Where | Notes |
|---|---|---|
| API | `http://localhost:5001` | `/health` answers `{"status":"healthy"}`; `/openapi/v1.json` is the contract |
| App | `http://localhost:5173` | Vite dev server with hot reload; **5173 is the only origin the API trusts** for credentialed requests |
| Mailpit | `http://localhost:8025` | every email the API sends (registration, reset, email change, transfer) lands here; links in them point at the app. Its REST API reads them without a browser: `GET http://localhost:8025/api/v1/messages` (list), `GET http://localhost:8025/api/v1/message/{ID}` (one message, HTML and text bodies with the links), `DELETE http://localhost:8025/api/v1/messages` (clear) |
| PostgreSQL | `localhost:5433` | container `rwrent_v5_postgres`, database `rwrent_v1`, user `rwrent`, password in `/Users/zulf/rw-rent-api/RWRentApi/.env` as `RWRENT_POSTGRES_PASSWORD` |

Both apps are normally already running from the worktrees (`lsof -nP -iTCP:5001 -iTCP:5173
-sTCP:LISTEN` shows them; the process's working directory tells you which folder it was started
from). To stop one before restarting it: `kill $(lsof -ti :5001)` or `kill $(lsof -ti :5173)`.
Never start a second instance on the same port and never start either from the main checkouts. If
one is not running:

```sh
# database + mailpit (from the main backend folder only)
cd /Users/zulf/rw-rent-api/RWRentApi && docker compose up -d postgres mailpit

# environment for every dotnet command below
set -a; source /Users/zulf/rw-rent-api/RWRentApi/.env; set +a
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5433;Database=rwrent_v1;Username=rwrent;Password=${RWRENT_POSTGRES_PASSWORD}"
export EmailDelivery__FromAddress="dev@rwrent.local"

# the API, from the wiring worktree
cd /Users/zulf/rw-rent-api/RWRentApi-wiring
dotnet ef database update --project src/RWRentApi.Infrastructure --startup-project src/RWRentApi.Api
dotnet run --project src/RWRentApi.Api --launch-profile http

# the app, from its wiring worktree
cd /Users/zulf/rw-rent-api/rw-rent-web-wiring && npm install && npm run dev -- --port 5173 --strictPort
```

### 5.2 The seeded dataset, and the clock

The sample data is written by the API's own command. **Every instant in it is relative to the moment
the command ran** (registrations 400 days ago, assignments weeks ago, the transfer 24 hours from
now…), so re-seed at the start of the phase, whenever the dataset has been changed for good, and at
the end. The command replaces everything, including sessions:

```sh
cd /Users/zulf/rw-rent-api/RWRentApi-wiring   # with the environment of §5.1 exported
dotnet run --project src/RWRentApi.Api --no-build -- seed-development-data --password '<seed password>' --replace true
```

**The seed password is the owner's.** Ask for it once in chat if it is not in your environment.
Never write it into any file under either worktree, not even the report. Every seeded person signs
in with it.

People (all `@rwrent.example` unless noted):

| Person | Email | Status | Roles | Use them for |
|---|---|---|---|---|
| Arturs Veidenbaums | `sysadmin` | Active | System Administrator | everything, corrections, the System Administrator page |
| Signe Priede | `signe.priede` | Active | Company Principal | company scope, role administration, Principal protection |
| Karlis Zvaigzne | `karlis.zvaigzne` | Active | Fleet Manager | fleet and rental work, registrations |
| Toms Rudzitis | `toms.rudzitis` | Active | Viewer | read-only across the fleet; revoke his role for "Access pending" |
| Dita Smite | `dita.smite` | Active | Viewer (one expired row, one live), Fleet Manager (one revoked, one expiring 2026-12-05) | role history, expiries |
| Raivis Dumins | `raivis.dumins` | Suspended | none | the suspended sign-in screen; restore/suspend |
| Liga Brice | `liga.brice@example.com` | Pending activation, email confirmed | none | the target of the open administrator transfer |
| Gatis Lapsa, Zane Upite | `@example.com` | Pending activation | none | activation with roles |
| Imants Gailis | `@example.com` | Registration rejected | none | the rejection reason, reopen |
| Baiba Krastina | `@example.com` | Registration expired | none | the expired-registration screen |

Vehicles: 119 MPR Volvo XC60, 204 JLM Hyundai Kona Electric, 335 SNB Mercedes E 220 d, 400 NDP
Skoda Octavia, 444 WKS Nissan Qashqai, 482 TKL VW Passat Variant, 552 KLM BMW 320d Touring, 770 HDV
Audi A4 (all active); 660 BYH Fiat Tipo and 881 GRT Peugeot 308 SW (retired). Customers: Baltic
Freight Partners, Daugava Construction, Nordwind Logistics (business), Ventspils Marine Services
(business, inactive), Anete Kalnina and Ilze Berzina (private, each linked to their own driver
record), Martins Ozols, Roberts Liepins (private). Drivers: Ilze Berzina, Anete Kalnina, Janis
Krumins, Laura Ozola, Edgars Sproģis, Kristine Vitola (active), Normunds Zarins (inactive).

Assignments (12): Active 552 KLM Nordwind Logistics (collective coverage, one open interruption);
Active 482 TKL Baltic Freight Partners; Active 770 HDV Ilze Berzina; Active 204 JLM Anete Kalnina
(one open interruption); Planned 444 WKS Martins Ozols (starts in two days, no coverage yet);
Planned 335 SNB Daugava Construction (in five days); four Ended and two Cancelled in the past. So the
Overview reads 4 active, 2 planned, 8 active vehicles of which 2 available, 3 pending registrations.
One open System Administrator transfer targets Liga Brice and expires 24 hours after seeding.

### 5.2a The machine and your tools

macOS with zsh; `dotnet` SDK 10, `node`/`npm`, `docker`, `python3` and `git` (push over SSH works;
`gh` is not installed) are available. Both folders are git worktrees that share one stash stack
with the main checkouts: never use `git stash`. Keep every file of your own — scripts, cookie jars,
screenshots, notes — in a scratch folder **outside both worktrees**, for example
`/Users/zulf/rw-rent-api/testing-scratch/` (create it; it is not a git repository). You may install
tools for yourself there (a Python virtual environment, Playwright with `npm init -y && npm i
playwright && npx playwright install chromium`), never inside a worktree. If you have no browser
tool of your own, drive the app headless with Playwright from that folder; screenshots stay there
and are named in the report. Evidence in the report is text: response bodies, page text, `psql`
output. The clock: the machine and the app render Europe/Tallinn time (the zone the app's code
uses; the same offsets as Riga, UTC+3 in summer, UTC+2 in winter); the API speaks UTC.

If your session runs out of context or restarts, the report file is your memory: read it, continue
from the coverage section, and say in the summary that the run was continued. Do not start over
and do not lose what was found.

### 5.3 Security numbers you will test against

Session idle timeout 2 h, absolute lifetime 12 h, sessions retained 90 days. Rate limits per 60 s
window: authentication 10 per account / 60 per source; registration 8 / 40; recovery (reset,
resend) 5 / 30; administrator security 5 / 30. Lockout, password policy (12+ characters, upper case,
digit, symbol, blocklist, five-password history), registration window (7 days) and email challenge
(24 h), reset-token and transfer lifetimes: as the LOGIN, PASSWORD, REGISTRATION and SYSTEM rules
state them. Cookie `RWRent.Auth` is HttpOnly, SameSite=Lax; every unsafe request needs the
antiforgery header `X-RWRent-Antiforgery` whose token comes from `GET /api/auth/antiforgery` and
is bound to the signed-in identity (fetch it again after signing in).

### 5.4 Calling the API directly

Do it the way the app does: keep a cookie jar, send `Origin: http://localhost:5173`, fetch the
antiforgery token, sign in, fetch the token again, then send the header on every POST/PUT/DELETE.
A minimal shape in Python:

```python
import json, urllib.request, http.cookiejar
BASE = "http://localhost:5001"
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(method, path, body=None, headers=None):
    req = urllib.request.Request(BASE + path, method=method,
        data=(json.dumps(body).encode() if body is not None else None))
    req.add_header("Origin", "http://localhost:5173")
    if body is not None: req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items(): req.add_header(k, v)
    try:
        r = op.open(req, timeout=20); return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
tok = json.loads(call("GET", "/api/auth/antiforgery")[1])["requestToken"]
call("POST", "/api/auth/login", {"email": "sysadmin@rwrent.example", "password": PASSWORD}, {"X-RWRent-Antiforgery": tok})
tok = json.loads(call("GET", "/api/auth/antiforgery")[1])["requestToken"]   # re-fetch: bound to the identity
```

Errors come back as `application/problem+json` with a machine `code` (for example
`authentication.account_suspended`, `antiforgery.invalid`); validation failures carry an `errors`
map keyed by field. The app renders those codes and fields; check that it does.

## 6. Rules of engagement

1. **Read-only.** You change no source file, no test, no configuration, no document in either
   worktree. The one file you create and commit is the report (§11). No other commit, no push of
   anything else, no force push, no branch.
2. **Through the doors, not the walls.** Create, change and break data only through the API and
   the app. You may read the database with `psql` to verify what was stored (`docker exec
   rwrent_v5_postgres psql -U rwrent -d rwrent_v1 -c '…'`), never write to it.
3. **Re-seed** before you start, whenever you have changed the dataset for good (accepted the
   transfer, activated a registration, retired a vehicle, suspended someone…) and need the clean
   baseline back, and once more at the end so the owner starts clean. The report says when you did.
4. **The seed password stays out of the repositories.** Test passwords you invent for new accounts
   may appear in the report.
5. **Both apps stay running when you finish.** You may stop the API briefly to test the app's
   "unreachable" behaviour; start it again the same way.
6. **You fix nothing.** A finding is a finding; the implementation agent fixes it later from your
   report. Do not propose code, propose expected behaviour.
7. **Work in the browser and on the API.** Every user-facing scenario is driven in the app at
   `http://localhost:5173`; the same rule is then attacked directly on the API, where the app's
   own validation cannot protect it.
8. **Write as you go.** The report grows during the phase, not at the end; a crash of your session
   must not lose the findings. Commit the report at least at the end of every part of §9.

## 7. How to think

Wear these five hats in turn on every screen and every endpoint.

**The replacement operator.** It is July, the owner is away, a customer is at the counter. You do
what seems natural, not what the manual says: end the rental before you activated it, add the
driver after the car left, cancel the wrong assignment, activate the assignment for the car that is
already out, record the interruption for last month, type the licence number into the name field,
press Save twice because nothing happened, refresh because it looked stuck. Every one of those must
end in a clear message and unchanged data, never in a blank page, a spinner, a 500, or a half-saved
record.

**The adversary.** You want to do what you are not allowed to: call a Fleet Manager's endpoint as a
Viewer, another person's session list as yourself, change the id in the URL to someone else's
record, replay an old antiforgery token, use a reset link twice, register with an email that already
exists to learn whether it exists, hit sign-in 11 times in a minute, keep a session alive after the
administrator revoked it, escalate a role you may not grant, suspend the Company Principal, accept a
transfer meant for someone else. Every one must be refused by the API with the right status and
code, whether or not the app hides the button.

**The accountant.** Every number must agree with every other number. The Overview's counts equal
the lists' totals; the vehicle's availability chip on the list equals the record's and the summary's
count; an assignment's open authorization count equals its authorizations tab; the audit history
shows exactly the actions you performed, with the actor, the entity and the Company; the sessions
tab shows the sign-ins you made. After every write, read back from the list, the record and the
audit and compare.

**The auditor.** Every rule in `business_rules.md` is a promise. For each rule id, design at least
one attempt to break it via the API, and via the app wherever the app offers the action. Record the
rule id on the finding. If a rule has no test possible, say so and why. If you meet a behaviour no
rule covers, that is a question for the owner, not a pass.

**The newcomer on a phone.** Light theme, 402 px wide, thumbs. Every dialog is a bottom sheet; every
list must scroll; nothing is cut off; every error is readable where it happens; the keyboard does
not hide the field being typed in; the back button does what a person expects.

Heuristics to apply everywhere: do it twice; do it in the wrong order; do it after refreshing;
do it in two tabs and let them disagree; do it with a session that expired while the form was
open; do it with a role that was revoked while the page was open; do it with empty, whitespace,
maximum-length, over-length, unicode (Latvian letters, emoji), leading/trailing spaces, mixed case;
with boundary numbers (year 1899/1900, page size 0/1/100/101/−1, page 0, page beyond the last);
with instants at midnight, across the DST change (last Sunday of March and October in
Europe/Riga), far in the past, far in the future, equal to each other; with ids that do not exist,
malformed ids, ids of the wrong entity type; with the API stopped; with slow answers (throttle the
browser). Ask after every action: what did the database store, what does the audit say, what does
the other screen say.

## 8. The layers of the test

**A. Contract and API surface.** For every endpoint in Appendix A: unauthenticated → 401; each of
the four roles → 200 or 403 exactly as its policy in the OpenAPI document says; malformed JSON,
wrong content type (`text/json`, `text/plain`), missing body, unknown fields, wrong types; unknown
ids → 404 with a problem body; conflicts (a second identical create, an action on a final record)
→ 409 or 400 with a code, never 500; pagination and filter parameters at their limits; the response
shape against the schema (required fields present, nullables, enum values). Check that HEAD/OPTIONS
and other origins behave (CORS: a request with `Origin: http://evil.local` must not be credentialed).

**B. The rule catalogue.** Rule by rule (§7, the auditor). Keep a matrix: rule id → what you tried
on the API → result → what you tried in the app → result.

**C. Workflows, end to end.** The "day in the life" scripts of §9.10 and your own. Run each in the
app as the natural role, with the API as the second witness (read back after every step).

**D. Security.** Authentication, sessions, antiforgery, rate limits, lockout, enumeration, links
with tokens (in the URL fragment, never sent to the server as a query), role escalation, Company
Principal protection, administrator transfer, audit completeness.

**E. The app itself.** Every route in Appendix B, for every role that may see it and for one that
may not; every state of every screen (loading, empty after a filter, error card, unreachable API,
signed out mid-page); every dialog; three widths (1512 / 834 / 402) in light and dark; keyboard
navigation and focus in dialogs; the console clean of errors and React warnings; the network log
free of per-row request storms and of 500s; the page never scrolls horizontally.

**F. Consistency across surfaces.** §7, the accountant. Include the audit entry page's payload diff
against what you changed, and the label catalogue (`src/format/labels.ts`) against the event types
the audit actually contains.

**G. Time and data.** Instants sent by the app are UTC; the app renders Europe/Riga; filters by
date narrow correctly at the day boundaries; retroactive edits obey the rules; ordering of lists
(newest first where promised); the seeded relative instants still make sense on the day you test.
Where this brief says Europe/Riga it means the same offsets as the app's Europe/Tallinn.

**H. Robustness.** API stopped: the app shows its unreachable state and recovers when it is back;
a request that times out; double submit; navigation away mid-request; browser back and forward
through dialogs; deep links to every record; a bookmarked link opened after the session expired
(it must come back to the same page after signing in).

## 9. Scenario catalogue

This is generous on purpose. Everything here is a starting point; add what the hats of §7 suggest.
Mark each scenario in the report as pass, fail (with a finding id), blocked (with the reason) or
not applicable.

### 9.1 Public screens and registration
- Sign-in with: valid credentials; wrong password; unknown email (same message as wrong password,
  no enumeration); a pending-activation account (its screen); an unconfirmed registration (the
  alert with the resend action); a rejected, an expired, a suspended account (each screen and
  wording); empty fields; whitespace around the email; upper-case email.
- Lockout: wrong password repeatedly until locked; the message; the API status/code; that the
  correct password is refused while locked; behaviour after the lockout window.
- Rate limits: exceed the authentication limit per account and per source; the 429 screen in the
  app ("HTTP 429" line); the same for registration and recovery endpoints.
- Register: all validation (names, phone format, email format, password checklist of four rules
  and that the API agrees on every rule incl. no lowercase requirement and no whitespace symbol);
  duplicate email; the "registration submitted" screen; the email in Mailpit; the confirmation
  link (token in the `#` fragment, removed from the address bar); confirm twice; an altered token;
  an expired challenge (cannot wait 24 h: observe the expiry instant the API stores and note it);
  resend with the wrong password; resend for an already confirmed account; the 7-day registration
  window rule.
- Forgotten password: request for a known and an unknown email (identical response); the email; the
  reset screen; token reuse; a weak new password; a password from the history; the sign-in after.
- Public routes while signed in (what happens when a signed-in person opens `/sign-in`).
- Every outcome screen's actions ("Back to sign in", "Sign in again", "Try again") lead where they say.

### 9.2 Session and account
- Idle/absolute expiry cannot be waited for; instead: revoke the session from another browser or as
  the administrator and watch the first one land on "Session expired" and return to its page after
  signing in; sign out and confirm the cookie is gone and the API answers 401.
- "Your sessions": the current device marked, no revoke on it, revoke one other, revoke all others,
  the list after each; sessions of another user as the administrator (and as a Principal for an
  ordinary user, refused for a Principal or the administrator).
- Password change: wrong current; new equal to current; one of the last five; policy violations one
  by one; success then sign-in with the new one; that other sessions are ended if the rules say so.
- Email change: request; "Pending change" shows the address; a second request replaces the first
  (the first link must now fail); confirm through Mailpit; the confirmation screen; sign in with
  the new address; the old address refused; an address already used by someone else.
- Phone change validation. "Show permissions" lists exactly the role bundle.
- Access pending: revoke Toms's Viewer role, sign in as Toms, the page and the empty navigation,
  every direct URL as him (`/vehicles`, `/users`, a record) → the same screen, and the API → 403.

### 9.3 Roles, permissions, protection
- The full matrix: for each of the four roles, every navigation entry visible or not, every list
  and record readable or not, every action button present or not, and the API answer for the same
  operation. Do it as a table.
- Grant Viewer / Fleet Manager with and without expiry; an expiry in the past (refused); an expiry
  two minutes ahead, then watch the permission disappear (after the app's one-minute cache);
  change an expiry; revoke with a reason; grant the same role twice; grant Company Principal
  through the ordinary endpoint (refused); a Principal granting Principal; the administrator's own
  roles; a person changing their own roles.
- Suspend and restore: an ordinary user; the Company Principal (protected); the administrator;
  yourself. What a suspended person sees mid-session (their existing session must end).
- Name correction and its audit entry. Registration review: activate with one role, with several,
  with none (refused?), reject with and without a reason, reopen a rejected one, act on an expired
  one, act on an already active one, as a Fleet Manager and as a Viewer.

### 9.4 System Administrator
- Transfers: initiate to a confirmed pending person, to an active person, to an unconfirmed one,
  to a suspended one, to yourself; resend (password required, wrong password); cancel; accept with
  the wrong password, with an expired token, twice; accept correctly → Liga is the administrator,
  Arturs demoted, both audit entries, both people's sessions; then **re-seed**.
- Recovery transfer semantics if the rules define them (`is_recovery`).

### 9.5 Company
- The singleton: create when one exists; update every field with bad input; delete while referenced;
  who may. The company chip/name in the shell after an update (cache).

### 9.6 Vehicles
- Create with duplicate plate (also lower-case, with spaces), duplicate VIN, year 1899/1900/next
  year, every enum value and an invalid one, empty colour; update the same; normalisation (plate
  and VIN upper-cased and trimmed).
- Deactivate with a Planned assignment (refused, VEHICLE-008), with an Active one (refused), after
  cancelling/ending (allowed); plan a rental on a retired vehicle (refused); activate a planned
  assignment whose vehicle was retired meanwhile.
- Availability: for each of the ten vehicles the chip on the list, the record and the summary
  count agree with VEHICLE-009; the upcoming assignment shown also for a vehicle in use; filters
  (active, availability, search) and paging.

### 9.7 Customers and drivers
- Every CUSTOMER and DRIVER rule: identifiers, dates of birth (future, today, 17 years old), business
  vs private required fields, the link from a private customer to a driver record (one to one?),
  deactivating a customer with an active assignment, using an inactive customer or driver in a new
  assignment or authorization, uniqueness of personal ids and licence numbers, search.
- The driver record: the authorization history across assignments and the audit panel.

### 9.8 Assignments, authorizations, interruptions, corrections
- Create Planned without a start (refused), with end before start, on a vehicle with an
  overlapping planned range (ASSIGN-011, including the exact-touch case and the open-ended case),
  with an inactive customer/vehicle; create directly Active with and without coverage, with the
  handover instant in the future/past.
- Activate: without coverage; when the vehicle already has an active assignment; when the customer
  is inactive; twice; an Ended one; a Cancelled one.
- Coverage: named driver on a private customer; collective on a private customer (refused,
  AUTH-009); named plus collective together (refused, AUTH-003); the same driver twice (AUTH-006);
  the same driver on two active assignments (allowed); stop the last coverage on an active
  assignment (refused, AUTH-007) and the replacement-in-one-step path if the app offers it; stop
  with a stop instant before the start; stop reason Other without a note; reopen a stopped one
  (impossible by design).
- Interruptions: every reason, every billing impact, no note, end before start, start before the
  assignment's handover (INTERRUPT-012), on an Ended assignment beyond its closure, overlapping
  two (allowed); end an assignment with an open interruption (refused, INTERRUPT-011) then end the
  interruption and the assignment.
- End: with a closure before the handover; twice; a Planned one (must be cancel, not end).
- Cancel: Planned with and without a note; Active without a note (400 on the note field, shown
  under the field); Active after a physical handover (the rule says it must be ended instead: what
  does the API know, what does the app say); an Ended one; the audit entry with the note as reason,
  the cancellation note beside the assignment note on the record.
- Update planned dates on an Active assignment; on a final one.
- Corrections (administrator only): parties, timeline, authorization, interruption; each with
  invalid values, each with a note; the audit entries carry the Company and PascalCase payloads;
  a Principal sees them; a Viewer and a Fleet Manager cannot call them; the record's Corrections
  tab and the audit list agree.
- The lists: every filter alone and combined (status, customer, vehicle, planned and started date
  ranges at the day boundaries), search, paging beyond the end, the coverage column, the
  interrupted chip; Needs attention's five rows and their links.

### 9.9 Security audit
- Every action you performed appears with the right event type, actor, entity type and id, Company,
  reason and payload; nothing appears twice; ordinary lifecycle operations (activate, end) do not
  appear (by rule) while cancellations and corrections do; filters (event type, entity type, entity
  id, assignment id, actor, date range); the entry page for each event type; a Principal's view vs
  the administrator's; the label catalogue has a label for every event type present.

### 9.10 Day-in-the-life scripts (run each in the app, verify each step on the API)
1. **A business customer walks in.** Create the customer and two drivers; plan a rental for
   tomorrow; the customer wants the car now: activate today with one named driver; a week later
   swap drivers (start the second, stop the first); the car has an accident: interruption, then a
   repair interruption overlapping it; try to end the rental with both open; end them; end the
   rental; the vehicle is available again; every record, list and audit row agrees.
2. **A private person rents and drives.** Customer with a linked driver record; try collective
   coverage (refused); named coverage with the linked driver; the person wants a friend to drive
   too; later the person replaces the friend; end.
3. **The wrong car.** Activate the assignment for the wrong vehicle (the car never left): cancel
   with the mistaken-activation note; the vehicle is free again; the audit shows why.
4. **The double booking.** Two planned rentals for the same car, overlapping; then touching exactly;
   then one open-ended; retire the car while one is planned (refused); cancel it; retire; try to
   plan on it again.
5. **The colleague on vacation cover.** Does everything in the wrong order on purpose (§7). Each
   refusal must be a message at the right place, never a 500 or a stuck dialog.
6. **A new staff member.** Registers, confirms, waits (pending screen), is activated as Viewer with
   an expiry, sees read-only, is promoted to Fleet Manager, loses the Viewer role at expiry, is
   suspended mid-session, is restored.
7. **The account under attack.** Wrong passwords until lockout, rate-limited, reset link used twice,
   old antiforgery token replayed, session revoked by the administrator mid-form.
8. **The handover of the platform.** Initiate the transfer to Liga, resend, cancel, initiate again,
   accept; re-seed.
9. **Two people at once.** Two browsers: one ends the assignment while the other has its dialog
   open; one revokes the role the other is using; one retires the vehicle the other is planning on.
   Every second action must be refused with a clear message and the screen must recover.
10. **The phone day.** Scripts 1 and 3 again at 402 px in the light theme.

### 9.11 The app in general
- Every route × every width × both themes; the theme survives reload and the public pages; the art
  panel appears from 1024 px and not below; nothing scrolls horizontally; long names and addresses
  wrap; tables stack or scroll as designed; every icon renders (no missing-glyph text); dates in
  Europe/Riga on operational screens and UTC where the design says UTC (audit, sessions).
- Loading states never flash a wrong number; empty states after filters; the error card for a
  missing record with "Try again"; a 500 from the API (the only known one: an offset instant sent by
  hand) renders the unexpected-error card and the app stays usable.
- Dialogs: focus lands inside, Escape closes, Enter submits the primary action only once, the
  primary button disables while busy, validation errors appear under their fields, server errors
  appear where the app promises, closing does not lose the list's filters.
- Navigation: the current entry highlighted, the open-work queue counts correct, deep links, browser
  back/forward, a bookmarked record after re-sign-in.
- Accessibility basics: every input labelled, buttons have names, contrast of the warn/bad tones in
  both themes, the `block` button case of §3.

## 10. What a finding is, and how to write it

A finding is anything where the behaviour differs from the rule catalogue, from the OpenAPI
contract, from the app's own README promises, from the prototype's looks, or from what a reasonable
operator expects and no rule covers. Classify each one:

| Class | Meaning |
|---|---|
| **Defect** | the API or the app does something wrong: 500, wrong status/code, data changed when it should not have, a screen that breaks, a rule not enforced, the two sides disagreeing |
| **Gap** | a rule or a behaviour that nobody defined and the operator needs (for example an action with no confirmation that cannot be undone) |
| **Question** | behaviour that follows the rules but looks wrong from the counter; the owner decides |
| **Prototype** | the app differs from the prototype's looks |

Severity: **Blocker** (data corruption or loss, a security bypass, an operator cannot complete a
core rental workflow), **Major** (a function fails or gives a wrong result with a workaround),
**Minor** (cosmetic, wording, inconvenience), **Info** (confirmed known item, observation).

Each finding, in this exact shape:

```
### T-014 · Defect · Major · Backend · ASSIGN-011
**Title**: Two planned assignments may overlap when the second has no end
**Steps**: (the app) … / (the API) POST /api/rental-assignments {…} then POST … {…}
**Expected**: 409 with code rental_assignment.planned_overlap; the app shows the message under the start field
**Actual**: 201; both assignments listed as Planned on 444 WKS
**Evidence**: response bodies; the list screenshot; psql: select … 
**Role**: Fleet Manager (karlis.zvaigzne) · **Where**: Assignments › New assignment · **Seen**: 3 of 3 attempts
```

Side is Backend, Frontend, Both or Docs. Include the exact request and response for API findings and
the exact clicks for app findings; a finding the implementation agent cannot reproduce from your
text is worth little. One finding per cause; if the same cause shows on five screens, one finding
with five places.

## 11. The report, and the end of the phase

The report is **one file**, `rw-rent-web-wiring/Context/testing_report.md`, committed on
`feature/backend-wiring` with the message `Testing: report of run 1` (a later run rewrites the file
completely and commits `run 2`, and so on). Sections, in this order:

1. **Summary** — what was covered, how long, the counts of findings by class and severity, the
   three things the owner should look at first.
2. **Findings** — a table (id, class, severity, side, area, rule, title) then the details of §10,
   most severe first.
3. **Coverage** — the rule matrix (every rule id with what was tried and the result), the endpoint
   matrix (every endpoint × the four roles × unauthenticated), the route matrix (every route × roles
   × widths × themes), the scenario list of §9 with pass/fail/blocked/n.a.
4. **Not tested and why** — everything you could not do (time-dependent expiries, load…), with what
   would be needed.
5. **Questions for the owner** — the Question class collected, one decision per line.
6. **Environment** — commits under test (both worktrees' `git log -1`), the API build, the seed
   moment(s), the browsers and widths used, the tools you used.
7. **Dataset state at the end** — re-seeded, when.

Exit criteria for the phase: every endpoint, every rule id, every route and every scenario of §9
has a line in the coverage section; every finding has steps the implementation agent can follow;
the dataset is re-seeded; both apps are running.

Your final chat message to the owner is a plain-language overview only: what you covered, what you
found by severity, what surprised you, what to check first. No technical report in the message; it
stays in the file.

## 12. Order of work

1. Read §1–§8 and the four documents of §4. Ask for the seed password if you need it. Re-seed.
2. Smoke: sign in as each seeded person in the app; open every route; note anything already broken.
3. Layer A on the API (the contract and the role matrix), writing the endpoint matrix as you go.
4. Layer B, rule by rule, API first, then the app.
5. Layers C and D: the scripts of §9.10 and the security scenarios, in the app with the API as
   witness.
6. Layers E–H: the app across roles, widths, themes and states; consistency; time; robustness.
7. Re-seed, complete the report, commit, and write the overview message.

Commit the report after steps 3, 5 and 7 at least.

## Appendix A — API endpoints under test

```
GET    /health
GET    /api/auth/antiforgery                      POST /api/auth/login              POST /api/auth/logout
POST   /api/auth/password-reset/request           POST /api/auth/password-reset/complete
POST   /api/registrations                         POST /api/registrations/email-confirmation/resend
POST   /api/registrations/email-confirmation/complete
GET    /api/me                                    PUT  /api/me/phone                POST /api/me/password
POST   /api/me/email-change                       POST /api/me/email-change/confirm
GET    /api/me/sessions                           DELETE /api/me/sessions/{sessionId}   POST /api/me/sessions/revoke-others
GET    /api/overview/summary
GET    /api/companies   POST /api/companies   PUT /api/companies/{id}   DELETE /api/companies/{id}
GET    /api/users   GET /api/users/{userId}   PUT /api/users/{userId}/name
POST   /api/users/{userId}/activate   POST …/reject-registration   POST …/reopen-registration
POST   /api/users/{userId}/suspend    POST …/restore
GET    /api/users/{userId}/sessions   DELETE …/sessions/{sessionId}   POST …/sessions/revoke-all
GET    /api/users/{userId}/roles      POST …/roles   PUT …/roles/{assignmentId}/expiry   POST …/roles/{assignmentId}/revoke
GET    /api/system-administrator/transfers   POST …/transfers   POST …/transfers/{transferId}/resend
POST   …/transfers/{transferId}/cancel       POST …/transfers/accept
GET    /api/vehicles    POST /api/vehicles    GET /api/vehicles/{id}    PUT /api/vehicles/{id}
POST   /api/vehicles/{id}/activate    POST /api/vehicles/{id}/deactivate
GET    /api/customers   POST /api/customers   GET /api/customers/{id}   PUT /api/customers/{id}
POST   /api/customers/{id}/activate   POST /api/customers/{id}/deactivate
GET    /api/drivers     POST /api/drivers     GET /api/drivers/{id}     PUT /api/drivers/{id}
GET    /api/drivers/{id}/authorizations   POST /api/drivers/{id}/activate   POST /api/drivers/{id}/deactivate
GET    /api/rental-assignments   POST /api/rental-assignments   GET /api/rental-assignments/{id}   PUT /api/rental-assignments/{id}
POST   /api/rental-assignments/{id}/activate   POST …/end   POST …/cancel
PUT    /api/rental-assignments/{id}/corrections/parties   PUT …/corrections/timeline
GET    /api/rental-assignments/{assignmentId}/authorizations   POST …/authorizations
POST   …/authorizations/{authorizationId}/stop   PUT …/authorizations/{authorizationId}/correction
GET    /api/rental-assignments/{assignmentId}/interruptions   POST …/interruptions
PUT    …/interruptions/{interruptionId}   PUT …/interruptions/{interruptionId}/correction   POST …/interruptions/{interruptionId}/end
GET    /api/interruptions
GET    /api/security-audit   GET /api/security-audit/{id}
```

## Appendix B — App routes under test

Public: `/sign-in`, `/register`, `/confirm-registration-email` (and `?resend=1`), `/reset-password`,
`/confirm-email-change`, `/accept-administrator-transfer` (the last four read their token from the
`#` fragment of the emailed link).

Signed in: `/overview`, `/needs-attention`, `/rental-assignments`, `/rental-assignments/{id}`,
`/vehicles`, `/vehicles/{id}`, `/customers`, `/customers/{id}`, `/drivers`, `/drivers/{id}`,
`/users`, `/users/{id}`, `/registrations`, `/company`, `/system-administrator`, `/security-audit`,
`/security-audit/{id}`, `/profile` (tabs `?tab=security`, `?tab=sessions`). Out of scope:
`/tasks`, `/insurance-cases`. A signed-in person with no permissions sees "Access pending" on every
route; an unknown route redirects.
