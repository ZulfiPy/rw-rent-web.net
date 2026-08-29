import {
  AssignmentDriverAuthorizationType, AssignmentStatus, CustomerType, enumName,
  AuthorizationStopReason, BillingImpact, InterruptionReason, SortDirection,
  type ActivateRentalAssignmentRequest, type AssignmentDriverAuthorizationResponse,
  type AssignmentInterruptionResponse, type AuthorizationsQuery,
  type CancelRentalAssignmentRequest, type CorrectDriverAuthorizationRequest,
  type CorrectInterruptionRequest, type CorrectRentalAssignmentPartiesRequest,
  type CorrectRentalAssignmentTimelineRequest, type CreateAssignmentInterruptionRequest,
  type CreateCustomerRequest, type CreateDriverRequest, type CreateRentalAssignmentRequest,
  type CustomerListItemResponse, type CustomerResponse,
  type CreateVehicleRequest, type CustomersQuery, type DriverListItemResponse, type DriverResponse,
  type DriversQuery,
  type EndAssignmentInterruptionRequest, type EndRentalAssignmentRequest,
  type InitialAuthorizationRequest, type InterruptionsQuery,
  type RentalAssignmentListItemResponse, type RentalAssignmentResponse,
  type RentalAssignmentsQuery, type StartAssignmentDriverAuthorizationRequest,
  type StopAssignmentDriverAuthorizationRequest, type UpdateRentalAssignmentRequest,
  type UpdateVehicleRequest, type VehicleListItemResponse, type VehicleResponse,
  type VehiclesQuery,
} from '@/api/dto';
import { writeAudit, type Payload } from '../audit';
import { newUuid } from '../ids';
import { byAsc, byDesc, contains, page } from '../paging';
import { displayNameOf } from '../seedFleet';
import { notFound, route, type Ctx } from '../transport';
import {
  codedValidation, conflict, fieldError, requireReason, requireText, staleConflict,
} from '../validate';

/**
 * Fleet reads and writes. Every projection is computed per request from the stored rows — a list
 * item never carries a copy of something the record owns.
 *
 * Vehicle, customer and driver writes are not audited: the backend audits security events, role and
 * registration transitions and privileged corrections, not ordinary fleet edits. What those writes
 * do carry is the refusal shape the record screens are built against — duplicate identifiers as
 * field errors, an in-progress assignment as a 409.
 */

const bool = (v: unknown) => String(v) === 'true';
const num = (v: unknown) => Number(v);
const has = (v: unknown) => v !== undefined && v !== '';
/** `Search` is one case-insensitive term across the fields swagger documents for that list. */
const matches = (search: string | undefined, ...fields: unknown[]) =>
  !search || fields.some((f) => contains(f, search));

/* vehicles -------------------------------------------------------------- */

/**
 * FOLLOW-UP: `upcomingCustomerDisplayName` / `upcomingPlannedStartAtUtc` are not in swagger. The
 * reviewed Vehicles list shows what a reserved vehicle is held for, so the mock resolves the next
 * planned assignment here; the real API would project it server-side.
 */
const upcoming = (ctx: Ctx, vehicleId: string) => {
  const next = ctx.store.assignments
    .filter((a) => a.vehicleId === vehicleId && a.status === AssignmentStatus.Planned && !!a.plannedStartAtUtc)
    .sort(byAsc((a) => a.plannedStartAtUtc ?? ''))[0];
  return {
    upcomingCustomerDisplayName: next?.customerDisplayName ?? null,
    upcomingPlannedStartAtUtc: next?.plannedStartAtUtc ?? null,
  };
};

route('GET', '/api/vehicles', (ctx) => {
  const q = ctx.query as VehiclesQuery;
  const rows = ctx.store.vehicles
    .filter((v) => (has(q.BodyType) ? v.bodyType === num(q.BodyType) : true))
    .filter((v) => (has(q.GearboxType) ? v.gearboxType === num(q.GearboxType) : true))
    .filter((v) => (has(q.FuelType) ? v.fuelType === num(q.FuelType) : true))
    .filter((v) => (has(q.Year) ? v.year === num(q.Year) : true))
    .filter((v) => (has(q.IsActive) ? v.isActive === bool(q.IsActive) : true))
    // Plate number, VIN, make and model.
    .filter((v) => matches(q.Search, v.plateNumber, v.vinCode, v.make, v.model))
    .sort(byAsc((v) => v.plateNumber))
    .map((v): VehicleListItemResponse => ({
      id: v.id,
      plateNumber: v.plateNumber,
      vinCode: v.vinCode,
      make: v.make,
      model: v.model,
      year: v.year,
      bodyType: v.bodyType,
      fuelType: v.fuelType,
      isActive: v.isActive,
      ...upcoming(ctx, v.id),
    }));
  return page(rows, q);
}, ['Vehicles.Read']);

route('GET', '/api/vehicles/{id}', (ctx) => {
  const found = ctx.store.vehicles.find((v) => v.id === ctx.params.id);
  if (!found) throw notFound('Vehicle not found.');
  return found;
}, ['Vehicles.Read']);

/* customers ------------------------------------------------------------- */

route('GET', '/api/customers', (ctx) => {
  const q = ctx.query as CustomersQuery;
  const rows = ctx.store.customers
    .filter((c) => (has(q.Type) ? c.type === num(q.Type) : true))
    .filter((c) => (has(q.IsActive) ? c.isActive === bool(q.IsActive) : true))
    // Individual and business names, personal or registration identifier, email.
    .filter((c) => matches(
      q.Search,
      c.firstName, c.lastName, c.companyName, displayNameOf(c), c.personalId, c.registrationCode, c.email,
    ))
    .map((c): CustomerListItemResponse => ({
      id: c.id,
      type: c.type,
      displayName: displayNameOf(c),
      email: c.email,
      phoneNumber: c.phoneNumber,
      driverId: c.driverId ?? null,
      isActive: c.isActive,
    }))
    .sort(byAsc((c) => c.displayName));
  return page(rows, q);
}, ['Customers.Read']);

route('GET', '/api/customers/{id}', (ctx) => {
  const found = ctx.store.customers.find((c) => c.id === ctx.params.id);
  if (!found) throw notFound('Customer not found.');
  return found;
}, ['Customers.Read']);

/* drivers --------------------------------------------------------------- */

route('GET', '/api/drivers', (ctx) => {
  const q = ctx.query as DriversQuery;
  const rows = ctx.store.drivers
    .filter((d) => (has(q.IsActive) ? d.isActive === bool(q.IsActive) : true))
    // First name, last name, email.
    .filter((d) => matches(q.Search, d.firstName, d.lastName, d.email))
    .sort(byAsc((d) => `${d.lastName} ${d.firstName}`))
    .map((d): DriverListItemResponse => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phoneNumber: d.phoneNumber,
      isActive: d.isActive,
    }));
  return page(rows, q);
}, ['Drivers.Read']);

route('GET', '/api/drivers/{id}', (ctx) => {
  const found = ctx.store.drivers.find((d) => d.id === ctx.params.id);
  if (!found) throw notFound('Driver not found.');
  return found;
}, ['Drivers.Read']);

/* rental assignments ---------------------------------------------------- */

const instant = (v: string) => new Date(v).getTime();

/** A date bound arrives as an instant with its offset, so the comparison is on the instant. */
const within = (value: string | null | undefined, from?: string, to?: string) => {
  if (!has(from) && !has(to)) return true;
  if (!value) return false;
  const at = instant(value);
  if (has(from) && at < instant(String(from))) return false;
  if (has(to) && at > instant(String(to))) return false;
  return true;
};

const listItem = (a: RentalAssignmentResponse): RentalAssignmentListItemResponse => ({
  id: a.id,
  customerId: a.customerId,
  customerDisplayName: a.customerDisplayName,
  vehicleId: a.vehicleId,
  vehiclePlateNumber: a.vehiclePlateNumber,
  status: a.status,
  plannedStartAtUtc: a.plannedStartAtUtc ?? null,
  startedAtUtc: a.startedAtUtc ?? null,
  plannedEndAtUtc: a.plannedEndAtUtc ?? null,
  closedAtUtc: a.closedAtUtc ?? null,
});

/**
 * The list order the prototype renders. With no column chosen it is the record's own creation
 * instant, newest first — which is why a freshly planned handover leads the list rather than the
 * nearest planned start. The STATUS and STARTS headers sort on `status` and `plannedStartAtUtc`;
 * a missing planned start sorts as an empty string, as the prototype's `sortVal` does.
 */
const ASSIGNMENT_SORT: Record<string, (a: RentalAssignmentResponse) => string | number> = {
  Status: (a) => a.status,
  PlannedStartAtUtc: (a) => a.plannedStartAtUtc ?? '',
};

const assignmentOrder = (q: RentalAssignmentsQuery) => {
  const key = ASSIGNMENT_SORT[String(q.SortBy ?? '')];
  const value = key ?? ((a: RentalAssignmentResponse) => a.createdAtUtc);
  // No column chosen means the default descending order; a chosen column defaults to ascending.
  const desc = key ? num(q.SortDirection) === SortDirection.Descending : true;
  return (x: RentalAssignmentResponse, y: RentalAssignmentResponse) => {
    const a = value(x), b = value(y);
    const c = a > b ? 1 : a < b ? -1 : 0;
    return desc ? -c : c;
  };
};

route('GET', '/api/rental-assignments', (ctx) => {
  const q = ctx.query as RentalAssignmentsQuery;
  const rows = ctx.store.assignments
    .filter((a) => (has(q.CustomerId) ? a.customerId === q.CustomerId : true))
    .filter((a) => (has(q.VehicleId) ? a.vehicleId === q.VehicleId : true))
    .filter((a) => (has(q.Status) ? a.status === num(q.Status) : true))
    .filter((a) => within(a.plannedStartAtUtc, q.PlannedFromUtc, q.PlannedToUtc))
    .filter((a) => within(a.startedAtUtc, q.StartedFromUtc, q.StartedToUtc))
    // Vehicle plate and VIN, customer individual or business name.
    .filter((a) => matches(
      q.Search,
      a.vehiclePlateNumber, a.customerDisplayName,
      ctx.store.vehicles.find((v) => v.id === a.vehicleId)?.vinCode,
    ))
    .sort(assignmentOrder(q))
    .map(listItem);
  return page(rows, q);
}, ['RentalAssignments.Read']);

const authorizationsOf = (ctx: Ctx, assignmentId: string): AssignmentDriverAuthorizationResponse[] =>
  ctx.store.authorizations
    .filter((z) => z.rentalAssignmentId === assignmentId)
    .sort(byDesc((z) => z.authorizedFromUtc));

const interruptionsOf = (ctx: Ctx, assignmentId: string): AssignmentInterruptionResponse[] =>
  ctx.store.interruptions
    .filter((i) => i.rentalAssignmentId === assignmentId)
    .sort(byDesc((i) => i.startedAtUtc));

/** The record composes its children per read, so a stale child list cannot be served. */
const detail = (ctx: Ctx, a: RentalAssignmentResponse): RentalAssignmentResponse => ({
  ...a,
  driverAuthorizations: authorizationsOf(ctx, a.id),
  interruptions: interruptionsOf(ctx, a.id),
});

const assignmentById = (ctx: Ctx, id: string | undefined) => {
  const found = ctx.store.assignments.find((a) => a.id === id);
  if (!found) throw notFound('Rental assignment not found.');
  return found;
};

route('GET', '/api/rental-assignments/{id}', (ctx) => detail(ctx, assignmentById(ctx, ctx.params.id)),
  ['RentalAssignments.Read']);

const assignmentOr404 = (ctx: Ctx) => assignmentById(ctx, ctx.params.assignmentId);

route('GET', '/api/rental-assignments/{assignmentId}/authorizations', (ctx) => {
  const q = ctx.query as AuthorizationsQuery;
  const rows = authorizationsOf(ctx, assignmentOr404(ctx).id)
    .filter((z) => (has(q.AuthorizationType) ? z.authorizationType === num(q.AuthorizationType) : true))
    .filter((z) => (has(q.DriverId) ? z.driverId === q.DriverId : true))
    .filter((z) => (has(q.IsOpen) ? !z.stoppedAtUtc === bool(q.IsOpen) : true));
  return page(rows, q);
}, ['DriverAuthorizations.Read']);

route('GET', '/api/rental-assignments/{assignmentId}/interruptions', (ctx) => {
  const q = ctx.query as InterruptionsQuery;
  const rows = interruptionsOf(ctx, assignmentOr404(ctx).id)
    .filter((i) => (has(q.Reason) ? i.reason === num(q.Reason) : true))
    .filter((i) => (has(q.BillingImpact) ? i.billingImpact === num(q.BillingImpact) : true))
    .filter((i) => (has(q.IsOpen) ? !i.endedAtUtc === bool(q.IsOpen) : true));
  return page(rows, q);
}, ['Interruptions.Read']);

/* rental assignment writes ---------------------------------------------- */

const nowIso = () => new Date().toISOString();
const openAuthsOf = (ctx: Ctx, id: string) => authorizationsOf(ctx, id).filter((z) => !z.stoppedAtUtc);
const openIntsOf = (ctx: Ctx, id: string) => interruptionsOf(ctx, id).filter((i) => !i.endedAtUtc);

const customerOf = (ctx: Ctx, id: string) => ctx.store.customers.find((c) => c.id === id);
const vehicleOf = (ctx: Ctx, id: string) => ctx.store.vehicles.find((v) => v.id === id);

/** A planned range conflicts with another non-final planned range on the same vehicle (ASSIGN-011). */
const rangeOverlaps = (ctx: Ctx, vehicleId: string, from: string, to: string | null, exceptId?: string) =>
  ctx.store.assignments.some((a) => {
    if (a.id === exceptId || a.vehicleId !== vehicleId) return false;
    if (a.status !== AssignmentStatus.Planned) return false;
    const otherFrom = a.plannedStartAtUtc;
    if (!otherFrom) return false;
    const otherTo = a.plannedEndAtUtc ?? null;
    if (to && to <= otherFrom) return false;
    if (otherTo && otherTo <= from) return false;
    return true;
  });

/** ASSIGN-001 / AUTH-003: an active assignment needs at least one open authorization. */
const hasCoverage = (rows: AssignmentDriverAuthorizationResponse[]) => rows.length > 0;

const assertPlannedDates = (start: string | null | undefined, end: string | null | undefined) => {
  if (start && end && end <= start) {
    throw codedValidation(
      'Planned end must be later than planned start.',
      'rental_assignments.planned_end_before_start',
    );
  }
};

const assertVehicleFree = (ctx: Ctx, vehicleId: string, exceptId?: string) => {
  const busy = ctx.store.assignments.some(
    (a) => a.id !== exceptId && a.vehicleId === vehicleId && a.status === AssignmentStatus.Active,
  );
  if (busy) {
    throw codedValidation(
      'The vehicle already has an active assignment.',
      'rental_assignments.vehicle_already_active',
    );
  }
};

const assertParties = (ctx: Ctx, customerId: string, vehicleId: string) => {
  const customer = customerOf(ctx, customerId);
  if (!customer) throw codedValidation('Customer not found.', 'rental_assignments.customer_not_found');
  if (!customer.isActive) {
    throw codedValidation(
      'An inactive customer cannot hold an assignment.',
      'rental_assignments.customer_inactive',
    );
  }
  const vehicle = vehicleOf(ctx, vehicleId);
  if (!vehicle) throw codedValidation('Vehicle not found.', 'rental_assignments.vehicle_not_found');
  if (!vehicle.isActive) {
    throw codedValidation(
      'A retired vehicle cannot be assigned.',
      'rental_assignments.vehicle_inactive',
    );
  }
  return { customer, vehicle };
};

/** AUTH-002 / AUTH-003 / AUTH-006 / AUTH-009, applied to one proposed authorization. */
const assertAuthorizationShape = (
  proposed: { authorizationType: number; driverId?: string | null; note?: string | null },
  customer: CustomerResponse,
  openRows: AssignmentDriverAuthorizationResponse[],
  ctx: Ctx,
) => {
  const collective = proposed.authorizationType === AssignmentDriverAuthorizationType.BusinessCustomerDrivers;
  const openNamed = openRows.filter((z) => z.authorizationType === AssignmentDriverAuthorizationType.NamedDriver);
  const openCollective = openRows.filter((z) => z.authorizationType === AssignmentDriverAuthorizationType.BusinessCustomerDrivers);

  if (collective) {
    if (customer.type !== CustomerType.Business) {
      throw codedValidation(
        'Company-authorized drivers is available only for a business customer.',
        'assignment_authorizations.collective_requires_business',
      );
    }
    if (openNamed.length > 0) {
      throw codedValidation(
        'Stop all named-driver authorizations before using company-authorized drivers.',
        'assignment_authorizations.named_and_collective_exclusive',
      );
    }
    if (openCollective.length > 0) {
      throw codedValidation(
        'A company-wide authorization is already open on this assignment.',
        'assignment_authorizations.collective_already_open',
      );
    }
    requireText(proposed.note, 'note', 'Note', 1000);
    return;
  }

  if (!proposed.driverId) {
    throw codedValidation(
      'A named-driver authorization requires a driver.',
      'assignment_authorizations.driver_required',
    );
  }
  const driver = ctx.store.drivers.find((d) => d.id === proposed.driverId);
  if (!driver) throw codedValidation('Driver not found.', 'assignment_authorizations.driver_not_found');
  if (!driver.isActive) {
    throw codedValidation(
      'A named-driver authorization requires an active driver.',
      'assignment_authorizations.driver_inactive',
    );
  }
  if (openCollective.length > 0) {
    throw codedValidation(
      'Stop the company authorization before adding named drivers.',
      'assignment_authorizations.named_and_collective_exclusive',
    );
  }
  if (openNamed.some((z) => z.driverId === proposed.driverId)) {
    throw codedValidation(
      'This driver already holds an open authorization on this assignment.',
      'assignment_authorizations.driver_already_open',
    );
  }
};

const newAuthorization = (
  assignmentId: string,
  body: InitialAuthorizationRequest | StartAssignmentDriverAuthorizationRequest,
): AssignmentDriverAuthorizationResponse => ({
  id: newUuid(),
  rentalAssignmentId: assignmentId,
  authorizationType: body.authorizationType,
  driverId: body.driverId ?? null,
  authorizedFromUtc: body.authorizedFromUtc,
  stoppedAtUtc: null,
  stopReason: null,
  note: body.note ?? null,
  concurrencyToken: newUuid(),
  createdAtUtc: nowIso(),
  updatedAtUtc: null,
});

/** Stops every open authorization when the assignment itself closes (AUTH-007's exception). */
const stopOpenAuthorizations = (ctx: Ctx, assignmentId: string, at: string, reason: AuthorizationStopReason) => {
  for (const z of openAuthsOf(ctx, assignmentId)) {
    z.stoppedAtUtc = at;
    z.stopReason = reason;
    z.updatedAtUtc = nowIso();
    z.concurrencyToken = newUuid();
  }
};

const touch = (a: RentalAssignmentResponse) => {
  a.updatedAtUtc = nowIso();
  a.concurrencyToken = newUuid();
};

route('POST', '/api/rental-assignments', (ctx) => {
  const body = ctx.body as CreateRentalAssignmentRequest;
  const { customer, vehicle } = assertParties(ctx, body.customerId, body.vehicleId);
  const planned = body.initialStatus === AssignmentStatus.Planned;

  if (planned && !body.plannedStartAtUtc) {
    throw codedValidation(
      'A planned assignment requires a planned start.',
      'rental_assignments.planned_start_required',
    );
  }
  assertPlannedDates(body.plannedStartAtUtc, body.plannedEndAtUtc);

  const initial = body.initialAuthorizations ?? [];
  if (planned) {
    if (body.plannedStartAtUtc
      && rangeOverlaps(ctx, body.vehicleId, body.plannedStartAtUtc, body.plannedEndAtUtc ?? null)) {
      throw codedValidation(
        'The vehicle already has a planned assignment overlapping this range.',
        'rental_assignments.planned_range_overlap',
      );
    }
  } else {
    if (!body.startedAtUtc) {
      throw codedValidation(
        'Starting directly as active requires the actual handover time.',
        'rental_assignments.started_at_required',
      );
    }
    assertVehicleFree(ctx, body.vehicleId);
    if (initial.length === 0) {
      throw codedValidation(
        'An active assignment needs at least one open driver authorization.',
        'rental_assignments.no_authorization_coverage',
      );
    }
  }

  const accepted: AssignmentDriverAuthorizationResponse[] = [];
  const id = newUuid();
  for (const proposed of initial) {
    assertAuthorizationShape(proposed, customer, accepted, ctx);
    accepted.push(newAuthorization(id, proposed));
  }

  const created: RentalAssignmentResponse = {
    id,
    customerId: customer.id,
    customerDisplayName: displayNameOf(customer),
    vehicleId: vehicle.id,
    vehiclePlateNumber: vehicle.plateNumber,
    status: planned ? AssignmentStatus.Planned : AssignmentStatus.Active,
    plannedStartAtUtc: body.plannedStartAtUtc ?? null,
    startedAtUtc: planned ? null : body.startedAtUtc ?? null,
    plannedEndAtUtc: body.plannedEndAtUtc ?? null,
    closedAtUtc: null,
    note: body.note?.trim() || null,
    concurrencyToken: newUuid(),
    createdAtUtc: nowIso(),
    updatedAtUtc: null,
    driverAuthorizations: [],
    interruptions: [],
  };
  ctx.store.assignments.unshift(created);
  ctx.store.authorizations.push(...accepted);
  return { ...created, driverAuthorizations: accepted, interruptions: [] };
}, ['RentalAssignments.Manage']);

route('PUT', '/api/rental-assignments/{id}', (ctx) => {
  const a = assignmentById(ctx, ctx.params.id);
  if (a.status === AssignmentStatus.Ended || a.status === AssignmentStatus.Cancelled) {
    throw conflict('A closed assignment can only be changed by a privileged correction.', 'rental_assignments.final');
  }
  const body = ctx.body as UpdateRentalAssignmentRequest;
  const { customer, vehicle } = assertParties(ctx, body.customerId, body.vehicleId);
  assertPlannedDates(body.plannedStartAtUtc, body.plannedEndAtUtc);
  if (a.status === AssignmentStatus.Active && vehicle.id !== a.vehicleId) assertVehicleFree(ctx, vehicle.id, a.id);
  if (a.status === AssignmentStatus.Planned) {
    if (!body.plannedStartAtUtc) {
      throw codedValidation(
        'A planned assignment requires a planned start.',
        'rental_assignments.planned_start_required',
      );
    }
    if (rangeOverlaps(ctx, vehicle.id, body.plannedStartAtUtc, body.plannedEndAtUtc ?? null, a.id)) {
      throw codedValidation(
        'The vehicle already has a planned assignment overlapping this range.',
        'rental_assignments.planned_range_overlap',
      );
    }
  }

  a.customerId = customer.id;
  a.customerDisplayName = displayNameOf(customer);
  a.vehicleId = vehicle.id;
  a.vehiclePlateNumber = vehicle.plateNumber;
  a.plannedStartAtUtc = body.plannedStartAtUtc ?? null;
  a.plannedEndAtUtc = body.plannedEndAtUtc ?? null;
  a.note = body.note?.trim() || null;
  touch(a);
  return detail(ctx, a);
}, ['RentalAssignments.Manage']);

route('POST', '/api/rental-assignments/{id}/activate', (ctx) => {
  const a = assignmentById(ctx, ctx.params.id);
  if (a.status !== AssignmentStatus.Planned) {
    throw conflict('Only a planned assignment can be activated.', 'rental_assignments.not_planned');
  }
  const body = ctx.body as ActivateRentalAssignmentRequest;
  if (!body?.startedAtUtc) {
    throw codedValidation('The actual handover time is required.', 'rental_assignments.started_at_required');
  }
  assertParties(ctx, a.customerId, a.vehicleId);
  assertVehicleFree(ctx, a.vehicleId, a.id);
  if (!hasCoverage(openAuthsOf(ctx, a.id))) {
    throw codedValidation(
      'An active assignment needs at least one open driver authorization.',
      'rental_assignments.no_authorization_coverage',
    );
  }
  a.status = AssignmentStatus.Active;
  a.startedAtUtc = body.startedAtUtc;
  touch(a);
  return detail(ctx, a);
}, ['RentalAssignments.Manage']);

route('POST', '/api/rental-assignments/{id}/end', (ctx) => {
  const a = assignmentById(ctx, ctx.params.id);
  if (a.status !== AssignmentStatus.Active) {
    throw conflict('Only an active assignment can be ended.', 'rental_assignments.not_active');
  }
  const body = ctx.body as EndRentalAssignmentRequest;
  if (!body?.closedAtUtc) {
    throw codedValidation('The closing time is required.', 'rental_assignments.closed_at_required');
  }
  if (a.startedAtUtc && body.closedAtUtc <= a.startedAtUtc) {
    throw codedValidation(
      'The closing time must be later than the actual start.',
      'rental_assignments.closed_before_start',
    );
  }
  // INTERRUPT-011: closure never silently ends an interruption.
  if (openIntsOf(ctx, a.id).length > 0) {
    throw conflict(
      'End the open interruption before ending this assignment.',
      'rental_assignments.interruption_open',
    );
  }
  a.status = AssignmentStatus.Ended;
  a.closedAtUtc = body.closedAtUtc;
  stopOpenAuthorizations(ctx, a.id, body.closedAtUtc, AuthorizationStopReason.AssignmentEnded);
  touch(a);
  return detail(ctx, a);
}, ['RentalAssignments.Manage']);

route('POST', '/api/rental-assignments/{id}/cancel', (ctx) => {
  const a = assignmentById(ctx, ctx.params.id);
  if (a.status === AssignmentStatus.Ended || a.status === AssignmentStatus.Cancelled) {
    throw conflict('The assignment is already closed.', 'rental_assignments.final');
  }
  const body = ctx.body as CancelRentalAssignmentRequest;
  if (!body?.closedAtUtc) {
    throw codedValidation('The closing time is required.', 'rental_assignments.closed_at_required');
  }
  // ASSIGN-013: the narrow mistaken-activation correction.
  if (a.status === AssignmentStatus.Active) {
    if (!body.noPhysicalHandoverOccurred) {
      throw conflict(
        'The vehicle was handed over, so the assignment must be ended rather than cancelled.',
        'rental_assignments.handover_occurred',
      );
    }
    if (interruptionsOf(ctx, a.id).length > 0) {
      throw conflict(
        'Interruptions were recorded, so this assignment cannot be cancelled.',
        'rental_assignments.interruption_recorded',
      );
    }
    requireText(body.note, 'note', 'Note', 1000);
    a.startedAtUtc = null;
  }
  a.status = AssignmentStatus.Cancelled;
  a.closedAtUtc = body.closedAtUtc;
  if (body.note?.trim()) a.note = body.note.trim();
  stopOpenAuthorizations(ctx, a.id, body.closedAtUtc, AuthorizationStopReason.AssignmentCancelled);
  touch(a);
  return detail(ctx, a);
}, ['RentalAssignments.Manage']);

/* authorization writes --------------------------------------------------- */

route('POST', '/api/rental-assignments/{assignmentId}/authorizations', (ctx) => {
  const a = assignmentOr404(ctx);
  if (a.status === AssignmentStatus.Ended || a.status === AssignmentStatus.Cancelled) {
    throw conflict('A closed assignment does not take new authorizations.', 'assignment_authorizations.assignment_final');
  }
  const body = ctx.body as StartAssignmentDriverAuthorizationRequest;
  if (!body?.authorizedFromUtc) {
    throw codedValidation('The authorization start is required.', 'assignment_authorizations.from_required');
  }
  const customer = customerOf(ctx, a.customerId);
  if (!customer) throw notFound('Customer not found.');
  assertAuthorizationShape(body, customer, openAuthsOf(ctx, a.id), ctx);
  const created = newAuthorization(a.id, body);
  ctx.store.authorizations.push(created);
  return created;
}, ['DriverAuthorizations.Manage']);

route('POST', '/api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/stop', (ctx) => {
  const a = assignmentOr404(ctx);
  const z = ctx.store.authorizations.find((x) => x.id === ctx.params.authorizationId && x.rentalAssignmentId === a.id);
  if (!z) throw notFound('Authorization not found.');
  if (z.stoppedAtUtc) throw conflict('The authorization is already stopped.', 'assignment_authorizations.already_stopped');

  const body = ctx.body as StopAssignmentDriverAuthorizationRequest;
  if (!body?.stoppedAtUtc) {
    throw codedValidation('The stop time is required.', 'assignment_authorizations.stopped_at_required');
  }
  if (body.stoppedAtUtc <= z.authorizedFromUtc) {
    throw codedValidation(
      'The stop time must be later than the authorization start.',
      'assignment_authorizations.stopped_before_start',
    );
  }
  if (!body.stopReason) {
    throw codedValidation('A stop reason is required.', 'assignment_authorizations.stop_reason_required');
  }
  if (body.stopReason === AuthorizationStopReason.Other) requireText(body.note, 'note', 'Note', 1000);

  const customer = customerOf(ctx, a.customerId);
  if (!customer) throw notFound('Customer not found.');
  const remaining = openAuthsOf(ctx, a.id).filter((x) => x.id !== z.id);
  const replacement = body.replacement ?? null;

  // AUTH-007: a standalone stop may not remove the final coverage of an active assignment.
  if (a.status === AssignmentStatus.Active && remaining.length === 0 && !replacement) {
    throw codedValidation(
      'Another authorization must replace this one; an active assignment cannot lose its last coverage.',
      'assignment_authorizations.coverage_required',
    );
  }

  let created: AssignmentDriverAuthorizationResponse | null = null;
  if (replacement) {
    assertAuthorizationShape(replacement, customer, remaining, ctx);
    created = newAuthorization(a.id, { ...replacement, authorizedFromUtc: body.stoppedAtUtc });
  }

  z.stoppedAtUtc = body.stoppedAtUtc;
  z.stopReason = body.stopReason;
  if (body.note?.trim()) z.note = body.note.trim();
  z.updatedAtUtc = nowIso();
  z.concurrencyToken = newUuid();
  if (created) ctx.store.authorizations.push(created);
  return z;
}, ['DriverAuthorizations.Manage']);

/* interruption writes ---------------------------------------------------- */

const assertInterruptionWindow = (
  a: RentalAssignmentResponse,
  startedAtUtc: string,
  endedAtUtc: string | null,
) => {
  if (endedAtUtc && endedAtUtc <= startedAtUtc) {
    throw codedValidation(
      'The end must be later than the start.',
      'assignment_interruptions.ended_before_start',
    );
  }
  // INTERRUPT-012: never before the actual handover, never after closure.
  if (a.startedAtUtc && startedAtUtc < a.startedAtUtc) {
    throw codedValidation(
      'An interruption cannot begin before the vehicle was handed over.',
      'assignment_interruptions.before_assignment_start',
    );
  }
  if (a.closedAtUtc && (!endedAtUtc || endedAtUtc > a.closedAtUtc)) {
    throw codedValidation(
      'An interruption on a closed assignment must end no later than its closing time.',
      'assignment_interruptions.after_assignment_close',
    );
  }
};

const interruptionFields = (body: CreateAssignmentInterruptionRequest) => {
  if (!body?.startedAtUtc) {
    throw codedValidation('The start is required.', 'assignment_interruptions.started_at_required');
  }
  if (!body.reason) {
    throw codedValidation('A reason is required.', 'assignment_interruptions.reason_required');
  }
  if (!body.billingImpact) {
    throw codedValidation('A billing impact is required.', 'assignment_interruptions.billing_impact_required');
  }
  return {
    startedAtUtc: body.startedAtUtc,
    endedAtUtc: body.endedAtUtc ?? null,
    reason: body.reason,
    billingImpact: body.billingImpact,
    // INTERRUPT-006: every interruption has a note.
    note: requireText(body.note, 'note', 'Note', 1000),
  };
};

route('POST', '/api/rental-assignments/{assignmentId}/interruptions', (ctx) => {
  const a = assignmentOr404(ctx);
  if (a.status === AssignmentStatus.Planned) {
    throw conflict(
      'Interruptions can be recorded once the vehicle has been handed over.',
      'assignment_interruptions.assignment_not_started',
    );
  }
  const fields = interruptionFields(ctx.body as CreateAssignmentInterruptionRequest);
  assertInterruptionWindow(a, fields.startedAtUtc, fields.endedAtUtc);
  const created: AssignmentInterruptionResponse = {
    id: newUuid(),
    rentalAssignmentId: a.id,
    ...fields,
    concurrencyToken: newUuid(),
    createdAtUtc: nowIso(),
    updatedAtUtc: null,
  };
  ctx.store.interruptions.push(created);
  return created;
}, ['Interruptions.Manage']);

const interruptionOr404 = (ctx: Ctx, assignmentId: string) => {
  const found = ctx.store.interruptions.find(
    (i) => i.id === ctx.params.interruptionId && i.rentalAssignmentId === assignmentId,
  );
  if (!found) throw notFound('Interruption not found.');
  return found;
};

route('PUT', '/api/rental-assignments/{assignmentId}/interruptions/{interruptionId}', (ctx) => {
  const a = assignmentOr404(ctx);
  const i = interruptionOr404(ctx, a.id);
  const fields = interruptionFields(ctx.body as CreateAssignmentInterruptionRequest);
  assertInterruptionWindow(a, fields.startedAtUtc, fields.endedAtUtc);
  Object.assign(i, fields, { updatedAtUtc: nowIso(), concurrencyToken: newUuid() });
  return i;
}, ['Interruptions.Manage']);

route('POST', '/api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/end', (ctx) => {
  const a = assignmentOr404(ctx);
  const i = interruptionOr404(ctx, a.id);
  if (i.endedAtUtc) throw conflict('The interruption is already ended.', 'assignment_interruptions.already_ended');
  const body = ctx.body as EndAssignmentInterruptionRequest;
  if (!body?.endedAtUtc) {
    throw codedValidation('The end time is required.', 'assignment_interruptions.ended_at_required');
  }
  assertInterruptionWindow(a, i.startedAtUtc, body.endedAtUtc);
  i.endedAtUtc = body.endedAtUtc;
  i.updatedAtUtc = nowIso();
  i.concurrencyToken = newUuid();
  return i;
}, ['Interruptions.Manage']);

/* privileged corrections ------------------------------------------------- */

const assertToken = (sent: string | null | undefined, held: string, resource: string) => {
  if (!sent || sent !== held) throw staleConflict(resource);
};

const ts = (v: string | null | undefined) => v ?? null;

route('PUT', '/api/rental-assignments/{id}/corrections/timeline', (ctx) => {
  const a = assignmentById(ctx, ctx.params.id);
  const body = ctx.body as CorrectRentalAssignmentTimelineRequest;
  const reason = requireReason(body?.reason);
  assertToken(body?.concurrencyToken, a.concurrencyToken, 'rental_assignments');
  assertPlannedDates(body.plannedStartAtUtc, body.plannedEndAtUtc);
  if (body.startedAtUtc && body.closedAtUtc && body.closedAtUtc <= body.startedAtUtc) {
    throw codedValidation(
      'The closing time must be later than the actual start.',
      'rental_assignments.closed_before_start',
    );
  }
  const before: Payload = {
    PlannedStartAtUtc: ts(a.plannedStartAtUtc),
    StartedAtUtc: ts(a.startedAtUtc),
    PlannedEndAtUtc: ts(a.plannedEndAtUtc),
    ClosedAtUtc: ts(a.closedAtUtc),
    Note: a.note ?? null,
  };
  a.plannedStartAtUtc = ts(body.plannedStartAtUtc);
  a.startedAtUtc = ts(body.startedAtUtc);
  a.plannedEndAtUtc = ts(body.plannedEndAtUtc);
  a.closedAtUtc = ts(body.closedAtUtc);
  a.note = body.note?.trim() || null;
  touch(a);
  writeAudit(ctx.store, {
    eventType: 'RentalAssignment.TimelineCorrected',
    actorUserId: ctx.me.id,
    entityType: 'RentalAssignment',
    entityId: a.id,
    reason,
    before,
    after: {
      PlannedStartAtUtc: ts(a.plannedStartAtUtc),
      StartedAtUtc: ts(a.startedAtUtc),
      PlannedEndAtUtc: ts(a.plannedEndAtUtc),
      ClosedAtUtc: ts(a.closedAtUtc),
      Note: a.note ?? null,
    },
  });
  return detail(ctx, a);
}, ['PrivilegedCorrections.Execute']);

route('PUT', '/api/rental-assignments/{id}/corrections/parties', (ctx) => {
  const a = assignmentById(ctx, ctx.params.id);
  const body = ctx.body as CorrectRentalAssignmentPartiesRequest;
  const reason = requireReason(body?.reason);
  assertToken(body?.concurrencyToken, a.concurrencyToken, 'rental_assignments');
  const nextCustomerId = body.customerId ?? a.customerId;
  const nextVehicleId = body.vehicleId ?? a.vehicleId;
  const { customer, vehicle } = assertParties(ctx, nextCustomerId, nextVehicleId);
  if (a.status === AssignmentStatus.Active && vehicle.id !== a.vehicleId) {
    assertVehicleFree(ctx, vehicle.id, a.id);
  }
  // AUTH-009 / CUSTOMER-006: a collective authorization cannot survive a move to a private customer.
  if (customer.type !== CustomerType.Business
    && openAuthsOf(ctx, a.id).some((z) => z.authorizationType === AssignmentDriverAuthorizationType.BusinessCustomerDrivers)) {
    throw codedValidation(
      'The open company-authorized-drivers authorization is not valid for a private customer.',
      'rental_assignments.collective_not_valid_for_customer',
    );
  }
  const before: Payload = { CustomerId: a.customerId, VehicleId: a.vehicleId };
  a.customerId = customer.id;
  a.customerDisplayName = displayNameOf(customer);
  a.vehicleId = vehicle.id;
  a.vehiclePlateNumber = vehicle.plateNumber;
  touch(a);
  writeAudit(ctx.store, {
    eventType: 'RentalAssignment.PartiesCorrected',
    actorUserId: ctx.me.id,
    entityType: 'RentalAssignment',
    entityId: a.id,
    reason,
    before,
    after: { CustomerId: a.customerId, VehicleId: a.vehicleId },
  });
  return detail(ctx, a);
}, ['PrivilegedCorrections.Execute']);

route('PUT', '/api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/correction', (ctx) => {
  const a = assignmentOr404(ctx);
  const z = ctx.store.authorizations.find((x) => x.id === ctx.params.authorizationId && x.rentalAssignmentId === a.id);
  if (!z) throw notFound('Authorization not found.');
  const body = ctx.body as CorrectDriverAuthorizationRequest;
  const reason = requireReason(body?.reason);
  assertToken(body?.concurrencyToken, z.concurrencyToken, 'assignment_authorizations');

  const from = body.authorizedFromUtc ?? z.authorizedFromUtc;
  const stopped = body.stoppedAtUtc ?? null;
  if (stopped && stopped <= from) {
    throw codedValidation(
      'The stop time must be later than the authorization start.',
      'assignment_authorizations.stopped_before_start',
    );
  }
  if (stopped && !body.stopReason) {
    throw codedValidation('A stopped authorization needs a stop reason.', 'assignment_authorizations.stop_reason_required');
  }
  if (body.stopReason === AuthorizationStopReason.Other) requireText(body.note, 'note', 'Note', 1000);

  const customer = customerOf(ctx, a.customerId);
  if (!customer) throw notFound('Customer not found.');
  // CORRECTION-007: the result must remain valid coverage history.
  if (!stopped) {
    assertAuthorizationShape(
      { authorizationType: body.authorizationType, driverId: body.driverId ?? null, note: body.note ?? z.note },
      customer,
      openAuthsOf(ctx, a.id).filter((x) => x.id !== z.id),
      ctx,
    );
  }

  const before: Payload = {
    AuthorizationType: enumName(AssignmentDriverAuthorizationType, z.authorizationType),
    DriverId: z.driverId ?? null,
    AuthorizedFromUtc: z.authorizedFromUtc,
    StoppedAtUtc: ts(z.stoppedAtUtc),
    StopReason: z.stopReason ? enumName(AuthorizationStopReason, z.stopReason) : null,
    Note: z.note ?? null,
  };
  z.authorizationType = body.authorizationType;
  z.driverId = body.driverId ?? null;
  z.authorizedFromUtc = from;
  z.stoppedAtUtc = stopped;
  z.stopReason = stopped ? body.stopReason ?? null : null;
  z.note = body.note?.trim() || null;
  z.updatedAtUtc = nowIso();
  z.concurrencyToken = newUuid();
  writeAudit(ctx.store, {
    eventType: 'DriverAuthorization.Corrected',
    actorUserId: ctx.me.id,
    entityType: 'AssignmentDriverAuthorization',
    entityId: z.id,
    reason,
    before,
    after: {
      AuthorizationType: enumName(AssignmentDriverAuthorizationType, z.authorizationType),
      DriverId: z.driverId ?? null,
      AuthorizedFromUtc: z.authorizedFromUtc,
      StoppedAtUtc: ts(z.stoppedAtUtc),
      StopReason: z.stopReason ? enumName(AuthorizationStopReason, z.stopReason) : null,
      Note: z.note ?? null,
    },
  });
  return z;
}, ['PrivilegedCorrections.Execute']);

route('PUT', '/api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/correction', (ctx) => {
  const a = assignmentOr404(ctx);
  const i = interruptionOr404(ctx, a.id);
  const body = ctx.body as CorrectInterruptionRequest;
  const reason = requireReason(body?.reason);
  assertToken(body?.concurrencyToken, i.concurrencyToken, 'assignment_interruptions');

  const startedAtUtc = body.startedAtUtc ?? i.startedAtUtc;
  const endedAtUtc = body.endedAtUtc ?? null;
  const reasonCode = body.reasonCode ?? i.reason;
  const billingImpact = body.billingImpact ?? i.billingImpact;
  assertInterruptionWindow(a, startedAtUtc, endedAtUtc);
  const note = requireText(body.note ?? i.note, 'note', 'Note', 1000);

  const before: Payload = {
    StartedAtUtc: i.startedAtUtc,
    EndedAtUtc: ts(i.endedAtUtc),
    Reason: enumName(InterruptionReason, i.reason),
    BillingImpact: enumName(BillingImpact, i.billingImpact),
    Note: i.note,
  };
  Object.assign(i, {
    startedAtUtc,
    endedAtUtc,
    reason: reasonCode,
    billingImpact,
    note,
    updatedAtUtc: nowIso(),
    concurrencyToken: newUuid(),
  });
  writeAudit(ctx.store, {
    eventType: 'Interruption.Corrected',
    actorUserId: ctx.me.id,
    entityType: 'AssignmentInterruption',
    entityId: i.id,
    reason,
    before,
    after: {
      StartedAtUtc: i.startedAtUtc,
      EndedAtUtc: ts(i.endedAtUtc),
      Reason: enumName(InterruptionReason, i.reason),
      BillingImpact: enumName(BillingImpact, i.billingImpact),
      Note: i.note,
    },
  });
  return i;
}, ['PrivilegedCorrections.Execute']);

/* vehicle, customer and driver writes ------------------------------------ */

const trimmed = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** The prototype's identity rule for a private customer and for every driver. */
const assertIdentityProof = (personalId: unknown, dateOfBirth: unknown) => {
  if (!trimmed(personalId) && !trimmed(dateOfBirth)) {
    throw fieldError({
      personalId: ['Provide at least one of personal identifier or date of birth.'],
    });
  }
};

/** A planned or active assignment holds the vehicle or the customer. */
const heldByAssignment = (ctx: Ctx, field: 'vehicleId' | 'customerId', id: string) =>
  ctx.store.assignments.some(
    (a) => a[field] === id
      && (a.status === AssignmentStatus.Active || a.status === AssignmentStatus.Planned),
  );

route('POST', '/api/vehicles', (ctx) => {
  const body = ctx.body as CreateVehicleRequest;
  const vehicle = writeVehicle(ctx, body, null);
  const created: VehicleResponse = {
    id: newUuid(),
    ...vehicle,
    isActive: true,
    createdAtUtc: nowIso(),
    updatedAtUtc: null,
  };
  ctx.store.vehicles.push(created);
  return created;
}, ['Vehicles.Manage']);

route('PUT', '/api/vehicles/{id}', (ctx) => {
  const found = ctx.store.vehicles.find((v) => v.id === ctx.params.id);
  if (!found) throw notFound('Vehicle not found.');
  Object.assign(found, writeVehicle(ctx, ctx.body as UpdateVehicleRequest, found.id), {
    updatedAtUtc: nowIso(),
  });
  return found;
}, ['Vehicles.Manage']);

function writeVehicle(ctx: Ctx, body: CreateVehicleRequest, exceptId: string | null) {
  const plateNumber = requireText(body.plateNumber, 'plateNumber', 'Plate number', 20);
  const vinCode = requireText(body.vinCode, 'vinCode', 'VIN code', 17);
  const make = requireText(body.make, 'make', 'Make', 100);
  const model = requireText(body.model, 'model', 'Model', 100);
  const color = requireText(body.color, 'color', 'Colour', 50);
  const year = Number(body.year);
  if (!Number.isInteger(year) || year < 1900) {
    throw fieldError({ year: ['Manufacturing year must be 1900 or later.'] });
  }
  const clash = (pick: (v: VehicleResponse) => string, value: string) =>
    ctx.store.vehicles.some((v) => v.id !== exceptId && same(pick(v), value));
  if (clash((v) => v.vinCode, vinCode)) {
    throw fieldError({ vinCode: ['Another vehicle is already registered with this VIN code.'] });
  }
  if (clash((v) => v.plateNumber, plateNumber)) {
    throw fieldError({ plateNumber: ['Another vehicle already uses this plate number.'] });
  }
  return {
    plateNumber,
    vinCode,
    make,
    model,
    year,
    bodyType: body.bodyType,
    gearboxType: body.gearboxType,
    fuelType: body.fuelType,
    color,
  };
}

route('POST', '/api/vehicles/{id}/activate', (ctx) => {
  const found = ctx.store.vehicles.find((v) => v.id === ctx.params.id);
  if (!found) throw notFound('Vehicle not found.');
  found.isActive = true;
  found.updatedAtUtc = nowIso();
  return found;
}, ['Vehicles.Manage']);

route('POST', '/api/vehicles/{id}/deactivate', (ctx) => {
  const found = ctx.store.vehicles.find((v) => v.id === ctx.params.id);
  if (!found) throw notFound('Vehicle not found.');
  if (heldByAssignment(ctx, 'vehicleId', found.id)) {
    throw conflict(
      'The vehicle is on a planned or active assignment and cannot be deactivated.',
      'vehicles.assignment_in_progress',
    );
  }
  found.isActive = false;
  found.updatedAtUtc = nowIso();
  return found;
}, ['Vehicles.Manage']);

function writeCustomer(ctx: Ctx, body: CreateCustomerRequest, type: CustomerType, exceptId: string | null) {
  const business = type === CustomerType.Business;
  const address = requireText(body.address, 'address', 'Address', 500);
  const email = requireText(body.email, 'email', 'Email', 254);
  const phoneNumber = requireText(body.phoneNumber, 'phoneNumber', 'Phone number', 30);

  if (ctx.store.customers.some((c) => c.id !== exceptId && same(c.email, email))) {
    throw fieldError({ email: ['That email address is already used by another customer.'] });
  }

  const driverId = trimmed(body.driverId) || null;
  if (business && driverId) {
    throw fieldError({ driverId: ['A business customer cannot be linked to a driver record.'] });
  }
  if (driverId) {
    if (!ctx.store.drivers.some((d) => d.id === driverId)) {
      throw fieldError({ driverId: ['That driver record does not exist.'] });
    }
    if (ctx.store.customers.some((c) => c.id !== exceptId && c.driverId === driverId)) {
      throw fieldError({ driverId: ['That driver record is already linked to another customer.'] });
    }
  }

  if (business) {
    return {
      firstName: null,
      lastName: null,
      personalId: null,
      dateOfBirth: null,
      companyName: requireText(body.companyName, 'companyName', 'Business name', 200),
      registrationCode: requireText(body.registrationCode, 'registrationCode', 'Registration code', 50),
      address,
      email,
      phoneNumber,
      driverId: null,
    };
  }

  assertIdentityProof(body.personalId, body.dateOfBirth);
  return {
    firstName: requireText(body.firstName, 'firstName', 'First name', 100),
    lastName: requireText(body.lastName, 'lastName', 'Last name', 100),
    personalId: trimmed(body.personalId) || null,
    dateOfBirth: trimmed(body.dateOfBirth) || null,
    companyName: null,
    registrationCode: null,
    address,
    email,
    phoneNumber,
    driverId,
  };
}

route('POST', '/api/customers', (ctx) => {
  const body = ctx.body as CreateCustomerRequest;
  const created: CustomerResponse = {
    id: newUuid(),
    type: body.type,
    ...writeCustomer(ctx, body, body.type, null),
    isActive: true,
    createdAtUtc: nowIso(),
    updatedAtUtc: null,
  };
  ctx.store.customers.push(created);
  return created;
}, ['Customers.Manage']);

route('PUT', '/api/customers/{id}', (ctx) => {
  const found = ctx.store.customers.find((c) => c.id === ctx.params.id);
  if (!found) throw notFound('Customer not found.');
  const body = ctx.body as CreateCustomerRequest;
  Object.assign(found, writeCustomer(ctx, body, found.type, found.id), { updatedAtUtc: nowIso() });
  return found;
}, ['Customers.Manage']);

route('POST', '/api/customers/{id}/activate', (ctx) => {
  const found = ctx.store.customers.find((c) => c.id === ctx.params.id);
  if (!found) throw notFound('Customer not found.');
  found.isActive = true;
  found.updatedAtUtc = nowIso();
  return found;
}, ['Customers.Manage']);

route('POST', '/api/customers/{id}/deactivate', (ctx) => {
  const found = ctx.store.customers.find((c) => c.id === ctx.params.id);
  if (!found) throw notFound('Customer not found.');
  if (heldByAssignment(ctx, 'customerId', found.id)) {
    throw conflict(
      'The customer has a planned or active assignment and cannot be deactivated.',
      'customers.assignment_in_progress',
    );
  }
  found.isActive = false;
  found.updatedAtUtc = nowIso();
  return found;
}, ['Customers.Manage']);

function writeDriver(ctx: Ctx, body: CreateDriverRequest, exceptId: string | null) {
  const driverLicenseNumber = requireText(
    body.driverLicenseNumber, 'driverLicenseNumber', 'Driver licence number', 50,
  );
  if (ctx.store.drivers.some(
    (d) => d.id !== exceptId && same(d.driverLicenseNumber, driverLicenseNumber),
  )) {
    throw fieldError({ driverLicenseNumber: ['Another driver already holds this licence number.'] });
  }
  assertIdentityProof(body.personalId, body.dateOfBirth);
  return {
    firstName: requireText(body.firstName, 'firstName', 'First name', 100),
    lastName: requireText(body.lastName, 'lastName', 'Last name', 100),
    personalId: trimmed(body.personalId) || null,
    dateOfBirth: trimmed(body.dateOfBirth) || null,
    address: requireText(body.address, 'address', 'Address', 500),
    email: requireText(body.email, 'email', 'Email', 254),
    phoneNumber: requireText(body.phoneNumber, 'phoneNumber', 'Phone number', 30),
    driverLicenseNumber,
  };
}

route('POST', '/api/drivers', (ctx) => {
  const created: DriverResponse = {
    id: newUuid(),
    ...writeDriver(ctx, ctx.body as CreateDriverRequest, null),
    isActive: true,
    createdAtUtc: nowIso(),
    updatedAtUtc: null,
  };
  ctx.store.drivers.push(created);
  return created;
}, ['Drivers.Manage']);

route('PUT', '/api/drivers/{id}', (ctx) => {
  const found = ctx.store.drivers.find((d) => d.id === ctx.params.id);
  if (!found) throw notFound('Driver not found.');
  Object.assign(found, writeDriver(ctx, ctx.body as CreateDriverRequest, found.id), {
    updatedAtUtc: nowIso(),
  });
  return found;
}, ['Drivers.Manage']);

route('POST', '/api/drivers/{id}/activate', (ctx) => {
  const found = ctx.store.drivers.find((d) => d.id === ctx.params.id);
  if (!found) throw notFound('Driver not found.');
  found.isActive = true;
  found.updatedAtUtc = nowIso();
  return found;
}, ['Drivers.Manage']);

route('POST', '/api/drivers/{id}/deactivate', (ctx) => {
  const found = ctx.store.drivers.find((d) => d.id === ctx.params.id);
  if (!found) throw notFound('Driver not found.');
  /** AUTH-007: an open named-driver authorization on an active assignment holds the driver. */
  const held = ctx.store.authorizations.some((z) => {
    if (z.stoppedAtUtc || z.driverId !== found.id) return false;
    if (z.authorizationType !== AssignmentDriverAuthorizationType.NamedDriver) return false;
    const a = ctx.store.assignments.find((x) => x.id === z.rentalAssignmentId);
    return !!a && a.status === AssignmentStatus.Active;
  });
  if (held) {
    throw conflict(
      'The driver holds an open authorization on an active assignment and cannot be deactivated.',
      'drivers.authorization_open',
    );
  }
  found.isActive = false;
  found.updatedAtUtc = nowIso();
  return found;
}, ['Drivers.Manage']);
