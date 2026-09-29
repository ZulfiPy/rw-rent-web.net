import type {
  InsuranceCaseListItemResponse, InsuranceCaseResponse, InsurerListItemResponse, InsurerResponse, PagedResponse, ProblemDetails, ValidationProblemDetails,
} from '@/api/dto';

/**
 * Follow-up 18's joint check, as round 13 answered it (port 5003, `rwrent_r13` freshly seeded,
 * 2026-09-29): Dita adds Pilot Insurance AS, names it on a case of 770 HDV, renames it, puts it out
 * of use and back; the same name refused, the old token refused, a new case naming it out of use
 * refused, the old case keeping it. Typed as the DTOs; only the tests import this module. The tests
 * read these with the clock set to `PRACTICE18_AT`, when the answers were given.
 */

export const PRACTICE18_AT = "2026-09-29T04:29:08.279222+00:00";

export const pilotAdded: InsurerResponse = {
  "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
  "name": "Pilot Insurance AS",
  "email": "claims@pilot-insurance.example",
  "phoneNumber": "+372 600 7700",
  "isActive": true,
  "openCasesHandled": 0,
  "casesNamed": 0,
  "concurrencyToken": "c042fea3-ca01-4a19-97f0-309a53cf401b",
  "createdAtUtc": "2026-09-29T04:29:08.358439+00:00",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByDisplayName": null
};

export const pilotNameConflictRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "Another insurer already has this name.",
  "errors": {
    "Name": [
      "Another insurer already has this name."
    ]
  },
  "code": "insurers.name_conflict"
};

export const practiceCase: InsuranceCaseResponse = {
  "id": "bd46dafb-feee-49d0-8473-2d1fa6de1211",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the left mirror knocked off",
  "description": null,
  "happenedAtUtc": "2026-09-29T01:29:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-25T04:12:20.736808+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": null,
  "otherInsurer": {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance AS",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": true
  },
  "otherClaimNumber": "PI-18-0001",
  "handledBy": 2,
  "status": 2,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-29T04:29:08.50731+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [],
  "events": [],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "61f00b5a-6f5b-4cf3-b7df-b976bd8feb27",
  "createdAtUtc": "2026-09-29T04:29:08.50731+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const pilotRenamed: InsurerResponse = {
  "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
  "name": "Pilot Insurance Group",
  "email": "claims@pilot-insurance.example",
  "phoneNumber": "+372 600 7700",
  "isActive": true,
  "openCasesHandled": 1,
  "casesNamed": 1,
  "concurrencyToken": "b855cf52-78ee-4cee-bf05-8b822196c729",
  "createdAtUtc": "2026-09-29T04:29:08.358439+00:00",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-29T04:29:08.569527+00:00",
  "updatedByDisplayName": "Dita Smite"
};

export const pilotStaleRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The insurer changed concurrently. Retry the operation.",
  "code": "insurers.concurrency_conflict"
};

export const practiceCaseRenamed: InsuranceCaseResponse = {
  "id": "bd46dafb-feee-49d0-8473-2d1fa6de1211",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the left mirror knocked off",
  "description": null,
  "happenedAtUtc": "2026-09-29T01:29:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-25T04:12:20.736808+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": null,
  "otherInsurer": {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance Group",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": true
  },
  "otherClaimNumber": "PI-18-0001",
  "handledBy": 2,
  "status": 2,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-29T04:29:08.50731+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [],
  "events": [],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "61f00b5a-6f5b-4cf3-b7df-b976bd8feb27",
  "createdAtUtc": "2026-09-29T04:29:08.50731+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const insurersOutOfUseWithPilot: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0004-4a7c-9a7c-000000000004",
    "name": "Old Harbour Insurance",
    "email": null,
    "phoneNumber": null,
    "isActive": false,
    "openCasesHandled": 0,
    "casesNamed": 0,
    "concurrencyToken": "db435bbd-f9e2-4cc0-98d9-6826675c51c4"
  },
  {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance Group",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": false,
    "openCasesHandled": 1,
    "casesNamed": 1,
    "concurrencyToken": "59610317-d612-4221-8bc1-f28768a6e3cc"
  }
];

export const insurersAllWithPilotOut: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true,
    "openCasesHandled": 3,
    "casesNamed": 5,
    "concurrencyToken": "b55ef05f-4396-450a-96ca-87ce3c3f73d5"
  },
  {
    "id": "a7c9e1f3-0002-4a7c-9a7c-000000000002",
    "name": "Meridian Insurance",
    "email": "claims@meridian-insurance.example",
    "phoneNumber": "+372 600 2200",
    "isActive": true,
    "openCasesHandled": 1,
    "casesNamed": 2,
    "concurrencyToken": "d4e2cdb8-bf89-4ca5-be58-5b646e3981d7"
  },
  {
    "id": "a7c9e1f3-0003-4a7c-9a7c-000000000003",
    "name": "Northgate Insurance",
    "email": "claims@northgate.example",
    "phoneNumber": null,
    "isActive": true,
    "openCasesHandled": 0,
    "casesNamed": 1,
    "concurrencyToken": "486fd270-5c9b-4cf6-b74c-ab443c693413"
  },
  {
    "id": "a7c9e1f3-0004-4a7c-9a7c-000000000004",
    "name": "Old Harbour Insurance",
    "email": null,
    "phoneNumber": null,
    "isActive": false,
    "openCasesHandled": 0,
    "casesNamed": 0,
    "concurrencyToken": "db435bbd-f9e2-4cc0-98d9-6826675c51c4"
  },
  {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance Group",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": false,
    "openCasesHandled": 1,
    "casesNamed": 1,
    "concurrencyToken": "59610317-d612-4221-8bc1-f28768a6e3cc"
  }
];

export const practiceCaseOutOfUse: InsuranceCaseResponse = {
  "id": "bd46dafb-feee-49d0-8473-2d1fa6de1211",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the left mirror knocked off",
  "description": null,
  "happenedAtUtc": "2026-09-29T01:29:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-25T04:12:20.736808+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": null,
  "otherInsurer": {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance Group",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": false
  },
  "otherClaimNumber": "PI-18-0001",
  "handledBy": 2,
  "status": 2,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-29T04:29:08.50731+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [],
  "events": [],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "61f00b5a-6f5b-4cf3-b7df-b976bd8feb27",
  "createdAtUtc": "2026-09-29T04:29:08.50731+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const registerPilotOutOfUseRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "This insurer is out of use.",
  "errors": {
    "OtherInsurerId": [
      "This insurer is out of use."
    ]
  },
  "code": "insurance_cases.insurer_out_of_use"
};

export const practiceCaseEditedKept: InsuranceCaseResponse = {
  "id": "bd46dafb-feee-49d0-8473-2d1fa6de1211",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the left mirror and its cover knocked off",
  "description": null,
  "happenedAtUtc": "2026-09-29T01:29:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-25T04:12:20.736808+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": null,
  "otherInsurer": {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance Group",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": false
  },
  "otherClaimNumber": "PI-18-0001",
  "handledBy": 2,
  "status": 2,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-29T04:29:08.50731+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [],
  "events": [],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "0e995b76-b6bf-459a-978a-5e87a687f76f",
  "createdAtUtc": "2026-09-29T04:29:08.50731+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-29T04:29:08.754175+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const editHarbourRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "This insurer is out of use.",
  "errors": {
    "OtherInsurerId": [
      "This insurer is out of use."
    ]
  },
  "code": "insurance_cases.insurer_out_of_use"
};

export const openHandledByPilot: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "bd46dafb-feee-49d0-8473-2d1fa6de1211",
      "type": 1,
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlate": "770 HDV",
      "damage": "Practice: the left mirror and its cover knocked off",
      "happenedAtUtc": "2026-09-29T01:29:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": null,
      "ourInsurer": {
        "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
        "name": "Baltic Mutual",
        "email": "claims@balticmutual.example",
        "phoneNumber": "+371 6700 1100",
        "isActive": true
      },
      "ourClaimNumber": null,
      "otherInsurer": {
        "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
        "name": "Pilot Insurance Group",
        "email": "claims@pilot-insurance.example",
        "phoneNumber": "+372 600 7700",
        "isActive": false
      },
      "otherClaimNumber": "PI-18-0001",
      "handledBy": 2,
      "status": 2,
      "waitingFor": 3,
      "waitingSinceUtc": "2026-09-29T04:29:08.50731+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": null,
      "createdAtUtc": "2026-09-29T04:29:08.50731+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const insurersAllWithPilot: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true,
    "openCasesHandled": 3,
    "casesNamed": 5,
    "concurrencyToken": "b55ef05f-4396-450a-96ca-87ce3c3f73d5"
  },
  {
    "id": "a7c9e1f3-0002-4a7c-9a7c-000000000002",
    "name": "Meridian Insurance",
    "email": "claims@meridian-insurance.example",
    "phoneNumber": "+372 600 2200",
    "isActive": true,
    "openCasesHandled": 1,
    "casesNamed": 2,
    "concurrencyToken": "d4e2cdb8-bf89-4ca5-be58-5b646e3981d7"
  },
  {
    "id": "a7c9e1f3-0003-4a7c-9a7c-000000000003",
    "name": "Northgate Insurance",
    "email": "claims@northgate.example",
    "phoneNumber": null,
    "isActive": true,
    "openCasesHandled": 0,
    "casesNamed": 1,
    "concurrencyToken": "486fd270-5c9b-4cf6-b74c-ab443c693413"
  },
  {
    "id": "a7c9e1f3-0004-4a7c-9a7c-000000000004",
    "name": "Old Harbour Insurance",
    "email": null,
    "phoneNumber": null,
    "isActive": false,
    "openCasesHandled": 0,
    "casesNamed": 0,
    "concurrencyToken": "db435bbd-f9e2-4cc0-98d9-6826675c51c4"
  },
  {
    "id": "da1dc8d7-cdf2-469e-90dd-f8763553f979",
    "name": "Pilot Insurance Group",
    "email": "claims@pilot-insurance.example",
    "phoneNumber": "+372 600 7700",
    "isActive": true,
    "openCasesHandled": 1,
    "casesNamed": 1,
    "concurrencyToken": "6522f66f-01cc-4c70-884e-ab60295e458f"
  }
];
