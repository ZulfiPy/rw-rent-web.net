# RW-Rent web — Phase 2

React + Vite + TypeScript port of the reviewed prototype (`RW-Rent.dc.html`). The prototype is the
design spec; `uploads/swagger.json` is the contract. Phase 3 wires the real API by changing one
folder.

```
npm install
npm run dev        # VITE_API_MODE=mock by default
npm test           # dto/mock round-trip, formatting, permission gate, error mapping
npm run typecheck
```

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
  chosen driver with their licence number; the driver list projection carries no licence, and the
  picker reads one list rather than one record per driver, so the row's sub-line is the email.
- **The identifier row's copy has no toast.** The prototype confirms a copied identifier with a
  toast; there is no toast surface in the port, so the button reports "Copied" itself for two seconds.
- Sign out calls `POST /api/auth/logout` and reloads. The prototype returns to its own sign-in
  screen; the authentication screens are Phase 3, so the mock ends the persona's session instead.
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
    http.ts       Phase 3 target: cookie auth + antiforgery header
    queryKeys.ts  TanStack Query keys, one factory per resource
  app/            shell, sidebar, bootstrap
  pages/          one folder per screen
  ui/             chips, filters, pagination, empty and problem states
  format/         datetime.ts (Europe/Tallinn + UTC), labels.ts (labels by raw value)
  permissions/    permission strings, can(), actionState(), AccessProvider
  mock/           in-memory store, route table, audit writer, failure simulator
  dev/            PROTOTYPE panel (dev-only)
  styles/         tokens.css ported from the prototype + base resets
```

## The swap point

`src/app/bootstrap.ts` installs a transport once:

```ts
VITE_API_MODE=mock  → createMockTransport()      // src/mock
VITE_API_MODE=http  → createHttpTransport(url)   // src/api/http.ts
```

Both satisfy `Transport.request(method, path, {query, body})`, so `src/api/*.ts` keeps the real
verbs and URLs in mock mode too, and no component or api function changes in Phase 3.

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
could otherwise perform is disabled with its reason (`actionState`). The mock enforces the same
permissions, so an over-offered action returns 403.

**Sessions.** `isActive` and `isCurrent` are computed on every read, never stored: active means not
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
desktop from 1280 (expanded rail, every column). Column folding is CSS — `foldTablet` and
`foldNarrow` in `ui/table.module.css`; only the structural switches (table → cards, rail → drawer,
row buttons going icon-only) read `useTier()` / `useNarrow()`. Portrait tables run `table-layout:
fixed`, so a long value ellipsises inside its cell instead of widening the table: no page body is
ever wider than the viewport, at any tier. Every value a fold removes reappears as a sub-line in a
column that stays, bound to the same breakpoint as the fold.

**Type.** Mono is for machine values only — identifiers, phone numbers, timestamps, counts, IP
addresses. Emails, names, reasons and sublabels such as “Protected account” are sans secondary text.
A list cell shows an identifier shortened to eight characters with the full value in its tooltip; the
record page shows it in full.

**Query types.** Query DTOs are type aliases rather than interfaces, which is what lets `UsersQuery`
reach `Transport.request` with its own property types intact. `AssertQuery` in `api/client.ts` lists
every one of them, so redeclaring one as an interface fails there instead of at each call site. The
mock matches paths and query keys case-insensitively, as ASP.NET binds them.

**Failures.** One envelope module. Two 400 shapes: a filter-level rejection carries `errors` keyed by
FluentValidation's PascalCase property path, indices included (`Reason`, `Roles[0].Role`), normalised
to the JSON names the inputs use; a service-level validation refusal carries `code` + `detail`
(`users.activation_role_expiry_invalid` → the role's expiry input). Both become field errors when the
path or code names an input, otherwise a form-level message above the footer. 409 ending
`.concurrency_conflict` → amber stale banner with Refresh; other 409 → red conflict banner; 403 → the
action should not have been offered; 401 → sign-in. The failure simulator lives at the mock transport
boundary and throws the same envelopes.

**Business rules.** `contract/business_rules.md` is enforced at the mock boundary, never in a
component: coverage before activation (ASSIGN-012), no ending while an interruption is open
(INTERRUPT-011), Active → Cancelled only as a mistaken activation with no handover, no interruption
and a note (ASSIGN-013), named and collective authorizations mutually exclusive (AUTH-003), the
collective form for business customers only (AUTH-009), no standalone stop of the last coverage on an
active assignment (AUTH-007), a required note on every interruption (INTERRUPT-006), and interruption
windows inside the assignment's actual period (INTERRUPT-012). Each refusal carries a `code`, and
`api/codes.ts` routes the ones that name an input to that input; the rest are form-level messages.

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

## Not in swagger (mock-only, marked `// FOLLOW-UP` in dto.ts)

- The Overview's Recent security activity feed (`api/overview.ts` → `GET /api/overview/security-activity`)
- Reading System Administrator transfers (`listTransfers()` → `GET /api/system-administrator/transfers`)
- `registrationDecisionReason` on the user read model
- `createdAtUtc` on the user LIST projection — the Registrations queue's Registered column
- Overview summary counts (four `PageSize=1` probes stand in, routed through `api/overview.ts`; a
  count the persona may not read comes back null and its card is left out)
- `upcomingCustomerDisplayName` / `upcomingPlannedStartAtUtc` on the vehicles list projection
- No vehicle availability field: In use / Reserved / Available is derived per screen from the open
  assignments the persona can read, so a Viewer without `RentalAssignments.Read` sees only whether a
  vehicle is in the fleet
- Interruptions and authorizations are assignment-scoped, so the open-work queue fans out one
  request per open assignment; a company-wide `GET /api/interruptions?IsOpen=true` would collapse it
- No `GET /api/security-audit/{id}`: an audit entry is located in the first page of the unfiltered
  list, so a deep link is best-effort
- `GET /api/users` takes one `Status`, so “All lifecycle states” fans out into one request per state
  and pages the merged result client-side

## Asks for the backend

Two contract changes the ported screens want. Both have an interim behaviour in the mock, so nothing
is blocked — but both are visible in the UI as a compromise.

**`createdAtUtc` on the user list projection.** The Registrations queue sorts and shows *Registered*,
which only the read model carries today. Interim: the mock's list projection adds the field, so the
column works in mock mode and would be empty against the real API.

**The Recent security activity card.** The prototype's card is `db.audit.slice(0, 5)`: the audit
store's first five rows in stored order, which is not time-ordered. `GET /api/security-audit` pages
newest first and cannot express stored order, so the card reads a mock-only
`GET /api/overview/security-activity` through `api/overview.ts` and renders exactly the reviewed
list. Wiring phase: point that one function at whatever the backend exposes for the card.

**`GET /api/security-audit/{id}`.** An audit entry has its own page and its own URL. Interim: the
entry is located in the first page of the unfiltered list (`PageSize=100`), so a deep link is
best-effort — an entry older than that window renders “That entry is not available”, and opening the
row from the list is the reliable path. A by-id read makes the link exact and drops the 100-row
fetch behind every entry page.

## Seed

`src/mock/seed.ts` is the reviewed prototype's `DB`: the same eleven people, their registration
states, fifteen sessions and thirteen audit rows, with the prototype's identifiers preserved as the
keys of `src/mock/ids.ts` (`u4` is Dita Smite in both). `src/mock/seedFleet.ts` carries the fleet the
same way — ten vehicles, eight customers, seven drivers, twelve assignments, six authorizations and
four interruptions, `v7` and `a1` naming the same rows as in the prototype. Two things are computed
rather than stored: an assignment's `customerDisplayName` / `vehiclePlateNumber` resolve from the
customer and vehicle rows, and its authorizations and interruptions are composed per read.

## State of the port

Deliverable A is the api, error, formatting, permission and mock layers. Deliverable B ports the
screens: **user directory**, **user record** (with its eleven actions), **Registrations** and
**Security audit** with its entry page, then **Overview**, **Needs attention** and the fleet lists —
**rental assignments**, **vehicles**, **customers**, **drivers**. The sidebar lists only screens that
exist.

The **rental assignment record** is the first fleet record: summary, authorized drivers,
interruptions, and a corrections tab for System Administrator. Its writes are the assignment
lifecycle (edit, activate, end, the ASSIGN-013 mistaken-activation cancel), authorization start and
stop with same-operation replacement, interruption create / edit / end, and the four privileged
corrections — timeline, parties, authorization, interruption.

**Company profile** and the **System Administrator** console complete the rail's Administration
group: the Company's legal identity, address and record panels with its edit and delete writes and
its first-run setup state, and the protected transfer of the single administrator account —
initiate, rotate and resend, cancel, each password- or reason-confirmed and audited.

Every list toolbar is the prototype's: search where the prototype has one — every list but Security
audit, which sets `noSearch` — the filter chips, the More filters toggle whose label becomes "Fewer
filters" when open, then a flexible gap, `Clear filters` while anything is filtered, and the record
count. Each search box carries the prototype's own placeholder ("Plate, VIN, make or model", "Name,
identifier or email", "First name, last name or email", "Plate, VIN or customer name") and the
documented `Search` cap for that list, and commits after a pause rather than per keystroke. The extra
filters open as their own shaded grid below the toolbar with a label above each control — the target
user on Security audit, gearbox and manufacturing year on vehicles, and on rental assignments the
customer, the vehicle and four date bounds: planned start from/to and actual start from/to, the
second of each pair hinted "Must not precede the lower bound." A date bound resolves to the edge of
the chosen Europe/Tallinn day and is compared as an instant. Clearing resets the search and every
filter at once and keeps the sort, the page size and the open row.

**New rental assignment** is the assignments list's own write: the prototype's 700px create dialog —
parties, the initial lifecycle state, the timeline that state implies, the driver-coverage block with
its three modes and named-driver picker, and the assignment note. A Planned assignment may be saved
without a driver; an Active one may not, and the footer says so before the button refuses. The
created record opens on success, as in the prototype.

The **vehicle**, **customer** and **driver** records follow: specifications, identity, contact and
driver-link panels, the rental history and authorization-period tables in the prototype's order, and
the record's own writes — edit, activate, deactivate, and create from each list header. A
deactivation that the record's own state refuses is disabled with the prototype's reason, and the
confirmation lists what holds it (each planned or active assignment, or each open named-driver
authorization).

Every mutation runs through one dialog layer: `ui/Dialog` renders the failure envelope (field
messages under inputs, validation message above the footer, amber stale banner with Refresh — which
disables the primary action until the form is re-seeded — red conflict, forbidden, session ended) and
`app/useActionMutation` maps the rejection, exposes the field messages and invalidates the affected
caches on success. Refresh refetches what the dialog is editing and then remounts it through
`app/reseed.tsx`, so every input is re-seeded from the record that came back and anything typed
against the stale copy is discarded. Nothing is validated in the browser: a past role expiry is
refused by the api boundary as `users.activation_role_expiry_invalid` and rendered under that role's
expiry input.

Audit payloads are parsed by `format/auditPayload.ts`, which follows the documented shape (flat
PascalCase objects, changed keys only, `Roles` as an array of grants) and returns null for anything
else — the entry page then shows the raw payload instead of guessing.

## Known gaps against the prototype

None open. The three left after the four-viewport re-audit are closed: search on the four fleet
lists, the rental assignments' four date bounds, and the record panel grid — the last one after
checking what the prototype's grid actually renders (below).

The prototype's record page is a `repeat(2,minmax(0,1fr))` grid, but every panel it places carries
`span:'1 / -1'` — there is no half-width panel on any record, in any role or tab. A full-row panel in
that grid and a panel in this port's 14px flex column occupy the same box, and `min-width: 0;
max-width: 100%` on the panel gives a wide table the same containment `minmax(0,1fr)` does: the table
scrolls inside the panel instead of widening the page. The stacked column stays, rather than carrying
a second grid track nothing is ever placed in.

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
