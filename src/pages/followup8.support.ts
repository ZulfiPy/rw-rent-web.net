import type {
  CustomerDeletionCandidateResponse, DriverAuthorizationDeletionCandidateResponse,
  DriverDeletionCandidateResponse, InterruptionDeletionCandidateResponse,
  RecordDeletionCandidateCountsResponse, RecordDeletionListItemResponse, RecordDeletionResponse,
  RentalAssignmentDeletionCandidateResponse, SecurityAuditResponse, VehicleDeletionCandidateResponse,
} from '@/api/dto';

/**
 * Follow-up 8's fixtures: the backend's round-7 answers exactly as the API gave them on the scratch
 * stack (port 5002, the seeded sample data, 2026-09-21), before and after two deletions made there.
 * The seeded Fleet Manager had first created and put out of use one vehicle and one customer,
 * because the seed has neither. Typed as the DTOs, so a member the API sends and `dto.ts` does not
 * declare fails the typecheck. Only the tests import this module.
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
  "plannedStartAtUtc": "2026-08-12T06:16:39.954194+00:00",
  "plannedEndAtUtc": "2026-09-11T06:16:39.954194+00:00",
  "startedAtUtc": "2026-08-12T06:16:39.954194+00:00",
  "closedAtUtc": "2026-09-11T06:16:39.954194+00:00",
  "authorizationCount": 1,
  "interruptionCount": 1,
  "deletion": {
    "state": 1,
    "blocks": []
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
  "plannedStartAtUtc": "2026-09-19T06:16:39.954194+00:00",
  "plannedEndAtUtc": "2026-09-26T06:16:39.954194+00:00",
  "startedAtUtc": "2026-09-19T06:16:39.954194+00:00",
  "closedAtUtc": null,
  "authorizationCount": 1,
  "interruptionCount": 1,
  "deletion": {
    "state": 1,
    "blocks": []
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
  "plannedStartAtUtc": "2026-07-23T06:16:39.954194+00:00",
  "plannedEndAtUtc": "2026-09-01T06:16:39.954194+00:00",
  "startedAtUtc": null,
  "closedAtUtc": "2026-07-25T06:16:39.954194+00:00",
  "authorizationCount": 0,
  "interruptionCount": 0,
  "deletion": {
    "state": 1,
    "blocks": []
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
  "authorizedFromUtc": "2026-08-12T06:16:39.954194+00:00",
  "stoppedAtUtc": "2026-09-11T06:16:39.954194+00:00",
  "stopReason": 4,
  "deletion": {
    "state": 1,
    "blocks": []
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
  "authorizedFromUtc": "2026-09-19T06:16:39.954194+00:00",
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
    ]
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
  "authorizedFromUtc": "2026-08-22T06:16:39.954194+00:00",
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
    ]
  }
};

export const interruptionEnded: InterruptionDeletionCandidateResponse = {
  "id": "9c5f7e08-0004-49c5-99c5-000000000004",
  "recordLabel": "VacationOrLeave · 400 NDP · Roberts Liepins",
  "rentalAssignmentId": "2d7b5c86-0007-42d7-92d7-000000000007",
  "rentalAssignmentLabel": "400 NDP · Roberts Liepins",
  "vehiclePlateNumber": "400 NDP",
  "customerDisplayName": "Roberts Liepins",
  "reason": 1,
  "billingImpact": 1,
  "startedAtUtc": "2026-08-30T06:16:39.954194+00:00",
  "endedAtUtc": "2026-09-01T06:16:39.954194+00:00",
  "deletion": {
    "state": 1,
    "blocks": []
  }
};

export const interruptionOpen: InterruptionDeletionCandidateResponse = {
  "id": "9c5f7e08-0002-49c5-99c5-000000000002",
  "recordLabel": "CarRepair · 552 KLM · Nordwind Logistics",
  "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
  "rentalAssignmentLabel": "552 KLM · Nordwind Logistics",
  "vehiclePlateNumber": "552 KLM",
  "customerDisplayName": "Nordwind Logistics",
  "reason": 11,
  "billingImpact": 2,
  "startedAtUtc": "2026-09-20T04:16:39.954194+00:00",
  "endedAtUtc": null,
  "deletion": {
    "state": 1,
    "blocks": []
  }
};

export const vehicleReady: VehicleDeletionCandidateResponse = {
  "id": "ed491aae-6242-43fe-8552-b30ad245bdcb",
  "recordLabel": "913 RF3 · Citroen Berlingo 2019",
  "plateNumber": "913 RF3",
  "vinCode": "VF7F8F3DDC0000000",
  "make": "Citroen",
  "model": "Berlingo",
  "year": 2019,
  "isActive": false,
  "deletion": {
    "state": 1,
    "blocks": []
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
        "reason": 1,
        "count": 2,
        "records": [
          {
            "kind": 1,
            "id": "2d7b5c86-0001-4f60-9a06-000000000001",
            "label": "482 TKL · Baltic Freight Partners"
          },
          {
            "kind": 1,
            "id": "2d7b5c86-0012-42d7-92d7-000000000012",
            "label": "482 TKL · Ilze Berzina"
          }
        ]
      }
    ]
  }
};

export const customerReady: CustomerDeletionCandidateResponse = {
  "id": "5823b458-2dcd-4f63-87ef-cefd1cf46f0c",
  "recordLabel": "Edijs Balodis F3DDC",
  "displayName": "Edijs Balodis F3DDC",
  "type": 1,
  "identifier": "110290-F3DDC",
  "email": "edijs.f3ddc@example.com",
  "isActive": false,
  "deletion": {
    "state": 1,
    "blocks": []
  }
};

export const customerBlocked: CustomerDeletionCandidateResponse = {
  "id": "4d9f2a61-0007-44d9-94d9-000000000007",
  "recordLabel": "Daugava Construction",
  "displayName": "Daugava Construction",
  "type": 2,
  "identifier": "40003882201",
  "email": "transport@daugavacon.example",
  "isActive": true,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 1,
        "count": 2,
        "records": [
          {
            "kind": 1,
            "id": "2d7b5c86-0005-42d7-92d7-000000000005",
            "label": "335 SNB · Daugava Construction"
          },
          {
            "kind": 1,
            "id": "2d7b5c86-0011-42d7-92d7-000000000011",
            "label": "770 HDV · Daugava Construction"
          }
        ]
      }
    ]
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
    "blocks": []
  }
};

export const driverBlockedTwice: DriverDeletionCandidateResponse = {
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
        "reason": 2,
        "count": 1,
        "records": [
          {
            "kind": 2,
            "id": "8b4e6d97-0005-48b4-98b4-000000000005",
            "label": "Anete Kalnina · 204 JLM · Anete Kalnina"
          }
        ]
      },
      {
        "reason": 3,
        "count": 1,
        "records": [
          {
            "kind": 5,
            "id": "4d9f2a61-0006-44d9-94d9-000000000006",
            "label": "Anete Kalnina"
          }
        ]
      }
    ]
  }
};

export const driverBlocked: DriverDeletionCandidateResponse = {
  "id": "6e1b3f72-0007-46e1-96e1-000000000007",
  "recordLabel": "Laura Ozola · LV-AG-772013",
  "firstName": "Laura",
  "lastName": "Ozola",
  "email": "l.ozola@nordwind.example",
  "driverLicenseNumber": "LV-AG-772013",
  "isActive": true,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 2,
        "count": 1,
        "records": [
          {
            "kind": 2,
            "id": "8b4e6d97-0006-48b4-98b4-000000000006",
            "label": "Laura Ozola · 400 NDP · Roberts Liepins"
          }
        ]
      }
    ]
  }
};

export const countsOutOfUse: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 6,
  "driverAuthorizations": 2,
  "interruptions": 2,
  "vehicles": 3,
  "customers": 2,
  "drivers": 1
};

export const countsEverything: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 12,
  "driverAuthorizations": 6,
  "interruptions": 4,
  "vehicles": 11,
  "customers": 9,
  "drivers": 7
};

export const deletionsMade: RecordDeletionListItemResponse[] = [
  {
    "auditEntryId": "f5a8a72a-0ecc-4588-999a-9ef06cd4aadf",
    "occurredAtUtc": "2026-09-21T06:23:12.312458+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 1,
    "recordLabel": "400 NDP · Roberts Liepins",
    "reason": 1,
    "note": null
  },
  {
    "auditEntryId": "f284a74d-150e-44f8-b430-270303c06363",
    "occurredAtUtc": "2026-09-21T06:23:12.205219+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 4,
    "recordLabel": "913 RF3 · Citroen Berlingo 2019",
    "reason": 2,
    "note": "Made while teaching a new colleague."
  }
];

export const vehicleDeleted: RecordDeletionResponse = {
  "auditEntryId": "f284a74d-150e-44f8-b430-270303c06363",
  "kind": 4,
  "recordLabel": "913 RF3 · Citroen Berlingo 2019",
  "deletedAuthorizationCount": 0,
  "deletedInterruptionCount": 0
};

export const rentalDeleted: RecordDeletionResponse = {
  "auditEntryId": "f5a8a72a-0ecc-4588-999a-9ef06cd4aadf",
  "kind": 1,
  "recordLabel": "400 NDP · Roberts Liepins",
  "deletedAuthorizationCount": 1,
  "deletedInterruptionCount": 1
};

export const vehicleEntry: SecurityAuditResponse = {
  "id": "f284a74d-150e-44f8-b430-270303c06363",
  "eventType": "Vehicle.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-21T06:23:12.205219+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Vehicle",
  "entityId": "ed491aae-6242-43fe-8552-b30ad245bdcb",
  "reason": "Practice or test record: Made while teaching a new colleague.",
  "beforeJson": "{\"Id\": \"ed491aae-6242-43fe-8552-b30ad245bdcb\", \"Make\": \"Citroen\", \"Year\": 2019, \"Color\": \"White\", \"Model\": \"Berlingo\", \"VinCode\": \"VF7F8F3DDC0000000\", \"BodyType\": \"Wagon\", \"FuelType\": \"Diesel\", \"IsActive\": false, \"GearboxType\": \"Manual\", \"PlateNumber\": \"913 RF3\", \"RecordLabel\": \"913 RF3 · Citroen Berlingo 2019\", \"CreatedAtUtc\": \"2026-09-21T06:23:11.552894+00:00\", \"DeletionNote\": \"Made while teaching a new colleague.\", \"UpdatedAtUtc\": \"2026-09-21T06:23:11.751529+00:00\", \"DeletionReason\": \"PracticeOrTestRecord\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}",
  "afterJson": null
};

export const rentalEntry: SecurityAuditResponse = {
  "id": "f5a8a72a-0ecc-4588-999a-9ef06cd4aadf",
  "eventType": "RentalAssignment.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-21T06:23:12.312458+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "RentalAssignment",
  "entityId": "2d7b5c86-0007-42d7-92d7-000000000007",
  "reason": "Entered by mistake",
  "beforeJson": "{\"Id\": \"2d7b5c86-0007-42d7-92d7-000000000007\", \"Note\": \"Returned with full tank, no damage recorded.\", \"Status\": \"Ended\", \"VehicleId\": \"1a5c8e30-0010-41a5-91a5-000000000010\", \"CustomerId\": \"4d9f2a61-0008-44d9-94d9-000000000008\", \"ClosedAtUtc\": \"2026-09-11T06:16:39.954194+00:00\", \"RecordLabel\": \"400 NDP · Roberts Liepins\", \"CreatedAtUtc\": \"2026-08-10T06:16:39.954194+00:00\", \"DeletionNote\": null, \"StartedAtUtc\": \"2026-08-12T06:16:39.954194+00:00\", \"UpdatedAtUtc\": \"2026-09-11T06:16:39.954194+00:00\", \"Interruptions\": [{\"Id\": \"9c5f7e08-0004-49c5-99c5-000000000004\", \"Note\": \"Customer on leave, vehicle retained.\", \"Reason\": \"VacationOrLeave\", \"EndedAtUtc\": \"2026-09-01T06:16:39.954194+00:00\", \"CreatedAtUtc\": \"2026-08-30T06:16:39.954194+00:00\", \"StartedAtUtc\": \"2026-08-30T06:16:39.954194+00:00\", \"UpdatedAtUtc\": \"2026-09-01T06:16:39.954194+00:00\", \"BillingImpact\": \"FullyBillable\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"f39a543d-7b4d-4f33-8a1a-12c816d27a97\", \"RentalAssignmentId\": \"2d7b5c86-0007-42d7-92d7-000000000007\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"400 NDP · Roberts Liepins\"}], \"Authorizations\": [{\"Id\": \"8b4e6d97-0006-48b4-98b4-000000000006\", \"Note\": null, \"DriverId\": \"6e1b3f72-0007-46e1-96e1-000000000007\", \"StopReason\": \"AssignmentEnded\", \"CreatedAtUtc\": \"2026-08-12T06:16:39.954194+00:00\", \"StoppedAtUtc\": \"2026-09-11T06:16:39.954194+00:00\", \"UpdatedAtUtc\": \"2026-09-11T06:16:39.954194+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"88840f90-8bc6-40ef-a7b5-5f6b1402bfa2\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-08-12T06:16:39.954194+00:00\", \"DriverDisplayName\": \"Laura Ozola\", \"RentalAssignmentId\": \"2d7b5c86-0007-42d7-92d7-000000000007\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"400 NDP · Roberts Liepins\"}], \"DeletionReason\": \"EnteredByMistake\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"PlannedEndAtUtc\": \"2026-09-11T06:16:39.954194+00:00\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CancellationNote\": null, \"ConcurrencyToken\": \"65df2737-a3ab-498c-85f2-4b354fed982b\", \"PlannedStartAtUtc\": \"2026-08-12T06:16:39.954194+00:00\", \"VehiclePlateNumber\": \"400 NDP\", \"CustomerDisplayName\": \"Roberts Liepins\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}",
  "afterJson": null
};
