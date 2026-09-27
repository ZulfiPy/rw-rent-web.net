# RW-Rent · Insurance cases — handover

Source of truth: `RW-Rent.dc.html` (approved). Open it directly in a browser; `support.js` must sit beside it.
Line numbers below refer to that file (6 200 lines). Build the section inside today's app from the prototype; nothing outside this feature needs to be taken.

The prototype stores its mock data in the browser under `rwrent.db`, now with version `rwrent-23` (was `rwrent-22`). Opening this copy the first time resets older saved mock data. To start over at any time, clear `rwrent.db` in the browser's storage.

---

## a. How to see it

The **PROTOTYPE** tab on the right edge opens the review controls. **Signed-in role** switches the persona and returns to Overview. **Next action fails as** applies to the next dialog you submit, then resets. The theme switch is in the sidebar footer.

| Role in the panel | Person | What they can do in the section |
|---|---|---|
| Company Principal | Signe Priede | everything; her own entries: the event "Meridian asked for a repair calculation" and the note "Under warranty until 2027…" on 552 KLM |
| Fleet Manager | Dita Smite | everything; every other seeded event and note is hers |
| Viewer | Toms Rudzitis | reads everything; no Register case, no case actions, no Edit, no Add note |
| System Administrator | Arturs Veidenbaums | everything, as on Vehicles; owns no seeded entry, so no Edit shows until he adds one |

Every role sees every case and the same count (2).

**Tabs** (Insurance cases in the sidebar, group Operations)
- **Open with rows:** Open (5): 770 HDV, 482 TKL casco, 552 KLM, 482 TKL usual, 204 JLM.
- **Waiting for us with rows:** Waiting for us (2): 770 HDV, 482 TKL casco.
- **Closed with rows:** Closed (2): 400 NDP, 119 MPR.
- **Waiting for us empty:** as Dita, open 770 HDV, Add event, set Waiting for now to The insurer. Do the same on 482 TKL casco. The tab shows "Nothing is waiting for you".
- **Open empty:** set **Data state** to *Empty collection* in the PROTOTYPE panel while on Open. It also shows the Register case button for managers.
- **Closed empty:** set **Data state** to *Empty collection* while on Closed.
- **No results:** any search with no match, for example `zzz`.

**Statuses and waiting** (the list's Status and Waiting for columns)
- **Happened:** 770 HDV.
- **Reported:** both 482 TKL cases.
- **Under review:** 552 KLM.
- **Repair:** 204 JLM.
- **Closed:** 400 NDP and 119 MPR.
- **Waiting for:** Us on 770 HDV and 482 TKL casco; The driver on 482 TKL usual; The insurer on 552 KLM; Someone else on 204 JLM; Nobody on both closed cases.

**Case pages**
- **Usual case:** 552 KLM (the fullest case: 7 events, 2 notes, 6 photos, both insurers).
- **Casco case:** 204 JLM, or 482 TKL casco.
- **Two linked cases of one accident:** 482 TKL usual and 482 TKL casco. Each shows the other in the Same accident panel. The casco case points to the usual one.
- **Found instead of Happened:** 770 HDV. The hero fact, the timeline's first entry and the list read "Found".
- **No events, no insurers:** 770 HDV. Handled by reads "Not reported".
- **No photos:** 482 TKL usual (Photos panel empty state).
- **No notes:** 482 TKL usual (Notes panel empty state).
- **At fault decided:** 400 NDP (The other party) and 119 MPR (Not found).
- **Timeline with photos and change chips:** 552 KLM. Its first entry has 4 photos, and "Car shown at the BMW dealer" has 2. The chips are on every event that changed something.
- **Large photo view:** click any thumbnail on a timeline or in the Photos panel. Use ‹ ›, the arrow keys, Esc, or a click outside.
- **Edit on one's own entries:** Dita on 552 KLM (every event but one, and the note of 2 days ago). Signe on 552 KLM (the 9-days-ago event and her note). Neither sees Edit on the other's entries.
- **Viewer's read-only view:** Toms, any case.
- **Rental fact, not rented then:** register a case for 444 WKS now (see below), then open it.

**Register case** (as Dita, Signe or the System Administrator: Register case in the list header)
- **One driver:** Car 770 HDV, Happened now: Ilze Berzina, with the hint "From the rental of 770 HDV for Ilze Berzina".
- **A choice between drivers:** Car 482 TKL, Happened four days ago: Janis Krumins and Kristine Vitola are offered first, and the placeholder reads "Choose who drove".
- **Business customer's own drivers:** Car 552 KLM, now: empty, with the hint about the customer's own drivers.
- **Car not rented:** Car 444 WKS, now: empty, "444 WKS was not rented at that time…".
- **No driver named on the rental:** Car 119 MPR, 45 days ago (an ended rental without authorisations).
- **Ticks:** tick "We don't know when" and "We don't know where": the field labels become Found and Where it was found.
- **Handled by:** fill in either insurer and its option appears.
- **Photos:** Add photos opens the device picker; each file shows as a tile with Remove.
- After Register case, the new case's page opens.

**Other dialogs**
- **Casco case for this accident:** Dita, 552 KLM → header button. It opens Register case filled in, type Casco, Same accident = 552 KLM. The button is absent on 482 TKL usual (it already has its casco case) and on every casco case.
- **Edit case with At fault:** any manager, any case → Edit case → section Decision.
- **Add event that changes the status and the waiting:** 770 HDV → Add event, set Status now to Reported and Waiting for now to The insurer. The timeline gets two chips, the hero, the list and the count update, and the toast names both changes.
- **Add event that changes neither:** leave both selects as preset.
- **Add note / Edit note:** Notes panel header, or the header's Add note. Edit is under one's own notes.
- **Edit event:** Edit under one's own event. On 552 KLM "Car shown at the BMW dealer" (Dita), the Photos section with Remove appears.

**Dialog errors**
- **Register case with everything empty:** Car, What is damaged and Place errors.
- **Time missing:** clear Happened.
- **Time in the future:** set Happened or When later than now.
- **Event before the case:** Add event on 552 KLM with When before 08:35 nineteen days ago.
- **Edit case after its first event:** Edit case on 552 KLM with Happened set after its first event.
- **Title missing:** Add event without a title.
- **Text missing:** Add note without text.

**"Next action fails as" refusals** (choose the mode, then submit the dialog)
- **Field errors:** Register case and Edit case show the Claim number error; Add event and Edit event show the Title error; Add note and Edit note show the Text error.
- **Conflict:** the refusal banner in the dialog footer, with the dialog's own text (f).
- **Stale record:** the shared stale banner with Refresh, which reloads the dialog.

**Count, Overview, phone**
- **Count on the destination:** Insurance cases in the expanded sidebar and in the phone navigation drawer (2). As with the other counts, it is not drawn on the collapsed rail.
- **Overview:** the card "Insurance cases waiting for us" (second column) and the tile of the same name.
- **Phone cards and the sheet:** make the window narrower than 768 px for the cards. Below 640 px the dialogs open as the bottom sheet, the tab strip spans the list and drops its icons, and the photo view goes full-bleed.

---

## b. Reused pieces (unchanged)

**Template blocks** (by their binding names)
- **Header bar:** `crumbs`, `pageTitle`, `pageBadges`, `pageDesc`, `pageActions` (the action note popover included).
- **List section** `pgList`:
  - `list.hasSearch`, `list.filters`, `list.clearFilters` and `list.countLabel`;
  - the list states `list.isLoading`, `list.isProblem` and `list.isEmpty`, with `list.emptyHasAction`;
  - `list.showTable`, with the cell kinds `c.isText`, `c.isChip` and `c.isLink`, and `c.extraSubs` on the link cell;
  - `list.showPager`.
- **Record page** `pgDetail`:
  - the hero band `detail.hasHero`: `heroChip`, `heroFacts` with `h.isPlain` / `h.isLink` / `h.hasSub`, and `heroActions`, which is empty for a case;
  - the panel grid `detail.panels`, which is empty for a case and renders nothing.
- **Dialog / sheet** `dialog.open`:
  - the header and `dialog.sections`, with the field kinds `isInput`, `isSelect`, `isTextarea` and `isStatic`;
  - the tick cards `sec.checks`, `sec.hasNote` and `dialog.hasFootnote`;
  - the fail surface `dialog.failOpen`, with Refresh, and the footer `dialog.actions`.
- **Toasts:** `toasts`.
- **Navigation badge:** `it.hasBadge` / `it.badgeStyle`.
- **Overview tile:** `metrics`.

**Logic** (class `Component`)
- **Routing, people, formatting:**
  - `go`, `me`, `can`, `userName` and `displayName`;
  - `fmt` (default mode "19 Sep, 09:41" and `'dateShort'` "19 Sep"), `toLocal`, `fromLocal` and `toast`.
- **Dialogs:**
  - `openDialog`, `closeDialog`, `setForm`, `done`, `guard`, `refuse`, `refreshDialog`, `mutate` and `saveDb`;
  - `dialogModel`'s helpers `F`, `CK`, `SEC`, `A` and `cancel`.
- **Lists and record pages:**
  - `listModel`, `listSpec`'s `OPT`, `cell` (options `link`, `quiet`, `strong`, `wrap`, `sub`, `subMono`, `extra`, `chip`, `shape`, `tone`, `dim`), `q` and `patchQ`;
  - `detailModel`'s `A` and the hero wrapper in `renderVals`.
- **Tiers:** `isPhone` (<640), `isCardTier` (<768), `isTightTable` (768–1023), `isNarrow` (<1024) and `navIsExpanded`.
- **Rentals:** the data `db.assignments`, `db.authorizations`, `db.vehicles`, `db.drivers` and `db.customers`, read without change.

**Constants:** `TONE`, `FAIL_SIM` (its shape), `FAIL_GENERIC`, `FAIL_MODES`, `H`, `D`, `now`, `dayAt`.

---

## c. New and changed pieces

### Template (every declaration is in `new-styles.css`)
| Lines | What |
|---|---|
| 549–576 | Overview card, replacing the "Unresolved insurance cases" sample card. New title and description; the "Sample · module under development" chip is removed; rows are now `<button onClick="{{ c.go }}">` with a chevron, the Needs attention row styling; the empty state reads "Nothing is waiting for you". Bindings `insurance`, `insuranceEmpty`, `insuranceCount`. |
| 683–693 | Tab strip `<sc-if pgCaseTabs>`, bound to `caseTabs` and `caseTabsW`. |
| 1029–1052 | Phone case cards `<sc-if list.showCaseCards>`, bound to `list.caseCards`. |
| 1139–1272 | Case page columns `<sc-if detail.hasCase>`, bound to `detail.kase.cols` and `detail.kase.columns[].panels[]`. Panel kinds: `p.isTimeline` (entries `e.*`), `p.isNotes`, `p.isPhotos` (groups `g.*`), `p.isFacts`, `p.isLinks`, `p.isText` and `p.isEmpty`. It sits before the unchanged `detail.panels` grid. |
| 1637–1663 | Dialog section kind `sec.hasPhotos`: photo tiles with Remove, Add photos (`<input type="file" accept="image/*" multiple>`) and the hint. |
| 1673 | Dialog text input: new attribute `list="{{ f.listId }}"`. It is empty except on the two insurer fields. |
| 1714–1716 | `<datalist id="rw-insurers">` in the dialog body, bound to `dialog.insurerNames`. |
| 1757–1784 | Large photo view `<sc-if photo.open>`, bound to `photo.*`, at z-index 75 (dialogs are 70; the two never open together). |

### Constants and data
| Lines | Name |
|---|---|
| 1935–1940 | `FAIL_SIM['case-register']`, `['case-edit']`, `['case-event-add']`, `['case-event-edit']`, `['case-note-add']`, `['case-note-edit']` |
| 2063–2069 | `INS_TYPE`, `INS_TYPE_SHAPE`, `INS_STATUS`, `INS_STATUS_TONE`, `INS_PARTY`, `INS_PARTY_ORDER`, `INS_FAULT` |
| 2071–2072 | `pastAt`, `plusMin` (seed time helpers) |
| 2074–2138 | `INS_SEED`: the seven cases, with their events, notes and photos (exported in `mock-data.json`) |
| 2298 | `DB.insuranceCases: INS_SEED` |
| 2345, 3006 | Stored-DB version `'rwrent-23'` (was `'rwrent-22'`) |

### Component state and lifecycle
| Line | Change |
|---|---|
| 2336 | New state `photoView: null` (`{ caseId, photoId }` while the photo view is open). |
| 2353–2354 | `componentDidMount`: keydown listener `this._kd` (Esc closes the photo view; ← → step). |
| 2369 | `componentWillUnmount` removes it. |
| 2397 | `go` also clears `photoView`. |
| 6063 | Role switch also clears `photoView`. |

### Navigation, Overview, header
| Line | Change |
|---|---|
| 2467 | Nav item `insurance`: new `badge: this.caseRows('us').length`. |
| 2485 | Nav item active also on route `case`. |
| 2614 | Overview tile `key:'ins'`: now "Insurance cases waiting for us", icon `car_crash`, value `insuranceModel().length`, and it opens the Waiting for us tab (it was the sample count with no target). |
| 2743–2748 | `insuranceModel()` rewritten: the open cases waiting for Us, the longest waiting first (was three sample rows including "Policy lapsed"). |
| — | `simpleModel()`: the `insurance` branch with the "Under development" notice is removed. The Insurance cases route no longer uses `pgSimple`. |
| — | Driver page (`detailModel`, route `driver`): the "Insurance cases · Under development" panel is removed. |
| 2814 | `headerModel` `insurance`: new description and the Register case action (managers only). |
| 2894–2904 | `headerModel` route `case`: breadcrumb (back to the tab it was opened from), title, type badge, and the actions Add event, Add note, Edit case and Casco case for this accident. |
| 6028, 6031 | `headerRowDir` / `headerRowGap`: on route `case` with actions, the header stacks the title over its actions at every width. |

### New methods (class `Component`)
| Lines | Name | Does |
|---|---|---|
| 2636 | `canCase()` | Whether the person may change cases: `can('Vehicles.Manage')`, so Fleet Manager, Company Principal and System Administrator. |
| 2637–2642 | `cases()`, `caseById()`, `casePlate()`, `caseTitle()`, `caseEvents()`, `caseLastEvent()` | Data access. `caseTitle` = "plate · damage"; `caseEvents` sorts by happenedAtUtc, oldest first. |
| 2644 | `caseWaitSince(c)` | When the current waiting started. |
| 2645 | `caseClosedAt(c)` | When the case was closed. |
| 2646–2654 | `dur`, `agoText`, `laterText`, `caseWaitText` | Durations and relative days. |
| 2655–2660 | `caseHandled(c)` | Handled by text and sub-line. |
| 2661–2676 | `caseTab()`, `caseRows(tab)`, `caseTabs()` | Tabs, filtering and order. |
| 2678 | `caseGroup(c)` | The other cases of the same accident. |
| 2680–2701 | `caseRental(vehicleId, iso)`, `caseDriverHint(info)` | Rental and driver fill-in. |
| 2702–2710 | `localIso(v)`, `setCaseForm(k, v)` | Form setter that refills the driver and resets Handled by. |
| 2711–2718 | `pickPhotos(e)`, `removeFormPhoto(key)` | Dialog photos. |
| 2720–2723 | `photoBg(name)`, `sizeText(b)` | Placeholder drawing, file size. |
| 2724–2740 | `casePhotoList(c)`, `photoModel()`, `photoStep(dir)` | Large photo view. |
| 4170–4201 | `submitCase(t, id)` | Register case / Edit case. |
| 4202–4231 | `submitCaseEvent(t, cid, eid)` | Add event / Edit event. |
| 4232–4243 | `submitCaseNote(t, cid, nid)` | Add note / Edit note. |

### Dialog models
| Lines | Entry |
|---|---|
| 2983–2998 | `openDialog` pre-fills for `case-register` (with `fromId` for the casco copy), `case-edit`, `case-event-add`, `case-event-edit`, `case-note-add` and `case-note-edit`. Payloads: `{ id }` for a case, `{ cid, id }` for an event or note. |
| 3060 | Closed dialog model also returns `insurerNames: []`. |
| 3073 | `F`: new property `listId` (from option `list`). |
| 3083 | `SEC` defaults: `hasPhotos`, `photosAny`, `photos`, `canAddPhotos`, `onPickPhotos`, `hasPhotosHint`, `photosHint`, `photoBtn`. |
| 3565–3571 | Shared helpers: `PHS` (photos section), `stOpts`, `wOpts`. |
| 3572–3610 | `case-register` / `case-edit`. |
| 3611–3628 | `case-event-add` / `case-event-edit`. |
| 3629–3634 | `case-note-add` / `case-note-edit`. |
| 3657 | Dialog model: `insurerNames`, the distinct insurer names used on all cases, sorted. |

### List and record page
| Lines | Entry |
|---|---|
| 4564–4624 | `listSpec` route `insurance`: filters, columns, `match`, `cells`, `caseCard` and `empty`. |
| 5089–5090 | `listModel`: `showCards` excludes `caseCards` specs; new `showCaseCards` and `caseCards`. |
| 5278–5351 | `detailModel` route `case`: hero, timeline entries, and the panels built with the local helpers `CP` (panel), `FT` (fact) and `thumb`. |
| 6076–6084 | `renderVals`: `pgSimple` is now Needs attention only; `pgList` includes `insurance`; new `pgCaseTabs`, `caseTabs`, `caseTabsW`; `pgDetail` includes `case`. |
| 6124 | Hero wrapper passes `hasCase` and `kase`. |
| 6130 | `photo: this.photoModel()`. |
| 6060–6061 | The PROTOTYPE tab hides while the photo view is open. |

---

## d. Behaviour as built

**Who sees what**
- **Visibility:** every signed-in Company user and the System Administrator sees every case. Only the Viewer is read-only.
- **Open:** every case whose status is not Closed.
- **Waiting for us:** the Open cases waiting for Us.
- **Closed:** status Closed.
- **Count:** the number of rows on Waiting for us, the same for every role, recomputed on every change.

**Order**
- **Open and Waiting for us:** the cases waiting for Us first, then by how long they have waited, the longest first (`caseWaitSince` ascending). Ties keep the stored order, newest registered first.
- **Closed:** by `caseClosedAt`, most recent first.
- **Overview card:** the Waiting for us order.

**Search and filters**
- **Search:** case-insensitive substring over the plate, what is damaged, the driver's full name, both insurers and both claim numbers.
- **Type:** Any type / Usual / Casco, on every tab.
- **Status:** Any status / Happened / Reported / Under review / Repair, on Open and Waiting for us.
- **Waiting for:** Anyone / Us / The driver / The insurer / Someone else / Nobody, on Open only.
- **Hidden filters:** a filter set on one tab is kept but not applied where it is not shown. Clear filters shows when the search or a shown filter is set.

**Driver fill-in**
- **The rental:** the rental of that car with status Active or Ended, started at or before the time, and not closed before it. An authorisation counts when it started at or before the time and was not stopped at or before it.
- **When it runs:** it runs each time Car or Happened changes, in Register case and in Edit case. It replaces whatever was chosen. Opening Edit case keeps the stored driver.
- **Only one named driver authorised then:** that driver, with the hint "From the rental of {plate} for {customer}".
- **Several named drivers:** empty. The authorised ones are listed first, with "· on the rental then". The placeholder reads "Choose who drove", and the hint names them.
- **Company-authorised drivers on the rental:** empty, with the business-customer hint.
- **Rental but no authorisation then:** empty, "No driver was named on the rental…".
- **Not rented then:** empty, "{plate} was not rented at that time…".
- **Car or time missing:** empty, "Choose the car and the time…".
- **Changing or clearing it:** the person can choose any active driver, or Not known.
- **What is stored:** only `driverId`. The Rental fact is recomputed from the car and the time.

**Handled by**
- **Options:** Not known yet, plus "Our insurer · {name}" once our insurer is filled in, and "The other party's insurer · {name}" once theirs is.
- **Clearing an insurer:** clearing the chosen side's insurer resets Handled by.
- **On save:** the side is kept only if its insurer is filled in. Claim numbers are kept as typed, with or without an insurer.

**A new case**
- **Defaults:** Type Usual; Happened now (to the minute); both ticks off; Driver as filled in; no insurers; Status Happened; Waiting for Us; no photos; no other case.
- **Stamps:** it gets createdAtUtc and createdByUserId. updatedAtUtc and atFault stay empty.

**Events: status, waiting and "since"**
- **Presets:** Add event presets Status now and Waiting for now to the case's current values.
- **What is stored:** on save, `statusChangedTo` is stored only when the status differs from the current one, and `waitingForChangedTo` likewise. The case takes the new values.
- **The case's Last updated:** it changes only when the event changed something.
- **"Since":** the happenedAtUtc of the latest event, by happenedAtUtc, that changed Waiting for. With no such event, the case's createdAtUtc.
- **Durations:** under an hour "N minutes", under a day "N hours", otherwise whole days. Each rounds down.
- **Order of statuses:** any status may follow any other.
- **Reopening:** an event that sets anything but Closed on a closed case moves it back to Open (and to Waiting for us if it waits for Us). At fault stays as it was. The Closed date always comes from the latest event that set Closed.

**Edit case**
- **What it changes:** car, type, what is damaged, description, Happened and its tick, place and its tick, driver, both insurers and claim numbers, Handled by, At fault and Same accident. It stamps updatedAtUtc / updatedByUserId.
- **What it leaves alone:** status, waiting, photos, events and notes.

**Correcting events and notes**
- **Who:** only the person who added the event or wrote the note (`createdByUserId` = the signed-in person), and never a Viewer.
- **Edit event:** When, Title and Description, and removing the photos they added to that event. It cannot add photos, and it cannot change what the event set: that is shown read-only.
- **Edit note:** the text.
- **Deleting:** nothing else can be deleted.

**Cases of one accident**
- **The link:** `sameAccidentCaseId` points to the first case registered. Choosing a case that itself points somewhere stores that first case.
- **Same accident panel:** the first case plus every case pointing to it, minus the case itself.
- **Same accident as, in Edit case:** leaves out the case itself and the cases pointing to it.

**Casco case for this accident**
- **When it shows:** only on a usual case whose accident has no casco case yet.
- **What it copies:** car, what is damaged, description, Happened and its tick, place and its tick, driver and our insurer (with Handled by set to ours when there is one). Type becomes Casco, and Same accident points to the accident's first case.
- **What it leaves out:** the claim numbers, the other party's insurer, the status and waiting (defaults), photos and At fault.

**Time between entries**
- **Measured from:** the first event from the case's own time; each later event from the previous event, by happenedAtUtc.
- **Wording:** under a minute "At the same time", otherwise the duration + " later".

**Dates**
- **A case's time:** required and not in the future. In Edit case it may not be later than the case's first event.
- **An event's time:** required, not in the future, and not earlier than the case's time (equal is allowed). It may be earlier than the day it is typed in.

**Rental fact**
- **Rented then:** the customer's name, as a link to that rental, with "Rental from {date}" and " to {date}" when it has ended.
- **Otherwise:** "Not rented then".

**Photo view**
- **Header:** the entry's title (Happened / Found, or the event's title) and "{case title} · {entry date and time}".
- **Picture:** the drawn placeholder.
- **Footer:** the file name, "Added by {name}, {date} · {size}" and "{n} of {m}".
- **Moving and closing:** ‹ › and the arrow keys move through every photo of the case in timeline order. Esc, × or a click outside closes it.

---

## e. Layout values

**The three tiers**
- **1512, rail collapsed:** the rail is 64 px and the content is 1512 − 64 − 2 × 26 = 1396 px.
- **834:** the rail becomes the drawer and the content is 834 − 2 × 16 = 802 px.
- **402:** the content is 370 px.

**List**
- **1512, table:** Case `auto`, Status 132, Waiting for 170 (Closed: At fault 150), Handled by `auto` and Last event `auto` (Closed: Closed 130). The three `auto` text columns share the spare width, and their text wraps. Cells are 11 px 14 px, with 22 px outer edges. The minimum table width is 920.
- **834, folded table:**
  - Handled by folds into the Case cell as a third sub-line: "{insurer} · {claim}", or "Not reported".
  - Fixed widths scale by 0.71: Status 94, Waiting for 121, At fault 107, Closed 92. Cells are 9 px, edges 16 px, and headings may wrap. The minimum width is 653, so nothing scrolls.
- **402 (and below 768), cards:**
  - Padding 14 × 16 and gap 11.
  - Title 14/600, wrapping, with no line under it. The sub-line is 11.5 `--fg-3`, "Usual · Happened 05 Sep".
  - The status chip is top right.
  - Facts sit in a 2-column grid, gaps 8 × 14. The right column is right-aligned. Labels are 10.5 uppercase `--fg-4`; values are 12.5.
  - Open and Waiting for us: Waiting for (left, warn 500 when Us), Handled by (right), and Last event across both columns with its day below.
  - Closed: At fault (left), Closed (right), and Handled by across both columns.
- **Tab strip at 1512 and 834:** width max-content, tabs padded 8 × 13, 13.5 px, icons shown.
- **Tab strip below 640:** as wide as the list, tabs `flex:1 1 auto`, 44 px high, padded 0 × 8, 13 px, gap 6, no icons, labels on one line.

**Header on a case page:** the title is on its own row, with the badge (type) beside it. The actions wrap on the row below at every tier. The title is 24 px, 19 px below 1024.

**Hero band** (status chip, then 6 facts: Waiting for, Happened/Found, Driver, Rental, Handled by, At fault; no actions)
- **1512:** chip and facts on one row. The free width is shared between the facts as spacers (the existing wide-band rule).
- **834:** the chip on row one; the facts on row two, spread with space-between and wrapping if needed.
- **640–767:** facts in 2 columns.
- **402:** facts in 1 column.

**Panels**
- **≥ 1024, two columns** `minmax(0,1.7fr) minmax(300px,1fr)`, gap 14:
  - left: Timeline, Photos;
  - right: Notes, Insurance, Same accident (when linked), Description (when there is one), Record.
- **< 1024, one column:** Timeline, Notes, Insurance, Same accident, Photos, Description, Record.
- **Panel header:** 14 × 17. Title 14/600; description 12.5 `--fg-3`.

**Timeline entry**
- **Rail:** a 22 px rail column and a 12 px gap; side padding 17. The dot is 9 px, 17 px from the top of the entry, with a 4 px `--surface` ring.
- **Dot colour:** the case entry's is `--fg-2`. An event that changed the status takes that status's tone. Others are hollow with a `--line-3` border.
- **Line:** 1 px `--line-2`, from the first dot to the last.
- **Content:** padding 12 top, 14 bottom, gap 6.
  - date: mono 12 `--fg-2`; the "later" text: 12 `--fg-3`;
  - title: 13.5/600; place: 13 `--fg-2`, with the location icon;
  - description: 13/1.55 `--fg-2`, max 72ch;
  - change chips: 11.5/500, padding 2 × 8, radius 6, `--surface-2` with a `--line-2` border;
  - by-line: 12 `--fg-3`. Edit is underlined, 12/500 `--fg-2`, with a 44 px hit height below 640.
- **Thumbnails:** 76 × 57 (below 640: 64 × 48), gap 8, radius 8, with a `--line-2` border.

**Notes:** rows 13 × 17; text 13.5/1.55; meta 12 `--fg-3`; Edit as on the timeline.

**Photos panel:** padding 14/17/17. Groups gap 16. The group title is 12.5/500 and its date mono 11.5. Thumbnails 96 × 72 (below 640: 88 × 66).

**Fact panels (Insurance, Record):** a 2-column grid (1 below 640) with 1 px `--line` gaps. Cells are 13 × 17. Handled by spans both columns.

**Large photo view**
- **Desktop and tablet:** max width 980, 24 px from the viewport, radius 16. The scrim is `rgba(0,0,0,.8)`. The picture area is 4:3, capped at 68 vh. Round ‹ › buttons of 36 px sit 12 px inside.
- **Below 640:** full-bleed, radius 0, 44 px buttons.

**Dialogs**
- **Widths:** Register case and Edit case 720; Add event and Edit event 640; Add note and Edit note 560.
- **Placement:** 48 × 24 from the viewport above 1024; 16 px at 640–1023.
- **Paired fields:** 2 columns from 1024 up. They stack to 1 column below 1024.
- **Below 640, the bottom sheet:** full width, top radius 18, max height 92 vh, footer buttons stacked full width.
- **Photo tiles:** 104 × 78; Remove is 28 px high (44 px below 640); Add photos is 44 px high below 640.

**Overview card:** the existing card shell. Rows 13 × 17, with a 30 px warn tile, the title 13.5/500 and the sub-line 12.5, each on one line. The right text is mono 11 `--fg-3`, with a chevron.

**Navigation count:** the existing badge, shown in the expanded sidebar and the phone drawer.

---

## f. Copy deck

**Page**
- **Title:** Insurance cases
- **Description:** Damage to the company's cars and its insurance claims, from the day it is found until the case is closed.
- **Primary action:** Register case
- **Tabs:** Open · Waiting for us · Closed (each followed by its count)
- **Search placeholder:** Plate, damage, driver, insurer or claim
- **Filters:**
  - Type: Any type, Usual, Casco
  - Status: Any status, Happened, Reported, Under review, Repair
  - Waiting for: Anyone, Us, The driver, The insurer, Someone else, Nobody
- **Clear filters:** Clear filters
- **Count:** {n} case / {n} cases

**Columns and cells**
- **Column heads:** Case · Status · Waiting for · Handled by · Last event. On Closed: Case · Status · At fault · Handled by · Closed.
- **Case cell:** "{plate} · {what is damaged}", then "{Usual|Casco} · Happened {05 Sep}" or "… · Found {05 Sep}".
- **Waiting for:** "Us · 2 days", "The insurer · 6 days", "Someone else · 3 hours", "Nobody".
- **Handled by:** "{insurer}" with "{claim number}" under it; "Not decided yet" (insurers known, none chosen); "Not reported".
- **Last event:** "{title}" with "Today", "Yesterday", "{n} days ago" or "{05 Sep}" under it; "No events yet".
- **Closed:** "Closed {12 Sep}"; At fault "Not decided yet".
- **Phone card fact labels:** Waiting for, Handled by, Last event, At fault, Closed.

**Empty states**
- **Open:** No open cases. "Register a case as soon as you learn about new damage, so nothing is forgotten." Button: Register case.
- **Waiting for us:** Nothing is waiting for you. "A case appears here when the next move is yours."
- **Closed:** No closed cases yet.
- **No results** (shared): No results for these filters. "Nothing matches the current search and filters. Clearing them restores the full list." Button: Clear filters.

**Labels**
- **Statuses:** Happened · Reported · Under review · Repair · Closed
- **Types:** Usual · Casco
- **Waiting for:** Us · The driver · The insurer · Someone else · Nobody
- **At fault:** Our driver · The other party · Both · Not found

**Case page**
- **Breadcrumb:** Insurance cases › {plate} · {what is damaged}
- **Badge:** Usual / Casco. The hero chip is the status.
- **Actions:** Add event · Add note · Edit case · Casco case for this accident
- **Hero facts:**
  - WAITING FOR: {party}, with "since {05 Sep, 14:40} · {6 days}" (no duration for Nobody).
  - HAPPENED or FOUND: {05 Sep, 08:35}, with "{place}" under it. Add " (where it was found)" when only the place is where it was found, and " (where it happened)" when only the time is when it was found.
  - DRIVER: {name} (a link) or "Not known".
  - RENTAL: {customer} (a link), with "Rental from {28 Aug}" and " to {dd Mon}" when ended; or "Not rented then".
  - HANDLED BY: {insurer} with {claim number}; "Not decided yet"; or "Not reported".
  - AT FAULT: {value} or "Not decided yet".
- **Timeline:**
  - Title and description: Timeline. "What happened, oldest first. Times in Tallinn time."
  - First entry: "Happened" or "Found", the place, what is damaged, "Registered by {name}, {date, time}".
  - Events: "{n} days later" / "{n} hours later" / "{n} minutes later" / "At the same time", and "Added by {name}, {date, time}".
  - Chips: "Status: {status}", "Waiting for: {party}".
  - Edit.
- **Notes:** Title Notes. Description "Newest first." (when there are notes). Header action Add note. Row "{text}", "{name}, {date, time}", Edit. Empty: "No notes yet."
- **Insurance:**
  - Our insurer {name} or "None"; Claim number {number} or "—".
  - The other party's insurer {name} or "Not known"; Claim number.
  - Handled by: "{insurer} (ours)", "{insurer} (the other party's)", "Not decided yet" or "Not reported".
- **Photos:** Title Photos. Description "{n} photos, by the entry they belong to." (1: "1 photo, …"). Groups "{entry title}" "{date, time}". Empty: "No photos yet".
- **Same accident:** Title Same accident. Description "The other case of this accident." / "The other cases of this accident.". Rows "{plate} · {damage}", "{type}", status chip.
- **Description panel:** Title Description, then the text.
- **Record panel:** Created {date, time} "by {name}"; Last updated {date, time} "by {name}" or "Never".
- **Photo view:**
  - "{entry}", "{case title} · {date, time}"
  - "{file name}", "Added by {name}, {date, time} · {2.8 MB}", "{n} of {m}"
  - aria labels: "Close photo", "Previous photo", "Next photo", "Open photo {file name}"

**Register case / Edit case**
- **Title:** Register case / Edit case.
- **Description:** Register case has none; filled in from another case: "Filled in from {plate} · {damage}, as its casco case."; Edit case: the case title.
- **Sections and fields:**
  - THE DAMAGE:
    - Car (required), with the placeholder option "Choose a car" and options "{plate} · {make} {model}";
    - Type (required): Usual, Casco. Hint for Usual: "The insurers decide who is at fault."; for Casco: "Our casco repairs the car now; the company pays the 500-euro deductible.";
    - What is damaged (required), placeholder "For example Rear bumper dented";
    - Description (· optional), placeholder "What happened, in as many words as needed".
  - WHEN AND WHERE:
    - Happened (required); when ticked, the label becomes Found;
    - tick "We don't know when", hint "This is when it was found.";
    - Place (required); when ticked, the label becomes "Where it was found";
    - tick "We don't know where", hint "This is where it was found."
  - DRIVER: Driver (· optional). The first option is "Not known" or "Choose who drove". Authorised drivers read "{name} · on the rental then". Hints:
    - "From the rental of {plate} for {customer}"
    - "{A} and {B} were both authorised on the rental of {plate} for {customer} then. Choose who drove." (three or more: "were all authorised")
    - "{plate} was on the rental for {customer}, driven by the customer's own drivers, so no driver is filled in."
    - "No driver was named on the rental of {plate} for {customer} at that time."
    - "{plate} was not rented at that time, so there is no driver to fill in."
    - "Choose the car and the time, and the driver is filled in from its rental."
  - INSURANCE:
    - Our insurer (· optional), then Claim number (· optional);
    - The other party's insurer (· optional), then Claim number (· optional);
    - Handled by (· optional), with the options "Not known yet", "Our insurer · {name}" and "The other party's insurer · {name}". Hint: "The insurer that handles the case, once the two have agreed." (no insurer yet: "Offers the insurers filled in above.").
  - WHERE IT STANDS (Register case only): Status (required), Waiting for (required).
  - PHOTOS (Register case only): Add photos, tiles "{file name}" "{size}" Remove. Hint: "Optional, several at once. Photos only: documents stay in the mailbox."
  - DECISION (Edit case only): At fault (· optional), with the options "Not decided yet", Our driver, The other party, Both, Not found. Hint: "Set it once the decision is known."
  - SAME ACCIDENT: "Same accident as" (· optional), with the options "No other case" and "{plate} · {damage} · {type}".
- **Footnote:** Register case "After this, the status and who the case waits for change only through an event."; Edit case "Status and Waiting for change only through an event."
- **Buttons:** Cancel · Register case / Save changes

**Add event / Edit event**
- **Title:** Add event / Edit event; description: the case title.
- **THE EVENT:** When (required), hint "The day it happened, even when you type it in later."; Title (required), placeholder "The insurer asked for the driver's licence"; Description (· optional).
- **PHOTOS** (Add event): as above, hint "Optional. Photos only: documents stay in the mailbox." (Edit event, when the event has photos: "You can remove a photo you added. New photos go with a new event.")
- **WHERE IT STANDS** (Add event): Status now (required), Waiting for now (required), with the note "Preset to the case's current values. Most events change neither."
- **WHERE IT STANDS** (Edit event): "What this event changed", with "Status: {x} · Waiting for: {y}" or "Nothing: the status and who the case waited for stayed as they were."
- **Footnote** (Edit event): "Only you, who added this event, can correct it."
- **Buttons:** Cancel · Add event / Save changes

**Add note / Edit note**
- **Title:** Add note / Edit note; description: the case title.
- **Field:** Text (required), placeholder "The driver says a witness saw the other car's plate".
- **Footnote:** "A note changes nothing on the case." / "Only you, who wrote this note, can correct it."
- **Buttons:** Cancel · Add note / Save changes

**Errors under the field**
- Choose the car.
- Say what is damaged.
- Enter when it happened. / Enter when the damage was found.
- The time cannot be in the future.
- An event cannot be before the case happened. (Edit case adds: " Its first event is on {date, time}.")
- Enter where it happened. / Enter where the damage was found.
- Enter a title for the event.
- Write the note.

**Refusals computed from the data** (dialog footer): This case no longer exists. · This event no longer exists. · Only the person who added this event can correct it. · This note no longer exists. · Only the person who wrote this note can correct it.

**"Next action fails as" (FAIL_SIM)**
- **case-register:**
  - fields: Claim number "Another case already carries this claim number with the same insurer."
  - conflict: "The car was deactivated moments ago. Choose another car."
- **case-edit:**
  - fields: the same Claim number error.
  - conflict: "The case was changed by someone else while you had this open."
- **case-event-add:**
  - fields: Title "The title must be at most 200 characters."
  - conflict: "Someone else added an event to this case while you had this open. Refresh to see it first."
- **case-event-edit:**
  - fields: the same Title error.
  - conflict: "Only the person who added this event can correct it."
- **case-note-add:**
  - fields: Text "The note must be at most 4000 characters."
  - conflict: "The case was changed by someone else while you had this open."
- **case-note-edit:**
  - fields: the same Text error.
  - conflict: "Only the person who wrote this note can correct it."
- **Stale (shared):** "This record changed while you had it open." "Refresh to load the current values, then save again." Button: Refresh.

**Toasts**
- **Case registered:** Case registered, with "{plate} · {damage}". Case saved.
- **Event added:** Event added, with "Status: {x} · Waiting for: {y}" or "The status and who the case waits for stay as they were." Event saved.
- **Notes:** Note added. Note saved.
- **Photos only:** Photos only, "Documents stay in the mailbox." (when a non-image file is picked).

**Navigation and Overview**
- **Navigation:** Insurance cases, with the count (open cases waiting for Us).
- **Overview card:**
  - Title "Insurance cases waiting for us"; description "Open cases where the next move is ours, the longest waiting first."
  - Count "{n} case" / "{n} cases".
  - Rows "{plate} · {damage}", then "{last event title}" or "No events yet", and "Waiting for us · {2 days}".
  - Empty: "Nothing is waiting for you".
- **Overview tile:** "Insurance cases waiting for us", {n} "cases".

---

## g. Invented, and built differently

**Invented**
- **Wording:** all hints, footnotes, the dialog notes, the toasts, the FAIL_SIM texts, the error texts beyond the two you gave, and "Not known" / "None" / "Not decided yet" / "Not reported" / "Not rented then".
- **Mock data you did not specify:** every clock time, the places, the file names and sizes, the description of case 552 KLM ("Hit from behind at a crossing while waiting at the red light."), and the description of its event "Meridian asked who drove…".
- **Ticks:** each tick's text is split into a label and a hint ("We don't know when" / "This is when it was found."). The field label switches to Found / Where it was found when ticked.
- **"Since" and durations:** waiting counts from the last event that changed Waiting for, and durations round down. So 552 KLM reads "6 days" at most times of day, though its waiting started 7 calendar days back. 770 HDV reads "1 day" or "2 days" depending on the hour.
- **Rental sub-line:** "Rental from … to …".
- **Photo view:** the file size and the "{n} of {m}" counter.
- **Order:** the order of the right-hand panels.
- **Suggestions for insurer names** use the browser's own list (datalist).

**Changed outside the page**
- **Overview tile:** it now shows the Waiting for us count and opens that tab. Before, it counted the sample rows and had no target.
- **Driver page:** the "Insurance cases · Under development" panel is removed, per "the under development notice goes away everywhere".
- **Stored-DB version:** bumped to `rwrent-23`.

**Built differently**
- **Chips:** the type is a badge beside the title in the header; the status is the hero chip. They are not both in the hero.
- **Case actions:** they are in the header under the title, not in the hero band.
- **Edit event:** it cannot add photos (new photos go with a new event). It shows what the event changed read-only.
- **Photos:** each is stored once, in the case's `photos`, with `insuranceCaseEventId`. The event's Photos collection is derived from them.
- **Claim numbers:** they are kept even when their insurer is empty.
- **Viewer:** Driver and Rental remain links for the Viewer, as the Viewer may read those pages.
- **The Closed tab's Status column** always reads Closed; the date is in the Closed column.
- **Photos in the dialogs:** they use the device's file picker. Only the name and size are kept, and the pictures show as placeholders.
- **Leftover template:** the `pgSimple` template still contains its generic "Under development" notice markup. Nothing sets it now, and Needs attention does not use it.
- **Mock data left as it was:** the task "Handle the windscreen insurance case of 204 JLM" was created 5 days ago, while its case happened yesterday.

**Not produced**
- **`insurance/screens/`:** my preview renders at one fixed width, so I cannot capture true 1512, 834 and 402 renders. The prototype, resized in the browser, is the reference for every state.
