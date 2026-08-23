import styles from './Pagination.module.css';
import type { PagedResponse } from '@/api/dto';

const SIZES = [20, 50, 100];

/** Server paging, rendered from the envelope the API returns: range, page size, and the two steps. */
export function Pagination<T>({ page, onPage, onPageSize }: {
  page: PagedResponse<T>;
  onPage: (pageNumber: number) => void;
  onPageSize: (pageSize: number) => void;
}) {
  const { pageNumber, pageSize, totalCount, totalPages } = page;
  const first = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const last = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className={styles.bar}>
      <span className={styles.range}>
        {totalCount === 0 ? 'Nothing to show' : `${first}–${last} of ${totalCount}`}
      </span>

      <label className={styles.perPage}>
        <span>Per page</span>
        <span className={styles.sizeBox}>
          <span className={styles.sizeValue}>{pageSize}</span>
          <span data-icon aria-hidden="true" className={styles.sizeIcon}>expand_more</span>
          <select
            className={styles.nativeSelect}
            value={pageSize}
            aria-label="Rows per page"
            onChange={(e) => onPageSize(Number(e.target.value))}
          >
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </span>
      </label>

      <div className={styles.pager}>
        <button
          type="button"
          className={styles.step}
          onClick={() => onPage(pageNumber - 1)}
          disabled={pageNumber <= 1}
        >
          <span data-icon aria-hidden="true">chevron_left</span>
          <span className={styles.stepLabel}>Previous</span>
        </button>
        <span className={styles.page}>{pageNumber} / {totalPages}</span>
        <button
          type="button"
          className={styles.step}
          onClick={() => onPage(pageNumber + 1)}
          disabled={pageNumber >= totalPages}
        >
          <span className={styles.stepLabel}>Next</span>
          <span data-icon aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
