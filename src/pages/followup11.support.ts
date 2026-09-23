import type {
  ApplicationUserResponse, CompanyResponse, CurrentUserResponse, CustomerDeletionCandidateResponse,
  CustomerListItemResponse, DriverListItemResponse, PagedResponse, ProblemDetails,
  RecordDeletionCandidateCountsResponse, RecordDeletionListItemResponse, RentalAssignmentResponse,
  RoleAssignmentResponse, ValidationProblemDetails, VehicleListItemResponse,
} from '@/api/dto';

/**
 * Follow-up 11's fixtures: the API's answers exactly as it gave them on the scratch stack (port 5002,
 * freshly seeded, 2026-09-23), during the joint check (`Context/wiring_report.md` §4.1): the lists the
 * new-rental dialog picks from, the owner's refusal of an Active rental on a vehicle in use, one real
 * field refusal for each dialog file whose controls now mark themselves invalid, and the Delete records
 * counts and lists before and after the inactive customers were deleted as practice records.
 *
 * Typed as the DTOs, so a member the API sends and `dto.ts` does not declare fails the typecheck.
 * Only the tests import this module.
 */

/** The seeded administrator’s GET /api/me. */
export const meAdmin: CurrentUserResponse = {
  "id": "9f2b7c41-0001-4a10-8b01-000000000001",
  "email": "sysadmin@rwrent.example",
  "firstName": "Arturs",
  "lastName": "Veidenbaums",
  "phoneNumber": "+371 29 000 001",
  "companyId": null,
  "status": 2,
  "passwordChangedAtUtc": "2025-08-19T07:32:59.997568+00:00",
  "pendingEmail": null,
  "roles": [
    1
  ],
  "permissions": [
    "Company.Create",
    "Company.Delete",
    "Company.Read",
    "Company.Update",
    "Customers.Manage",
    "Customers.Read",
    "DriverAuthorizations.Manage",
    "DriverAuthorizations.Read",
    "Drivers.Manage",
    "Drivers.Read",
    "Interruptions.Manage",
    "Interruptions.Read",
    "PrivilegedCorrections.Execute",
    "Records.Delete",
    "RentalAssignments.Manage",
    "RentalAssignments.Read",
    "Roles.ManageCompanyPrincipal",
    "Roles.ManageRecordDeleter",
    "Roles.ManageViewerFleetManager",
    "Roles.ReadHistory",
    "SecurityAudit.ReadAll",
    "SecurityAudit.ReadCompany",
    "Sessions.ManageAnyUser",
    "Sessions.ManageOrdinaryCompanyUsers",
    "SystemAdministration.Transfer",
    "Users.ActivateCompanyPrincipal",
    "Users.ActivateFleetManager",
    "Users.ActivateViewer",
    "Users.CorrectName",
    "Users.ManageRegistrations",
    "Users.ReadDirectory",
    "Users.ReviewRegistrations",
    "Users.SuspendRestoreCompanyPrincipal",
    "Users.SuspendRestoreOrdinary",
    "Vehicles.Manage",
    "Vehicles.Read"
  ]
};

/** The seeded Fleet Manager Karlis Zvaigzne’s GET /api/me: he creates rentals. */
export const meManager: CurrentUserResponse = {
  "id": "9f2b7c41-0003-4a10-8b01-000000000003",
  "email": "karlis.zvaigzne@rwrent.example",
  "firstName": "Karlis",
  "lastName": "Zvaigzne",
  "phoneNumber": "+371 26 440 118",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-02-25T07:32:59.997568+00:00",
  "pendingEmail": null,
  "roles": [
    3
  ],
  "permissions": [
    "Company.Read",
    "Company.Update",
    "Customers.Manage",
    "Customers.Read",
    "DriverAuthorizations.Manage",
    "DriverAuthorizations.Read",
    "Drivers.Manage",
    "Drivers.Read",
    "Interruptions.Manage",
    "Interruptions.Read",
    "RentalAssignments.Manage",
    "RentalAssignments.Read",
    "Users.ActivateViewer",
    "Users.ManageRegistrations",
    "Users.ReadDirectory",
    "Users.ReviewRegistrations",
    "Vehicles.Manage",
    "Vehicles.Read"
  ]
};

/** GET /api/vehicles?PageSize=100, the new-rental dialog’s vehicle list: 204 JLM is in use by Anete Kalnina, 119 MPR is available. */
export const vehiclesPick: PagedResponse<VehicleListItemResponse> = {
  "items": [
    {
      "id": "1a5c8e30-0002-41a5-91a5-000000000002",
      "plateNumber": "119 MPR",
      "vinCode": "YV1DZ8156K1190334",
      "make": "Volvo",
      "model": "XC60",
      "year": 2024,
      "bodyType": 3,
      "fuelType": 4,
      "isActive": true,
      "availability": 1,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0006-41a5-91a5-000000000006",
      "plateNumber": "204 JLM",
      "vinCode": "KMHK381CFNU204711",
      "make": "Hyundai",
      "model": "Kona Electric",
      "year": 2024,
      "bodyType": 3,
      "fuelType": 3,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0006-42d7-92d7-000000000006",
      "currentCustomerDisplayName": "Anete Kalnina",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0004-41a5-91a5-000000000004",
      "plateNumber": "335 SNB",
      "vinCode": "W1K2130421A335512",
      "make": "Mercedes-Benz",
      "model": "E 220 d",
      "year": 2023,
      "bodyType": 1,
      "fuelType": 2,
      "isActive": true,
      "availability": 3,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": "2d7b5c86-0005-42d7-92d7-000000000005",
      "upcomingCustomerDisplayName": "Daugava Construction",
      "upcomingPlannedStartAtUtc": "2026-09-28T07:32:59.997568+00:00"
    },
    {
      "id": "1a5c8e30-0010-41a5-91a5-000000000010",
      "plateNumber": "400 NDP",
      "vinCode": "TMBJJ7NE4M4440801",
      "make": "Skoda",
      "model": "Octavia",
      "year": 2024,
      "bodyType": 2,
      "fuelType": 5,
      "isActive": true,
      "availability": 1,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0009-41a5-91a5-000000000009",
      "plateNumber": "444 WKS",
      "vinCode": "SJNFAAF15U9174220",
      "make": "Nissan",
      "model": "Qashqai",
      "year": 2023,
      "bodyType": 3,
      "fuelType": 4,
      "isActive": true,
      "availability": 3,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": "2d7b5c86-0004-42d7-92d7-000000000004",
      "upcomingCustomerDisplayName": "Martins Ozols",
      "upcomingPlannedStartAtUtc": "2026-09-25T07:32:59.997568+00:00"
    },
    {
      "id": "1a5c8e30-0001-41a5-91a5-000000000001",
      "plateNumber": "482 TKL",
      "vinCode": "WVWZZZ3CZKE004821",
      "make": "Volkswagen",
      "model": "Passat Variant",
      "year": 2023,
      "bodyType": 2,
      "fuelType": 2,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0001-4f60-9a06-000000000001",
      "currentCustomerDisplayName": "Baltic Freight Partners",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0007-41a5-91a5-000000000007",
      "plateNumber": "552 KLM",
      "vinCode": "WBA5R11009F552804",
      "make": "BMW",
      "model": "320d Touring",
      "year": 2022,
      "bodyType": 2,
      "fuelType": 2,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
      "currentCustomerDisplayName": "Nordwind Logistics",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0008-41a5-91a5-000000000008",
      "plateNumber": "660 BYH",
      "vinCode": "ZFA33400006660301",
      "make": "Fiat",
      "model": "Tipo",
      "year": 2020,
      "bodyType": 1,
      "fuelType": 1,
      "isActive": false,
      "availability": 4,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0003-41a5-91a5-000000000003",
      "plateNumber": "770 HDV",
      "vinCode": "WAUZZZF23MN770211",
      "make": "Audi",
      "model": "A4",
      "year": 2022,
      "bodyType": 1,
      "fuelType": 2,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
      "currentCustomerDisplayName": "Ilze Berzina",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0005-41a5-91a5-000000000005",
      "plateNumber": "881 GRT",
      "vinCode": "VF3LCYHZPKS881409",
      "make": "Peugeot",
      "model": "308 SW",
      "year": 2021,
      "bodyType": 2,
      "fuelType": 1,
      "isActive": false,
      "availability": 4,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 10,
  "totalPages": 1
};

/** GET /api/customers?PageSize=100, the new-rental dialog’s customer list. */
export const customersPick: PagedResponse<CustomerListItemResponse> = {
  "items": [
    {
      "id": "4d9f2a61-0001-44d9-94d9-000000000001",
      "type": 2,
      "displayName": "Baltic Freight Partners",
      "email": "fleet@balticfreight.example",
      "phoneNumber": "+371 67 220 118",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0002-44d9-94d9-000000000002",
      "type": 1,
      "displayName": "Ilze Berzina",
      "email": "ilze.berzina@example.com",
      "phoneNumber": "+371 29 441 208",
      "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
      "isActive": true
    },
    {
      "id": "4d9f2a61-0007-44d9-94d9-000000000007",
      "type": 2,
      "displayName": "Daugava Construction",
      "email": "transport@daugavacon.example",
      "phoneNumber": "+371 67 449 210",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0006-44d9-94d9-000000000006",
      "type": 1,
      "displayName": "Anete Kalnina",
      "email": "anete.kalnina@example.com",
      "phoneNumber": "+371 28 330 447",
      "driverId": "6e1b3f72-0005-46e1-96e1-000000000005",
      "isActive": true
    },
    {
      "id": "4d9f2a61-0008-44d9-94d9-000000000008",
      "type": 1,
      "displayName": "Roberts Liepins",
      "email": "r.liepins@example.com",
      "phoneNumber": "+371 22 007 118",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0003-44d9-94d9-000000000003",
      "type": 2,
      "displayName": "Nordwind Logistics",
      "email": "ops@nordwind.example",
      "phoneNumber": "+371 66 881 004",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0004-44d9-94d9-000000000004",
      "type": 1,
      "displayName": "Martins Ozols",
      "email": "m.ozols@example.com",
      "phoneNumber": "+371 26 118 903",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0005-44d9-94d9-000000000005",
      "type": 2,
      "displayName": "Ventspils Marine Services",
      "email": "admin@vms.example",
      "phoneNumber": "+371 63 620 991",
      "driverId": null,
      "isActive": false
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 8,
  "totalPages": 1
};

/** GET /api/drivers?PageSize=100&IsActive=true, the coverage block’s roster. */
export const driversActive: PagedResponse<DriverListItemResponse> = {
  "items": [
    {
      "id": "6e1b3f72-0002-46e1-96e1-000000000002",
      "firstName": "Ilze",
      "lastName": "Berzina",
      "email": "ilze.berzina@example.com",
      "phoneNumber": "+371 29 441 208",
      "personalId": "110385-12043",
      "driverLicenseNumber": "LV-AB-201773",
      "address": "Vienibas gatve 87, Riga, LV-1004",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0005-46e1-96e1-000000000005",
      "firstName": "Anete",
      "lastName": "Kalnina",
      "email": "anete.kalnina@example.com",
      "phoneNumber": "+371 28 330 447",
      "personalId": "020992-10774",
      "driverLicenseNumber": "LV-AE-118440",
      "address": "Talejas 6, Jurmala, LV-2015",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0001-46e1-96e1-000000000001",
      "firstName": "Janis",
      "lastName": "Krumins",
      "email": "j.krumins@balticfreight.example",
      "phoneNumber": "+371 29 118 004",
      "personalId": "050381-10228",
      "driverLicenseNumber": "LV-AF-448120",
      "address": "Ropazu 14, Riga, LV-1039",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0007-46e1-96e1-000000000007",
      "firstName": "Laura",
      "lastName": "Ozola",
      "email": "l.ozola@nordwind.example",
      "phoneNumber": "+371 20 118 774",
      "personalId": "300796-11220",
      "driverLicenseNumber": "LV-AG-772013",
      "address": "Cesu 12, Riga, LV-1012",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0003-46e1-96e1-000000000003",
      "firstName": "Edgars",
      "lastName": "Sproģis",
      "email": "e.sprogis@nordwind.example",
      "phoneNumber": "+371 26 774 001",
      "personalId": "221177-11004",
      "driverLicenseNumber": "LV-AC-330219",
      "address": "Brivibas 188, Riga, LV-1012",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0004-46e1-96e1-000000000004",
      "firstName": "Kristine",
      "lastName": "Vitola",
      "email": "k.vitola@daugavacon.example",
      "phoneNumber": "+371 25 330 118",
      "personalId": "081294-12210",
      "driverLicenseNumber": "LV-AD-559120",
      "address": "Slokas 42, Riga, LV-1048",
      "isActive": true
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 6,
  "totalPages": 1
};

/** POST /api/rental-assignments, Active, on 204 JLM while Anete Kalnina has it: the owner’s refusal (F11-1). Nothing was created. */
export const vehicleInUseRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The vehicle already has an active assignment.",
  "code": "rental_assignments.vehicle_already_active"
};

/** POST /api/rental-assignments, Active, on the free 119 MPR, naming an inactive driver: refused on the driver. Nothing was created. */
export const driverInactiveRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "A named authorization requires an active driver.",
  "code": "assignment_authorizations.driver_inactive"
};

/** GET /api/rental-assignments/{id}: the Active rental that holds 204 JLM, where the warning’s link goes. */
export const inUseRental: RentalAssignmentResponse = {
  "id": "2d7b5c86-0006-42d7-92d7-000000000006",
  "customerId": "4d9f2a61-0006-44d9-94d9-000000000006",
  "customerDisplayName": "Anete Kalnina",
  "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "vehiclePlateNumber": "204 JLM",
  "plannedStartAtUtc": "2026-09-21T07:32:59.997568+00:00",
  "startedAtUtc": "2026-09-21T07:32:59.997568+00:00",
  "plannedEndAtUtc": "2026-09-28T07:32:59.997568+00:00",
  "closedAtUtc": null,
  "status": 1,
  "note": null,
  "cancellationNote": null,
  "customerType": 1,
  "vehicleMake": "Hyundai",
  "vehicleModel": "Kona Electric",
  "vehicleVinCode": "KMHK381CFNU204711",
  "customerDriverId": "6e1b3f72-0005-46e1-96e1-000000000005",
  "concurrencyToken": "c3612de6-a54f-4dfc-9bf6-f757a69a670d",
  "createdAtUtc": "2026-09-20T07:32:59.997568+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": "2026-09-21T07:32:59.997568+00:00",
  "updatedByDisplayName": "Karlis Zvaigzne",
  "driverAuthorizations": [
    {
      "createdByDisplayName": "Karlis Zvaigzne",
      "updatedByDisplayName": null,
      "id": "8b4e6d97-0005-48b4-98b4-000000000005",
      "rentalAssignmentId": "2d7b5c86-0006-42d7-92d7-000000000006",
      "authorizationType": 1,
      "driverId": "6e1b3f72-0005-46e1-96e1-000000000005",
      "driverFirstName": "Anete",
      "driverLastName": "Kalnina",
      "driverLicenseNumber": "LV-AE-118440",
      "authorizedFromUtc": "2026-09-21T07:32:59.997568+00:00",
      "stoppedAtUtc": null,
      "stopReason": null,
      "note": null,
      "concurrencyToken": "02510464-4ded-4879-9859-0f60cf7bf567",
      "createdAtUtc": "2026-09-21T07:32:59.997568+00:00",
      "updatedAtUtc": null
    }
  ],
  "interruptions": [
    {
      "createdByDisplayName": "Karlis Zvaigzne",
      "updatedByDisplayName": null,
      "id": "9c5f7e08-0003-49c5-99c5-000000000003",
      "rentalAssignmentId": "2d7b5c86-0006-42d7-92d7-000000000006",
      "startedAtUtc": "2026-09-22T23:32:59.997568+00:00",
      "endedAtUtc": null,
      "reason": 23,
      "billingImpact": 2,
      "note": "Roadworthiness inspection expired; renewal booked.",
      "concurrencyToken": "6d49c393-c110-42fb-a0a8-851f2888b087",
      "createdAtUtc": "2026-09-22T23:32:59.997568+00:00",
      "updatedAtUtc": null
    }
  ]
};

/** GET /api/rental-assignments/{id}: Martins Ozols’s Planned rental of 444 WKS, the one the Edit refusal was made on. */
export const plannedRental: RentalAssignmentResponse = {
  "id": "2d7b5c86-0004-42d7-92d7-000000000004",
  "customerId": "4d9f2a61-0004-44d9-94d9-000000000004",
  "customerDisplayName": "Martins Ozols",
  "vehicleId": "1a5c8e30-0009-41a5-91a5-000000000009",
  "vehiclePlateNumber": "444 WKS",
  "plannedStartAtUtc": "2026-09-25T07:32:59.997568+00:00",
  "startedAtUtc": null,
  "plannedEndAtUtc": "2026-10-09T07:32:59.997568+00:00",
  "closedAtUtc": null,
  "status": 4,
  "note": "Awaiting licence verification before handover.",
  "cancellationNote": null,
  "customerType": 1,
  "vehicleMake": "Nissan",
  "vehicleModel": "Qashqai",
  "vehicleVinCode": "SJNFAAF15U9174220",
  "customerDriverId": null,
  "concurrencyToken": "beda312d-ff70-402b-a9c1-8cd8168a83d4",
  "createdAtUtc": "2026-09-22T11:32:59.997568+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": null,
  "updatedByDisplayName": null,
  "driverAuthorizations": [],
  "interruptions": []
};

/** PUT /api/rental-assignments/{id} with the planned end before the planned start. */
export const plannedEndRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "PlannedEndAtUtc": [
      "PlannedEndAtUtc must be later than PlannedStartAtUtc."
    ]
  }
};

/** GET /api/rental-assignments/{id}: an Active rental with no interruption history, the one the Cancel refusal was made on. */
export const cancelRental: RentalAssignmentResponse = {
  "id": "2d7b5c86-0002-42d7-92d7-000000000002",
  "customerId": "4d9f2a61-0002-44d9-94d9-000000000002",
  "customerDisplayName": "Ilze Berzina",
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlateNumber": "770 HDV",
  "plannedStartAtUtc": "2026-09-19T07:32:59.997568+00:00",
  "startedAtUtc": "2026-09-19T07:32:59.997568+00:00",
  "plannedEndAtUtc": "2026-09-26T07:32:59.997568+00:00",
  "closedAtUtc": null,
  "status": 1,
  "note": null,
  "cancellationNote": null,
  "customerType": 1,
  "vehicleMake": "Audi",
  "vehicleModel": "A4",
  "vehicleVinCode": "WAUZZZF23MN770211",
  "customerDriverId": "6e1b3f72-0002-46e1-96e1-000000000002",
  "concurrencyToken": "953c3593-f74b-493d-80a8-b8e8d4d47bd6",
  "createdAtUtc": "2026-09-17T07:32:59.997568+00:00",
  "createdByDisplayName": "Karlis Zvaigzne",
  "updatedAtUtc": null,
  "updatedByDisplayName": null,
  "driverAuthorizations": [
    {
      "createdByDisplayName": "Karlis Zvaigzne",
      "updatedByDisplayName": null,
      "id": "8b4e6d97-0003-48b4-98b4-000000000003",
      "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
      "authorizationType": 1,
      "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
      "driverFirstName": "Ilze",
      "driverLastName": "Berzina",
      "driverLicenseNumber": "LV-AB-201773",
      "authorizedFromUtc": "2026-09-19T07:32:59.997568+00:00",
      "stoppedAtUtc": null,
      "stopReason": null,
      "note": "Private customer driving personally.",
      "concurrencyToken": "b94d85c9-de09-48b5-aaff-567e44ef3047",
      "createdAtUtc": "2026-09-19T07:32:59.997568+00:00",
      "updatedAtUtc": null
    }
  ],
  "interruptions": []
};

/** POST …/cancel of that Active rental without its note (ASSIGN-013). It stayed Active. */
export const cancelNoteRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Cancelling a mistaken activation requires an explanatory cancellation note.",
  "errors": {
    "CancellationNote": [
      "A cancellation note is required when cancelling an active assignment."
    ]
  },
  "code": "rental_assignments.correction_note_required"
};

/** POST …/interruptions with the end before the start. */
export const interruptionEndRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "EndedAtUtc": [
      "EndedAtUtc must be later than StartedAtUtc."
    ]
  }
};

/** POST …/authorizations, a named authorization without its driver. */
export const authorizationDriverRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "DriverId": [
      "DriverId is required for a named-driver authorization."
    ]
  }
};

/** POST /api/customers with a blank address. */
export const customerAddressRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Address": [
      "Address is required."
    ]
  }
};

/** GET /api/companies, as the Principal Signe Priede. */
export const company: CompanyResponse = {
  "id": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "name": "RW-Rent Fleet Services",
  "registrationNumber": "40203881204",
  "vatNumber": "LV40203881204",
  "legalAddress": "Brivibas gatve 214, Riga, LV-1039",
  "email": "operations@rwrent.example",
  "phoneNumber": "+371 66 120 400",
  "createdAtUtc": "2025-11-27T07:32:59.997568+00:00",
  "createdByDisplayName": "Arturs Veidenbaums",
  "updatedAtUtc": "2026-09-22T13:32:59.997568+00:00",
  "updatedByDisplayName": "Arturs Veidenbaums"
};

/** PUT /api/companies/{id} with an email that is no address. The company kept its own. */
export const companyEmailRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": [
      "'Email' is not a valid email address."
    ]
  }
};

/** POST /api/system-administrator/transfers with a target that is no address. */
export const transferEmailRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "TargetEmail": [
      "'Target Email' is not a valid email address."
    ]
  }
};

/** GET /api/users/{id}: the seeded Viewer Toms Rudzitis. */
export const toms: ApplicationUserResponse = {
  "securityVersion": 1,
  "updatedAtUtc": "2026-07-15T07:32:59.997568+00:00",
  "registrationDecisionReason": null,
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "emailConfirmed": true,
  "registrationExpiresAtUtc": null,
  "effectiveRoles": [
    4
  ],
  "createdAtUtc": "2026-07-15T07:32:59.997568+00:00"
};

/** GET /api/users/{id}/roles?PageSize=100 for Toms. */
export const tomsRoles: PagedResponse<RoleAssignmentResponse> = {
  "items": [
    {
      "id": "5a8f1d63-0005-4c30-8d03-000000000005",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 4,
      "assignedAtUtc": "2026-07-15T07:32:59.997568+00:00",
      "assignedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "expiresAtUtc": null,
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 1,
  "totalPages": 1
};

/** POST /api/users/{id}/roles with a role that does not exist. */
export const roleRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Role": [
      "'Role' has a range of values which does not include '99'."
    ]
  }
};

/** GET /api/users/{id}: Gatis Lapsa, a confirmed registration waiting for activation. */
export const pendingUser: ApplicationUserResponse = {
  "securityVersion": 1,
  "updatedAtUtc": "2026-09-21T05:32:59.997568+00:00",
  "registrationDecisionReason": null,
  "id": "9f2b7c41-0007-4a10-8b01-000000000007",
  "email": "gatis.lapsa@example.com",
  "firstName": "Gatis",
  "lastName": "Lapsa",
  "phoneNumber": "+371 26 118 447",
  "companyId": null,
  "status": 1,
  "emailConfirmed": true,
  "registrationExpiresAtUtc": null,
  "effectiveRoles": [],
  "createdAtUtc": "2026-09-21T01:32:59.997568+00:00"
};

/** POST /api/users/{id}/activate without a role. */
export const activationRolesRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Roles": [
      "'Roles' must not be empty."
    ]
  }
};

/** POST /api/record-deletions without the tick. The customer stayed. */
export const confirmationRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "A deletion must be confirmed explicitly; it cannot be undone.",
  "errors": {
    "Confirmed": [
      "A deletion must be confirmed explicitly; it cannot be undone."
    ]
  },
  "code": "record_deletions.confirmation_required"
};

/** GET /api/record-deletions/candidates/counts?Show=OutOfUse, once the inactive customer was deleted: no customer is out of use. */
export const countsOutOfUse: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 6,
  "driverAuthorizations": 2,
  "interruptions": 2,
  "vehicles": 2,
  "customers": 0,
  "drivers": 1
};

/** The same under Everything: seven customers. */
export const countsEverything: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 12,
  "driverAuthorizations": 6,
  "interruptions": 4,
  "vehicles": 10,
  "customers": 7,
  "drivers": 7
};

/** GET …/candidates/customers?Show=Everything: every customer, Martins Ozols (active, one planned rental) Ready among them. */
export const customersEverything: PagedResponse<CustomerDeletionCandidateResponse> = {
  "items": [
    {
      "id": "4d9f2a61-0008-44d9-94d9-000000000008",
      "recordLabel": "Roberts Liepins",
      "displayName": "Roberts Liepins",
      "type": 1,
      "identifier": "170688-13991",
      "email": "r.liepins@example.com",
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 1,
          "interruptions": 1,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "4d9f2a61-0006-44d9-94d9-000000000006",
      "recordLabel": "Anete Kalnina",
      "displayName": "Anete Kalnina",
      "type": 1,
      "identifier": "020992-10774",
      "email": "anete.kalnina@example.com",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0006-42d7-92d7-000000000006",
                "label": "204 JLM · Anete Kalnina"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 1,
          "interruptions": 1,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "4d9f2a61-0004-44d9-94d9-000000000004",
      "recordLabel": "Martins Ozols",
      "displayName": "Martins Ozols",
      "type": 1,
      "identifier": "240790-11882",
      "email": "m.ozols@example.com",
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "4d9f2a61-0007-44d9-94d9-000000000007",
      "recordLabel": "Daugava Construction",
      "displayName": "Daugava Construction",
      "type": 2,
      "identifier": "40003882201",
      "email": "transport@daugavacon.example",
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 2,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "4d9f2a61-0002-44d9-94d9-000000000002",
      "recordLabel": "Ilze Berzina",
      "displayName": "Ilze Berzina",
      "type": 1,
      "identifier": "110385-12043",
      "email": "ilze.berzina@example.com",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0002-42d7-92d7-000000000002",
                "label": "770 HDV · Ilze Berzina"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 3,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "4d9f2a61-0001-44d9-94d9-000000000001",
      "recordLabel": "Baltic Freight Partners",
      "displayName": "Baltic Freight Partners",
      "type": 2,
      "identifier": "40103772110",
      "email": "fleet@balticfreight.example",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0001-4f60-9a06-000000000001",
                "label": "482 TKL · Baltic Freight Partners"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 2,
          "driverAuthorizations": 2,
          "interruptions": 1,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "4d9f2a61-0003-44d9-94d9-000000000003",
      "recordLabel": "Nordwind Logistics",
      "displayName": "Nordwind Logistics",
      "type": 2,
      "identifier": "40203119887",
      "email": "ops@nordwind.example",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0003-42d7-92d7-000000000003",
                "label": "552 KLM · Nordwind Logistics"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 2,
          "driverAuthorizations": 1,
          "interruptions": 1,
          "customerLinksCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 7,
  "totalPages": 1
};

/** GET …/candidates/customers?Show=OutOfUse: empty. */
export const customersOutOfUse: PagedResponse<CustomerDeletionCandidateResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

/** GET /api/record-deletions?PageSize=20: the practice deletion of the inactive customer. */
export const deletionsMade: PagedResponse<RecordDeletionListItemResponse> = {
  "items": [
    {
      "auditEntryId": "fce3aa6e-5297-4d82-8663-09027cc4cdee",
      "occurredAtUtc": "2026-09-23T07:33:14.555264+00:00",
      "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "actorDisplayName": "Arturs Veidenbaums",
      "kind": 5,
      "recordLabel": "Ventspils Marine Services",
      "reason": 2,
      "note": "Follow-up 11 check: an empty Out of use."
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};
