import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { AssignmentRecord } from './fleet/AssignmentRecord';
import { assignment, clearRenders, renderPage } from './followup7b.support';

/**
 * The same rows below 768 pixels, where the assignment record lays its authorizations and
 * interruptions out as cards. A server render always takes the desktop tier, so the tier is set
 * here; everything else is the real page.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
}));

afterEach(clearRenders);

describe('the assignment record on a phone (F7-6)', () => {
  const read = (tab: string) => renderPage(h(AssignmentRecord), {
    at: `/rental-assignments/${assignment.id}?tab=${tab}`,
    route: '/rental-assignments/:assignmentId',
    permissions: ['RentalAssignments.Read'],
    data: [[qk.assignments.detail(assignment.id), assignment]],
  });

  test('each authorization card says who recorded it', () => {
    const markup = read('coverage');
    expect(markup).not.toContain('<table');
    expect(markup.match(/>Recorded by Karlis Zvaigzne</g)).toHaveLength(2);
  });

  test('each interruption card says who recorded it', () => {
    const markup = read('interruptions');
    expect(markup).not.toContain('<table');
    expect(markup.match(/>Recorded by Karlis Zvaigzne</g)).toHaveLength(1);
  });
});
