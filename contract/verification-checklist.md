# Prototype-fidelity verification checklist

How the final side-by-side pass runs, and who does what. This file lives in `contract/` because
deliveries rsync over everything else.

## Division of labor

- **Claude (reviewer)** — everything functional, every delivery: typecheck, vitest, driving every
  page/dialog/button in the browser, persona variants, failure simulator (field errors, 409
  conflict, 409 stale), overflow measurement at 375/768/1024/1440, light+dark. No user action
  needed for any of this. Ruling (settled 2026-08-27 after the Overview mobile pair): no horizontal
  page scroll at any tier, in either app — where the prototype overflows on small screens, that is
  a prototype bug to fix, not a behavior to port.
- **Claude Design (builder)** — self-checks each screen side-by-side against the prototype at the
  same viewport before zipping ("port, don't recreate"), plus the queued re-audit of all delivered
  screens.
- **User** — screenshot pairs only. The prototype runs where only you can see it, so pixel
  comparison needs your pairs. Per delivery: a few pairs for what changed. The full sweep below:
  once, at the end, when the queue is empty.

## Traversal order (decided 2026-08-27)

Section by section, each section taken across every device to completion before the next section
starts: desktop first, then tablet (768 / 1024), then phone (375). A closed section is never
reopened. Closed sections: **Overview + System Administrator** (2026-08-27 — desktop, iPad
portrait/landscape, phone, both themes; transfers table nofold band, collapsed-rail scroll and the
sr-only phantom-pan fix all verified). Current section: **Rental assignments** (since 2026-08-29) — the list page closed 2026-09-01 on
all devices (Deliveries 22–25: shared list gutter, Cancelled chip tone, folded-band fit, phone card
composition); the assignment record's desktop tier closed 2026-09-06 at 1280, 1512 and 2560 (Deliveries 26–35: hero band and its proportional gaps, record fidelity, panel empty states, one-line row actions and Cancel gating, fit-before-pan tables with ACTIONS headers, Lifecycle on one row, row navigation, PERIOD row identifier); the record's portrait tier (834) closed 2026-09-08 (Deliveries 36–39: two-row hero, labelled fold recipe for the two record tables, dialog ports); landscape (1194) closed 2026-09-08 (Delivery 43: panel-width container queries for the record tables and the Lifecycle grid, both rail states); phone (402, iPhone 16 Pro) closed 2026-09-08 (Delivery 44: cards for the two record tables, scrollbar-free tab strip). The Rental assignments section — list and record — is CLOSED on all devices. Current section: **Vehicles** (since 2026-09-08) — desktop tier CLOSED 2026-09-08 at 1280/1512/2560 in both rail states (Deliveries 45–46: Specifications pinned to two rows of four, history table on the panel recipe with its declared widths sharing the spare width, plate identifier in full-strength ink on the list, Add vehicle current-year default, aria-invalid on erroring controls; list, hero and the four dialogs verified as delivered); portrait tier CLOSED 2026-09-09 at 834 and 768 (Delivery 47: Availability column 260px so the Reserved sub-line fits, one spec line in the folded stack, the record's Ends column kept through portrait via foldPhone/showPhone, customer name as an accent link at rest) with landscape 1194 measured clean in both rail states; phone tier CLOSED 2026-09-09 at 402 (Deliveries 48–49: the record's Rental history as cards, the card plate in the mono identifier face, the shared card treatments in ui/cards.module.css, and the right column of every card's facts right-aligned — applied app-wide, the closed Rental assignments cards and the assignment record's cards included and re-measured). The Vehicles section — list, record and dialogs — is CLOSED on all devices. Current section: **Customers** (since 2026-09-09) — list page closed on desktop (1512 both rail states, 2560 user shot) and both iPad tiers (1194 both rail states, 834, 768) with Delivery 50 (Driver record column kept through portrait, folded phone in the mono face, 'Also a driver' a record link at every width); the list's phone tier closed with Delivery 51 (right-aligned right column on the customer cards), so the LIST is closed on all devices; the customer record's desktop tier closed 2026-09-09 (Delivery 51: accent mono plate link in the Assignments table, Driver link panel without the loading flash and with the fact-grid link, private Identity pinned to five on one row from 1024 up; measured at 1512, 1280 rail expanded, 1194 both rail states; dialogs Add/Edit both types/Deactivate/Activate verified); the record's portrait tier closed 2026-09-09 at 834 and 768 (Delivery 52: an odd last fact spans both columns in the two-column band — app-wide FactGrid rule, which also gave the closed assignment record's Lifecycle its seventh fact full width at 768–1023, re-measured; the Assignments table keeps Ends through portrait); landscape 1194 measured clean in both rail states; the record's phone tier closed 2026-09-10 at 402 (Delivery 53: the Assignments table as cards, plate as the accent mono title link, Starts / Ends with the right column right-aligned; 834 and 1512 unchanged). The Customers section — list, record and dialogs — is CLOSED on all devices. Current section: **Drivers** (since 2026-09-10) — list: phone tier closed 2026-09-10 (Delivery 55 cards with Personal identifier / Licence number / Phone); desktop and iPad tiers carry Personal ID and Licence number columns (Deliveries 54–55; the list projection's extra fields are optional in the DTO with a README backend follow-up) plus an Address column (Delivery 56); both iPad tiers closed 2026-09-10 (834: Driver 272 / 126 / 138 / Address 160 wrapping / 104; 1194 both rail states clean); desktop: one open item — the six columns share the panel's spare width proportionally instead of Driver taking it all (next prompt); the driver record and its dialogs follow. No open loose ends: Claude Design confirmed (Delivery 18 report) the prototype never had
the sr-only phantom pan — its actions header is an empty string, measured clean at 834 and 695.

## Pair convention

Same viewport for both shots. Prototype = PROTOTYPE tab on the right edge. React app = PROTOTYPE
pill in the bottom-right corner. Dark theme is the default; shoot dark unless the row says light.
One width is enough (your half-32" width); add ultrawide only where a row asks.

## Final sweep — pages (one pair each)

- [x] Overview  (closed 2026-08-27 via the section traversal, all devices)
- [ ] Needs attention
- [x] Rental assignments (list)  (closed 2026-09-01 via the section traversal, all devices)
- [ ] Tasks
- [ ] Insurance cases
- [x] Vehicles (list)  (closed 2026-09-09 via the section traversal, all devices)
- [x] Customers (list)  (closed 2026-09-09 via the section traversal, all devices)
- [ ] Drivers (list)
- [ ] User directory  (+ one pair as Viewer persona — shorter list)
- [ ] Registrations
- [ ] Security audit (list)
- [ ] Company profile  (when delivered)
- [x] System Administrator  (closed 2026-08-27 via the section traversal, all devices)

## Final sweep — record pages / tabs

- [ ] User record — Account tab
- [ ] User record — Roles tab
- [ ] User record — Sessions tab
- [x] Rental assignment record — summary  (closed 2026-09-08 via the section traversal, all devices)
- [x] Rental assignment record — authorizations tab  (closed 2026-09-08 via the section traversal, all devices)
- [x] Rental assignment record — interruptions tab  (closed 2026-09-08 via the section traversal, all devices)
- [x] Vehicle record  (closed 2026-09-09 via the section traversal, all devices)
- [x] Customer record  (closed 2026-09-10 via the section traversal, all devices)
- [ ] Driver record  (when delivered)
- [ ] Audit entry

## Final sweep — dialogs (open the dialog, one pair each)

- [ ] Activate registration (roles + expiry rows)
- [ ] Reject registration (reason)
- [ ] Reopen registration (reason)
- [ ] Correct name (user record)
- [ ] Stale banner inside any dialog (arm "Stale record (409)" in the PROTOTYPE panel)
- [ ] Field-error state inside any dialog (arm "Field errors")
- [ ] Session revoke confirmation
- [ ] Assignment timeline correction  (when delivered)
- [ ] Authorization add/end  (when delivered)
- [ ] Interruption open/close  (when delivered)
- [ ] Customer deactivation guard  (when delivered)

## Light-theme spot checks (2–3 pairs, not the whole sweep)

- [ ] Overview, light
- [ ] One list page, light
- [ ] One dialog, light

## Already settled — do not re-verify by hand

Business rules, error envelope shapes, concurrency codes, payload casing, permission gating,
orderings, time-zone rules: encoded in `business_rules.md`, `swagger.json`, the README, and the
vitest suite; checked by the reviewer every delivery.
