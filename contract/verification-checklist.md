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
composition); the assignment record pages are next, starting from desktop. No open loose ends: Claude Design confirmed (Delivery 18 report) the prototype never had
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
- [ ] Vehicles (list)
- [ ] Customers (list)
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
- [ ] Rental assignment record — summary
- [ ] Rental assignment record — authorizations tab
- [ ] Rental assignment record — interruptions tab
- [ ] Vehicle record  (when delivered)
- [ ] Customer record  (when delivered)
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
