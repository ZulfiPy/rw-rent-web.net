import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { listCompanyInterruptions } from '@/api/interruptions';
import { listAssignments } from '@/api/rentalAssignments';
import { listUsers } from '@/api/users';
import { ApplicationUserStatus, AssignmentStatus } from '@/api/dto';
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
  to: string;
}

const PAGE = { PageSize: 100 } as const;
const THREE_DAYS = 3 * 24 * 3_600_000;

const OPEN_INTERRUPTIONS = { PageSize: 100, IsOpen: true } as const;

/**
 * The open queue, assembled from the lists the persona may read. Every part is permission-gated on
 * its own, so a Viewer sees the registrations they can act on and nothing they cannot. Four list
 * requests, none of them per row: the open interruptions come from the company-wide read and a
 * planned handover's coverage from the planned list's own openAuthorizationCount.
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

  const planned = useQuery({
    queryKey: qk.assignments.list({ ...PAGE, Status: AssignmentStatus.Planned }),
    queryFn: () => listAssignments({ ...PAGE, Status: AssignmentStatus.Planned }),
    enabled: mayReadAssignments,
  });

  const interruptions = useQuery({
    queryKey: qk.interruptions.list(OPEN_INTERRUPTIONS),
    queryFn: () => listCompanyInterruptions(OPEN_INTERRUPTIONS),
    enabled: can('Interruptions.Read'),
  });

  const plannedRows = planned.data?.items ?? [];
  const openInterruptionRows = interruptions.data?.items ?? [];
  const openInterruptions = interruptions.data?.totalCount ?? 0;

  const items: QueueItem[] = [];

  /**
   * Group order and within-group order are the prototype's rendered order: registrations, then open
   * interruptions, then imminent handovers. The prototype walks its in-memory collections, which the
   * API cannot express — so each group is ordered by the timestamp its rows are read against, in the
   * direction that reproduces the prototype's list (registrations by registration instant, newest
   * first; interruptions oldest open first). A pending registration has no later activity, and the
   * list projection carries no `updatedAtUtc` anyway.
   */
  const pending = (registrations.data?.items ?? [])
    .filter((u) => u.emailConfirmed)
    .map((u) => ({ u, at: u.createdAtUtc ?? '' }))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  for (const { u, at } of pending) {
    items.push({
      id: `reg-${u.id}`,
      icon: 'how_to_reg',
      tone: 'warn',
      title: `${u.firstName} ${u.lastName} — awaiting activation`,
      sub: `Email confirmed · ${u.email} · no roles assigned yet`,
      when: relative(at),
      to: `/users/${u.id}`,
    });
  }

  // Served oldest open first; the row carries its own vehicle and customer.
  for (const int of openInterruptionRows) {
    items.push({
      id: `int-${int.id}`,
      icon: 'pause_circle',
      tone: 'bad',
      title: `Open interruption — ${INTERRUPTION_REASON_LABEL[int.reason]}`,
      sub: `${int.vehiclePlateNumber} · ${int.customerDisplayName} · ${BILLING_IMPACT_LABEL[int.billingImpact]}`,
      when: relative(int.startedAtUtc),
      to: `/rental-assignments/${int.rentalAssignmentId}?tab=interruptions`,
    });
  }

  plannedRows.forEach((a) => {
    const start = a.plannedStartAtUtc;
    if (!start || new Date(start).getTime() > Date.now() + THREE_DAYS) return;
    const covered = a.openAuthorizationCount > 0;
    items.push({
      id: `plan-${a.id}`,
      icon: 'event_upcoming',
      tone: 'info',
      title: `Planned handover — ${a.vehiclePlateNumber}`,
      sub: `${a.customerDisplayName}${covered ? ' · driver authorized' : ' · no authorized driver yet'}`,
      when: relative(start),
      to: `/rental-assignments/${a.id}`,
    });
  });

  // The prototype's queueModel caps the queue at seven rows; both surfaces show the same list.
  const capped = items.slice(0, 7);

  const isPending = (mayReview && registrations.isPending) || (mayReadAssignments && planned.isPending);

  return {
    items: capped,
    openInterruptions,
    isPending,
    mayReadInterruptions: can('Interruptions.Read'),
    /** The sidebar's Registrations badge: confirmed registrations waiting for a decision. */
    pendingRegistrations: (registrations.data?.items ?? []).filter((u) => u.emailConfirmed).length,
  };
}
