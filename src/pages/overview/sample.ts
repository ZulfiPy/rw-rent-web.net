import type { Tone } from '@/ui/status';

/**
 * The prototype's `insuranceModel()`, verbatim. Insurance cases have no backend yet: these rows are
 * sample data, and every surface that shows them says so. The sample tasks went in Follow-up 12,
 * when Tasks came to read the backend's round 10.
 */
export interface SampleRow {
  id: string;
  icon: string;
  tone: Tone | 'plain';
  title: string;
  sub: string;
  when: string;
}

export const INSURANCE: SampleRow[] = [
  { id: 'i1', icon: 'gavel', tone: 'warn', title: 'Damage claim — 552 KLM', sub: 'Rear bumper · awaiting adjuster visit', when: '3 d ago' },
  { id: 'i2', icon: 'description', tone: 'warn', title: 'Third-party claim — 204 JLM', sub: 'Windscreen · documents missing', when: '1 d ago' },
  { id: 'i3', icon: 'shield', tone: 'bad', title: 'Policy lapsed — 400 NDP', sub: 'Liability cover expired · vehicle still active', when: '5 h ago' },
];

export const SAMPLE_CHIP = 'Sample · module under development';

export const INSURANCE_NOTICE =
  'Insurance handling is still being built on the backend. The records below are sample data — filing claims and updating policies is not available yet.';
