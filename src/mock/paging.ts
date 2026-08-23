import type { PagedQuery, PagedResponse } from '@/api/dto';

export function page<T>(items: T[], query: PagedQuery = {}): PagedResponse<T> {
  const pageNumber = Math.max(1, Number(query.PageNumber ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.PageSize ?? 20)));
  const start = (pageNumber - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pageNumber,
    pageSize,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

export const contains = (haystack: unknown, needle?: string) =>
  !needle || String(haystack ?? '').toLowerCase().includes(needle.toLowerCase());

/** Ordering helpers matching the documented server orders. */
export const byDesc = <T>(key: (x: T) => string) => (a: T, b: T) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0);
export const byAsc = <T>(key: (x: T) => string) => (a: T, b: T) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0);
