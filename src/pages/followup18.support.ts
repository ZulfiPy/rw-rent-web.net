import type {
  InsuranceCaseListItemResponse, InsurerListItemResponse, InsurerResponse, PagedResponse, ProblemDetails, ValidationProblemDetails,
} from '@/api/dto';

/**
 * Follow-up 18’s fixtures: the API’s answers exactly as round 13 gave them (port 5003, round 13’s
 * Release build, `rwrent_r13` freshly seeded, 2026-09-29): the insurers of the list, the cases each
 * one handles, and the refusals of the insurers’ writes and of a case naming an insurer. Typed as the
 * DTOs, so a member the API sends and `dto.ts` does not declare fails the typecheck. Only the tests
 * import this module.
 *
 * The seed’s times are relative to the moment it was seeded, so the tests read them with the clock
 * set to `R13_CAPTURED_AT`, when the answers were given.
 */

export const R13_CAPTURED_AT = '2026-09-29T04:13:49.226341+00:00';

/** GET /api/insurers: the seed's four, in the order of the names */
export const insurersAll: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true,
    "openCasesHandled": 3,
    "casesNamed": 4,
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
  }
];

export const insurersInUse: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true,
    "openCasesHandled": 3,
    "casesNamed": 4,
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
  }
];

export const insurersOutOfUse: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0004-4a7c-9a7c-000000000004",
    "name": "Old Harbour Insurance",
    "email": null,
    "phoneNumber": null,
    "isActive": false,
    "openCasesHandled": 0,
    "casesNamed": 0,
    "concurrencyToken": "db435bbd-f9e2-4cc0-98d9-6826675c51c4"
  }
];

/** The Viewer reads the same list */
export const insurersToms: InsurerListItemResponse[] = [
  {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true,
    "openCasesHandled": 3,
    "casesNamed": 4,
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
  }
];

export const insurerBaltic: InsurerResponse = {
  "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
  "name": "Baltic Mutual",
  "email": "claims@balticmutual.example",
  "phoneNumber": "+371 6700 1100",
  "isActive": true,
  "openCasesHandled": 3,
  "casesNamed": 4,
  "concurrencyToken": "b55ef05f-4396-450a-96ca-87ce3c3f73d5",
  "createdAtUtc": "2026-07-31T06:01:00+00:00",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByDisplayName": null
};

export const insurerHarbour: InsurerResponse = {
  "id": "a7c9e1f3-0004-4a7c-9a7c-000000000004",
  "name": "Old Harbour Insurance",
  "email": null,
  "phoneNumber": null,
  "isActive": false,
  "openCasesHandled": 0,
  "casesNamed": 0,
  "concurrencyToken": "db435bbd-f9e2-4cc0-98d9-6826675c51c4",
  "createdAtUtc": "2026-07-31T06:04:00+00:00",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-08-30T07:00:00+00:00",
  "updatedByDisplayName": "Dita Smite"
};

export const openHandledByBaltic: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "type": 2,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-24T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": {
        "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
        "name": "Baltic Mutual",
        "email": "claims@balticmutual.example",
        "phoneNumber": "+371 6700 1100",
        "isActive": true
      },
      "ourClaimNumber": "BM-26-05161",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 2,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-28T11:20:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Baltic Mutual asked for the mileage and photos of the damage",
        "happenedAtUtc": "2026-09-28T11:20:00+00:00"
      },
      "createdAtUtc": "2026-09-25T06:10:00+00:00"
    },
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "type": 1,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-24T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": {
        "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
        "name": "Baltic Mutual",
        "email": "claims@balticmutual.example",
        "phoneNumber": "+371 6700 1100",
        "isActive": true
      },
      "ourClaimNumber": "BM-26-05120",
      "otherInsurer": {
        "id": "a7c9e1f3-0003-4a7c-9a7c-000000000003",
        "name": "Northgate Insurance",
        "email": "claims@northgate.example",
        "phoneNumber": null,
        "isActive": true
      },
      "otherClaimNumber": "NG-771204",
      "handledBy": 1,
      "status": 2,
      "waitingFor": 2,
      "waitingSinceUtc": "2026-09-28T08:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Asked Kristine Vitola for the account",
        "happenedAtUtc": "2026-09-28T08:15:00+00:00"
      },
      "createdAtUtc": "2026-09-24T15:30:00+00:00"
    },
    {
      "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
      "type": 2,
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlate": "204 JLM",
      "damage": "Windscreen cracked by a stone",
      "happenedAtUtc": "2026-09-28T10:25:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Anete Kalnina",
      "ourInsurer": {
        "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
        "name": "Baltic Mutual",
        "email": "claims@balticmutual.example",
        "phoneNumber": "+371 6700 1100",
        "isActive": true
      },
      "ourClaimNumber": "BM-26-05233",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 4,
      "waitingFor": 4,
      "waitingSinceUtc": "2026-09-29T03:52:20.736808+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Approved; the glass workshop replaces it tomorrow",
        "happenedAtUtc": "2026-09-29T03:52:20.736808+00:00"
      },
      "createdAtUtc": "2026-09-28T11:35:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

export const usHandledByBaltic: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "type": 2,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-24T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": {
        "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
        "name": "Baltic Mutual",
        "email": "claims@balticmutual.example",
        "phoneNumber": "+371 6700 1100",
        "isActive": true
      },
      "ourClaimNumber": "BM-26-05161",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 2,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-28T11:20:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Baltic Mutual asked for the mileage and photos of the damage",
        "happenedAtUtc": "2026-09-28T11:20:00+00:00"
      },
      "createdAtUtc": "2026-09-25T06:10:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const closedHandledByBaltic: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const openHandledByMeridian: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
      "type": 1,
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlate": "552 KLM",
      "damage": "Rear bumper and boot lid dented",
      "happenedAtUtc": "2026-09-10T05:35:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": null,
      "ourInsurer": {
        "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
        "name": "Baltic Mutual",
        "email": "claims@balticmutual.example",
        "phoneNumber": "+371 6700 1100",
        "isActive": true
      },
      "ourClaimNumber": "BM-26-04417",
      "otherInsurer": {
        "id": "a7c9e1f3-0002-4a7c-9a7c-000000000002",
        "name": "Meridian Insurance",
        "email": "claims@meridian-insurance.example",
        "phoneNumber": "+372 600 2200",
        "isActive": true
      },
      "otherClaimNumber": "MI-2026-118305",
      "handledBy": 2,
      "status": 3,
      "waitingFor": 3,
      "waitingSinceUtc": "2026-09-22T11:40:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Everything is sent, Meridian is deciding",
        "happenedAtUtc": "2026-09-23T07:15:00+00:00"
      },
      "createdAtUtc": "2026-09-10T07:05:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const openHandledByHarbour: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const handledUnknownRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "This insurer does not exist.",
  "errors": {
    "HandledByInsurerId": [
      "This insurer does not exist."
    ]
  },
  "code": "insurance_cases.insurer_not_found"
};

/** Adding "  baltic   MUTUAL ": the same name in other letters and spaces */
export const insurerNameConflictRefusal: ValidationProblemDetails = {
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

/** Renaming Meridian Insurance to "Northgate insurance" */
export const insurerRenameConflictRefusal: ValidationProblemDetails = {
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

export const insurerEmptyRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Name": [
      "Enter the insurer's name."
    ],
    "Email": [
      "Enter a valid email address."
    ],
    "PhoneNumber": [
      "A phone number must be at most 30 characters."
    ]
  }
};

export const insurerStaleRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The insurer changed concurrently. Retry the operation.",
  "code": "insurers.concurrency_conflict"
};

export const insurerNotFoundRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "This insurer does not exist.",
  "code": "insurers.not_found"
};

export const insurerToggleNotFoundRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "This insurer does not exist.",
  "code": "insurers.not_found"
};

export const insurerViewerRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Authorization failed.",
  "status": 403,
  "detail": "The authenticated user is not allowed to perform this operation.",
  "code": "authorization.forbidden"
};

/** Register case naming Old Harbour Insurance, out of use, as our insurer */
export const registerOutOfUseRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "This insurer is out of use.",
  "errors": {
    "OurInsurerId": [
      "This insurer is out of use."
    ]
  },
  "code": "insurance_cases.insurer_out_of_use"
};

/** Register case naming an insurer that is not on the list as the other party's */
export const registerUnknownInsurerRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "This insurer does not exist.",
  "errors": {
    "OtherInsurerId": [
      "This insurer does not exist."
    ]
  },
  "code": "insurance_cases.insurer_not_found"
};

/** Edit case on 552 KLM changing the other party's insurer to Old Harbour Insurance, out of use */
export const editOutOfUseRefusal: ValidationProblemDetails = {
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
