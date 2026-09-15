import { get } from './client';
import type { PagedResponse, SecurityAuditQuery, SecurityAuditResponse, Uuid } from './dto';

/** Ordered occurredAtUtc descending, then id descending. SortBy/SortDirection are ignored. */
export const listSecurityAudit = (query: SecurityAuditQuery = {}) =>
  get<PagedResponse<SecurityAuditResponse>>('/api/security-audit', query);

/** 404 both for an unknown entry and for one outside the reader's audit scope. */
export const getAuditEntry = (entryId: Uuid) =>
  get<SecurityAuditResponse>(`/api/security-audit/${entryId}`);
