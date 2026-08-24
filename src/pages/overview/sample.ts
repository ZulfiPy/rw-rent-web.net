import type { Tone } from '@/ui/status';

/**
 * The prototype's `tasksModel()` and `insuranceModel()`, verbatim. Tasks and insurance have no
 * backend yet: these rows are sample data, and every surface that shows them says so.
 */
export interface SampleRow {
  id: string;
  icon: string;
  tone: Tone | 'plain';
  title: string;
  sub: string;
  when: string;
}

export const TASKS: SampleRow[] = [
  { id: 't1', icon: 'assignment_late', tone: 'warn', title: 'Signed handover protocol missing — 552 KLM', sub: 'Nordwind Logistics · due today', when: 'today' },
  { id: 't2', icon: 'photo_camera', tone: 'warn', title: 'Upload return inspection — 204 JLM', sub: 'Anete Kalnina · overdue', when: '2 d ago' },
  { id: 't3', icon: 'speed', tone: 'plain', title: 'Confirm return mileage — 444 WKS', sub: 'Martins Ozols · awaiting driver', when: 'in 2 d' },
  { id: 't4', icon: 'receipt_long', tone: 'plain', title: 'Renew road tax — 770 HDV', sub: 'Expires end of month', when: 'in 9 d' },
];

export const INSURANCE: SampleRow[] = [
  { id: 'i1', icon: 'gavel', tone: 'warn', title: 'Damage claim — 552 KLM', sub: 'Rear bumper · awaiting adjuster visit', when: '3 d ago' },
  { id: 'i2', icon: 'description', tone: 'warn', title: 'Third-party claim — 204 JLM', sub: 'Windscreen · documents missing', when: '1 d ago' },
  { id: 'i3', icon: 'shield', tone: 'bad', title: 'Policy lapsed — 400 NDP', sub: 'Liability cover expired · vehicle still active', when: '5 h ago' },
];

export const SAMPLE_CHIP = 'Sample · module under development';

export const TASKS_NOTICE =
  'Task management is still being built on the backend. The records below are sample data — creating, assigning and closing tasks is not available yet.';

export const INSURANCE_NOTICE =
  'Insurance handling is still being built on the backend. The records below are sample data — filing claims and updating policies is not available yet.';
