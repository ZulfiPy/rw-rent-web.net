# Frontend Wiring — Follow-up 17, Insurance cases in the app

> Follow-up 17 (`Context/wiring_followups.md` §17): the app's half of Insurance cases, built from the
> approved prototype's handover (`Context/prototype/insurance/`) and wired to the backend's round 12
> (`RWRentApi-wiring/Context/round12_report.md` §5, the contract). Frontend only; the backend was only
> built in Release and run, never changed. On `feature/backend-wiring` in this worktree
> (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main` after verification.
> Written 2026-09-27. It replaces Follow-up 16's report, which git history keeps.
>
> **The owner's side was never touched.** This run never opened 5173, never signed in anywhere, never
> called 5001, never read or wrote `rwrent_v1` and never read Mailpit.
>
> - The owner's app on 5173 hot-reloads from this worktree, so it showed this run's code as it was
>   written. Every file was written whole, and every new module existed before anything imported it:
>   the routes were pointed at the new pages only once every page they import was in place. The
>   owner's API still answers round 11: its `GET /api/me` grants neither insurance permission, so the
>   owner's app now offers no Insurance cases entry, card or tile, and asks for nothing about insurance.
> - Every live check used a scratch stack built for this run: `rwrent_check`, dropped, recreated,
>   migrated and seeded by round 12's Release build, behind the API on 5002 (§4.1).
> - **For the owner's reviewer: §5 lists the steps that need the seed password typed into the app, on
>   5174 and 5002.**

## 1. Summary

- **Insurance cases replaces its placeholder (F17-1).** `/insurance-cases` and `/insurance-cases/:caseId`
  need `InsuranceCases.Read`; the entry carries the count of the cases waiting for us. The placeholder
  page, its sample rows and the driver page's "under development" panel are gone. Without the
  permission (a Record deleter alone, and every reader of an API before round 12, the owner's 5001
  among them) there is no entry, card or tile, and no insurance request is made.
- **The list (F17-2):** Open, Waiting for us and Closed with the server's counts; the search and the
  filters each view offers; each view's columns in the order the API gives; the phone cards; paging.
  The view, the search, the filters and the page live in the address.
- **A case's page (F17-3):** the title with its type, the status and six facts, the actions under the
  title only with `canChange`, and the panels in two columns from 1024 px: the timeline (the case
  itself first, then each event with its gap, changes, photos and Edit for its author), notes,
  insurance, photos by their entry, the other cases of the accident, description and record; the
  large photo view with the arrow keys; the not-found state.
- **The dialogs (F17-4 to F17-7):** Register case and Edit case as one dialog, with the driver filled in
  from the rental each time the car or the time changes; Casco case for this accident; Add event and
  Edit event; Add note and Edit note. Photos are made smaller in the browser before they are sent, and
  a file that cannot go is refused under its tile first. Every refusal lands where it belongs.
- **The Overview (F17-8):** the tile and the card "Insurance cases waiting for us", from the server.
- **Delete records (F17-9):** block reason 8 in the API's own words with each open case linked, the
  cases a vehicle takes along and a driver is cleared from, in the rows, the dialog and the answer.
  Beyond the specification, the security audit reads the copies round 12's deletions leave (§2.8).
- **Freshness (F17-10):** every write refreshes the case, the three views, the counts, the Overview
  and the deletions page's candidates; a deletion refreshes the insurance cases.

| | |
|---|---|
| Commits | seven `Wiring 43` commits and this report's `Wiring 44`, on `feature/backend-wiring` (§9) |
| Tests | 516 → **627**, all green: 111 new; 13 existing tests updated on purpose (§2.9) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the seven (§4.5) |
| Planted breakages | **24 planted, 24 caught** by the suite, one after its test was pinned (§4.4) |
| Joint check | **33/33** through the API on a freshly seeded database (§4.2) |
| In a browser | the real pages at 1512, 834 and 402 px, light and dark, from recorded answers; the app on 5174 signed out (§4.3) |

## 2. Implemented

### 2.1 The contract (`src/api`)

- **`dto.ts`** gains round 12's seven enums (`InsuranceCaseType`, `InsuranceCaseStatus`,
  `InsuranceCaseParty` with Nobody = 5, `InsurerSide`, `AtFaultParty`, `InsuranceCaseView`,
  `InsuranceCaseDriverSituation`), the answers (the case with its events, notes, photos, rental and
  links; the list item; the counts; the driver suggestion), the three queries and the five requests.
  On the deletions page: `RecordKind.InsuranceCase` (7), a `DeletableKind` type for the six kinds the
  page deletes, block reason 8, and the four new counts of `RecordDeletionTakes` and
  `RecordDeletionResponse`. Those four are optional in the app and read as 0 when absent: the owner's
  API still answers round 11, which does not send them (§6).
- **Photos as a form.** The transport takes a `FormData` body (`form`), sent as the browser encodes it,
  with the antiforgery header and no JSON content type (`http.ts`, `client.ts` `postForm`).
  `insuranceCases.ts` builds the two forms (`caseForm`): each field under its request member's name, a
  blank or missing one left out, each photo as a part named `photos`. A photo's picture is read by the
  browser from `GET /api/insurance-cases/{caseId}/photos/{photoId}` at the API's own address
  (`resourceUrl`, installed at start beside the transport).
- **The permissions** `InsuranceCases.Read` and `InsuranceCases.Manage` join the app's list.
- **The refusal codes** of the four writes (`codes.ts`, F17-7): the four checks of a time under the
  dialog's time, `handler_without_insurer` under Handled by, `vehicle_not_available`,
  `driver_not_available` and `accident_case_not_available` under theirs, the photo codes under the
  Photos section. Each also arrives with its field under `errors` (`HappenedAtUtc`, `Photos[2]`,
  `RemovePhotoIds[0]`), which the shared mapping puts under its input or tile; the table is there for
  a refusal that ever comes without it. The codes test's catalogue gains round 12's 18 codes.
- **The query keys:** one prefix, `insurance-cases`, for the case, the three views, the counts, the
  insurers, the accident choices and the driver suggestions.

### 2.2 The words and the photos (`src/format/insurance.ts`, `src/pages/insurance/photos.ts`)

- The copy deck's labels, and the sentences built from the server's answers: "Us · 2 days", "since
  20 Sep, 14:40 · 6 days" (no duration for Nobody), "Today", "Yesterday", "6 days ago", "2 days later",
  "At the same time", "Not decided yet", "Not reported", the place with "(where it was found)" or
  "(where it happened)", "Rental from 28 Aug to 11 Sep", the change chips, the photo sizes, and the hint
  under Driver for each of the five situations the server names. Durations round down; a last event's
  day is counted on the Tallinn calendar.
- The statuses' tones and shapes (`src/ui/status.ts`): Happened warn, Reported and Under review info,
  Repair ok, Closed mute; the type's badge a square for Usual and a cut corner for Casco.
- **Photos made smaller in the browser (F17-6)**, with the browser's own decoder and canvas: a picture
  over 2560 px on its longer side, or over 3 MB, is redrawn at most 2560 px as JPEG at 0.85 and keeps
  its name with a .jpg ending; a smaller JPEG, PNG or WebP goes as it is. A file that is not a picture
  is refused before it is decoded ("This file is not a photo. Only photos can be added: JPEG, PNG or
  WebP."); a picture this browser cannot open is refused in words that say so ("This browser cannot
  open this photo. Save it as JPEG, PNG or WebP and add it again."). The picture is decoded the right
  way up, so a redrawn phone photo does not lie on its side.

### 2.3 F17-1: routes, the entry, the placeholder (`src/app`, `src/pages/simple`, `src/pages/fleet`)

- `routes.tsx`: the two routes with `InsuranceCases.Read`, and the entry's count `insurance`;
  `AppShell.tsx` reads it from the counts (`useCaseCounts`, asked only with the permission), in the
  expanded sidebar and the phone's drawer.
- `pages/simple/Placeholders.tsx` and `pages/overview/sample.ts` are removed; the driver's page loses
  its "Insurance cases" panel. `SimpleQueue` stays for Needs attention.

### 2.4 F17-2: the list (`src/pages/insurance/InsuranceCases.tsx`, `caseAddress.ts`)

- Built with the app's list vocabulary, as Tasks was: `PageHeader` with Register case for a holder of
  `InsuranceCases.Manage`; the compact tab strip with the counts (as wide as the list on the phone);
  the search (50 characters, the API's limit) and the filters: Type on every view, Status (the four
  open statuses) on Open and Waiting for us, Waiting for on Open only. A filter set on one view stays
  in the address and is not sent where the view does not offer it (handover d); Clear filters shows
  while the search or a shown filter is set.
- Columns: Case (the title, "Usual · Happened 05 Sep", and in the folded band the handler under it),
  Status, Waiting for with how long (Us in the warn tone), Handled by with the claim number, Last
  event with its day; on Closed, At fault and Closed instead. The API's order. Widths from 1024 up as
  handover e gives them (132, 170, 150, 130, the text columns sharing the rest, at least 920); in the
  folded band at 71%, except Status at 120 px (§7). The phone card is the other lists' card.
- The empty views in the copy deck's words (Register case on an empty Open for a manager), the shared
  no-results state, paging, and "Not available to you" without the permission.

### 2.5 F17-3: a case's page (`CaseRecord.tsx`, `PhotoView.tsx`)

- The header: the breadcrumb back to the view it came from, "{plate} · {what is damaged}", the type as
  its badge, and with `canChange` Add event, Add note, Edit case and, on a usual case whose accident
  has no casco case yet, Casco case for this accident, on a row under the title at every width (the
  shell's header gains `actionsBelow`).
- The hero: the status chip, then Waiting for (since when and for how long), Happened or Found (with
  the place), Driver (a link with `Drivers.Read`, or "Not known"), Rental (the customer as a link to the
  rental with `RentalAssignments.Read`, "Rental from … to …", or "Not rented then"), Handled by and At
  fault. While the case loads, each reads "—".
- The panels, two columns from 1024 px (1.7 : 1, the right one at least 300 px) and one below, in
  handover e's orders: Timeline, Notes, Insurance, Photos, Same accident, Description, Record. The
  timeline's rail, dots (the case's solid, a status change in its status's tone, the rest hollow) and
  line; Edit only where the API says `canCorrect`. The Photos panel groups every photo by its entry.
- The large photo view: the entry and its date, the file name, who added it, the size, "n of m";
  ‹ › and the arrow keys through every photo in timeline order; Esc, × or a click outside close it and
  focus returns to the thumbnail; full-bleed below 640. A picture that cannot load, in a thumbnail or
  the view, shows a quiet placeholder (the view names the file).
- `404 insurance_cases.not_found`: "That case is not available" with the API's sentence, no retry.

### 2.6 F17-4 to F17-7: the dialogs (`CaseDialogs.tsx`)

- **Register case / Edit case**, one dialog (720 px), handover f's sections: The damage; When and where
  with the two ticks (the labels then read Found and Where it was found); Driver; Insurance with the
  insurer names suggested (`datalist`) and Handled by offering only the insurers filled in (clearing
  that side's insurer resets it); Where it stands and Photos on Register; Decision on Edit; Same
  accident from the accident choices (`ForCaseId` on Edit). The active cars and drivers are offered; on
  Edit an inactive car or driver already on the case stays offered. An untouched time goes back
  exactly as stored. After Register the new case's page opens.
- **The driver from the rental:** each time the car or the time changes, the suggestion is asked for
  and fills the driver in (OneDriver) or leaves it empty (the others); the drivers on the rental then
  come first, marked "· on the rental then", with "Choose who drove" for several; handover f's hint
  names the rental. Opening Edit keeps the stored driver. Any active driver can still be chosen, or
  none.
- **Casco case for this accident** opens Register case filled in as handover d says, with "Filled in
  from … , as its casco case."
- **Add event** (640 px): now to the minute, the title, the description, photos, Status now and Waiting
  for now preset to the case's values with the note; it sends the case's token. **Edit event**: its
  time, title and description, its photos each with Remove (a removed one stays dimmed with Keep until
  saved, §6), what it changed read-only, and the footnote. **Add note / Edit note** (560 px) with their
  footnotes.
- **Photos (F17-6):** Add photos opens the device's picker for several at once; each photo is a tile
  with its preview, name, size and Remove; at most 20 in one dialog (more chosen: the rest are left
  out with a line that says so). The dialog cannot be sent while a photo is being made ready or a file
  is refused, and says why on the button.
- **Refusals (F17-7):** a field's under the field; a photo's under the tile its `Photos[i]` names; a
  removed photo's under the tile its `RemovePhotoIds[i]` names; `not_your_event` and `not_your_note`
  as the dialog's "Not permitted" banner in the API's words; a case, event or note gone as a refused
  change; the concurrency conflict as the stale banner with Refresh; a 413 as a refused change: "The
  photos are too large to send together. Add fewer at a time."

### 2.7 F17-8: the Overview (`src/pages/overview/Overview.tsx`)

- The tile "Insurance cases waiting for us" with the count and "cases", opening Waiting for us; the
  card of the same name in the second column, the first page of that view in its order: each row
  "{plate} · {damage}", its last event or "No events yet", "Waiting for us · 2 days", opening its case
  with Waiting for us behind its breadcrumb; the empty state "Nothing is waiting for you". Both only
  with `InsuranceCases.Read`. The sample tile and card are gone.

### 2.8 F17-9: Delete records, and the audit's copies (`src/format/recordDeletion.ts`, `src/pages/admin`, `src/format/auditPayload.ts`, `src/pages/audit/AuditEntry.tsx`)

- Block reason 8 in the API's own words, singular and plural ("One of its insurance cases is open.
  Close it first; then the vehicle can be deleted with its cases" / "2 of its insurance cases are
  open. Close them first; …"), with each blocking record of kind 7 linking to its case. A kind 7 is
  never offered: the six tabs stay.
- The counts: "Takes … and 1 insurance case with it", "Clears the driver of 2 insurance cases"; the
  dialog's "Its 1 insurance case, with its events, notes and photos, is removed with it." and "The
  driver is cleared from 1 insurance case; the case stays."; the answer's "1 insurance case went with
  it." and "The driver of 1 insurance case was cleared." A vehicle's or a driver's deletion refreshes
  the insurance cases.
- **Beyond the specification:** round 12 always writes `InsuranceCases` and `ClearedAccidentLinks` into
  a vehicle's deletion copy, and `ClearedInsuranceCaseDrivers` into a driver's, even empty. The audit
  entry's reader treated any unknown list as a shape it does not know and fell back to the raw payload,
  so every vehicle or driver deleted on round 12 would have lost its "Deleted record" view. The reader
  now knows the three lists: the entry shows the deleted cases (each with its facts, photos, events and
  notes, never a picture), the cases of other cars that lost their accident's link, and the cases a
  deleted driver was cleared from.

### 2.9 Tests

**111 new tests, 13 existing ones updated on purpose** (516 → 627, 49 → 57 files). None was deleted,
skipped or weakened.

**The tests updated on purpose:**

| Test | Before | Now |
|---|---|---|
| `app/routes.test.ts` · the personas `VIEWER` and `FLEET_MANAGER` | round 10's permissions | also `InsuranceCases.Read` (Viewer, and so the two above) and `InsuranceCases.Manage` (Fleet Manager, and so the Principal), as round 12's `/api/me` gives them |
| `app/routes.test.ts` · "the pages open to every signed-in persona need nothing" | `/overview`, `/needs-attention`, `/insurance-cases`, `/profile` | `/overview`, `/needs-attention`, `/profile` |
| `app/routes.test.ts` · "a Record deleter with no other role reaches the ungated pages and Delete records" | reachable: the four above with `/insurance-cases` and `/delete-records` | without `/insurance-cases` |
| `app/routes.test.ts` · "an account with no permission at all reaches only the ungated pages" | with `/insurance-cases` | without it |
| `app/routes.test.ts` · "the navigation offers Tasks with its count only to a holder" | `offered([])` contains `/insurance-cases` | does not |
| `pages/followup12.render.test.ts` · "without Tasks.Use there is no entry…; Insurance cases stays" (renamed "…; Insurance cases needs its own permission") | round 10's administrator is offered Insurance cases | is not (no `InsuranceCases.Read` in round 10's answer) |
| `pages/followup12.render.test.ts` · "the tile reads the to-do count…" | the sample card "Unresolved insurance cases" and its chip are there | neither is, nor the new card (round 10's Dita holds no insurance permission) |
| `pages/followup12.render.test.ts` · "without Tasks.Use neither the tile nor the card shows…" | the sample card is there | it is not |
| `pages/followup10.render.test.ts` · "sees the Overview's restricted states…" (a Record deleter) | the sample card is there | neither the sample card nor the new one |
| `pages/followup16.render.test.ts` · "only Tasks draws the compact strip…" (renamed "only Tasks and Insurance cases draw…") | four pages draw the strip, only Tasks compact | five, Tasks and Insurance cases compact; the other three unchanged |
| `api/recordDeletions.test.ts` · "a cascade makes stale…" | loops over `Object.values(RecordKind)` (1–6) | over the kinds the page deletes, the same six, since `RecordKind` gains 7 |
| `format/recordDeletion.test.ts` · "every kind ends with the audit line…" | the same loop | the same six kinds |
| `api/codes.test.ts` · the backend's catalogue `BACKEND_CODES` | ten resources | and round 12's 18 `insurance_cases` codes |

**The new tests:**

| File | Tests | What they hold |
|---|---|---|
| `api/insuranceCases.test.ts` | 3 | the form of a write with photos (names, blanks left out, Nobody as 5, the parts named `photos`); where a picture is read |
| `api/http.test.ts` | +1 | a form body goes as the browser encodes it, with the antiforgery header and no JSON content type |
| `api/codes.test.ts` | +16 | each insurance refusal on each write lands on its input; who may correct an entry and the stale conflict name no input |
| `app/routes.test.ts` | +3 | the two routes need `InsuranceCases.Read` by any spelling; who opens them; the entry with its count only for a holder |
| `format/insurance.test.ts` | 10 | durations, "since", the Tallinn day of a last event, the gaps, the case's words, the place's marks, Handled by, the chips, sizes, the five driver hints |
| `pages/insurance/photos.test.ts` | 9 | which pictures are redrawn and at what size, the .jpg name, a file that is not a picture, one the browser cannot open, a small JPEG as it is, a large one redrawn at 2560 as JPEG 0.85 |
| `pages/followup17.render.test.ts` | 27 | the list's three views, filters, hidden filters, search, empty states, paging, the Viewer, no permission; a case's header, hero, timeline, photos, notes, insurance, description, record, the Viewer, a found case, the two cases of one accident, a closed case, loading, not found; the photo view; the navigation's count; the refresh; the Overview's tile and card; the driver's page |
| `pages/followup17.dialogs.render.test.ts` | 21 | Register case and its driver in each situation, the ticks, Handled by, what it sends and its refusals; Edit case, what it sends, its refusals; Casco case for this accident; the photo tiles, a refused file, the API's refusal under its tile, twenty at most, 413; Add event and Edit event with what they send and their refusals; the notes |
| `pages/followup17.phone.render.test.ts` | 4 | the phone cards of Open and Closed, a case's panels in one column, the drawer's count |
| `pages/followup17.deletions.render.test.ts` | 11 | block reason 8 with its cases linked, the counts, the Ready vehicle, the refused deletion in the API's words, the six tabs, the drivers' rows, the dialogs, the confirmation (and an older answer as before), the refresh, the audit entries of a vehicle and a driver |
| `pages/followup17.stylesheet.test.ts` | 6 | the list's widths from 1024 up and in the folded band, the case page's columns, the timeline, the thumbnails, the photo view and the dialogs at each size |

The fixtures are the scratch API's own answers, typed as the DTOs, so the typecheck is a contract
check: `followup17.support.ts` (the seeded people's views, the seven cases, the dialogs' lists and
suggestions, the refusals, the deletions page) and `followup17.practice.ts` (the joint check's writes,
the practice car and driver, their deletions and audit entries).

## 3. Not implemented or partial

Everything §17 asks for is built. The one part of the joint check this run cannot do itself is typing
the seed password into the app; those steps are in §5 for the reviewer.

## 4. Verification

### 4.1 The scratch stack

- At the start the reviewer's API ran on 5002 (pid 40002) over a `rwrent_check` holding the reviewer's
  probe records. Its connection string was read from its environment and named `rwrent_check`; it was
  stopped with round 12's scratch script, which stops only a process started from the backend
  worktree's `bin/Release`. `rwrent_check` was dropped, recreated, migrated (eight migrations,
  `V10InsuranceCases` last) and seeded by round 12's Release build (7 insurance cases, 19 events, 5
  notes, 12 photos), and the API started on 5002 with `ApiSecurity__RecordDeleterEmailDomain=rwrent.example`
  and `ApiSecurity__FrontendOrigin=http://localhost:5174`. Every command sourced an environment that
  refuses any connection string not naming `rwrent_check`.
- The first attempt at the joint check wrote its practice records up to the deletions page and then
  stopped: its script looked the practice driver up on the deletions page by licence number, which that
  search does not find (§8). The stack was recreated and seeded again in the same way, and the joint
  check ran whole on it (§4.2).
- Vite on 5174 (`VITE_API_BASE_URL=http://localhost:5002`, from this worktree), started from a launch
  entry outside both repositories.

### 4.2 Through the API — 33/33

A script as the seeded people, against 5002 only, sending exactly what the dialogs send (the forms of
Register case and Add event under the request members' names with the files `photos`; the JSON of the
other writes):

| Checks | What was proved |
|---|---|
| 1 | the counts before: Open 5, Waiting for us 2, Closed 2 |
| 2–5 | Dita: the driver suggestion for 770 HDV names one driver; Register case with two PNGs answers 201 with that driver, the rental and both photos; Waiting for us counts it at once (3); the picture reads back byte for byte as `image/png` with `private` caching |
| 6–8 | Add event with a photo: Reported, waiting for the insurer, its photo kept; the count back to 2 at once; the old token refused as the stale conflict (409) |
| 9 | Edit case: the claim number, Handled by ours, At fault the other party; the untouched time exactly as stored; the status unchanged |
| 10–12 | Edit event: the title corrected and its photo removed; that picture then `photo_not_found`; Signe refused on Dita's event (403 `not_your_event`) |
| 13–16 | Add note (the token stays); Signe refused on Dita's note (`not_your_note`); Toms refused a note (403); Toms reads the case with no right to change or correct anything |
| 17–18 | Casco case for this accident from 552 KLM: a Casco case of the same car naming 552 KLM; 552 KLM then lists it, so the app offers no second one |
| 19–32 | Karlis: a practice car with a case, and a case of 444 WKS naming it as its accident's with a practice driver; the car Blocked with reason 8 naming the case (kind 7); its deletion refused (409 `record_deletions.blocked`); an event closes the case; the car Ready taking one case; the administrator deletes it; the entry keeps the case's copy and names the other car's case that lost its link, with no picture; the case answers 404; the other car's case stays without its link; the driver's deletion would clear one case; deleted, it clears it; the driver's entry names that case; the case stays without a driver |
| 33 | a body declared over 100 MB refused with 413 before any of it is sent |

### 4.3 In a browser

**The real pages**, the app's own code from this worktree, served on 5175 from a folder outside both
repositories with a stand-in transport that answers from the recorded answers of §2.9 and sends no
request anywhere (a small middleware draws a picture for each photo address). Each width loaded fresh;
the built-in browser pane, never the owner's browser.

| Width | The list | A case's page | The dialogs and the photo view |
|---|---|---|---|
| 1512 | the strip 387 px with its counts; Status 132 and Waiting for 170 px, the three text columns sharing the rest (334, 148, 427); no sideways scroll; the entry's count 2 | the title with its badge, the four actions under it; the hero on one row; the columns 749 and 441 px (1.7 : 1); the timeline's dots 9 px, 17 px from each entry's top, the line from the first dot to the last; the thumbnails 76 × 57 with their pictures | — |
| 834 | the folded table 800 px, nothing scrolls; Handled by under the case; **every status chip whole** (the handover's 94 px cut them, §7) | the chip on its own row, the facts under it, wrapping; one column of panels | — |
| 402 | the cards in the handover's shape; the strip 360 of 360 px, each tab on one line, no icons | one column | Register case as the bottom sheet, full width, radius 18, the footer's buttons full width; the car chosen fills the driver from the rental (482 TKL: "Choose who drove" with the two drivers first; 770 HDV: Ilze Berzina chosen, with her hint); three files given to the picker: a 4000 × 3000 picture redrawn at 2560 × 1920, a small PNG as it was, a text file refused under its tile with Register case held and saying why; the photo view full-bleed, the arrow keys to "3 of 6", Esc closing it and focus back on the thumbnail, a picture that cannot load shown as the placeholder with its name |

- **Dark:** the list and a case's page read the same in the dark theme.
- **The Overview** at 1512: the tile (2, opening Waiting for us) and the card in the second column.
- **Delete records** as the administrator: 204 JLM Blocked with both sentences, its rental and its case
  each linked.
- **Two things the browser found, now fixed and tested:** the folded Status column cut its chips; a
  case's hero read "Not known", "Not rented then" and "Not decided yet" while the case was still
  loading (it reads "—" now).
- **Console:** no error from the app. The harness's very first load, while Vite was still preparing its
  modules, reloaded itself once and left one page waiting; every load after it was immediate.

**The app on 5174**, signed out, in the browser pane: `/insurance-cases?tab=us` went to Sign in; its
only API request went to 5002 (`/api/me`), none to 5001.

### 4.4 The planted breakages — 24 planted, 24 caught

Each one changed one rule in a copy of the app outside the worktree (the owner's app hot-reloads the
worktree), ran the whole suite there (627 tests), and wrote the file back fresh.

| # | The breakage | Caught by |
|---|---|---|
| B1 | Insurance cases is open to everyone again | yes: a Record deleter with no other role reaches the ungated pages and Delete records, nothing else (Follow-up 10); an account with no permission at all reaches only the ungated pages; the four roles that hold it open In… |
| B2 | the navigation's count reads the open cases, not those waiting for us | yes: the drawer’s entry carries the cases waiting for us; the entry carries the cases waiting for us |
| B3 | Closed offers the Status filter | yes: Closed: At fault and Closed instead, most recently closed first, and no Status or Waiting for filter; a filter the view does not offer stays in the address but is not asked for (handover d) |
| B4 | a filter the view does not offer is sent anyway | yes: a filter the view does not offer stays in the address but is not asked for (handover d) |
| B5 | Casco case for this accident is offered on a casco case | yes: the two cases of one accident: each lists the other; only the usual one without its casco offers one |
| B6 | Edit shows on every event, whoever added it | yes: the timeline, oldest first: the case itself, then each event with its gap, changes, photos and Edit for its au |
| B7 | durations round instead of rounding down | yes: Open: the API’s rows in its order, each with its type and time, status, waiting, handler and last event; minutes under an hour, at least one; hours under a day; then whole days; the hero: the status, then who it… |
| B8 | the place's two marks are swapped | yes: its place, marked when only one of the time and the place is the finding’s |
| B9 | a side chosen without its insurer reads as handled | yes: who handles it: the chosen side’s insurer, not decided yet, not reported |
| B10 | Add event sends no concurrency token | yes: what Add event sends: the statuses as chosen and the case’s token |
| B11 | Edit case sends the untouched time rounded to the minute | yes: what Edit case sends: no status, the time the person did not touch exactly as stored, the case’s token |
| B12 | a photo up to 30 MB goes as it is | yes: a smaller JPEG, PNG or WebP goes as it is; over 3 MB it is redrawn at its own size when its sides are within 2560 (after the test was pinned) |
| B13 | a GIF goes as it is | yes: another kind of picture the browser opens (a GIF, a HEIC it reads) is redrawn as JPEG |
| B14 | a photo not in the event lands nowhere without its index | yes: insurance_cases.photo_not_in_event on case-event-edit lands on removePhotoIds |
| B15 | block reason 8's plural keeps the singular | yes: 482 TKL: two open cases, counted and each linked |
| B16 | a blocking case is not linked | yes: 482 TKL: two open cases, counted and each linked; 552 KLM: its running rental and its open case, each sentence in the API’s words, each record linked |
| B17 | the audit does not know the case lists, and falls back | yes: a driver’s entry names the case whose driver was cleared; a vehicle’s entry: the case that went, with its photo, its event, and the other car’s case that lost its link  |
| B18 | the Overview's tile opens Open, not Waiting for us | yes: the tile reads the count and opens Waiting for us; the card lists that view’s cases, each opening its case |
| B19 | a case's write does not refresh the deletions page | yes: one prefix holds the case, the views, the counts and the dialogs’ lists; the deletions page follows |
| B20 | while loading, the hero says Not known | yes: while the case loads, the hero says nothing it does not know yet |
| B21 | the folded Status column is the handover's 94px again | yes: the folded band: fixed layout, the widths at 71% but Status’s, which keeps its widest chip whole |
| B22 | a driver's deletion does not say it clears their cases | yes: a driver’s dialog: the driver is cleared from their case, which stays |
| B23 | the Photos panel counts only the registration's photos | yes: the photos by their entry, the notes newest first, the insurance, the description and the record |
| B24 | the photo view puts the events' photos first | yes: every photo of the case in timeline order, the first with no ‹ and the last with no › |

**B12** was not caught on the first run: the photo test read the 3 MB limit from the rule's own
constant, so the raised limit moved the test with it (round 12's M14, in the app). The test now writes
3 MB out itself and checks the constant against it; run again, B12 was caught by two tests.

### 4.5 The test suite, and each commit

- **The final state:** `npm run typecheck` clean; `npm test` **627 passed in 57 files**; `npm run build`
  built, with the chunk-size warning the build has had since before this run.
- **Before the run** (`c49f086`): typecheck clean, 516 passed in 49 files, the build as above.
- **Each commit alone**, exported with `git archive` (nothing untracked along), with the worktree's
  `node_modules`: every one 0 type errors and the whole suite green: 536 (`93d6d67`), 555 (`f2a1a15`),
  576 (`afd7616`), 605 (`43b1aa4`), 609 (`7861c2e`), 620 (`b7d0010`), 627 (`9d07090`).

### 4.6 The owner's side, untouched

- The owner's API ran throughout on its own process (pid 7505 on 5001, from the backend worktree's
  `bin/Debug`, started 2026-09-25 07:41) and the owner's app on its own (pid 24831 on 5173, from this
  worktree, started 2026-09-16). This run sent no request to either, never opened 5173 in any browser,
  never addressed `rwrent_v1` and never read Mailpit. It read who listens on each port with `lsof`.
- The backend worktree is unchanged (clean at `4aa5474`); it was only built in Release and run. The
  main checkouts were not touched.

### 4.7 End state

- **The scratch API is left running on 5002** (pid 50047, from the backend worktree's `bin/Release`, over
  `rwrent_check`) for the reviewer, with the seed and the joint check's records (§5.0).
- This run's Vite on 5174 and its harness on 5175 are stopped; nothing listens on either.

## 5. For the owner's reviewer: the steps with the seed password

### 5.0 Before and after

- **The stack as this run leaves it:** the API on 5002 over `rwrent_check` (§4.7), holding the seed's
  seven cases and the joint check's records: "770 HDV · Practice: the right mirror scratched" (Dita's,
  Reported, waiting for the insurer, one note), a Casco case of 552 KLM's accident (Happened, waiting
  for us), and "444 WKS · Practice: the other car of the same accident" (Karlis's, waiting for us, its
  driver and its accident's link cleared by the joint check's deletions). **The counts: Open 8,
  Waiting for us 4, Closed 2.** This run's Vite on 5174 is stopped; start one from this worktree:
  `VITE_API_BASE_URL=http://localhost:5002 npm run dev -- --port 5174 --strictPort`.
- **In a browser profile of its own**, never the owner's: 5174 and 5173 share `localhost`'s cookies,
  and signing in on 5174 in the owner's profile signs the owner out of 5173.
- The seeded people: Dita Smite and Karlis Zvaigzne (Fleet Managers), Signe Priede (Company Principal),
  Toms Rudzitis (Viewer), Arturs Veidenbaums (System Administrator), all with the seed password.

### 5.1 At 1512 px

1. **Sign in as Dita.** The sidebar's Insurance cases carries **4**. The Overview's tile "Insurance cases
   waiting for us" reads 4 and opens Waiting for us; the card in the second column lists the four cases
   with "Waiting for us · …", each opening its case with "Insurance cases" (Waiting for us) behind the
   breadcrumb.
2. **Insurance cases:** Open 8, Waiting for us 4, Closed 2; Register case in the header; the columns
   Case, Status, Waiting for, Handled by, Last event; "Us · …" in the warn tone. Type Casco narrows the
   list; the search "Meridian" finds 552 KLM; Closed shows At fault and Closed, and offers neither Status
   nor Waiting for. Set Status on Open, switch to Closed and back: the filter comes back on Open.
3. **552 KLM:** the title with Usual beside it, Add event, Add note and Edit case under it (no "Casco
   case for this accident": the joint check registered its casco case, which the Same accident panel
   lists). The six facts; the timeline oldest first with its gaps and chips; **the pictures load in the
   thumbnails** (the seed's PNGs, read with the session's cookie). Open a thumbnail: the photo view,
   ‹ › and the arrow keys through the six photos, Esc closes it.
4. **Register case:** choose 482 TKL and set Happened four days back: the driver reads "Choose who
   drove" with Janis Krumins and Kristine Vitola first, marked. Choose 770 HDV and set the time to now:
   Ilze Berzina is filled in, with "From the rental of 770 HDV for Ilze Berzina". Fill What is damaged
   and Place, add two photos, one of them a large phone photo: its tile shows it, and it is sent at
   most 2560 px wide. Register case: the new case's page opens with the photos on its first entry, and
   Waiting for us counts it.
5. **On that case, Add event** with Status now Reported and Waiting for now The insurer: the timeline
   gains the entry with both chips, the hero reads Reported and The insurer, and the sidebar's count
   drops by one at once.
6. **Refusals:** Register case with nothing filled in: four messages under Car, What is damaged,
   Happened and Place. Add event with When before the case: "An event cannot be before the case
   happened." under When. Add a text file renamed `.jpg`: refused under its tile before anything is sent.
7. **Edit event** on your own event with a photo: Remove leaves the tile dimmed with Keep; Save changes:
   the photo is gone from the timeline and the Photos panel.
8. **Sign in as Signe:** on 552 KLM, Edit shows only on "Meridian asked for a repair calculation" and on
   the note "Under warranty until 2027…".
9. **Sign in as Toms:** no Register case, no actions on a case, no Edit anywhere; everything reads, the
   driver and the rental are links.
10. **Sign in as Arturs:** the Insurance cases entry with its count; Delete records → Vehicles: 552 KLM
    Blocked with "A running rental refers to this vehicle. End it first. One of its insurance cases is
    open. Close it first; then the vehicle can be deleted with its cases", the rental and the case each a
    link; Drivers: Kristine Vitola's row "Clears the driver of 2 insurance cases". In the security audit,
    the entry of the joint check's "Vehicle deleted" shows **Deleted insurance cases** and **Cleared
    accident links**.
11. **Dark theme:** the list and a case read the same.
12. **Optional, two profiles:** open one case in both as Dita; add an event in one; then Add event in the
    other: the stale banner with Refresh, which reloads the dialog.

### 5.2 At 834 px

1. The list folds: Handled by under the case, **every status chip whole** (Under review included),
   nothing scrolls sideways.
2. A case: the chip on its own row and the facts under it; the panels in one column in the order
   Timeline, Notes, Insurance, Same accident, Photos, Description, Record.
3. Register case: every field on its own row (paired fields stack below 1024).
4. The drawer (menu button) shows Insurance cases with its count.

### 5.3 At 402 px (or a phone)

1. The list is cards: the title and its line, the status chip top right, Waiting for and Handled by in
   two columns, Last event across; Closed's cards with At fault, Closed and Handled by. The strip spans
   the list with each label on one line.
2. Register case opens as the bottom sheet; Add photos opens the phone's own picker, and on an iPhone a
   HEIC photo is sent as JPEG where Safari can open it.
3. The photo view is full-bleed with 44 px buttons.

## 6. Decisions

Choices this run made where the specification left room, each small to change:

1. **The deletion counts are optional** in `dto.ts` and read as 0 when absent, because the owner's API
   answers round 11 until its upgrade. Every older answer reads exactly as before.
2. **A picture of another kind** that the browser opens (a GIF, a BMP, a HEIC on a browser that reads
   it) is redrawn as JPEG at its own size, since the API keeps JPEG, PNG and WebP only.
3. **A photo removed in Edit event stays on its tile**, dimmed with "Removed" and a Keep button, until
   Save changes, so the API's refusal of that photo lands under it and the person sees what goes.
4. **A dialog's tiles show the photo itself**, not a drawn placeholder as the prototype had to.
5. **More than 20 chosen at once:** the first up to 20 are kept and a line says "At most 20 photos can
   be added at once. Add the rest with an event."
6. **Not your event, not your note:** the API answers 403, which the app shows as its "Not permitted"
   banner with the API's sentence. A case, event or note gone (404) shows as a refused change.
7. **The Overview's card** reads the first page of Waiting for us, the very answer the list's view
   opens on, so the two share it.
8. **A blocking case links to its case** whoever reads the deletions page, as its running rentals
   always have; a Record deleter alone lands on "Not available to you" there.
9. **The case page's one or two columns** are chosen at 1024 px by the viewport hook, as the
   prototype does, so the panels keep handover e's two orders.

## 7. Deviations

1. **The folded Status column is 120 px, not 94.** The handover scaled 132 × 0.71 by rule and its
   author could not render at 834; at 94 px (9 px of cell padding each side) every chip but Repair
   was cut. "Under review" is 101 px. The table's floor moves from 653 to 679 px, and nothing scrolls
   at 768.
2. **The search takes 50 characters**, the API's limit, where the prototype allowed 100.
3. **No toasts**, as the app has none: the change itself is what the person sees (the new case's page,
   the timeline's new entry, the count).

## 8. Open risks and observations

1. **Until the owner's upgrade** (a copy of `rwrent_v1`, `V10InsuranceCases`, the round-12 Debug
   build), the owner's app offers no Insurance cases at all: no entry, card or tile.
2. **A photo's picture is read with the session's cookie** like every other request. This run could
   not load one signed in (it cannot type the password); the pictures in the browser check came from
   the harness. §5.1 step 3 is where the reviewer sees them load from the API; a browser that refused
   the cookie on an image would show the quiet placeholders.
3. **Observed, not changed (it predates this run):** the Delete records page's Drivers search says
   "Name, licence number or email", but neither that search nor the Drivers list finds a driver by
   licence number; both find one by name and email.
4. **The photos are made smaller on the device**, which on an old phone may take a second or two per
   large photo; the tile shows it is being made ready and the dialog cannot be sent until it is.

## 9. Commits

On `feature/backend-wiring`, after `c49f086`, in this order:

1. **`93d6d67`** Wiring 43: The app learns round 12's contract: the requests, answers and permissions of insurance cases, photos sent as a form, their refusal codes, and the deletions page's new kind and counts in its types.
   20 files (under `src/`): `api/client.ts`; `api/codes.test.ts`; `api/codes.ts`; `api/dto.ts`; `api/http.test.ts`; `api/http.ts`; `api/index.ts`; added `api/insuranceCases.test.ts`; added `api/insuranceCases.ts`; `api/queryKeys.ts`; `api/recordDeletions.test.ts`; `api/recordDeletions.ts`; `api/transport.ts`; `app/bootstrap.ts`; `format/labels.ts`; `format/recordDeletion.test.ts`; `format/recordDeletion.ts`; `pages/admin/DeleteRecordDialog.tsx`; `pages/admin/DeleteRecords.tsx`; `permissions/permissions.ts`.

2. **`f2a1a15`** Wiring 43: The words of insurance cases from the prototype's copy deck, the tones of their statuses, and the photos made smaller in the browser before they are sent.
   6 files (under `src/`): `format/index.ts`; added `format/insurance.test.ts`; added `format/insurance.ts`; added `pages/insurance/photos.test.ts`; added `pages/insurance/photos.ts`; `ui/status.ts`.

3. **`afd7616`** Wiring 43: Register case, Edit case, Casco case for this accident, Add and Edit event, Add and Edit note, with the driver filled in from the rental, the photos as tiles, and each refusal where it belongs.
   5 files (under `src/`): added `pages/followup17.dialogs.render.test.ts`; added `pages/followup17.support.ts`; added `pages/insurance/CaseDialogs.module.css`; added `pages/insurance/CaseDialogs.tsx`; added `pages/insurance/caseAddress.ts`.

4. **`43b1aa4`** Wiring 43: The Insurance cases section replaces the placeholder: the list with Open, Waiting for us and Closed, a case's page with its timeline, notes, insurance and photos, the large photo view, and the count on its entry.
   20 files (under `src/`): `app/AppShell.module.css`; `app/AppShell.tsx`; `app/pageHeader.tsx`; `app/routes.test.ts`; `app/routes.tsx`; `pages/followup12.render.test.ts`; `pages/followup16.render.test.ts`; added `pages/followup17.phone.render.test.ts`; added `pages/followup17.render.test.ts`; added `pages/insurance/CaseRecord.module.css`; added `pages/insurance/CaseRecord.tsx`; added `pages/insurance/InsuranceCases.module.css`; added `pages/insurance/InsuranceCases.tsx`; added `pages/insurance/PhotoView.module.css`; added `pages/insurance/PhotoView.tsx`; removed `pages/simple/Placeholders.tsx`; `pages/simple/SimpleQueue.tsx`; `ui/FactGrid.module.css`; `ui/FactGrid.tsx`; `ui/RecordHeader.tsx`.

5. **`7861c2e`** Wiring 43: The Overview's tile and card show the insurance cases waiting for us instead of the sample ones, and the driver's page loses its placeholder panel.
   7 files (under `src/`): `pages/fleet/DriverRecord.tsx`; `pages/followup10.render.test.ts`; `pages/followup12.render.test.ts`; `pages/followup17.render.test.ts`; `pages/overview/Overview.module.css`; `pages/overview/Overview.tsx`; removed `pages/overview/sample.ts`.

6. **`b7d0010`** Wiring 43: The Delete records page learns round 12: a vehicle with an open insurance case is blocked with its cases linked, a deletion counts the cases it takes or clears, and the audit reads their copies.
   7 files (under `src/`): `format/auditPayload.ts`; `format/recordDeletion.ts`; `pages/admin/DeleteRecordDialog.tsx`; `pages/admin/DeleteRecords.tsx`; `pages/audit/AuditEntry.tsx`; added `pages/followup17.deletions.render.test.ts`; added `pages/followup17.practice.ts`.

7. **`9d07090`** Wiring 43: What the browser check and the planted breakages found: the folded list's Status column keeps its widest chip whole, a case's hero says nothing it does not know while the case loads, and the photo test names its 3 MB limit itself.
   5 files (under `src/`): `pages/followup17.render.test.ts`; added `pages/followup17.stylesheet.test.ts`; `pages/insurance/CaseRecord.tsx`; `pages/insurance/InsuranceCases.module.css`; `pages/insurance/photos.test.ts`.

8. **This report's commit**, `Wiring 44`: `Context/wiring_report.md`, rewritten.

