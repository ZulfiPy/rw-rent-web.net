# RW-Rent web

React + Vite + TypeScript front end for the RW-Rent API. The contract is the backend's live OpenAPI
document, `GET /openapi/v1.json` on the running API. There is no in-app fake backend: the app talks
to the real API with cookies and the antiforgery header.

```
npm install
npm run dev -- --port 5173 --strictPort
npm test
npm run typecheck
```

The backend has to be running first; see "Running the app" below.

## Running the app

The API and its seeded database come first. From the backend's main folder and worktree:

```sh
# 1. PostgreSQL and Mailpit, from the backend's main checkout only
cd /Users/zulf/rw-rent-api/RWRentApi && docker compose up -d postgres mailpit

# 2. the environment the API reads (the database password lives in that folder's .env)
set -a; source /Users/zulf/rw-rent-api/RWRentApi/.env; set +a
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5433;Database=rwrent_v1;Username=rwrent;Password=${RWRENT_POSTGRES_PASSWORD}"
export EmailDelivery__FromAddress="dev@rwrent.local"

# 3. migrations, then the sample dataset (the password is yours; it is never committed)
cd /Users/zulf/rw-rent-api/RWRentApi-wiring
dotnet ef database update --project src/RWRentApi.Infrastructure --startup-project src/RWRentApi.Api
dotnet run --project src/RWRentApi.Api -- seed-development-data --password '<your seed password>' --replace true

# 4. the API on http://localhost:5001
dotnet run --project src/RWRentApi.Api --launch-profile http
```

Then the app:

```sh
npm run dev -- --port 5173 --strictPort
```

Port 5173 is not optional: it is the only origin the API trusts for credentialed requests in
Development. Mailpit catches every development email at `http://localhost:8025`.

`VITE_API_BASE_URL` is the only environment variable. `.env.development` is committed with
`http://localhost:5001`; `.env.example` mirrors it for other environments.

## The account area

Six screens live outside the shell: `/sign-in`, `/register`, and the four the backend's emails link
to — `/confirm-registration-email`, `/reset-password`, `/confirm-email-change` and
`/accept-administrator-transfer`. They are ports of the reviewed prototype's authentication family,
which lives in this repository at `Context/prototype/RW-Rent.dc.html`: the split page with the
monogram art, the theme toggle, and one message screen per outcome. Each emailed link carries its
single-use token after the `#`, so it never reaches a server log; the page reads it once and removes
it from the address bar.

"Your account" (`/profile`) and "Access pending" are ports of the same prototype and live inside the
shell. Both are open to every signed-in account, including one that is Active with no permissions
yet — such an account sees an empty navigation and its own account area.

## Signing in

Every seeded person shares the password given to `seed-development-data`. The dataset is the
reviewed sample data, so these accounts show the screens the prototype was reviewed with:

| Account | Email | What they see |
|---|---|---|
| System Administrator | `sysadmin@rwrent.example` | everything, including privileged corrections and the System Administrator page |
| Company Principal | `signe.priede@rwrent.example` | the company's records, role administration and the company's audit history |
| Fleet Manager | `karlis.zvaigzne@rwrent.example` | fleet and rental work, registrations to review |
| Viewer | `toms.rudzitis@rwrent.example` | read-only across the fleet |

Re-seed before a review session: the sample instants are relative to the seeding moment, so the
dates drift once the data has been sitting for a while.

## Porting rule

Every screen is transcribed from `RW-Rent.dc.html`, not rebuilt from memory: same panels, same
grouping, same spacing scale, same icons, same copy, same per-role variants. A CSS Module carries the
prototype's literal values (14px gutters, 14px panel radius, 17px panel padding, 13.5px row titles),
and a screen's data model follows the prototype's model function — `metricsModel`, `queueModel`,
`navModel`, `simpleModel` — rather than an equivalent invented here. Where the prototype and swagger
disagree, the disagreement is written down (see the follow-ups above) instead of being resolved by
substituting something plausible.

**Known deviations, deliberate:**

- **Needs attention group ordering.** Group order is the prototype's (registrations, then open
  interruptions, then handovers inside three days). Within a group the prototype walks its in-memory
  collections in seed order, which the API cannot express — registrations are ordered by registration
  instant, newest first, and interruptions by oldest open, the directions that reproduce the
  prototype's rendered list. The panel carries the prototype's "Registrations first, then open
  interruptions, then upcoming handovers." subtitle, which describes that grouping rather than
  claiming a waiting-time sort.
- **Fleet writes are not audited.** Vehicle, customer and driver edits are outside the backend's
  audited set (security events, role and registration transitions, privileged corrections), so no
  entry is written for them. The driver record's audit panel therefore usually holds only the
  creation; where the trail has no stored `Driver.Created`, the panel synthesizes the row from
  `createdAtUtc`. The prototype attributes that synthetic row to a seeded creator, which no API
  field carries — the port shows the actor as "Not recorded".
- **The driver picker's sub-line is the email.** The prototype's named-driver picker labels each
  chosen driver with their licence number. The list now carries the licence, and the picker puts it
  in the field's helper slot once a driver is chosen; the row's own sub-line stays the email.
- **The identifier row's copy has no toast.** The prototype confirms a copied identifier with a
  toast; there is no toast surface in the port, so the button reports "Copied" itself for two seconds.
- Sign out calls `POST /api/auth/logout`, empties the cache and goes to `/sign-in` without
  reloading, so the theme and rail preferences survive it.
- A record's state badges are in the shell's header bar next to the title (the prototype's
  `pageBadges`), along with the record's identifier row and its actions. The assignment and user
  records keep the prototype's hero band below the bar: its state chip, headline facts and lifecycle
  buttons in one row. Vehicle, customer and driver records have no hero band, as in the prototype.

A record panel's table is a different vocabulary from a list's, and both are transcribed as such
(`.table[data-panel]` in `table.module.css`): sans headers at 11px/.05em/600 on `--inset` over
9px 16px, 11px 16px cells, a 13px/450 row title with an 11.5px sub-line, each header left-aligned
over its column and the actions column right. On the transfers table both instants are Geist Mono
12.5px/400 in `--fg-3` — the list vocabulary's mono size, since the two timestamps are of equal
standing. The prototype renders them the same way.

## Layout

```
src/
  api/            the only surface pages import
    dto.ts        swagger mirrored: server names, camelCase bodies, numeric enums
    <resource>.ts typed functions returning DTOs and PagedResponse<T>
    problem.ts    ProblemDetails / ValidationProblemDetails → Failure
    codes.ts      code → input table for coded 400s
    transport.ts  the Transport interface + installTransport()
    http.ts       the one transport: cookie auth + the antiforgery header
    queryKeys.ts  TanStack Query keys, one factory per resource
  app/            shell, sidebar, bootstrap, the session-end signal
  pages/          one folder per screen
  pages/account/  sign-in, registration, the email-link pages, the profile
  ui/             chips, filters, pagination, empty and problem states
  format/         datetime.ts (Europe/Tallinn + UTC), labels.ts (labels by raw value)
  permissions/    permission strings, can(), actionState(), AccessProvider
  styles/         tokens.css ported from the prototype + base resets
```

## Rules the code enforces

**Audit payloads.** `beforeJson` / `afterJson` keys are PascalCase as the backend types them; enum
values are PascalCase strings; timestamps carry an explicit `+00:00`. When both sides exist only
changed keys survive, with identical key sets; a one-sided payload passes through; nothing changed
writes no row. Reason is recorded only where the dialog collects one. Session revocations caused by
a security-state change set a revocation reason on the session and write no audit row.

**Time.** Instants are stored with offset. Operational surfaces render Europe/Tallinn in the
humanized style (`23 Aug, 14:57`, year only when not current); Security audit and Sessions render
UTC `yyyy-MM-dd HH:mm`, declared once per panel. A date-only expiry resolves to 23:59:59.999 local
on the chosen day — the chosen date is the last valid day — and the backend's future check applies
to that instant.

**Permissions.** `GET /api/me` is the only capability source. `can(permission)` gates nav, tabs and
actions; an action the persona can never hold is hidden, and only a state-blocked action the persona
could otherwise perform is disabled with its reason (`actionState`). The API enforces the same
permissions, so an over-offered action returns 403 and the dialog says so.

**Sessions.** `isActive` and `isCurrent` are the API's, computed on every read, never stored: active means not
revoked AND the idle deadline ahead AND the absolute deadline ahead; current means the row is the
session that authenticated the request, and it is self-view-only — an administrator listing another
user's sessions never receives it. The store holds `SessionRecord` (the response minus those two) so
a stale flag cannot disagree with the deadlines. The revoke endpoints take no reason: a single
revocation stamps the session “Revoked by administrator”, a forced sign-out stamps “Forced logout by
administrator”, and both audit entries carry neither a reason nor a payload — single revocation names
the session, forced sign-out names the user.

**Layout.** The shell is the prototype's: a rail (246px expanded, 64px collapsed, a 272px overlay
below 1024), a `flex: none` header bar carrying the breadcrumb, title, badges and description
(`18px 26px`, `14px 16px` narrow, 24px/19px title), and a scroll area whose inner column is the only
centred max-width block (`none` until 1800, then 1680; padding `22px 26px 40px`, `22px 18px 40px`
below 1280, `16px` narrow). A screen declares its header through `usePageHeader` — `ui/PageHeader`
for a list, `ui/RecordHeader` for a record — and renders only its body.

**Tiers.** Three, as in the prototype: phone below 768 (cards instead of tables, sidebar behind a
menu button), tablet 768–1279 in both orientations (icon rail, folded columns, tighter cells),
desktop from 1280 (expanded rail, every column). Column folding is CSS — `foldTablet`,
`foldNarrow` and `foldPhone` in `ui/table.module.css`, the last for a column a record panel has the
width to keep through portrait and folds only for the card tier; only the structural switches (table → cards, rail → drawer,
row buttons going icon-only) read `useTier()` / `useNarrow()`. Portrait tables run `table-layout:
fixed`, so a long value ellipsises inside its cell instead of widening the table: no page body is
ever wider than the viewport, at any tier. Every value a fold removes reappears as a sub-line in a
column that stays, bound to the same breakpoint as the fold. A record panel whose table needs more
width than the card tier has renders cards there instead of folding further — the vehicle record's
Rental history and the assignment record's two tables — from the shared card vocabulary in
`ui/cards.module.css`, which the lists' cards use too.

**Panel width, not window width.** `ui/Panel` is a size container (`container-type: inline-size`),
so what a panel holds can pick its layout from the panel rather than the viewport — the rail state
then changes a layout the way a narrower window does. Two places take it up: the assignment record's
Authorized drivers and Interruptions tables (desktop recipe at 940 and wider, the portrait fold
below, with `foldPanel` / `showPanel` in `AssignmentRecord.module.css` in place of the viewport fold
classes), and a `FactGrid` that opts in with `oneRow`. Landscape iPad with the rail pinned open is
the case this answers: 1194 wide, but a panel no wider than a portrait one. The fleet records'
history tables do not take it up: they carry declared column widths that share the panel's spare
width, which is what a table with room to spare wants — the 1%-plus-one-flexible-column recipe is
for a table that would otherwise overflow.

A `FactGrid` whose facts divide evenly can pin its track count instead: `columns={4}` on the vehicle
record's Specifications gives two rows of four at every desktop width and rail state, where the
auto-fit default leaves a remainder that moves with the panel.

**Type.** Mono is for machine values only — identifiers, phone numbers, timestamps, counts, IP
addresses. Emails, names, reasons and sublabels such as “Protected account” are sans secondary text.
A list cell shows an identifier shortened to eight characters with the full value in its tooltip; the
record page shows it in full.

**Query types.** Query DTOs are type aliases rather than interfaces, which is what lets `UsersQuery`
reach `Transport.request` with its own property types intact. `AssertQuery` in `api/client.ts` lists
every one of them, so redeclaring one as an interface fails there instead of at each call site.
Query parameter names keep the server's PascalCase; a multi-valued one is a comma-separated string,
as `Statuses=1,4,5` on the users list.

**Failures.** One envelope module. Two 400 shapes: a filter-level rejection carries `errors` keyed by
FluentValidation's PascalCase property path, indices included (`Reason`, `Roles[0].Role`), normalised
to the JSON names the inputs use; a service-level validation refusal carries `code` + `detail`
(`users.activation_role_expiry_invalid` → the role's expiry input). Both become field errors when the
path or code names an input, otherwise a form-level message above the footer. 409 ending
`.concurrency_conflict` → amber stale banner with Refresh; other 409 → red conflict banner; 403 → the
action should not have been offered. A 401 from any request that does not own its own 401 ends the
session once, from the query client's cache handlers, and the sign-in page opens with the message
and the path to come back to.

**Business rules.** The rules live in the backend repository (`Context/business_rules.md` there) and
are enforced by the API. The app never re-implements one: it renders what a refusal says, and it
describes a rule's consequence in a dialog's note where the prototype does.

**Privileged corrections.** Only `PrivilegedCorrections.Execute` sees the Corrections tab. Every
correction sends the last-read `concurrencyToken`, requires a reason of 3–1000 characters, and writes
one append-only audit entry — `RentalAssignment.TimelineCorrected`, `RentalAssignment.PartiesCorrected`,
`DriverAuthorization.Corrected`, `Interruption.Corrected` — whose payload carries changed keys only,
PascalCase names, enum values as names and timestamps with an explicit offset. A successful
correction rotates the token, so the same payload cannot be replayed.

**Stale records.** The concurrency refusal is contractual on every audited resource — users, roles,
customers, drivers, vehicles, companies, profile, corrections, rental assignments, authorizations,
interruptions and system administrator — so the banner and its Refresh are wired on all of them. The
token round-trip is separate: only DTOs that expose a `concurrencyToken` send one back.

## Sheet tier (< 640)

The System Administrator transfers panel does not fold at phone width, it changes shape. Below 640 —
`useSheetTier()`, the prototype's `isPhone()`, the edge the dialog sheet already uses — each transfer
renders as a stacked block: the target's name with the email beneath it, INITIATED and EXPIRES as
label–value rows whose values keep the UTC suffix, the state chip, then Resend and Cancel as two
outlined 44px buttons sharing the row. No header row, no panning, no column dropped. Blocks separate
on the panel's own 1px divider, the last meeting the footer note's rule.

From 640 up the table is the same table at every width: all five columns at their declared widths
(auto / 180 / 180 / 150 / 220), `table-layout: auto`, the panel's roomy pads, and a 900px min-width
that scrolls inside the panel on a narrow tablet rather than folding. `data-nofold` on the table opts
out of the shared ≤1023 panel-table fold — the prototype drops a column from a list, never from a
panel.
