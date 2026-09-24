# RW-Rent · Tasks — handover

Source of truth: `RW-Rent.dc.html` (approved). Open it directly in a browser; `support.js` must sit beside it.
Line numbers below refer to that file (5 472 lines). Build the section inside today's app from the prototype; nothing outside this feature needs to be taken.

The prototype stores its mock data in the browser under the key `rwrent.db` with version `rwrent-22`. Opening this copy the first time resets any older saved mock data.

---

## a. How to see it

The **PROTOTYPE** tab on the right edge opens the review controls. **Signed-in role** switches the persona and returns to Overview. **Next action fails as** applies to the next dialog you submit, then resets. The theme switch is in the sidebar footer.

| Role in the panel | Person | Tasks count |
|---|---|---|
| Company Principal | Signe Priede (owner of the company) | 2 |
| Fleet Manager | Dita Smite | 4 |
| Viewer | Toms Rudzitis (assistant) | 2 |
| System Administrator | Arturs Veidenbaums | no Tasks destination, no Overview tasks card, no Open tasks tile |

To see a state, pick the role and follow the path. The tab names refer to the Tasks page.

**Tabs with rows**
- **My tasks with rows:** Dita (4 rows) or Signe (2 rows).
- **Involving me with rows:** Toms (3 rows), Dita (1: the windscreen case) or Signe (1: Prepare 204 JLM).
- **Finished with rows:** Dita (1: Register 119 MPR) or Signe (2: the finished one and the cancelled one).

**Empty states**
- **My tasks empty:** Toms, My tasks.
- **Involving me empty:** no seed person starts with it empty. As Dita, open *Prepare 204 JLM for a rental* and use Finish task (Finish anyway), then switch to Signe: her Involving me is empty. A search such as `zzz` shows the separate no-results state on any tab.
- **Finished empty:** Toms, Finished.

**Task pages**
- **Task without steps:** Dita, *Order two spare key fobs* or *Reassign the parking fine*. The Steps panel shows "No steps".
- **Task with steps, as its creator:** Dita, *Prepare 204 JLM for a rental*. Mark done or Undo shows on every step, and Edit, Finish task and Cancel task are in the hero.
- **The same task, as a step's person:** Toms, Involving me, *Prepare 204 JLM*. Mark done shows on *Car wash* only, and there are no task actions.

**Due dates**
- **Overdue:** Dita, *Reassign the parking fine* (the task is overdue). Toms, *Tell the driver the time* (the step is overdue).
- **Due today:** Signe, *Prepare the rental agreement for Martins Ozols*.

**Finished and cancelled tasks**
- **Finished task:** Dita or Signe, Finished tab, *Register 119 MPR in Bolt*. It shows the banner and is read-only.
- **Cancelled task with its reason:** Signe, Finished tab, *Prepare an agreement for Ventspils Marine Services*.

**Mark done and Undo**
- **Mark done / Undo by the step's person:** Toms, Involving me. *Car wash* has Mark done; *Collect the photos* is done by Toms and has Undo.
- **Undo not offered:** Toms cannot undo a mark somebody else made. As Dita, mark *Car wash* done, then switch to Toms: his step shows Done with no Undo.

**Edit**
- **Edit:** Dita, *Prepare 204 JLM* → Edit. The first step is already done and keeps its "Done · …" line when renamed or moved.

**Finish and Cancel**
- **Finish with every step done:** Dita, open *Book a service for 444 WKS*, mark *Tell the driver the time* done, then Finish task.
- **Finish with steps still open:** Dita, *Prepare 204 JLM* → Finish task. The warning names the open steps.
- **Cancel:** Dita, any own open task → Cancel task, with or without the Why note.

**New task**
- **New task with steps:** any Company role → New task. Use Add step, then the ↑ ↓ ✕ buttons on the rows. The About select reveals the record select for the chosen kind.

**Dialog errors**
- **Title missing:** leave Title empty and press Create task.
- **Step without a title or person:** Add step, leave it empty and press Create task. Both step errors appear.
- **Step due after the task:** set the task's Due, then set a step's Due later than it and press Create task.
- **About record missing:** choose a kind under About, leave the record empty and press Create task.

**"Next action fails as" refusals**
- **Field errors:** choose it, then submit New task or Edit task. The Title field shows the API error.
- **Conflict:** choose it, then submit New task or Edit task. The refusal banner appears in the dialog footer. Finish task and Cancel task show the shared generic refusal.
- **Stale record:** choose it, then submit any of the four task dialogs. The stale banner with Refresh appears, and the submit button is disabled (Cancel and Keep task stay enabled).

**Count, Overview and phone**
- **Count on Tasks:** the sidebar (expanded) and the phone navigation drawer. As with the other counts in the prototype, it is not drawn on the collapsed rail.
- **Overview card:** Overview → the *Open tasks* card (first column, under Needs attention) and the *Open tasks* tile.
- **Phone cards and the sheet:** make the window narrower than 768 px for the cards. Below 640 px the dialogs open as the bottom sheet and the tab icons drop.

---

## b. Reused pieces (unchanged)

**Template blocks** (by their binding names):
- **Header bar:** `crumbs`, `pageTitle`, `pageDesc`, `pageActions`.
- **List section** `pgList`: `list.hasSearch` / `list.search`, `list.filters`, `list.clearFilters`, `list.countLabel`, `list.isLoading`, `list.isProblem`, `list.isEmpty`, `list.showTable` (table head `list.columns`, body `list.rows`), and the existing cell kinds `c.isText`, `c.isLink`, `c.isChip`. Pager `list.showPager`.
- **Record page** `pgDetail`: the hero band `detail.hasHero` (`heroChip`, `heroFacts`, `heroActions`), `detail.hasBanner`, the panel grid `detail.panels` with `p.hasRows` fact rows and `p.isEmpty` empty state.
- **Dialog / sheet** `dialog.open`: header, `dialog.hasBanner`, `dialog.sections` (field kinds `isInput`, `isSelect`, `isTextarea`), `dialog.hasConsequences`, `dialog.failOpen` (fail surface with Refresh), footer `dialog.actions`, `dialog.hasFootnote`.
- **Toasts** `toasts`.
- **Overview card shell:** section, header and empty state (`tasksEmpty`).
- **The tab-strip markup:** the Delete records `purgeTabs` strip. The Tasks strip is a copy of it with two new bindings; see c.

**Logic** (class `Component`):
- **Navigation, users and formatting:** `go`, `me`, `can`, `displayName`, `fmt` (default mode and `'dateShort'`), `toLocal`, `fromLocal`, `toast`.
- **Dialogs:** `openDialog`, `closeDialog`, `setForm`, `done`, `guard`, `refuse`, `refreshDialog`, `mutate`, `saveDb`, and `dialogModel`'s helpers `F`, `SEC`, `A`, `cancel`.
- **Lists and record pages:** `listModel`, `listSpec`, `cell`, `q`, `patchQ`, `detailModel`'s helpers `P`, `R`, `A`, and `rowColsDefault`.
- **Tiers:** `isPhone` (<640), `isCardTier` (<768), `isTightTable` (768–1023), `isNarrow` (<1024), `navIsExpanded`.

**Constants:** `TONE`, `E.status`, `FAIL_SIM` (shape), `FAIL_GENERIC`, `FAIL_MODES`, `H`, `D`, `now`.

---

## c. New and changed pieces

### Template (see `new-styles.css` for every declaration)
| Where | What |
|---|---|
| 495–524 | Overview *Open tasks* card: wrapped in `<sc-if showTasksCard>`; description text changed; rows (510) changed from `<div>` to `<button onClick="{{ t.go }}">` with the Needs attention row styling, a chevron, and `when` coloured by `{{ t.whenFg }}`. |
| 668–681 | Tasks tab strip `<sc-if pgTasks>`: `taskTabs` (new bindings `t.pad`, `t.iconDisplay`) and "Times in Tallinn time." |
| 824 | List table link cell: second sub-line `<sc-for c.extraSubs>` (used for "from …"). |
| 838–846 | List table cell kind `c.isProgress` ("1 of 4 done" + bar). |
| 847–864 | List table cell kind `c.isSteps` (Your step with Mark done / Done + Undo). |
| 967–1015 | Phone task cards `<sc-if list.showTaskCards>` / `list.taskCards`. |
| 1060–1061 | Hero fact value: `h.isPlain` (colour now `{{ h.fg }}`, was `var(--fg)`) and new `h.isLink` (quiet dark link). |
| 1097 | Record banner body wrapped in `<sc-if detail.bannerHasBody>` (style unchanged). |
| 1117–1119 | Panel kind `p.hasText` (Description). |
| 1120–1138 | Panel kind `p.hasSteps` (numbered step rows). |
| 1418–1464 | Dialog section kind `sec.hasSteps` (step rows, Add step, hint, empty note). |

### Constants
| Line | Name |
|---|---|
| 1702–1703 | `FAIL_SIM['task-create']`, `FAIL_SIM['task-edit']` |
| 1813 | `dayAt(n, h, m)`, a local wall-clock seed time |
| 1814 | `todayLater()`, a seed time later today |
| 1816 | `WS(...)`, the seed step builder |
| 1818–1823 | `TASK_ABOUT`: the four About kinds `{ id, label, field, noun }` |
| 1824 | `TASK_STATUS`: status → `[label, tone, dot shape]` |
| 1954 → the line before `transfers: [` | `DB.tasks`, eight seed tasks (see mock-data.json) |
| 2030, 2560 | storage version bumped `'rwrent-21'` → `'rwrent-22'` |

### Navigation, Overview, header
| Line | Change |
|---|---|
| 2149 | Tasks nav item gains `companyOnly:true` and `badge: this.tasksTodo().length` |
| 2167 | nav filter hides `companyOnly` items for the System Administrator |
| 2168 | route `task` marks Tasks active |
| 2296 | `metricsModel`: the *Open tasks* tile is hidden for the System Administrator, its value is the to-do count, its unit is "to do", and it opens Tasks |
| 2302–2315 | `tasksModel()` rewritten: Overview rows built from `tasksTodo()` (sample rows removed) |
| `simpleModel` | the `tasks` branch was removed (Tasks is no longer a stub page) |
| 2394 | `headerModel` `tasks`: new description and the **New task** action |
| 2475–2480 | `headerModel` `task`: crumbs `Tasks › <title>` and the description "Times in Tallinn time." |
| 2484 | crumbs: an optional 3rd element carries the tab back to Tasks |

### Task functions (all new, 2193–2267)
- `isSysAdmin()`
- `userName(id)`
- `taskPeople()`
- `taskVisible(t, uid)`
- `canToggleStep(t, s, uid)`
- `taskAbout(t)` (2203–2214)
- `aboutOptions(kind)` (2215–2223)
- `dueInfo(iso)` (2225–2231)
- `tasksTodo(uid)` (2233–2242)
- `taskTab()` (2243)
- `taskDueKey(t, tab, me)` (2245–2249)
- `taskRows(tab)` (2250–2260)
- `taskTabs()` (2261–2267)

### Dialogs
| Line | Name |
|---|---|
| 2548–2552 | `openDialog` form seeds: `task-create`, `task-edit`, `task-cancel` |
| 2635 | `SEC` defaults: `hasSteps`, `steps`, `noSteps`, `addStep`, `stepsHint`, `stepsEmpty`, `stepCols`, `stepBtn`, `addH` |
| 3072–3104 | `dialogModel` entries `task-create` / `task-edit` |
| 3105–3113 | `dialogModel` entry `task-finish` |
| 3114–3116 | `dialogModel` entry `task-cancel` (its Keep task button carries `keep:true`) |
| 3123 | stale-record mapping also leaves buttons flagged `keep` enabled |
| 3592–3598 | `setStep`, `addStep`, `removeStep`, `moveStep` |
| 3599–3606 | `toggleStep(tid, sid)` |
| 3607–3640 | `submitTask(t, id)` |
| 3641–3650 | `submitTaskClose(kind, id)` |

### Shared helpers extended (existing callers unaffected)
| Line | Change |
|---|---|
| 3655–3657 | `cell()`: options `progress`, `steps`, `extra`; outputs `isProgress`, `hasBar`, `barPct`, `progressFg`, `isSteps`, `steps`, `extraSubs`; `isText` excludes the two new kinds |
| 3674, 3680, 3681 | `cell()`: option `tone` sets `fg` / `listFg` to the tone colour and `listWeight` to 500 |
| 3905–3969 | `listSpec` branch `tasks` (columns per tab, match, cells, `taskCard`, empty states) |
| 4420 | `listModel`: `countLabel` uses `spec.noun` ("task" / "tasks") |
| 4434–4435 | `listModel`: `showCards` excludes `spec.taskCards`; new `showTaskCards`, `taskCards` |
| 4548, 4569 | `P()`: `hasText`, `text`, `hasSteps`, `steps`; `isEmpty` also checks steps |
| 4581–4621 | `detailModel` branch `task` |

### renderVals
| Line | Change |
|---|---|
| 5316 | `showTasksCard` |
| 5319 | `tasksCount` unit "to do" |
| 5351 | `pgSimple` without `tasks` |
| 5353–5354 | `pgList` includes `tasks` (not for the System Administrator); `pgTasks`, `taskTabs` |
| 5358 | `pgDetail` includes `task` |
| 5396–5398 | hero facts get `isPlain`, `isLink`, `linkGo`, `fg`; `detail.bannerHasBody` |

### CSS
No stylesheet rule was added or changed. The new and changed inline declarations are transcribed verbatim, with line numbers, in `new-styles.css`.

---

## d. Behaviour as built

**Who sees what**
- **Visibility:** a task without steps is seen by its creator only. A task with steps is seen by its creator and by every person on its steps. The System Administrator sees no tasks.
- **My tasks:** open tasks the signed-in person created.
- **Involving me:** open tasks someone else created in which the person has at least one step, done or not.
- **Finished:** Finished and Cancelled tasks the person can see, whether they created it or had a step in it.
- **Tab counts:** the number of rows in each tab, before search and filter.

**The count**
- **Count on Tasks:** the person's steps not yet done in open tasks, plus their own open tasks that have no steps. The Overview tile and card use the same items.

**Order and search**
- **Order, My tasks:** by due date, earliest first (overdue therefore first), tasks without a due date last; ties are broken newest created first.
- **Order, Involving me:** the same, but the date used is the person's earliest open step due date. When they have no open step with a due date, the task's own due date is used.
- **Order, Finished:** most recently closed first.
- **Order, Overview and count:** each item's due date, earliest first, none last, ties newest first. A step's due date is its own, or the task's when the step has none.
- **Search:** case-insensitive substring over the task title, all step titles, and the About label, which includes the kind word, e.g. "Vehicle · 204 JLM".

**Due filter** (applied to the same date the tab orders by)
- **Any due date:** everything.
- **Overdue:** the date has passed.
- **Due in the next 7 days:** from now up to now + 7 × 24 h. This includes later today and excludes overdue.
- **No due date:** no date.

**Finish and Cancel**
- **Finish:** status Finished, closed time now. Steps still open stay not done. Everything becomes read-only, and the task leaves every open list and every count.
- **Cancel:** status Cancelled, closed time now, the optional "Why" note (trimmed; stored as null when empty). The steps and their done marks stay exactly as they were. The task stays readable under Finished.

**Who may change what**
- **Mark done:** the creator on any step. The step's person on their own step. Only while the task is open.
- **Undo:** the creator on any step. The step's person only for a mark they made themselves. Only while the task is open.
- **Who may Edit, Finish or Cancel:** the creator only, while open. Everyone else sees no task actions.
- **Last updated:** marking or undoing a step also sets the task's `updatedAtUtc` / `updatedByUserId`.

**Edit and done steps**
- **Renamed:** keeps its done mark (`doneAtUtc` / `doneByUserId`).
- **Moved:** keeps its done mark; `position` follows the new order.
- **Given to another person:** keeps its done mark, made by the original marker.
- **Removed:** the step and its mark are gone.

**Dates**
- **Due-date rule:** when the task has a due date, no step may be due later ("A step cannot be due after the task."). Equal is allowed. When the task has none, steps may have any due date.
- **Overdue and due today:** overdue means the due time has passed (bad tone). Due today means later today (warn tone). Tones apply only to open tasks and open steps.

**The dialog lists**
- **About kinds:** Vehicle offers every vehicle ("plate · make model"), Customer every customer, Driver every driver. Rental assignment offers every assignment, any status ("plate · customer · status"). In the first three, inactive records are included with " · inactive".
- **Person list:** users of the Company who are Active, excluding the System Administrator: Signe Priede, Karlis Zvaigzne, Dita Smite and Toms Rudzitis. "(you)" follows the signed-in person's name. When editing, a step's current person who is no longer offered is still shown.

**After Create**
- **After Create:** the new task's page opens, and its breadcrumb leads back to My tasks.

---

## e. Layout values per tier

Tiers in the prototype:
- phone <640
- card tier <768
- folded table 768–1023
- rail overlay <1024
- rail expanded by default ≥1280

Content padding is `22px 26px 40px` at 1512, `16px` at 834 and at 402.

**1512, rail collapsed** (rail 64 px; content column ≈1396 px)
- **List:** table. Cells `11px 14px`; the first and last column clear the panel by 22 px; head `10px`, mono 10.5 px uppercase.
  - My tasks and Finished: Task (auto), Steps 170, People 240, Due / Closed 170; min width 800.
  - Involving me: Task (auto), Steps 150, Your step 290, People 200, Due 170; min width 1020.
  - Nothing folds.
- **Tab strip:** padding 4, tabs `8px 13px` with icon; "Times in Tallinn time." right-aligned.
- **Hero band:** one row with the chip, then Created by · Due · About · Progress, then Edit · Finish task (primary) · Cancel task.
- **Task page:** panels full width (one column). Step rows: `13px 17px`; number 26×26; text block `flex:1 1 200px`; chip and button right; button `7px 12px`.
- **Record panel:** facts `auto-fit minmax(210px,1fr)`.
- **Dialog:** New/Edit 720 px wide, Finish 500, Cancel 520; padding `48px 24px`. Section Task in two columns: Title and Description span both, then Due | About, then the record select spanning both.
- **Dialog step rows:** inset card, padding 12; number 26 px; fields grid `1fr 1fr` (Title spans; Person | Due); vertical ↑ ↓ ✕ buttons 30×30.
- **Overview:** three columns (≥1400); the Open tasks card is in the first column.

**834** (rail as overlay; content ≈802 px)
- **List:** folded table. Cells `9px 9px`, outer 16 px, head wraps; fixed widths × 0.71.
  - My tasks and Finished: Steps 121, People 170, Due / Closed 121; min width 568.
  - Involving me: Steps 107, Your step 206, Due 121, People folded; min width 582. People folds as a sub-line under Steps.
- **Tab strip:** as desktop.
- **Hero band:** row one has the chip and the buttons (right); row two has the four facts spread `space-between`.
- **Record panel:** facts `repeat(2,minmax(0,1fr))`.
- **Dialog:** padding 16 px, same widths (720 fits). Section Task fields stack in one column. Step rows keep `1fr 1fr` (Person | Due) and 30 px buttons.
- **Overview:** one column.

**402** (content ≈370 px)
- **List:** cards (see below). The pager stays.
- **Tab strip:** icons hidden, tabs `8px 11px`, all three fit.
- **Hero band:** chip; facts one per row; buttons full width, one per row.
- **Task page:** step rows wrap (chip and button move under the text); step button min-height 44.
- **Record panel:** facts one column.
- **Dialog:** the bottom sheet (full width, radius 18 18 0 0, max height 92vh). Footer buttons stack full width. Fields in one column.
- **Dialog step rows:** Title, Person, Due stacked; ↑ ↓ ✕ 44×44 in a column on the right; Add step min-height 44.
- **Phone task card:** padding `14px 16px`, gap 11.
  - Row one: the title as the quiet dark link with sub-lines (record, "from …"); the chip on Finished only.
  - Then a two-column fact grid: Steps (text + bar, max 140 px) | Due or Closed.
  - Involving me adds "Your step(s)": one inset box per step (`10px 12px`) with title, due and Done, and a full-width 44 px Mark done / Undo button. Tapping the card opens the task.

Progress bar in all tiers: 4 px high, radius 2, track `var(--surface-3)`, fill `var(--ok)`; max width 112 in the table.

---

## f. Copy deck

"·" is U+00B7 and "’" is U+2019, as in the file. `<…>` is a runtime value.

**Navigation and Overview**
- **Navigation item:** `Tasks`, with the count as a number.
- **Overview tile:** label `Open tasks`, value `<n>`, unit `to do`.
- **Overview card title:** `Open tasks`
- **Overview card description:** `Your open steps and your own tasks, earliest due first. Times in Tallinn time.`
- **Overview card count:** `<n> to do`
- **Overview card empty state:** `No open tasks`
- **Overview card rows:**
  - Title: the step's or the task's title.
  - Sub-line: `<Kind> · <record>` and, when someone else created it, `· from <name>`. A step without a record shows its task's title.
  - When: `Overdue · 23 Sep` / `Due today · 17:00` / `27 Sep, 12:00` / `No due date`

**Tasks page: header, tabs, filters**
- **Title:** `Tasks`
- **Description:** `Your tasks, and the steps others have given you. Only a task’s creator changes or finishes it.`
- **Header button:** `New task`
- **Tabs:** `My tasks` · `Involving me` · `Finished`, each followed by its count.
- **Line beside the tabs:** `Times in Tallinn time.`
- **Search placeholder:** `Task, step or record`
- **Due filter:** label `Due`; options `Any due date` · `Overdue` · `Due in the next 7 days` · `No due date`
- **Clear filters and count:** `Clear filters` · `<n> task` / `<n> tasks`

**Tasks page: table**
- **Column heads:** `Task` · `Steps` · `Your step` · `People` · `Due` · `Closed`
- **Task cell sub-lines:**
  - `Vehicle · 204 JLM` · `Customer · Martins Ozols` · `Driver · <name>` · `Rental assignment · 552 KLM · Nordwind Logistics`
  - A record that no longer exists: `<Kind> · deleted record`
  - `from <name>`
- **Steps cell:** `<d> of <n> done` · `No steps`
- **Your step cell:**
  - Due line: `Overdue · 23 Sep` · `Due today · 17:00` · `Due 25 Sep, 10:00` · `No due date`
  - State and buttons: `Done` · `Mark done` · `Undo`
- **People cell:** `Signe Priede, Toms Rudzitis +1` · `—`
- **Due cell:** `Overdue · 23 Sep` · `Due today · 17:00` · `27 Sep, 12:00` · `—`
- **Closed cell:** chip `Finished` / `Cancelled`, with the date and time under it.

**Tasks page: empty states and phone cards**
- **My tasks:** `No open tasks` / `Press New task to write down what must not be forgotten.` / button `New task`
- **Involving me:** `Nobody is waiting on you` / `When someone gives you a step in their task, it appears here.`
- **Finished:** `Nothing finished yet`
- **No results:** the prototype's shared state (`No results for these filters` / `Nothing matches the current search and filters. Clearing them restores the full list.` / `Clear filters`).
- **Phone card labels:** `Steps` · `Due` · `Closed` · `Your step` · `Your steps` · `No due date`

**Task page**
- **Breadcrumb:** `Tasks › <title>`. The header title is the task's title; the description is `Times in Tallinn time.`
- **Status chip:** `Open` · `Finished` · `Cancelled`
- **Facts:**
  - `Created by` with `<name>` and the time under it.
  - `Due` with `<time>` or `No due date`; the sub-line is `Overdue` or `Due today`.
  - `About` with `<Kind> · <record>` as a link, or `Nothing`.
  - `Progress` with `<d> of <n> steps done` or `No steps`.
- **Actions:** `Edit` · `Finish task` · `Cancel task`
- **Banners:**
  - Finished: `Finished by <name> on 22 Sep, 16:02`
  - Cancelled: `Cancelled by <name> on 21 Sep, 10:15`, with the reason under it, or `No reason given.`
- **Description panel:** title `Description`.
- **Steps panel:**
  - Title: `Steps`
  - Description: `In the order you set. Steps do not wait for each other.` (creator) / `In the order the creator set. Steps do not wait for each other.` (others)
  - Person: `<name>`, with ` (you)` after the signed-in person.
  - Due line: `Overdue · 23 Sep` · `Due today · 17:00` · `Due 26 Sep, 16:00` · `No due date`
  - State chip: `Done · <name>, 23 Sep, 14:10` · `Open`
  - Buttons: `Mark done` · `Undo`
  - Empty: `No steps` / `This task is yours alone.`
- **Record panel:** title `Record`; `Created` (sub-line `by <name>`); `Last updated` (value `Never`, or the time with the sub-line `by <name>`).
- **Not visible to the person:** header `Task`, panel `Task`, `This task is not shared with you` / `A task is seen by its creator and by the people named on its steps.`

**New task / Edit task dialog**
- **Titles:** `New task` · `Edit task`
- **Section `Task`:**
  - `Title` required
  - `Description` · optional
  - `Due` · optional
  - `About` · optional, options `Nothing` · `Vehicle` · `Customer` · `Driver` · `Rental assignment`
  - The record field, labelled with the kind name, required. Its first option is `Choose a vehicle` / `Choose a customer` / `Choose a driver` / `Choose a rental assignment`.
  - Record option texts: `204 JLM · Hyundai Kona Electric` (with ` · inactive` for inactive records) · `552 KLM · Nordwind Logistics · Active`
- **Section `Steps`:**
  - Fields: `Title` required · `Person` required (first option `Choose a person`; `<name> (you)`) · `Due` · optional
  - A done step shows `Done · <name>, <time>`.
  - Button labels (aria-label and title): `Move step up` · `Move step down` · `Remove step`
  - `Add step`
  - Hint: `Everyone named on a step sees this task and can mark their own step done. Only you change or finish the task.`
  - Without steps: `No steps: the task stays yours alone.`
- **Buttons:** `Cancel` · `Create task` / `Save changes`
- **Field errors:**
  - `Enter a title for the task.`
  - `Choose the vehicle this task is about.` (and the same for customer, driver and rental assignment)
  - `Every step needs a title.`
  - `Every step needs a person.`
  - `A step cannot be due after the task.`
- **Refusals from the data:** `This task no longer exists.` · `This task was finished or cancelled and can no longer be changed.` · `Only the task’s creator can change it.`
- **Simulated refusals:**
  - Create: field `The title must be at most 200 characters.`; conflict `The record this task is about was deleted moments ago. Choose another one or none.`
  - Save: field `The title must be at most 200 characters.`; conflict `The task was finished or cancelled while you had this open.`
  - The refusal and stale banners use the shared titles (`This change was refused`; `This record changed while you had it open.` / `Refresh to load the current values, then save again.` / `Refresh`).

**Finish task dialog**
- **Title:** `Finish task`
- **All steps done:** `Finish this task? It leaves everyone’s open list.`
- **Steps still open** (warn banner): title `<n> steps are not done: Car wash (Toms Rudzitis), Handover (Dita Smite).` (for one step: `1 step is not done: …`), body `Finish anyway?`
- **Consequences list:** `It stays readable under Finished for everyone on it.` · `Its steps can no longer be marked done or undone.`
- **Buttons:** `Cancel` · `Finish task`
- **Refusals:** `This task was already finished or cancelled.` · `Only the task’s creator can finish or cancel it.` · the shared generic `The API refused this change because the record no longer accepts it.`

**Cancel task dialog**
- **Title:** `Cancel task`
- **Description:** `The task moves to Finished as Cancelled. Everyone on it can still read it there.`
- **Field:** `Why` · optional
- **Buttons:** `Keep task` · `Cancel task`

**Toasts**
- `Task created` / `Everyone named on a step can see it now.` or `Only you can see it.`
- `Task saved`
- `Task finished` / `It moved to Finished.`
- `Task cancelled` / `It moved to Finished.`
- `Step done` / `<step title>`
- `Step open again` / `<step title>`
- `Not available` / `Only the task’s creator, or the step’s person for their own mark, can change this step.`

---

## g. Invented beyond the brief

**Mock data**
- Descriptions on three seed tasks (wt1, wt2, wt5).
- Every time of day on the seed dates, and the seed created and updated stamps.
- The mock stores `updatedAtUtc` / `updatedByUserId` and a numeric `status` (1/2/3), as the other mock records do.
- `todayLater()`, so the due-today seed never turns overdue while you review.

**Rules**
- The Involving me order and Due filter use the person's earliest open step due date. The Due column still shows the task's own date.
- On the Overview, a step without a due date uses the task's due date.
- "from <name>" also shows on Finished rows that someone else created.
- Undo on the step's person's side is limited to the marks they made.
- Marking or undoing a step updates the task's Last updated.
- A done step keeps its mark when it is given to another person.
- About offers inactive records too, marked " · inactive".
- Karlis Zvaigzne is offered as a step's person (an Active Company user who is not a persona).

**Copy**
- The "Due " prefix on step due dates that are neither overdue nor today, and "Due today · HH:MM".
- The column name `Closed` on Finished.
- The Steps panel descriptions.
- The Finish dialog's consequences list.
- The Cancel dialog's description and the `Keep task` label.
- All error, refusal and toast texts listed in f, apart from "A step cannot be due after the task."
- `Your steps` for several steps.
- The fallback sub-line on the Overview card.
- The "not shared with you" state.
- The **New task** button inside the My tasks empty state.

**Look**
- Tab icons: person, group, inventory_2.
- Overview row icons: checklist for a step, task_alt for a task without steps.
- The tone of the Open chip (info, square dot).
- The cancelled banner in mute tone with the reason on its own line.

**Prototype plumbing**
- The storage version bump to `rwrent-22`.
