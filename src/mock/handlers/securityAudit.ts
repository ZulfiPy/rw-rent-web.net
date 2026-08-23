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
