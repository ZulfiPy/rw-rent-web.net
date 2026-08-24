import { useQueries, useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { listAuthorizations } from '@/api/authorizations';
import { listInterruptions } from '@/api/interruptions';
import { listAssignments } from '@/api/rentalAssignments';
import { listUsers } from '@/api/users';
import {
  ApplicationUserStatus, AssignmentStatus,
  type AssignmentInterruptionResponse, type RentalAssignmentListItemResponse,
} from '@/api/dto';
import { BILLING_IMPACT_LABEL, INTERRUPTION_REASON_LABEL, relative } from '@/format';
import { useAccess } from '@/permissions/usePermissions';
import type { Tone } from '@/ui/status';

export interface QueueItem {
  id: string;
  icon: string;
  tone: Tone;
  title: string;
  sub: string;
  when: string;
  /** Omitted while the record screen it would open does not exist yet. */
  to?: string;
  /** Sort key: how long the record has been waiting. */
  since: string;
}

const PAGE = { PageSize: 100 } as const;
const THREE_DAYS = 3 * 24 * 3_600_000;

/**
 * The open queue, assembled from the lists the persona may read. Every part is permission-gated on
 * its own, so a Viewer sees the registrations they can act on and nothing they cannot.
 *
 * FOLLOW-UP: interruptions and authorizations are assignment-scoped in swagger, so an open-work view
 * fans out one request per open assignment. A company-wide `GET /api/interruptions?IsOpen=true`
 * would collapse the fan-out to a single call — the same shape of gap as the Registrations queue.
 */
export function useOpenWork() {
  const { can } = useAccess();
  const mayReview = can('Users.ReviewRegistrations');
  const mayReadAssignments = can('RentalAssignments.Read');

  const registrations = useQuery({
    queryKey: qk.users.list({ ...PAGE, Status: ApplicationUserStatus.PendingActivation }),
    queryFn: () => listUsers({ ...PAGE, Status: ApplicationUserStatus.PendingActivation }),
    enabled: mayReview,
  });

  const active = useQuery({
    queryKey: qk.assignments.list({ ...PAGE, Status: AssignmentStatus.Active }),
    queryFn: () => listAssignments({ ...PAGE, Status: AssignmentStatus.Active }),
    enabled: mayReadAssignments,
  });

  const planned = useQuery({
    queryKey: qk.assignments.list({ ...PAGE, Status: AssignmentStatus.Planned }),
    queryFn: () => listAssignments({ ...PAGE, Status: AssignmentStatus.Planned }),
    enabled: mayReadAssignments,
  });

  const activeRows = active.data?.items ?? [];
  const plannedRows = planned.data?.items ?? [];

  const interruptions = useQueries({
    queries: (can('Interruptions.Read') ? activeRows : []).map((a) => ({
      queryKey: qk.assignments.interruptions(a.id, { IsOpen: true }),
      queryFn: () => listInterruptions(a.id, { IsOpen: true }),
    })),
  });

  /** A planned handover with no open authorization has no one cleared to drive it. */
  const cover = useQueries({
    queries: (can('DriverAuthorizations.Read') ? plannedRows : []).map((a) => ({
      queryKey: qk.assignments.authorizations(a.id, { IsOpen: true }),
      queryFn: () => listAuthorizations(a.id, { IsOpen: true }),
    })),
  });

  const openInterruptions = interruptions.reduce(
    (sum, r) => sum + (r.data?.totalCount ?? 0),
    0,
  );

  const items: QueueItem[] = [];

  for (const u of registrations.data?.items ?? []) {
    if (!u.emailConfirmed) continue;
    items.push({
      id: `reg-${u.id}`,
      icon: 'how_to_reg',
      tone: 'warn',
      title: `${u.firstName} ${u.lastName} — awaiting activation`,
      sub: `Email confirmed · ${u.email} · no roles assigned yet`,
      when: relative(u.createdAtUtc),
      to: `/users/${u.id}`,
      since: u.createdAtUtc,
    });
  }

  activeRows.forEach((a: RentalAssignmentListItemResponse, i) => {
    const rows: AssignmentInterruptionResponse[] = interruptions[i]?.data?.items ?? [];
    for (const int of rows) {
      items.push({
        id: `int-${int.id}`,
        icon: 'pause_circle',
        tone: 'bad',
        title: `Open interruption — ${INTERRUPTION_REASON_LABEL[int.reason]}`,
        sub: `${a.vehiclePlateNumber} · ${a.customerDisplayName} · ${BILLING_IMPACT_LABEL[int.billingImpact]}`,
        when: relative(int.startedAtUtc),
        since: int.startedAtUtc,
      });
    }
  });

  plannedRows.forEach((a, i) => {
    const start = a.plannedStartAtUtc;
    if (!start || new Date(start).getTime() > Date.now() + THREE_DAYS) return;
    const covered = (cover[i]?.data?.totalCount ?? 0) > 0;
    items.push({
      id: `plan-${a.id}`,
      icon: 'event_upcoming',
      tone: 'info',
      title: `Planned handover — ${a.vehiclePlateNumber}`,
      sub: `${a.customerDisplayName}${covered ? ' · driver authorized' : ' · no authorized driver yet'}`,
      when: relative(start),
      since: start,
    });
  });

  items.sort((a, b) => (a.since < b.since ? -1 : a.since > b.since ? 1 : 0));
  // The prototype's queueModel caps the queue at seven rows; both surfaces show the same list.
  const capped = items.slice(0, 7);

  const isPending =
    (mayReview && registrations.isPending) ||
    (mayReadAssignments && (active.isPending || planned.isPending));

  return {
    items: capped,
    openInterruptions,
    isPending,
    mayReadInterruptions: can('Interruptions.Read'),
    /** The sidebar's Registrations badge: confirmed registrations waiting for a decision. */
    pendingRegistrations: (registrations.data?.items ?? []).filter((u) => u.emailConfirmed).length,
    /** Denominators the Overview's metric cards show next to their counts. */
    activeAssignments: activeRows.length,
    plannedAssignments: plannedRows.length,
  };
}
