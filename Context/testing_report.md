# RW-Rent independent test report — run 2

## 1. Summary

**Status:** In progress. Run 2 began on 2026-09-17. This report is being written during the run and is the continuation record if the testing session restarts.

The run covers the full standing brief plus §13: adversarial retesting of every run-1 fix, a first-start rehearsal on an empty developer database, browser completion of workflows that run 1 exercised only through the API, and the unchanged run-1 regression suites.

Finding counts and the owner's three priorities will be finalized after all layers and the final replacement seed.

## 2. Findings

### 2.1 Run-1 findings under retest

| Run-1 id | Former result | Run-2 result | Run-2 evidence |
|---|---|---|---|
| T-001 | Major frontend defect: guarded route exposed System Administrator page | Preliminary pass; adversarial retest continues | The canonical route is locked for all three ordinary roles and makes no page request; alternate spellings and all guarded routes remain under attack. |
| T-002 | Minor backend defect: validation responses failed documented `oneOf` | **Fixed** | All 142 documented `400` media types use `anyOf`; 97 live validation samples across 42 operations produced zero schema failures. |
| T-003 | Minor backend defect: spaced valid VIN failed before normalization | Retest pending | Create, update, duplicate and boundary normalization are scheduled. |
| T-004 | Minor frontend defect, later rated Major: rapid submission sent duplicate writes | Retest pending | Multi-gesture dialog and public-form sweep is scheduled. |
| T-005 | Minor frontend defect: same-tab link arrival retained stale success | Retest pending | Same, altered, spent and second-valid link sequences are scheduled. |
| T-006 | Owner question: under-age drivers could be authorized | Retest pending | AUTH-011 and DRIVER-012 paths and race are scheduled. |

### 2.2 New run-2 findings

No new finding recorded yet.

## 3. Coverage

### 3.1 Run-2 focus and regression ledger

| Layer | Status | Evidence / next boundary |
|---|---|---|
| Run-1 fixes attacked | In progress | T-002 is fixed; canonical T-001 route passed; the deeper route, submission, link and new-rule attacks continue. |
| Empty-database first start | Pending | Authorized drop/recreate rehearsal follows the first seeded regression checkpoint. |
| App-only completion scenarios | Pending | Private customer, double booking, staff lifecycle, transfer acceptance, corrections, password/email changes, filters/navigation and uninterrupted phone day. |
| API endpoint × role regression | Complete | All 82 operations called as four roles and anonymous; authorization reached the expected boundary, every protected anonymous call was `401`, and public operations remained public while signed in. |
| Rule regression | Pending | Current catalogue includes AUTH-011, DRIVER-012 and INTERRUPT-014. |
| Route × role × width × theme regression | Pending | 1512, 834 and 402 px in light and dark. |

### 3.2 Endpoint and role matrix

Status codes are the exact live responses. For write probes, `400`/`404`/`409` means authorization passed and validation or state handling was reached; `403` means the role was refused.

| Operation | System Administrator | Company Principal | Fleet Manager | Viewer | Anonymous |
|---|---:|---:|---:|---:|---:|
| `GET /health` | 200 | 200 | 200 | 200 | 200 |
| `GET /api/users` | 200 | 200 | 200 | 200 | 401 |
| `GET /api/users/{userId}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/users/{userId}/name` | 400 | 400 | 403 | 403 | 401 |
| `POST /api/users/{userId}/activate` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/users/{userId}/reject-registration` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/users/{userId}/reopen-registration` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/users/{userId}/suspend` | 404 | 404 | 403 | 403 | 401 |
| `POST /api/users/{userId}/restore` | 404 | 404 | 403 | 403 | 401 |
| `GET /api/users/{userId}/sessions` | 200 | 200 | 403 | 403 | 401 |
| `DELETE /api/users/{userId}/sessions/{sessionId}` | 404 | 404 | 403 | 403 | 401 |
| `POST /api/users/{userId}/sessions/revoke-all` | 404 | 404 | 403 | 403 | 401 |
| `GET /api/rental-assignments/{assignmentId}/authorizations` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/rental-assignments/{assignmentId}/authorizations` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/stop` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/correction` | 400 | 403 | 403 | 403 | 401 |
| `GET /api/rental-assignments/{assignmentId}/interruptions` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/rental-assignments/{assignmentId}/interruptions` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{assignmentId}/interruptions/{interruptionId}` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/correction` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/end` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/auth/antiforgery` | 200 | 200 | 200 | 200 | 200 |
| `POST /api/auth/login` | 401 | 401 | 401 | 401 | 400 |
| `POST /api/auth/logout` | 204 | 204 | 204 | 204 | 204 |
| `POST /api/auth/password-reset/request` | 204 | 204 | 204 | 204 | 400 |
| `POST /api/auth/password-reset/complete` | 400 | 400 | 400 | 400 | 400 |
| `POST /api/companies` | 400 | 403 | 403 | 403 | 401 |
| `GET /api/companies` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/companies/{id}` | 400 | 400 | 400 | 403 | 401 |
| `DELETE /api/companies/{id}` | 404 | 403 | 403 | 403 | 401 |
| `GET /api/customers` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/customers` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/customers/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/customers/{id}` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/customers/{id}/activate` | 404 | 404 | 404 | 403 | 401 |
| `POST /api/customers/{id}/deactivate` | 404 | 404 | 404 | 403 | 401 |
| `GET /api/drivers` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/drivers` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/drivers/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/drivers/{id}` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/drivers/{id}/authorizations` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/drivers/{id}/activate` | 404 | 404 | 404 | 403 | 401 |
| `POST /api/drivers/{id}/deactivate` | 404 | 404 | 404 | 403 | 401 |
| `GET /api/interruptions` | 200 | 200 | 200 | 200 | 401 |
| `GET /api/me` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/me/phone` | 400 | 400 | 400 | 400 | 401 |
| `POST /api/me/password` | 400 | 400 | 400 | 400 | 401 |
| `POST /api/me/email-change` | 400 | 400 | 400 | 400 | 401 |
| `POST /api/me/email-change/confirm` | 400 | 400 | 400 | 400 | 401 |
| `GET /api/me/sessions` | 200 | 200 | 200 | 200 | 401 |
| `DELETE /api/me/sessions/{sessionId}` | 404 | 404 | 404 | 404 | 401 |
| `POST /api/me/sessions/revoke-others` | 200 | 200 | 200 | 200 | 401 |
| `GET /api/overview/summary` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/registrations` | 400 | 400 | 400 | 400 | 400 |
| `POST /api/registrations/email-confirmation/resend` | 202 | 202 | 202 | 202 | 400 |
| `POST /api/registrations/email-confirmation/complete` | 400 | 400 | 400 | 400 | 400 |
| `GET /api/rental-assignments` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/rental-assignments` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/rental-assignments/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/rental-assignments/{id}` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{id}/corrections/parties` | 400 | 403 | 403 | 403 | 401 |
| `PUT /api/rental-assignments/{id}/corrections/timeline` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/rental-assignments/{id}/activate` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/rental-assignments/{id}/end` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/rental-assignments/{id}/cancel` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/users/{userId}/roles` | 200 | 200 | 403 | 403 | 401 |
| `POST /api/users/{userId}/roles` | 400 | 400 | 403 | 403 | 401 |
| `PUT /api/users/{userId}/roles/{assignmentId}/expiry` | 404 | 404 | 403 | 403 | 401 |
| `POST /api/users/{userId}/roles/{assignmentId}/revoke` | 400 | 400 | 403 | 403 | 401 |
| `GET /api/security-audit` | 200 | 200 | 403 | 403 | 401 |
| `GET /api/security-audit/{id}` | 200 | 200 | 403 | 403 | 401 |
| `GET /api/system-administrator/transfers` | 200 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers/{transferId}/resend` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers/{transferId}/cancel` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers/accept` | 400 | 400 | 400 | 400 | 400 |
| `GET /api/vehicles` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/vehicles` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/vehicles/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/vehicles/{id}` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/vehicles/{id}/activate` | 404 | 404 | 404 | 403 | 401 |
| `POST /api/vehicles/{id}/deactivate` | 404 | 404 | 404 | 403 | 401 |

The final report will replace the remaining in-progress ledger rows with the complete rule, route and §9 scenario matrices.

Contract checks also covered success/error response schemas, pagination and filter boundaries, content types, unsupported methods and CORS. The only harness mismatch was its use of a rental-assignment id in the role-assignment path while probing malformed content; the API correctly returned that nonexistent role assignment as `404`. This is not a product finding.

## 4. Not tested and why

Testing is in progress. Final limitations will be recorded here without treating unrun work as a pass.

## 5. Questions for the owner

None yet.

## 6. Environment

- Test date: 2026-09-17; workstation zone Europe/Tallinn.
- API worktree: `/Users/zulf/rw-rent-api/RWRentApi-wiring`, branch `feature/backend-wiring`, commit `184e4566f2056d3a73fa14b66f84350ec0c24caf` (`Backlog: round 3 reviewed, its live checks run by the reviewer; the birth-date race recorded for the next round`).
- App worktree: `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`, commit at start `ab5cec13b7c60981589c54ad6794fe22ca39cd68` (`Follow-up 5 verified and implemented; next is testing run 2`).
- Initial replacement seed completed at 2026-09-17 06:24:41 UTC with 12 application users including the technical actor, 11 identity accounts, 8 role assignments, 15 sessions, 5 confirmation challenges, 13 audit entries, 1 administrator transfer, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations and 4 interruptions. Mailpit was cleared.
- API and app processes were verified running from the two wiring worktrees on ports 5001 and 5173 before testing.
- The live OpenAPI 3.1.1 contract contains 82 operations and 103 component schemas.
- Run-1 scripts and evidence are retained outside the worktrees under `/Users/zulf/rw-rent-api/testing-scratch/`; run-2 evidence will remain there.

## 7. Dataset state at the end

Not final. A replacement seed is required after every destructive phase and again at the end; both wiring applications must remain running.
