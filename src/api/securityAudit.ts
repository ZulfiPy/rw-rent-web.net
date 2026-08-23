import { get } from './client';
import type { PagedResponse, SecurityAuditQuery, SecurityAuditResponse } from './dto';

/** Ordered occurredAtUtc descending, then id descending. SortBy/SortDirection are ignored. */
export const listSecurityAudit = (query: SecurityAuditQuery = {}) =>
  get<PagedResponse<SecurityAuditResponse>>('/api/security-audit', query);
