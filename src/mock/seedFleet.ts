import {
  AssignmentDriverAuthorizationType, AssignmentStatus, AuthorizationStopReason, BillingImpact,
  BodyType, CustomerType, FuelType, GearboxType, InterruptionReason,
  type AssignmentDriverAuthorizationResponse, type AssignmentInterruptionResponse,
  type CustomerResponse, type DriverResponse, type Instant, type RentalAssignmentResponse,
  type VehicleResponse,
} from '@/api/dto';
import { ID } from './ids';

/**
 * The prototype's fleet rows: ten vehicles, eight customers, seven drivers, twelve assignments and
 * their authorizations and interruptions, with the prototype's own keys as `ID` lookups.
 *
 * Two things are computed rather than stored, so a projection can never disagree with its source:
 * an assignment's `customerDisplayName` / `vehiclePlateNumber` are resolved here from the customer
 * and vehicle rows, and its `driverAuthorizations` / `interruptions` are composed by the read
 * handler from the store's own arrays.
 */

const H = 3_600_000;
const base = Date.now();
const at = (hours: number): Instant => new Date(base + hours * H).toISOString();
const d = (days: number) => at(days * 24);

/** Concurrency tokens are uuids on the wire; the prototype's `t-a1-01` becomes an ordinal. */
const tok = (n: number) => `7f1e2d3c-${String(n).padStart(4, '0')}-4e5f-8a9b-${String(n).padStart(12, '0')}`;

const V = ID.vehicles;
const C = ID.customers;
const D = ID.drivers;
const A = ID.assignments;

export const vehicles = (): VehicleResponse[] => [
  { id: V.v1, plateNumber: '482 TKL', vinCode: 'WVWZZZ3CZKE004821', make: 'Volkswagen', model: 'Passat Variant', year: 2023, bodyType: BodyType.Wagon, gearboxType: GearboxType.Automatic, fuelType: FuelType.Diesel, color: 'Graphite', isActive: true, createdAtUtc: d(-210), updatedAtUtc: at(-40) },
  { id: V.v2, plateNumber: '119 MPR', vinCode: 'YV1DZ8156K1190334', make: 'Volvo', model: 'XC60', year: 2024, bodyType: BodyType.Suv, gearboxType: GearboxType.Automatic, fuelType: FuelType.Hybrid, color: 'Onyx black', isActive: true, createdAtUtc: d(-160), updatedAtUtc: null },
  { id: V.v3, plateNumber: '770 HDV', vinCode: 'WAUZZZF23MN770211', make: 'Audi', model: 'A4', year: 2022, bodyType: BodyType.Sedan, gearboxType: GearboxType.Automatic, fuelType: FuelType.Diesel, color: 'Mythos black', isActive: true, createdAtUtc: d(-320), updatedAtUtc: d(-12) },
  { id: V.v4, plateNumber: '335 SNB', vinCode: 'W1K2130421A335512', make: 'Mercedes-Benz', model: 'E 220 d', year: 2023, bodyType: BodyType.Sedan, gearboxType: GearboxType.Automatic, fuelType: FuelType.Diesel, color: 'Selenite grey', isActive: true, createdAtUtc: d(-140), updatedAtUtc: null },
  { id: V.v5, plateNumber: '881 GRT', vinCode: 'VF3LCYHZPKS881409', make: 'Peugeot', model: '308 SW', year: 2021, bodyType: BodyType.Wagon, gearboxType: GearboxType.Manual, fuelType: FuelType.Petrol, color: 'Vertigo blue', isActive: false, createdAtUtc: d(-480), updatedAtUtc: d(-30) },
  { id: V.v6, plateNumber: '204 JLM', vinCode: 'KMHK381CFNU204711', make: 'Hyundai', model: 'Kona Electric', year: 2024, bodyType: BodyType.Suv, gearboxType: GearboxType.Automatic, fuelType: FuelType.Electric, color: 'Atlas white', isActive: true, createdAtUtc: d(-95), updatedAtUtc: d(-3) },
  { id: V.v7, plateNumber: '552 KLM', vinCode: 'WBA5R11009F552804', make: 'BMW', model: '320d Touring', year: 2022, bodyType: BodyType.Wagon, gearboxType: GearboxType.Automatic, fuelType: FuelType.Diesel, color: 'Alpine white', isActive: true, createdAtUtc: d(-270), updatedAtUtc: null },
  { id: V.v8, plateNumber: '660 BYH', vinCode: 'ZFA33400006660301', make: 'Fiat', model: 'Tipo', year: 2020, bodyType: BodyType.Sedan, gearboxType: GearboxType.Manual, fuelType: FuelType.Petrol, color: 'Passione red', isActive: false, createdAtUtc: d(-610), updatedAtUtc: d(-88) },
  { id: V.v9, plateNumber: '444 WKS', vinCode: 'SJNFAAF15U9174220', make: 'Nissan', model: 'Qashqai', year: 2023, bodyType: BodyType.Suv, gearboxType: GearboxType.Automatic, fuelType: FuelType.Hybrid, color: 'Ceramic grey', isActive: true, createdAtUtc: d(-120), updatedAtUtc: null },
  { id: V.v10, plateNumber: '400 NDP', vinCode: 'TMBJJ7NE4M4440801', make: 'Skoda', model: 'Octavia', year: 2024, bodyType: BodyType.Wagon, gearboxType: GearboxType.Manual, fuelType: FuelType.Cng, color: 'Race blue', isActive: true, createdAtUtc: d(-70), updatedAtUtc: d(-6) },
];

const business = (
  id: string,
  companyName: string,
  registrationCode: string,
  address: string,
  email: string,
  phoneNumber: string,
  isActive: boolean,
  createdAtUtc: Instant,
  updatedAtUtc: Instant | null,
): CustomerResponse => ({
  id, type: CustomerType.Business, companyName, registrationCode,
  firstName: null, lastName: null, personalId: null, dateOfBirth: null,
  address, email, phoneNumber, driverId: null, isActive, createdAtUtc, updatedAtUtc,
});

const person = (
  id: string,
  firstName: string,
  lastName: string,
  personalId: string,
  dateOfBirth: string,
  address: string,
  email: string,
  phoneNumber: string,
  driverId: string | null,
  isActive: boolean,
  createdAtUtc: Instant,
  updatedAtUtc: Instant | null,
): CustomerResponse => ({
  id, type: CustomerType.PrivateIndividual, firstName, lastName, personalId, dateOfBirth,
  companyName: null, registrationCode: null,
  address, email, phoneNumber, driverId, isActive, createdAtUtc, updatedAtUtc,
});

export const customers = (): CustomerResponse[] => [
  business(C.cu1, 'Baltic Freight Partners', '40103772110', 'Katlakalna 11, Riga, LV-1073', 'fleet@balticfreight.example', '+371 67 220 118', true, d(-240), d(-9)),
  person(C.cu2, 'Ilze', 'Berzina', '110385-12043', '1985-03-11', 'Vienibas gatve 87, Riga, LV-1004', 'ilze.berzina@example.com', '+371 29 441 208', D.d2, true, d(-180), d(-20)),
  business(C.cu3, 'Nordwind Logistics', '40203119887', 'Ganibu dambis 24, Riga, LV-1005', 'ops@nordwind.example', '+371 66 881 004', true, d(-300), null),
  person(C.cu4, 'Martins', 'Ozols', '240790-11882', '1990-07-24', 'Kengaraga 8, Riga, LV-1063', 'm.ozols@example.com', '+371 26 118 903', null, true, d(-88), null),
  business(C.cu5, 'Ventspils Marine Services', '41203009114', 'Ostas iela 3, Ventspils, LV-3601', 'admin@vms.example', '+371 63 620 991', false, d(-420), d(-61)),
  person(C.cu6, 'Anete', 'Kalnina', '020992-10774', '1992-09-02', 'Talejas 6, Jurmala, LV-2015', 'anete.kalnina@example.com', '+371 28 330 447', D.d5, true, d(-55), d(-2)),
  business(C.cu7, 'Daugava Construction', '40003882201', 'Maskavas 322, Riga, LV-1063', 'transport@daugavacon.example', '+371 67 449 210', true, d(-150), null),
  person(C.cu8, 'Roberts', 'Liepins', '170688-13991', '1988-06-17', 'Zemitana 4, Riga, LV-1012', 'r.liepins@example.com', '+371 22 007 118', null, true, d(-33), null),
];

export const drivers = (): DriverResponse[] => [
  { id: D.d1, firstName: 'Janis', lastName: 'Krumins', personalId: '050381-10228', dateOfBirth: '1981-03-05', address: 'Ropazu 14, Riga, LV-1039', email: 'j.krumins@balticfreight.example', phoneNumber: '+371 29 118 004', driverLicenseNumber: 'LV-AF-448120', isActive: true, createdAtUtc: d(-230), updatedAtUtc: d(-11) },
  { id: D.d2, firstName: 'Ilze', lastName: 'Berzina', personalId: '110385-12043', dateOfBirth: '1985-03-11', address: 'Vienibas gatve 87, Riga, LV-1004', email: 'ilze.berzina@example.com', phoneNumber: '+371 29 441 208', driverLicenseNumber: 'LV-AB-201773', isActive: true, createdAtUtc: d(-180), updatedAtUtc: null },
  { id: D.d3, firstName: 'Edgars', lastName: 'Sproģis', personalId: '221177-11004', dateOfBirth: '1977-11-22', address: 'Brivibas 188, Riga, LV-1012', email: 'e.sprogis@nordwind.example', phoneNumber: '+371 26 774 001', driverLicenseNumber: 'LV-AC-330219', isActive: true, createdAtUtc: d(-300), updatedAtUtc: null },
  { id: D.d4, firstName: 'Kristine', lastName: 'Vitola', personalId: '081294-12210', dateOfBirth: '1994-12-08', address: 'Slokas 42, Riga, LV-1048', email: 'k.vitola@daugavacon.example', phoneNumber: '+371 25 330 118', driverLicenseNumber: 'LV-AD-559120', isActive: true, createdAtUtc: d(-140), updatedAtUtc: d(-4) },
  { id: D.d5, firstName: 'Anete', lastName: 'Kalnina', personalId: '020992-10774', dateOfBirth: '1992-09-02', address: 'Talejas 6, Jurmala, LV-2015', email: 'anete.kalnina@example.com', phoneNumber: '+371 28 330 447', driverLicenseNumber: 'LV-AE-118440', isActive: true, createdAtUtc: d(-55), updatedAtUtc: null },
  { id: D.d6, firstName: 'Normunds', lastName: 'Zarins', personalId: '190869-10038', dateOfBirth: '1969-08-19', address: 'Rupniecibas 5, Liepaja, LV-3401', email: 'n.zarins@example.com', phoneNumber: '+371 63 440 118', driverLicenseNumber: 'LV-AA-004471', isActive: false, createdAtUtc: d(-520), updatedAtUtc: d(-74) },
  { id: D.d7, firstName: 'Laura', lastName: 'Ozola', personalId: '300796-11220', dateOfBirth: '1996-07-30', address: 'Cesu 12, Riga, LV-1012', email: 'l.ozola@nordwind.example', phoneNumber: '+371 20 118 774', driverLicenseNumber: 'LV-AG-772013', isActive: true, createdAtUtc: d(-40), updatedAtUtc: null },
];

/** Business customers are their company name, private customers their person name. */
export const displayNameOf = (c: CustomerResponse | undefined): string =>
  !c ? '—' : c.type === CustomerType.Business ? c.companyName ?? '—' : `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();

interface Row {
  key: keyof typeof A;
  customer: string;
  vehicle: string;
  status: AssignmentStatus;
  plannedStart: Instant | null;
  started: Instant | null;
  plannedEnd: Instant | null;
  closed: Instant | null;
  note: string | null;
  created: Instant;
  updated: Instant | null;
}

const ROWS: Row[] = [
  { key: 'a1', customer: C.cu1, vehicle: V.v1, status: AssignmentStatus.Active, plannedStart: d(-12), started: at(-24 * 12 + 1), plannedEnd: d(18), closed: null, note: 'Long-term contract, monthly billing cycle.', created: d(-14), updated: d(-3) },
  { key: 'a2', customer: C.cu2, vehicle: V.v3, status: AssignmentStatus.Active, plannedStart: d(-4), started: d(-4), plannedEnd: d(3), closed: null, note: null, created: d(-6), updated: null },
  { key: 'a3', customer: C.cu3, vehicle: V.v7, status: AssignmentStatus.Active, plannedStart: d(-30), started: d(-30), plannedEnd: d(60), closed: null, note: 'Rotating driver pool authorised at customer level.', created: d(-32), updated: d(-30) },
  { key: 'a4', customer: C.cu4, vehicle: V.v9, status: AssignmentStatus.Planned, plannedStart: d(2), started: null, plannedEnd: d(16), closed: null, note: 'Awaiting licence verification before handover.', created: at(-20), updated: null },
  { key: 'a5', customer: C.cu7, vehicle: V.v4, status: AssignmentStatus.Planned, plannedStart: d(5), started: null, plannedEnd: d(35), closed: null, note: null, created: at(-44), updated: null },
  { key: 'a6', customer: C.cu6, vehicle: V.v6, status: AssignmentStatus.Active, plannedStart: d(-2), started: d(-2), plannedEnd: d(5), closed: null, note: null, created: d(-3), updated: d(-2) },
  { key: 'a7', customer: C.cu8, vehicle: V.v10, status: AssignmentStatus.Ended, plannedStart: d(-40), started: d(-40), plannedEnd: d(-10), closed: d(-10), note: 'Returned with full tank, no damage recorded.', created: d(-42), updated: d(-10) },
  { key: 'a8', customer: C.cu1, vehicle: V.v2, status: AssignmentStatus.Ended, plannedStart: d(-90), started: d(-90), plannedEnd: d(-32), closed: d(-31), note: null, created: d(-92), updated: d(-31) },
  { key: 'a9', customer: C.cu5, vehicle: V.v8, status: AssignmentStatus.Cancelled, plannedStart: d(-60), started: null, plannedEnd: d(-20), closed: d(-58), note: 'Customer record deactivated before handover; booking withdrawn by the customer.', created: d(-62), updated: d(-58) },
  { key: 'a10', customer: C.cu3, vehicle: V.v5, status: AssignmentStatus.Ended, plannedStart: d(-160), started: d(-160), plannedEnd: d(-100), closed: d(-99), note: null, created: d(-162), updated: d(-99) },
  { key: 'a11', customer: C.cu7, vehicle: V.v3, status: AssignmentStatus.Cancelled, plannedStart: d(-20), started: null, plannedEnd: d(-6), closed: d(-19), note: 'Site works postponed; no replacement vehicle required.', created: d(-21), updated: d(-19) },
  { key: 'a12', customer: C.cu2, vehicle: V.v1, status: AssignmentStatus.Ended, plannedStart: d(-220), started: d(-220), plannedEnd: d(-190), closed: d(-188), note: null, created: d(-222), updated: d(-188) },
];

export function assignments(
  customerRows: CustomerResponse[],
  vehicleRows: VehicleResponse[],
): RentalAssignmentResponse[] {
  return ROWS.map((r, i) => ({
    id: A[r.key],
    customerId: r.customer,
    customerDisplayName: displayNameOf(customerRows.find((c) => c.id === r.customer)),
    vehicleId: r.vehicle,
    vehiclePlateNumber: vehicleRows.find((v) => v.id === r.vehicle)?.plateNumber ?? '—',
    status: r.status,
    plannedStartAtUtc: r.plannedStart,
    startedAtUtc: r.started,
    plannedEndAtUtc: r.plannedEnd,
    closedAtUtc: r.closed,
    note: r.note,
    concurrencyToken: tok(100 + i),
    createdAtUtc: r.created,
    updatedAtUtc: r.updated,
    // Composed per read by the handler, from the store's own arrays.
    driverAuthorizations: [],
    interruptions: [],
  }));
}

const Z = ID.authorizations;
const T = AssignmentDriverAuthorizationType;

export const authorizations = (): AssignmentDriverAuthorizationResponse[] => [
  { id: Z.z1, rentalAssignmentId: A.a1, authorizationType: T.NamedDriver, driverId: D.d1, authorizedFromUtc: d(-12), stoppedAtUtc: null, stopReason: null, note: null, concurrencyToken: tok(201), createdAtUtc: d(-12), updatedAtUtc: null },
  { id: Z.z2, rentalAssignmentId: A.a1, authorizationType: T.NamedDriver, driverId: D.d4, authorizedFromUtc: d(-6), stoppedAtUtc: d(-2), stopReason: AuthorizationStopReason.Replaced, note: 'Replaced by contract driver rotation.', concurrencyToken: tok(202), createdAtUtc: d(-6), updatedAtUtc: d(-2) },
  { id: Z.z3, rentalAssignmentId: A.a2, authorizationType: T.NamedDriver, driverId: D.d2, authorizedFromUtc: d(-4), stoppedAtUtc: null, stopReason: null, note: 'Private customer driving personally.', concurrencyToken: tok(203), createdAtUtc: d(-4), updatedAtUtc: null },
  { id: Z.z4, rentalAssignmentId: A.a3, authorizationType: T.BusinessCustomerDrivers, driverId: null, authorizedFromUtc: d(-30), stoppedAtUtc: null, stopReason: null, note: 'All Nordwind employees holding a category B licence, per framework agreement clause 4.2.', concurrencyToken: tok(204), createdAtUtc: d(-30), updatedAtUtc: null },
  { id: Z.z5, rentalAssignmentId: A.a6, authorizationType: T.NamedDriver, driverId: D.d5, authorizedFromUtc: d(-2), stoppedAtUtc: null, stopReason: null, note: null, concurrencyToken: tok(205), createdAtUtc: d(-2), updatedAtUtc: null },
  { id: Z.z6, rentalAssignmentId: A.a7, authorizationType: T.NamedDriver, driverId: D.d7, authorizedFromUtc: d(-40), stoppedAtUtc: d(-10), stopReason: AuthorizationStopReason.AssignmentEnded, note: null, concurrencyToken: tok(206), createdAtUtc: d(-40), updatedAtUtc: d(-10) },
];

const I = ID.interruptions;

export const interruptions = (): AssignmentInterruptionResponse[] => [
  { id: I.i1, rentalAssignmentId: A.a1, startedAtUtc: d(-5), endedAtUtc: d(-4), reason: InterruptionReason.ScheduledMaintenance, billingImpact: BillingImpact.Billable50Percent, note: 'Scheduled 60 000 km service at authorised workshop.', concurrencyToken: tok(301), createdAtUtc: d(-5), updatedAtUtc: d(-4) },
  { id: I.i2, rentalAssignmentId: A.a3, startedAtUtc: at(-26), endedAtUtc: null, reason: InterruptionReason.CarRepair, billingImpact: BillingImpact.NotBillable, note: 'Rear suspension noise, vehicle at workshop awaiting parts.', concurrencyToken: tok(302), createdAtUtc: at(-26), updatedAtUtc: null },
  { id: I.i3, rentalAssignmentId: A.a6, startedAtUtc: at(-8), endedAtUtc: null, reason: InterruptionReason.NoValidInspection, billingImpact: BillingImpact.NotBillable, note: 'Roadworthiness inspection expired; renewal booked.', concurrencyToken: tok(303), createdAtUtc: at(-8), updatedAtUtc: null },
  { id: I.i4, rentalAssignmentId: A.a7, startedAtUtc: d(-22), endedAtUtc: d(-20), reason: InterruptionReason.VacationOrLeave, billingImpact: BillingImpact.FullyBillable, note: 'Customer on leave, vehicle retained.', concurrencyToken: tok(304), createdAtUtc: d(-22), updatedAtUtc: d(-20) },
];

/** The whole fleet, wired: assignments resolve their customer and vehicle from these same rows. */
export function fleet() {
  const vehicleRows = vehicles();
  const customerRows = customers();
  return {
    vehicles: vehicleRows,
    customers: customerRows,
    drivers: drivers(),
    assignments: assignments(customerRows, vehicleRows),
    authorizations: authorizations(),
    interruptions: interruptions(),
  };
}
