import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider, type QueryKey } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { qk } from '@/api';
import type {
  CompanyResponse, CustomerResponse, DriverResponse, PagedResponse, RentalAssignmentResponse,
  SecurityAuditResponse, VehicleResponse,
} from '@/api/dto';
import { AccessProvider } from '@/permissions/usePermissions';

/**
 * What the second batch's render tests share: a page rendered to markup the way the browser
 * receives it, from a query cache already holding the API's answers, and those answers themselves.
 * Only the tests import this module.
 */
const clients: QueryClient[] = [];

/** Drops every cache a render made; the tests call it after each test. */
export const clearRenders = () => clients.splice(0).forEach((client) => client.clear());

const SIGNE = '9f2b7c41-0002-4a10-8b01-000000000002';

/** The page component, the real permission provider and router, the cache pre-filled; no fetch. */
export function renderPage(element: ReactElement, { at, route, permissions = [], data = [] }: {
  at: string;
  route: string;
  permissions?: string[];
  data?: Array<[QueryKey, unknown]>;
}): string {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  clients.push(client);
  client.setQueryData(qk.me, {
    id: SIGNE, email: 'signe.priede@rwrent.example', firstName: 'Signe', lastName: 'Priede',
    phoneNumber: '+371 29 118 220', companyId: company.id, status: 2,
    passwordChangedAtUtc: '2026-01-01T00:00:00Z', pendingEmail: null, roles: [2], permissions,
  });
  for (const [key, value] of data) client.setQueryData(key, value);
  return renderToStaticMarkup(
    h(QueryClientProvider, { client },
      h(AccessProvider, null,
        h(MemoryRouter, { initialEntries: [at] },
          h(Routes, null, h(Route, { path: route, element }))))),
  );
}

export const page = <T>(items: T[]): PagedResponse<T> =>
  ({ items, pageNumber: 1, pageSize: items.length || 1, totalCount: items.length, totalPages: 1 });

/** The markup of one fact, from its label to the end of its cell: the value and its second line. */
export const fact = (markup: string, label: string): string | undefined => {
  const at = markup.indexOf(`>${label}</span>`);
  return at < 0 ? undefined : markup.slice(at, markup.indexOf('</div>', at));
};

/**
 * Round 6's responses exactly as the API answered them (the scratch stack on port 5002, seeded
 * sample data, 2026-09-19): records Karlis Zvaigzne (Fleet Manager) created and Signe Priede
 * (Principal) then changed, a seeded vehicle nobody changed, the Company the administrator created,
 * and the two own-revocation entries Dita Smite's profile wrote. Typed as the DTOs, so a member the
 * API sends and `dto.ts` does not declare fails the typecheck.
 */
export const vehicle: VehicleResponse = {
  "id": "53042310-f12e-4144-a9bd-232798e0fafb",
  "plateNumber": "R6D0C92B",
  "vinCode": "R6ACCD0C92BB54183",
  "make": "Skoda",
  "model": "Octavia",
  "year": 2024,
  "bodyType": 2,
  "gearboxType": 2,
  "fuelType": 2,
  "color": "Silver",
  "isActive": true,
  "createdAtUtc": "2026-09-19T06:25:01.441332+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": "2026-09-19T06:25:01.519419+00:00",
  "updatedByDisplayName": "Signe Priede",
  "availability": 2,
  "currentAssignmentId": "8217cf40-8980-4d16-a009-06bcdeab01ca",
  "currentCustomerDisplayName": "Round Six D0C92B",
  "upcomingAssignmentId": null,
  "upcomingCustomerDisplayName": null,
  "upcomingPlannedStartAtUtc": null
};

export const seededVehicle: VehicleResponse = {
  "id": "1a5c8e30-0002-41a5-91a5-000000000002",
  "plateNumber": "119 MPR",
  "vinCode": "YV1DZ8156K1190334",
  "make": "Volvo",
  "model": "XC60",
  "year": 2024,
  "bodyType": 3,
  "gearboxType": 2,
  "fuelType": 4,
  "color": "Onyx black",
  "isActive": true,
  "createdAtUtc": "2026-04-12T06:21:59.972216+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": null,
  "updatedByDisplayName": null,
  "availability": 1,
  "currentAssignmentId": null,
  "currentCustomerDisplayName": null,
  "upcomingAssignmentId": null,
  "upcomingCustomerDisplayName": null,
  "upcomingPlannedStartAtUtc": null
};

export const customer: CustomerResponse = {
  "id": "5cf19c7e-f58a-4d0d-a5bd-670377d47d26",
  "type": 1,
  "firstName": "Round",
  "lastName": "Six D0C92B",
  "personalId": "R6-D0C92B-C",
  "dateOfBirth": "1988-04-12",
  "companyName": null,
  "registrationCode": null,
  "address": "Changed iela 6, Riga",
  "email": "r6-d0c92b@example.com",
  "phoneNumber": "+371 20 D0C 606",
  "driverId": null,
  "isActive": true,
  "createdAtUtc": "2026-09-19T06:25:01.450452+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": "2026-09-19T06:25:01.524756+00:00",
  "updatedByDisplayName": "Signe Priede"
};

export const driver: DriverResponse = {
  "id": "db62082b-b507-44e0-aab4-38df3d191cfd",
  "firstName": "Round",
  "lastName": "Driver AD0C92B",
  "personalId": "R6-D0C92B-A",
  "dateOfBirth": "1985-02-03",
  "address": "Changed iela 7, Riga",
  "email": "r6-driver-ad0c92b@example.com",
  "phoneNumber": "+371 21 D0C 601",
  "driverLicenseNumber": "R6DLD0C92BA",
  "isActive": true,
  "createdAtUtc": "2026-09-19T06:25:01.45864+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": "2026-09-19T06:25:01.529955+00:00",
  "updatedByDisplayName": "Signe Priede"
};

export const company: CompanyResponse = {
  "id": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "name": "RW-Rent Fleet Services",
  "registrationNumber": "40203881204",
  "vatNumber": "LV40203881204",
  "legalAddress": "Brivibas gatve 214, Riga, LV-1039",
  "email": "operations@rwrent.example",
  "phoneNumber": "+371 66 D0C92B",
  "createdAtUtc": "2025-11-23T06:21:59.972216+00:00",
  "createdByDisplayName": "Arturs Veidenbaums",
  "updatedAtUtc": "2026-09-19T06:25:01.541209+00:00",
  "updatedByDisplayName": "Signe Priede"
};

export const assignment: RentalAssignmentResponse = {
  "id": "8217cf40-8980-4d16-a009-06bcdeab01ca",
  "customerId": "5cf19c7e-f58a-4d0d-a5bd-670377d47d26",
  "customerDisplayName": "Round Six D0C92B",
  "vehicleId": "53042310-f12e-4144-a9bd-232798e0fafb",
  "vehiclePlateNumber": "R6D0C92B",
  "plannedStartAtUtc": null,
  "startedAtUtc": "2026-09-18T08:00:00+00:00",
  "plannedEndAtUtc": "2026-09-25T08:00:00+00:00",
  "closedAtUtc": null,
  "status": 1,
  "note": "Round 6 acceptance, changed by the Principal",
  "cancellationNote": null,
  "customerType": 1,
  "vehicleMake": "Skoda",
  "vehicleModel": "Octavia",
  "vehicleVinCode": "R6ACCD0C92BB54183",
  "customerDriverId": null,
  "concurrencyToken": "40ef881e-f7ef-4e04-9cd8-a3ace0c0c0d0",
  "createdAtUtc": "2026-09-19T06:25:01.473181+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": "2026-09-19T06:25:01.53582+00:00",
  "updatedByDisplayName": "Signe Priede",
  "driverAuthorizations": [
    {
      "createdByDisplayName": "Karlis Zvaigzne",
      "updatedByDisplayName": "Signe Priede",
      "id": "db570690-fe0f-4e3e-8bc3-64ad13bb1c6b",
      "rentalAssignmentId": "8217cf40-8980-4d16-a009-06bcdeab01ca",
      "authorizationType": 1,
      "driverId": "db62082b-b507-44e0-aab4-38df3d191cfd",
      "driverFirstName": "Round",
      "driverLastName": "Driver AD0C92B",
      "driverLicenseNumber": "R6DLD0C92BA",
      "authorizedFromUtc": "2026-09-18T07:00:00+00:00",
      "stoppedAtUtc": "2026-09-18T09:00:00+00:00",
      "stopReason": 1,
      "note": "Stopped by the Principal",
      "concurrencyToken": "fadcd8a0-8dad-43a5-9515-0579b85b39cb",
      "createdAtUtc": "2026-09-19T06:25:01.473181+00:00",
      "updatedAtUtc": "2026-09-19T06:25:01.545976+00:00"
    },
    {
      "createdByDisplayName": "Karlis Zvaigzne",
      "updatedByDisplayName": null,
      "id": "804fbf6d-92d2-4d70-a58b-1b1b36139fd3",
      "rentalAssignmentId": "8217cf40-8980-4d16-a009-06bcdeab01ca",
      "authorizationType": 1,
      "driverId": "77c73b71-c388-47b1-b062-762178a2a135",
      "driverFirstName": "Round",
      "driverLastName": "Driver BD0C92B",
      "driverLicenseNumber": "R6DLD0C92BB",
      "authorizedFromUtc": "2026-09-18T08:30:00+00:00",
      "stoppedAtUtc": null,
      "stopReason": null,
      "note": "Second driver",
      "concurrencyToken": "117a96e4-f7fd-4e4f-b915-c79c816e53ff",
      "createdAtUtc": "2026-09-19T06:25:01.484744+00:00",
      "updatedAtUtc": null
    }
  ],
  "interruptions": [
    {
      "createdByDisplayName": "Karlis Zvaigzne",
      "updatedByDisplayName": "Signe Priede",
      "id": "67ffcdef-a0d7-4fc2-91fe-cea2d5f3618a",
      "rentalAssignmentId": "8217cf40-8980-4d16-a009-06bcdeab01ca",
      "startedAtUtc": "2026-09-18T12:00:00+00:00",
      "endedAtUtc": null,
      "reason": 11,
      "billingImpact": 2,
      "note": "Windscreen and wiper repair",
      "concurrencyToken": "7de1d45d-83c6-40b1-b077-0a82e95e7abe",
      "createdAtUtc": "2026-09-19T06:25:01.490387+00:00",
      "updatedAtUtc": "2026-09-19T06:25:01.5507+00:00"
    }
  ]
};

export const othersRevoked: SecurityAuditResponse = {
  "id": "49e5a6c9-2fae-4f44-bb05-5b4b9963d167",
  "eventType": "Session.OthersRevoked",
  "actorUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "actorDisplayName": "Dita Smite",
  "occurredAtUtc": "2026-09-19T06:25:01.791437+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "targetDisplayName": "Dita Smite",
  "entityType": "ApplicationUserSession",
  "entityId": "7c5570d9-9502-480c-83b3-139768474765",
  "reason": null,
  "beforeJson": null,
  "afterJson": "{\"RevokedCount\": 3}"
};

export const revoked: SecurityAuditResponse = {
  "id": "f691a1a2-86e6-40de-a64a-f3a515d4822c",
  "eventType": "Session.Revoked",
  "actorUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "actorDisplayName": "Dita Smite",
  "occurredAtUtc": "2026-09-19T06:25:01.701097+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "targetDisplayName": "Dita Smite",
  "entityType": "ApplicationUserSession",
  "entityId": "259b0808-652b-49eb-a256-30e73cce6d21",
  "reason": null,
  "beforeJson": null,
  "afterJson": null
};
