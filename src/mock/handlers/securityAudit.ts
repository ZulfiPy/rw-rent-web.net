import type { SecurityAuditQuery } from '@/api/dto';
import { page } from '../paging';
import { route } from '../transport';

route('GET', '/api/security-audit', (ctx) => {
  const q = ctx.query as SecurityAuditQuery;
  const rows = ctx.store.audit
    .filter((r) => (q.CompanyId ? r.companyId === q.CompanyId : true))
    .filter((r) => (q.TargetUserId ? r.targetUserId === q.TargetUserId : true))
    // Exact and case-sensitive, as documented.
    .filter((r) => (q.EventType ? r.eventType === q.EventType : true))
    .sort((a, b) => (b.occurredAtUtc + b.id).localeCompare(a.occurredAtUtc + a.id));
  return page(rows, q);
}, ['SecurityAudit.ReadCompany']);

/**
 * FOLLOW-UP: mock-only. The Overview's Recent security activity card is the prototype's
 * `db.audit.slice(0, 5)` — the first five rows of the audit store in stored order, which is not
 * time-ordered and which `GET /api/security-audit` cannot express (it pages newest first). Served
 * here so the card matches the reviewed design; the wiring phase replaces it with whatever the
 * backend exposes for the card. See COVERAGE.md §5.4.
 */
route('GET', '/api/overview/security-activity', (ctx) =>
  ({ items: ctx.store.audit.slice(0, 5) }), ['SecurityAudit.ReadCompany']);
