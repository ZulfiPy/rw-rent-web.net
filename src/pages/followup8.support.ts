import type {
  CustomerDeletionCandidateResponse, DriverAuthorizationDeletionCandidateResponse,
  DriverDeletionCandidateResponse, InterruptionDeletionCandidateResponse,
  RecordDeletionCandidateCountsResponse, RecordDeletionListItemResponse, RecordDeletionResponse,
  RentalAssignmentDeletionCandidateResponse, SecurityAuditResponse,
  VehicleDeletionCandidateResponse,
} from '@/api/dto';

/**
 * Follow-up 8's fixtures, re-captured for Follow-up 9 in the shape of the backend's round 8: the
 * answers exactly as the API gave them on the scratch stack (port 5002, the seeded sample data plus
 * the records earlier checks left there, 2026-09-22), before and after two deletions made there.
 * The same seeded records as Follow-up 8's where they still play their part; the inactive vehicle
 * and customer were created and put out of use by the seeded Fleet Manager, because the seed has
 * neither. Round 8 changed three parts: the running rental 204 JLM and everything it holds are now
 * Blocked by it, the blocked customer is Baltic Freight Partners (Daugava Construction has no
 * running rental and is Ready now), and Laura Ozola is Ready (her authorization would go with her).
 * Typed as the DTOs, so a member the API sends and `dto.ts` does not declare fails the typecheck.
 * Only the tests import this module.
 */

export const rentalEnded: RentalAssignmentDeletionCandidateResponse = {
  "id": "2d7b5c86-0007-42d7-92d7-000000000007",
  "recordLabel": "400 NDP · Roberts Liepins",
  "vehicleId": "1a5c8e30-0010-41a5-91a5-000000000010",
  "vehiclePlateNumber": "400 NDP",
  "vehicleMake": "Skoda",
  "vehicleModel": "Octavia",
  "customerId": "4d9f2a61-0008-44d9-94d9-000000000008",
  "customerDisplayName": "Roberts Liepins",
  "status": 2,
  "plannedStartAtUtc": "2026-08-13T05:18:19.959959+00:00",
  "plannedEndAtUtc": "2026-09-12T05:18:19.959959+00:00",
  "startedAtUtc": "2026-08-13T05:18:19.959959+00:00",
  "closedAtUtc": "2026-09-12T05:18:19.959959+00:00",
  "authorizationCount": 1,
  "interruptionCount": 1,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 1,
      "interruptions": 1,
      "customerLinksCleared": 0
    }
  }
};

export const rentalActive: RentalAssignmentDeletionCandidateResponse = {
  "id": "2d7b5c86-0006-42d7-92d7-000000000006",
  "recordLabel": "204 JLM · Anete Kalnina",
  "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "vehiclePlateNumber": "204 JLM",
  "vehicleMake": "Hyundai",
  "vehicleModel": "Kona Electric",
  "customerId": "4d9f2a61-0006-44d9-94d9-000000000006",
  "customerDisplayName": "Anete Kalnina",
  "status": 1,
  "plannedStartAtUtc": "2026-09-20T05:18:19.959959+00:00",
  "plannedEndAtUtc": "2026-09-27T05:18:19.959959+00:00",
  "startedAtUtc": "2026-09-20T05:18:19.959959+00:00",
  "closedAtUtc": null,
  "authorizationCount": 1,
  "interruptionCount": 1,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 5,
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
      "rentalAssignments": 0,
      "driverAuthorizations": 1,
      "interruptions": 1,
      "customerLinksCleared": 0
    }
  }
};

export const rentalCancelled: RentalAssignmentDeletionCandidateResponse = {
  "id": "2d7b5c86-0009-42d7-92d7-000000000009",
  "recordLabel": "660 BYH · Ventspils Marine Services",
  "vehicleId": "1a5c8e30-0008-41a5-91a5-000000000008",
  "vehiclePlateNumber": "660 BYH",
  "vehicleMake": "Fiat",
  "vehicleModel": "Tipo",
  "customerId": "4d9f2a61-0005-44d9-94d9-000000000005",
  "customerDisplayName": "Ventspils Marine Services",
  "status": 3,
  "plannedStartAtUtc": "2026-07-24T05:18:19.959959+00:00",
  "plannedEndAtUtc": "2026-09-02T05:18:19.959959+00:00",
  "startedAtUtc": null,
  "closedAtUtc": "2026-07-26T05:18:19.959959+00:00",
  "authorizationCount": 0,
  "interruptionCount": 0,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const authorizationReady: DriverAuthorizationDeletionCandidateResponse = {
  "id": "8b4e6d97-0006-48b4-98b4-000000000006",
  "recordLabel": "Laura Ozola · 400 NDP · Roberts Liepins",
  "rentalAssignmentId": "2d7b5c86-0007-42d7-92d7-000000000007",
  "rentalAssignmentLabel": "400 NDP · Roberts Liepins",
  "vehiclePlateNumber": "400 NDP",
  "customerDisplayName": "Roberts Liepins",
  "rentalAssignmentStatus": 2,
  "authorizationType": 1,
  "driverId": "6e1b3f72-0007-46e1-96e1-000000000007",
  "driverDisplayName": "Laura Ozola",
  "driverLicenseNumber": "LV-AG-772013",
  "authorizedFromUtc": "2026-08-13T05:18:19.959959+00:00",
  "stoppedAtUtc": "2026-09-12T05:18:19.959959+00:00",
  "stopReason": 4,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const authorizationBlocked: DriverAuthorizationDeletionCandidateResponse = {
  "id": "8b4e6d97-0005-48b4-98b4-000000000005",
  "recordLabel": "Anete Kalnina · 204 JLM · Anete Kalnina",
  "rentalAssignmentId": "2d7b5c86-0006-42d7-92d7-000000000006",
  "rentalAssignmentLabel": "204 JLM · Anete Kalnina",
  "vehiclePlateNumber": "204 JLM",
  "customerDisplayName": "Anete Kalnina",
  "rentalAssignmentStatus": 1,
  "authorizationType": 1,
  "driverId": "6e1b3f72-0005-46e1-96e1-000000000005",
  "driverDisplayName": "Anete Kalnina",
  "driverLicenseNumber": "LV-AE-118440",
  "authorizedFromUtc": "2026-09-20T05:18:19.959959+00:00",
  "stoppedAtUtc": null,
  "stopReason": null,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 4,
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
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const authorizationCollective: DriverAuthorizationDeletionCandidateResponse = {
  "id": "8b4e6d97-0004-48b4-98b4-000000000004",
  "recordLabel": "Business customer drivers · 552 KLM · Nordwind Logistics",
  "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
  "rentalAssignmentLabel": "552 KLM · Nordwind Logistics",
  "vehiclePlateNumber": "552 KLM",
  "customerDisplayName": "Nordwind Logistics",
  "rentalAssignmentStatus": 1,
  "authorizationType": 2,
  "driverId": null,
  "driverDisplayName": null,
  "driverLicenseNumber": null,
  "authorizedFromUtc": "2026-08-23T05:18:19.959959+00:00",
  "stoppedAtUtc": null,
  "stopReason": null,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 4,
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
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const interruptionEnded: InterruptionDeletionCandidateResponse = {
  "id": "9c5f7e08-0004-49c5-99c5-000000000004",
  "recordLabel": "Vacation or leave · 400 NDP · Roberts Liepins",
  "rentalAssignmentId": "2d7b5c86-0007-42d7-92d7-000000000007",
  "rentalAssignmentLabel": "400 NDP · Roberts Liepins",
  "vehiclePlateNumber": "400 NDP",
  "customerDisplayName": "Roberts Liepins",
  "reason": 1,
  "billingImpact": 1,
  "startedAtUtc": "2026-08-31T05:18:19.959959+00:00",
  "endedAtUtc": "2026-09-02T05:18:19.959959+00:00",
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const interruptionOpen: InterruptionDeletionCandidateResponse = {
  "id": "9c5f7e08-0002-49c5-99c5-000000000002",
  "recordLabel": "Car repair · 552 KLM · Nordwind Logistics",
  "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
  "rentalAssignmentLabel": "552 KLM · Nordwind Logistics",
  "vehiclePlateNumber": "552 KLM",
  "customerDisplayName": "Nordwind Logistics",
  "reason": 11,
  "billingImpact": 2,
  "startedAtUtc": "2026-09-21T03:18:19.959959+00:00",
  "endedAtUtc": null,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const vehicleReady: VehicleDeletionCandidateResponse = {
  "id": "57329b4c-4a1d-48bc-b3c3-f01119a1bb37",
  "recordLabel": "913 RD0 · Citroen Berlingo 2019",
  "plateNumber": "913 RD0",
  "vinCode": "F9VIND09F01D09FXX",
  "make": "Citroen",
  "model": "Berlingo",
  "year": 2019,
  "isActive": false,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const vehicleBlocked: VehicleDeletionCandidateResponse = {
  "id": "1a5c8e30-0001-41a5-91a5-000000000001",
  "recordLabel": "482 TKL · Volkswagen Passat Variant 2023",
  "plateNumber": "482 TKL",
  "vinCode": "WVWZZZ3CZKE004821",
  "make": "Volkswagen",
  "model": "Passat Variant",
  "year": 2023,
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
};

export const customerReady: CustomerDeletionCandidateResponse = {
  "id": "cf69568f-1206-4e59-89df-a0b4e561f67c",
  "recordLabel": "Edijs Balodis D09F",
  "displayName": "Edijs Balodis D09F",
  "type": 1,
  "identifier": "110290-D09F02",
  "email": "edijs.d09f02@example.com",
  "isActive": false,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const customerBlocked: CustomerDeletionCandidateResponse = {
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
};

export const driverReady: DriverDeletionCandidateResponse = {
  "id": "6e1b3f72-0006-46e1-96e1-000000000006",
  "recordLabel": "Normunds Zarins · LV-AA-004471",
  "firstName": "Normunds",
  "lastName": "Zarins",
  "email": "n.zarins@example.com",
  "driverLicenseNumber": "LV-AA-004471",
  "isActive": false,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const driverBlocked: DriverDeletionCandidateResponse = {
  "id": "6e1b3f72-0005-46e1-96e1-000000000005",
  "recordLabel": "Anete Kalnina · LV-AE-118440",
  "firstName": "Anete",
  "lastName": "Kalnina",
  "email": "anete.kalnina@example.com",
  "driverLicenseNumber": "LV-AE-118440",
  "isActive": true,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 7,
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
      "rentalAssignments": 0,
      "driverAuthorizations": 1,
      "interruptions": 0,
      "customerLinksCleared": 1
    }
  }
};

export const driverReadyWithAuthorization: DriverDeletionCandidateResponse = {
  "id": "6e1b3f72-0007-46e1-96e1-000000000007",
  "recordLabel": "Laura Ozola · LV-AG-772013",
  "firstName": "Laura",
  "lastName": "Ozola",
  "email": "l.ozola@nordwind.example",
  "driverLicenseNumber": "LV-AG-772013",
  "isActive": true,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 1,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const countsOutOfUse: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 8,
  "driverAuthorizations": 4,
  "interruptions": 2,
  "vehicles": 3,
  "customers": 2,
  "drivers": 1
};

export const countsEverything: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 20,
  "driverAuthorizations": 14,
  "interruptions": 4,
  "vehicles": 22,
  "customers": 21,
  "drivers": 16
};

export const deletionsMade: RecordDeletionListItemResponse[] = [
  {
    "auditEntryId": "c856002e-6768-4f34-99a5-faf776efd3b9",
    "occurredAtUtc": "2026-09-22T06:48:53.862393+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 1,
    "recordLabel": "400 NDP · Roberts Liepins",
    "reason": 1,
    "note": null
  },
  {
    "auditEntryId": "8275f355-1f43-4327-8c19-81b7f287e08b",
    "occurredAtUtc": "2026-09-22T06:48:53.845959+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 4,
    "recordLabel": "913 RD0 · Citroen Berlingo 2019",
    "reason": 2,
    "note": "Made while teaching a new colleague."
  }
];

export const vehicleDeleted: RecordDeletionResponse = {
  "auditEntryId": "8275f355-1f43-4327-8c19-81b7f287e08b",
  "kind": 4,
  "recordLabel": "913 RD0 · Citroen Berlingo 2019",
  "deletedAuthorizationCount": 0,
  "deletedInterruptionCount": 0,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 0
};

export const rentalDeleted: RecordDeletionResponse = {
  "auditEntryId": "c856002e-6768-4f34-99a5-faf776efd3b9",
  "kind": 1,
  "recordLabel": "400 NDP · Roberts Liepins",
  "deletedAuthorizationCount": 1,
  "deletedInterruptionCount": 1,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 0
};

export const vehicleEntry: SecurityAuditResponse = {
  "id": "8275f355-1f43-4327-8c19-81b7f287e08b",
  "eventType": "Vehicle.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-22T06:48:53.845959+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Vehicle",
  "entityId": "57329b4c-4a1d-48bc-b3c3-f01119a1bb37",
  "reason": "Practice or test record: Made while teaching a new colleague.",
  "beforeJson": "{\"Id\": \"57329b4c-4a1d-48bc-b3c3-f01119a1bb37\", \"Make\": \"Citroen\", \"Year\": 2019, \"Color\": \"White\", \"Model\": \"Berlingo\", \"VinCode\": \"F9VIND09F01D09FXX\", \"BodyType\": \"Wagon\", \"FuelType\": \"Diesel\", \"IsActive\": false, \"GearboxType\": \"Manual\", \"PlateNumber\": \"913 RD0\", \"RecordLabel\": \"913 RD0 · Citroen Berlingo 2019\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.599918+00:00\", \"DeletionNote\": \"Made while teaching a new colleague.\", \"UpdatedAtUtc\": \"2026-09-22T06:48:53.662322+00:00\", \"DeletionReason\": \"PracticeOrTestRecord\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"RentalAssignments\": [], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}",
  "afterJson": null
};

export const rentalEntry: SecurityAuditResponse = {
  "id": "c856002e-6768-4f34-99a5-faf776efd3b9",
  "eventType": "RentalAssignment.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-22T06:48:53.862393+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "RentalAssignment",
  "entityId": "2d7b5c86-0007-42d7-92d7-000000000007",
  "reason": "Entered by mistake",
  "beforeJson": "{\"Id\": \"2d7b5c86-0007-42d7-92d7-000000000007\", \"Note\": \"Returned with full tank, no damage recorded.\", \"Status\": \"Ended\", \"VehicleId\": \"1a5c8e30-0010-41a5-91a5-000000000010\", \"CustomerId\": \"4d9f2a61-0008-44d9-94d9-000000000008\", \"ClosedAtUtc\": \"2026-09-12T05:18:19.959959+00:00\", \"RecordLabel\": \"400 NDP · Roberts Liepins\", \"CreatedAtUtc\": \"2026-08-11T05:18:19.959959+00:00\", \"DeletionNote\": null, \"StartedAtUtc\": \"2026-08-13T05:18:19.959959+00:00\", \"UpdatedAtUtc\": \"2026-09-12T05:18:19.959959+00:00\", \"Interruptions\": [{\"Id\": \"9c5f7e08-0004-49c5-99c5-000000000004\", \"Note\": \"Customer on leave, vehicle retained.\", \"Reason\": \"VacationOrLeave\", \"EndedAtUtc\": \"2026-09-02T05:18:19.959959+00:00\", \"CreatedAtUtc\": \"2026-08-31T05:18:19.959959+00:00\", \"StartedAtUtc\": \"2026-08-31T05:18:19.959959+00:00\", \"UpdatedAtUtc\": \"2026-09-02T05:18:19.959959+00:00\", \"BillingImpact\": \"FullyBillable\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"74110c4a-de19-4d05-b8de-a5e61dfb1549\", \"RentalAssignmentId\": \"2d7b5c86-0007-42d7-92d7-000000000007\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"400 NDP · Roberts Liepins\"}], \"Authorizations\": [{\"Id\": \"8b4e6d97-0006-48b4-98b4-000000000006\", \"Note\": null, \"DriverId\": \"6e1b3f72-0007-46e1-96e1-000000000007\", \"StopReason\": \"AssignmentEnded\", \"CreatedAtUtc\": \"2026-08-13T05:18:19.959959+00:00\", \"StoppedAtUtc\": \"2026-09-12T05:18:19.959959+00:00\", \"UpdatedAtUtc\": \"2026-09-12T05:18:19.959959+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"68de326b-39c8-470b-82e7-37315d060387\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-08-13T05:18:19.959959+00:00\", \"DriverDisplayName\": \"Laura Ozola\", \"RentalAssignmentId\": \"2d7b5c86-0007-42d7-92d7-000000000007\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"400 NDP · Roberts Liepins\"}], \"DeletionReason\": \"EnteredByMistake\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"PlannedEndAtUtc\": \"2026-09-12T05:18:19.959959+00:00\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CancellationNote\": null, \"ConcurrencyToken\": \"58bd9027-468b-4341-a8bf-dd8cde63b137\", \"PlannedStartAtUtc\": \"2026-08-13T05:18:19.959959+00:00\", \"VehiclePlateNumber\": \"400 NDP\", \"CustomerDisplayName\": \"Roberts Liepins\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}",
  "afterJson": null
};
