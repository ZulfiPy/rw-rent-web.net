# Delete records — handover

Ported from the approved prototype `RW-Rent.dc.html` (in this zip). The prototype is the source of
truth for looks and behaviour; everything below describes it, nothing here is app code.

Line numbers refer to the copy of `RW-Rent.dc.html` in this zip.

**Opening the prototype:** it loads its runtime from `./support.js`, which is not in this zip (the
zip was asked to hold only the two items). Open it in the prototype project, or drop a copy of
`support.js` beside it.

---

## a. How to see it

**Role:** System Administrator. In the prototype: open the **Prototype** panel on the right edge,
set **Signed-in role** to `SystemAdministrator`.
**Destination:** sidebar group **Administration → Delete records** (icon `delete_sweep`), the entry
after System Administrator.

Any other role: the destination is absent from the sidebar. Opening the route directly shows the
existing restricted state — the `lock` problem block, `HTTP 403 · policy: Records.Delete`.

| State | How to reach it |
| --- | --- |
| Rental assignments | default tab on arrival. Out of use = Cancelled and Ended |
| Driver authorizations | tab 2 |
| Interruptions | tab 3 |
| Vehicles | tab 4 |
| Customers | tab 5 |
| Drivers | tab 6 |
| **Ready** rental | Rental assignments → `770 HDV · Daugava Construction` (Cancelled, no parts) |
| Rental with parts | `400 NDP · Roberts Liepins` (Ended, 2 authorizations · 1 interruption) |
| Ready authorization | Driver authorizations → `Laura Ozola` or `Maris Ozolins`, both on 400 NDP |
| **Blocked** authorization | Driver authorizations → Show **Everything** → `Anete Kalnina · 204 JLM` (the only open authorization of an Active rental) |
| Ready interruption | Interruptions → the two ended ones, on 482 TKL and 400 NDP |
| Ready vehicle | Vehicles → `913 RTN · Citroen Berlingo` (inactive, nothing refers to it) |
| Blocked vehicle | Vehicles → `881 GRT` or `660 BYH` (one rental assignment each) |
| Ready customer | Customers → `Edijs Balodis` (inactive, no rentals) |
| Blocked customer | Customers → `Ventspils Marine Services` (one rental assignment) |
| Ready driver | Drivers → `Normunds Zarins` (inactive, nothing refers to them) |
| Driver blocked by an authorization | Drivers → `Maris Ozolins` |
| Driver blocked by a customer's driver link | Drivers → `Edijs Balodis` |
| Dialog of an **Active** rental | Rental assignments → Show **Everything** → `204 JLM · Anete Kalnina` → Delete… (banner becomes "This rental is active") |
| **Conflict** | Prototype panel → **Next dialog fails with** = `Conflict`, then any Ready row → Delete… → fill in → Delete permanently |
| Conflict from the data itself | no setting needed: it fires when the record gained a reference, or left the list, since the list was loaded |
| Empty state | delete both ended interruptions; the Interruptions tab then shows "Nothing to clean up" |
| **Toast** | any successful Delete permanently |
| **Recently deleted** | bottom of the page, below the table, on every tab |
| Audit: the six new events | Security audit → **Event type** filter → e.g. `Rental assignment · Deleted` |
| Audit: entry of a deletion | Security audit → open a `· Deleted` row. Three seeded ones exist (vehicle, rental with parts, driver) |

Blocked rows: the reason is the row's secondary text under the chip and each blocking record is a
link. The **Delete…** button is disabled; pressing it raises the "Not available" warn toast with the
reason, the way blocked actions behave elsewhere in the prototype.

---

## b. Reused pieces, unchanged

Everything the page is built from, by its name in the file.

**Page frame**

- Page header (`crumbs` / `title` / `desc` in `pageHeaderModel`, entry `deleterecords`)
- `listModel()` / `listSpec()` — the whole list-page machine: filter row, search field, pager,
  sorting, empty and no-result states, the 403 restricted state
- `renderVals()` flags `pgList`, `pgDetail`
- The list table branch of the template (`list.showTable`, `list.columns`, `list.rows`)
- The phone card branch (`list.showCards`) — reused as-is by the five other lists; this page uses
  the new action-card branch instead (section c)
- `isNarrow()` 1024, `isTightTable(upTo)` 768–1024, `isCardTier()` 768, `isPhone()` 640
- `edgePad()` table gutters, `mask` column folding via `tightHide` / `narrowHide`

**Cells and chips**

- `cell(text, o)` with `mono`, `strong`, `dim`, `wrap`, `sub`, `subMono`, `link`, `chip`, `shape`,
  `actions`, `size`, `weight`
- `TONE` chip palette (`ok`, `warn`, `mute`, `info`, `bad`) and the dot `shape` vocabulary
- `ASSIGN_TONE` for the rental Status chip
- `E.status`, `E.interruption`, `E.billing`, `E.customerType`, `E.stopReason`, `E.body`,
  `E.gearbox`, `E.fuel` enum labels
- `displayName(customer)`
- `fmt(iso, mode)` — `dateShort` for the list periods, default local `19 Sep, 09:41` elsewhere

**Tabs**

- The scrollable tab strip markup used by the record pages — same shell, same `role="tablist"` /
  `role="tab"` / `aria-selected`, same overflow behaviour on the phone tier

**Dialog**

- `openDialog(type, args)`, `dialogModel()`, `closeDialog()`, `guard()`, `need()`, `mutate()`,
  `done()`, `refuse()`, `toast()`
- The dialog model vocabulary: `title`, `desc`, `icon`, `tone`, `maxW`, `destructive`, `banner`
  (`tone` / `title` / `body`), `consequences`, `sections` via `SEC()`, fields via `F()`, checkboxes
  via `CK()`, actions via `A()` — identical to `company-delete`
- The phone sheet behaviour (`isPhone()` → `phoneSheet`, `footerDir`, `footerAlign`)
- The conflict presentation and its Refresh (`dialogFail`, `failHasRefresh`, `refreshDialog()`)
- `FAIL_MODES` / `FAIL_TEXT` prototype failure injection
- The success toast

**Panels**

- `detailModel()` and its `P()` / `R()` / `TR()` builders
- The panel-table branch (`p.columns`, `p.trows`, `p.tcards`, `p.empty`, `minWidth`, `keep`)
- `rowColsDefault()` fact grid

**Permissions and navigation**

- `ROLE_PERMS`, `ROLE_CHAIN`, `can(perm)`, `ROUTE_PERM`, the sidebar group model in `navModel()`
- The restricted list state and the `noaccess` route

**Audit**

- `AUDIT_EVENTS`, `eventLabel()`, `entityLabel()`, the Security audit list spec, the audit entry
  route `auditentry`, `diffRows()`, the Raw payload panel, `payload()` / `atRaw()`
- The quiet dark link in table cells (new opt-in flag, same visual as the account screens)

---

## c. New pieces

Everything added or changed for this feature, and nothing else.

### Constants

| What | Line | Detail |
| --- | --- | --- |
| `ROLE_PERMS.SystemAdministrator` | 1477 | `'Records.Delete'` appended. No other role changed |
| `AUDIT_EVENTS` | 1545–1550 | `'Deleted'` added to `RentalAssignment`, `DriverAuthorization`, `Interruption`; three new rows `['Vehicle', ['Deleted']]`, `['Customer', ['Deleted']]`, `['Driver', ['Deleted']]` |
| `FAIL_MODES` entry `'record-delete'` | 1499 | field error for `note`, conflict text |
| `ROUTE_PERM.deleterecords` | 1564 | `'Records.Delete'` |
| `PURGE_KINDS` | 1585–1592 | the six kinds in switch order: `id`, `label`, `one`, `Title`, `icon`, `event`, `entity` |
| `PURGE_KIND` | 1593 | id → kind lookup |
| `PURGE_EVENTS` | 1594 | event type → kind lookup (drives the audit-entry branch and Recently deleted) |
| `PURGE_REASONS` | 1595 | the four reasons |

### State and navigation

| What | Line | Detail |
| --- | --- | --- |
| `state.purgeKind` | 1801 | selected tab, default `'assignments'` |
| Seed version | 1771, 1795 | `'rwrent-19'` → `'rwrent-21'`, so the new mock data seeds |
| Sidebar entry | 1949 | `{ id:'deleterecords', label:'Delete records', icon:'delete_sweep', perm:'Records.Delete' }` in the Administration group, after `sysadmin` |
| Page header | 2115 | `deleterecords` title and description |
| `renderVals`: `pgPurge`, `purgeTabs` | 4835–4836 | gate and tab model |
| `renderVals`: `pgList`, `pgDetail` | 4833, 4837 | `'deleterecords'` added to both (the page is a list **and** carries the Recently deleted panel) |

### Logic

| Function | Line | Does |
| --- | --- | --- |
| `purgeKind()` | 3288 | current tab, with a fallback |
| `purgeParts(db, aid)` | 3289 | a rental's own authorizations and interruptions |
| `purgePartsText(p)` | 3290 | `"2 authorizations · 1 interruption"` |
| `purgeSource(kind)` | 3296 | the rows of a kind (flattens the two keyed maps) |
| `purgeFind(kind, id)` | 3305 | row by id |
| `purgeOut(kind, x)` | 3307 | **out of use**: rental Cancelled or Ended; authorization stopped; interruption ended; vehicle / customer / driver inactive |
| `purgeVisible(kind, x, q)` | 3312 | the Show filter plus the search term |
| `purgeRent(a)` | 3316 | `"<plate> · <customer>"` |
| `purgeHay(kind, x)` | 3322 | the searched fields, same as that kind's normal list |
| `purgeIdent(kind, x)` | 3331 | the record's identifying text (list link, audit `recordLabel`) |
| `purgeDesc(kind, x)` | 3340 | the dialog description line |
| `purgeBlock(kind, x)` | 3355 | **the business rules.** Returns `null` or `{ reason, links, conflict }` |
| `purgeConsequences(kind, x)` | 3389 | the dialog's consequence lines, with exact counts |
| `purgePayload(kind, x)` | 3412 | the copy of the record written to `beforeJson`, PascalCase keys, enum names, nested `Authorizations` / `Interruptions` for a rental |
| `purgeTabs()` | 3436 | the six tabs with their live counts |
| `submitPurge()` | 3445 | re-checks the block, guards the form, deletes the row and only its own parts, writes the audit entry, raises the toast |

`purgeBlock` implements, in one place:

- vehicle / customer: blocked while **any** rental assignment in any status refers to it
- driver: blocked while any driver authorization refers to them, or while a customer record is
  linked to them as its driver record (the two reasons combine into one sentence)
- authorization: blocked only when it is the single open authorization of an Active rental
- interruption: never blocked
- rental assignment: never blocked (any status may be deleted)

`submitPurge` deletes the row and, for a rental, its own `authorizations[id]` and
`interruptions[id]` only. Nothing else is touched.

### Reused-shell extensions

| What | Line | Detail |
| --- | --- | --- |
| `cell()`: `del` | 3249–3256 | the labelled danger row button, its disabled hint and its warn toast |
| `cell()`: `subLinks` | 3257–3258 | blocker links under a chip's secondary text |
| `cell()`: `quiet` | 3260 | the quiet dark link for table cells (`linkFg` / `linkEdge`); default stays `--accent` |
| `listSpec()` branch `deleterecords` | 3749–3852 | the six per-kind column sets, cells, cards and search hints; `forbidden` / `forbiddenPerm`; the Show filter; `actionCards:true` |
| `listModel()`: `spec.forbidden` | 3946 | lets a list spec raise the 403 state itself |
| `listModel()`: `spec.activeExtra` | 3945 | makes Show count as an active filter, so Clear filters appears |
| `listModel()`: `showActionCards`, `actionCards` | 3960, 3990 | the phone card variant that carries its own action |
| `detailModel()` branch `deleterecords` | 4620–4641 | the Recently deleted panel, desktop rows and phone cards |
| `detailModel()` audit-entry branch | 4575–4604 | a deletion shows **Deleted record** (+ **Deleted authorizations** / **Deleted interruptions**) instead of Recorded values, a Record row instead of an entity link, and local times |
| Audit hero fact | 4607 | `Occurred` in local time for a deletion; other entries keep `Occurred (UTC)` |
| Audit list row tint | 4326 | `Deleted` joins Failed / Suspend / Reject in the bad tint |
| `P()`: `fullRows` | 4076 | a panel whose rows each take the full width (the two parts groups) |
| `dialogModel()` entry `record-delete` | 2689–2706 | title, description, the two banner variants, consequences, the one section, the two actions |
| `refuse(text, refresh)` | 2764 | second argument offers Refresh on a conflict the data raised |
| `dialogModel`: `failHasRefresh` | 2801 | honours that flag |

### Template

| Block | Line | Detail |
| --- | --- | --- |
| `pgPurge` block | 642–663 | the bad-tone banner and the six-kind tab strip, above the list |
| `c.hasSubLinks` | 791–798 | blocker links in a table cell |
| `c.isDelete` | 812–816 | the row's danger button |
| `list.showActionCards` | 882–915 | the phone action card |

### CSS

None. See `new-styles.css`.

---

## d. Layout at the three tiers

### 1512, rail collapsed

All columns show. Table `min-width` per kind: rental assignments 1220, driver authorizations and
interruptions 1180, drivers 1040, vehicles and customers 1020 — all under the available width, so
nothing pans.

| Kind | Columns, left to right |
| --- | --- |
| Rental assignments | Vehicle 176 · Customer auto · Status 118 · Period 172 · Parts 168 · Deletion 254 · Actions 118 right |
| Driver authorizations | Driver auto · Rental 220 · Period 172 · State 176 · Deletion 254 · Actions 118 right |
| Interruptions | Reason 210 · Rental 220 · Period 172 · Billing impact 150 · Deletion 254 · Actions 118 right |
| Vehicles | Plate 136 · Make, model, year auto · Status 128 · Deletion 300 · Actions 118 right |
| Customers | Customer auto · Type 140 · Status 128 · Deletion 300 · Actions 118 right |
| Drivers | Driver auto · Licence 180 · Status 128 · Deletion 300 · Actions 118 right |

Recently deleted: When 150 (`keep`) · Who 176 · What auto · Reason 300, `min-width` 880.
Dialog: `maxW` 560.

### 834 (tablet portrait)

Inside the 768–1023 folding band, so the shell's `tightHide` and its compact metrics apply:

- **Rental assignments: Parts folds.** **Interruptions: Billing impact folds.** No other column
  folds on any kind — the identifying cell, Deletion and Actions always stay.
- Fixed column widths shrink to 71%, the `auto` column absorbs the rest, table gutters go
  22 → 16px outer and 14 → 9px inner.
- The Deletion cell keeps its full reason text; it wraps to as many lines as it needs.
- Recently deleted keeps four columns; When is `keep`, so it does not shrink.
- Dialog: still the centred 560 modal, not a sheet.

### 402 (phone)

Below 768 the table is replaced by cards; below 640 the dialog becomes the sheet.

**Card** (one per row, separated by a 1px rule, 14/16px padding, 10px stack gap):

1. Head row: the identifying text as the quiet dark link (14/600, mono for a plate), the Deletion
   chip right-aligned on the same line, and the sub-line under the title at 11.5 in `--fg-3`.
2. Fact grid, `repeat(auto-fit, minmax(120px, 1fr))`, label 10.5 uppercase `--fg-4` over value 12.5
   `--fg-2`. A rental's Parts fact spans both columns.
3. Blocked only: the reason at 12 in `--warn`, with the blocker links beneath it.
4. The action: full-width **Delete…**, `min-height` 44, the danger recipe. Disabled at 45% opacity
   with the reason as its hint.

The card is deliberately **not** one big button, unlike the other lists' cards: it carries its own
action, and a button cannot nest in a button. The title link opens the record, the action opens the
dialog, and both keep a 44px target.

**Sheet:** bottom sheet, full width, Cancel above Delete permanently, both full width, the body
scrolls, the footer stays.

**Recently deleted** becomes the panel's phone cards: What as the title, Reason as the sub-line,
When and Who as facts, a mute `Deleted` chip and an `open_in_new` action to the audit entry.

### Secondary text, all tiers

- The identifying cell carries a sub-line: rental → make and model; vehicle → VIN in mono;
  customer → registration or personal id in mono; driver → email. It never wraps; it ellipsises.
- The Deletion cell's secondary text is the block reason, and it wraps.
- The State cell's secondary text is the stop reason.
- Periods and identifiers are mono; everything dim is `--fg-3` / `--fg-4`.
- Links in table cells are the quiet dark link (`--fg` with a `--line-3` underline that goes to
  `currentColor` on hover), never red.

---

## e. Copy deck

Every user-facing string of the feature, verbatim.

### Page

- Title: `Delete records`
- Description: `Permanently removes records the company no longer needs. A deletion cannot be undone. Every deletion is written to the security audit with its reason.`
- Sidebar label: `Delete records`

### Banner under the header

- `Deleted means gone`
- `The record leaves the database. What stays is one entry in the security audit: who deleted what, when and why, with a copy of what the record said.`

### Tabs

`Rental assignments` · `Driver authorizations` · `Interruptions` · `Vehicles` · `Customers` ·
`Drivers`

### Filter row

- Search placeholders, in tab order:
  `Plate, VIN or customer name` · `Driver, plate or customer name` ·
  `Reason, note, plate or customer` · `Plate, VIN, make or model` · `Name, identifier or email` ·
  `Name, licence number or email`
- `Show`, options `Out of use` (default) and `Everything`
- `Clear filters`

### Column headers

`Vehicle` `Customer` `Status` `Period` `Parts` `Deletion` — `Driver` `Rental` `State` —
`Reason` `Billing impact` — `Plate` `Make, model, year` — `Type` — `Licence`.
The Actions column has no header.

### Cells

- Deletion chip: `Ready` (ok) / `Blocked` (warn)
- Row action: `Delete…`
- Its hint when enabled: `Delete this rental assignment` / `… driver authorization` /
  `… interruption` / `… vehicle` / `… customer` / `… driver`
- Its hint when blocked: the block reason, with a full stop
- Pressing it while blocked: toast `Not available` + the same reason
- A rental with no parts: `No parts`; otherwise e.g. `2 authorizations · 1 interruption`
- An authorization with no named driver: `Business customer drivers`
- Period: `12 Aug → 11 Sep`, and `open` where there is no end

### Block reasons

- `1 rental assignment refers to this vehicle` / `2 rental assignments refer to this vehicle`
- `1 rental assignment refers to this customer` / `2 rental assignments refer to this customer`
- `1 driver authorization refers to this driver` / `2 driver authorizations refer to this driver`
- `A customer record is linked to this driver record`
- Both driver reasons at once:
  `1 driver authorization refers to this driver and a customer record is linked to this driver record`
- `An active rental must keep at least one authorization`

### Empty state

- `Nothing to clean up`
- `No out-of-use records of this kind. Switch Show to Everything to see the rest.`
- icon `inventory_2`

### Dialog

- Title: `Delete rental assignment` / `Delete driver authorization` / `Delete interruption` /
  `Delete vehicle` / `Delete customer` / `Delete driver`
- Description, the record's identifying line, e.g.
  `400 NDP · Roberts Liepins · Ended 11 Sep` ·
  `Laura Ozola · 400 NDP · Roberts Liepins · Stopped 11 Sep` ·
  `Administrative hold · 400 NDP · Roberts Liepins · 30 Aug → 01 Sep` ·
  `913 RTN · Citroen Berlingo 2019 · Inactive` ·
  `Edijs Balodis · Private person · Inactive` ·
  `Maris Ozolins · LV-AH-118903 · Inactive`
- Banner, normal: `This cannot be undone` /
  `The record is removed from the database for good.`
- Banner, Active rental: `This rental is active` /
  `The vehicle is recorded as being with the customer right now. Delete it only if this rental never happened.`

Consequences — the last line is on every kind:

- Rental assignment: `The rental assignment is removed permanently.` ·
  `Its 2 driver authorizations and 1 interruption are removed with it.` (only when it has parts;
  singular parts read `… is removed with it.`) ·
  `The customer, the vehicle and the drivers stay as they are.`
- Driver authorization: `The driver authorization is removed permanently.` ·
  `The rental assignment, the driver and every other authorization on it stay as they are.`
- Interruption: `The interruption is removed permanently.` ·
  `The rental assignment, its authorizations and its other interruptions stay as they are.`
- Vehicle: `The vehicle is removed permanently.` ·
  `No rental assignment refers to this vehicle, so nothing else changes.`
- Customer: `The customer is removed permanently.` ·
  `No rental assignment refers to this customer, so nothing else changes.`
- Driver: `The driver is removed permanently.` ·
  `No driver authorization and no customer record refer to this driver, so nothing else changes.`
- Every kind: `One entry stays in the security audit: you, the time, your reason and a copy of the deleted record.`

Section:

- `Reason` `required`, placeholder option `Select a reason`, options
  `Entered by mistake` · `Practice or test record` · `No longer needed` · `Other`
- `Note`, `required` when the reason is Other and `· optional` otherwise, hint
  `Stored with the audit entry.`
- Checkbox `I understand this cannot be undone`, hint
  `The record and its parts cannot be restored from the app.`

Actions: `Cancel` · `Delete permanently` (icon `delete_forever`), enabled only with a reason, the
note when it is required, and the checkbox.

Validation, if submitted incomplete: `A reason is required.` ·
`A note is required when the reason is Other.` · `The note must be at most 1000 characters.`

Conflicts, each with Refresh:

- `This vehicle now has a rental assignment. Refresh the list.`
- `This customer now has a rental assignment. Refresh the list.`
- `This driver is now referenced by another record. Refresh the list.`
- `This is now the only open authorization of an active rental. Refresh the list.`
- `This record is no longer in the list. Refresh the list.`
- Injected by the prototype panel:
  `This record gained a reference while the list was open. Refresh the list.`

### Toast

- `Rental assignment deleted` / `Driver authorization deleted` / `Interruption deleted` /
  `Vehicle deleted` / `Customer deleted` / `Driver deleted`
- Body, always: `Written to the security audit.`

### Recently deleted

- Panel title `Recently deleted`, description `Times in Tallinn time.`
- Columns `When` · `Who` · `What` · `Reason`
- What reads `Rental assignment · 660 BYH · Nordwind Logistics`
- Reason reads back what was chosen; a note is appended after an em dash:
  `Practice or test record — made while teaching a new colleague.`
- With no reason recorded: `No reason recorded`
- Empty: `Nothing has been deleted yet` /
  `Deletions made on this page appear here, newest first, each one linked to its security-audit entry.`
- Phone chip: `Deleted`; phone action label `Open audit entry`

### Security audit

Event labels, as the filter and the list show them:

`Rental assignment · Deleted` · `Driver authorisation · Deleted` · `Interruption · Deleted` ·
`Vehicle · Deleted` · `Customer · Deleted` · `Driver · Deleted`

Audit entry of a deletion:

- Event panel description `Times in Tallinn time.` (other entries keep `All times UTC.`)
- Hero fact label `Occurred` (other entries keep `Occurred (UTC)`)
- Row `Record` carries the identifying text, with the hint
  `The record was deleted, so there is nothing to open.`
- Panel `Deleted record`, description `The values the record held when it was deleted.`
- Panels `Deleted authorizations` and `Deleted interruptions`, rows labelled
  `Authorization 1`, `Interruption 1`, …
- Unparseable payload: `Unrecognised payload shape — see the raw values below`

---

## f. Invented, not asked for

1. **`recordLabel` on the audit row.** The record is gone, so nothing can reconstruct the What
   column or the entry's Record row. One new field, set from `purgeIdent()`.
2. **Deletion payload shape.** The copy of the record goes in `beforeJson` with `afterJson: null`;
   a rental's parts are nested `Authorizations` / `Interruptions` arrays in that same payload, and
   those arrays are what the two extra panels read.
3. **Spelling of the audit event.** The new event reads `Driver authorisation · Deleted`, matching
   the existing `Driver authorisation · Corrected` in the same list rather than the "authorization"
   used everywhere on the page itself. Tell me if you want the audit prefix flipped; it renames the
   Corrected label with it.
4. **Where "Times in Tallinn time." appears.** The list's periods are dates, not times, so only
   Recently deleted and the audit entry of a deletion carry the line.
5. **`Business customer drivers`** as the Driver cell of a company-level authorization, which has no
   named driver.
6. **`No parts`** as the Parts cell of a rental that has none, dim.
7. **The two combined driver block reasons** joined with "and" in one sentence, rather than two
   stacked reasons.
8. **Sort order.** The list sorts newest-created first and its columns are not sortable —
   the page is a cleanup queue, not a register.
9. **Show does not reset between tabs.** It is one filter over the whole page; the page number
   resets when the tab changes.
10. **Three shell extensions** rather than new components: `cell({del})`, `cell({subLinks})` and
    `cell({quiet})`, plus the `showActionCards` card variant. No new colour and no new component.
11. **Mock data.** Listed in `mock-data.json`.
12. **Seed version bump** to `rwrent-21`, so an existing prototype session picks up the new rows.
