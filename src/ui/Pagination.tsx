import styles from './Pagination.module.css';
import type { PagedResponse } from '@/api/dto';

/** Server paging, rendered from the envelope the API returns. */
export function Pagination<T>({ page, noun, onPage }: {
  page: PagedResponse<T>;
  noun: [singular: string, plural: string];
  onPage: (pageNumber: number) => void;
}) {
  const { pageNumber, pageSize, totalCount, totalPages } = page;
  const first = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const last = Math.min(pageNumber * pageSize, totalCount);
  const word = totalCount === 1 ? noun[0] : noun[1];

  return (
    <div className={styles.bar}>
      <span className={styles.count}>
        {totalCount === 0 ? `0 ${word}` : `${first}–${last} of ${totalCount} ${word}`}
      </span>
      <div className={styles.pager}>
        <button
          type="button"
          className={styles.step}
          onClick={() => onPage(pageNumber - 1)}
          disabled={pageNumber <= 1}
        >
          <span data-icon aria-hidden="true">chevron_left</span>Previous
        </button>
        <span className={styles.page}>{pageNumber} / {totalPages}</span>
        <button
          type="button"
          className={styles.step}
          onClick={() => onPage(pageNumber + 1)}
          disabled={pageNumber >= totalPages}
        >
          Next<span data-icon aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
