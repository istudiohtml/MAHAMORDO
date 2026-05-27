import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  /**
   * Base path including any preserved query params (e.g. "/dashboard/history"
   * or "/dashboard/credits"). The pagination param + hash will be appended.
   */
  basePath: string;
  /** Query param name (e.g. "page", "logPage"). */
  paramName: string;
  /** Optional anchor (without #) to jump to after navigating. */
  anchor?: string;
  /** Optional summary unit label (default "รายการ"). */
  unitLabel?: string;
};

/**
 * Compact numeric pagination — always shows first/last + a window of pages
 * around the current page. Server-rendered as <Link>s so it works without JS.
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  basePath,
  paramName,
  anchor,
  unitLabel = "รายการ",
}: Props) {
  const hash = anchor ? `#${anchor}` : "";
  const buildHref = (page: number) =>
    page === 1 ? `${basePath}${hash}` : `${basePath}?${paramName}=${page}${hash}`;

  const pageNumbers: Array<number | "ellipsis"> = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - window && i <= currentPage + window)
    ) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "ellipsis") {
      pageNumbers.push("ellipsis");
    }
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="dash-pagination" aria-label="Pagination">
      <p className="dash-pagination-summary thai-font">
        แสดง {from}-{to} จาก {totalCount} {unitLabel}
      </p>
      <div className="dash-pagination-controls">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="dash-pagination-btn"
            aria-label="หน้าก่อนหน้า"
          >
            ‹
          </Link>
        ) : (
          <span
            className="dash-pagination-btn is-disabled"
            aria-disabled="true"
          >
            ‹
          </span>
        )}

        {pageNumbers.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`e-${idx}`} className="dash-pagination-ellipsis">
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="dash-pagination-btn is-active"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className="dash-pagination-btn"
            >
              {p}
            </Link>
          ),
        )}

        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="dash-pagination-btn"
            aria-label="หน้าถัดไป"
          >
            ›
          </Link>
        ) : (
          <span
            className="dash-pagination-btn is-disabled"
            aria-disabled="true"
          >
            ›
          </span>
        )}
      </div>
    </div>
  );
}
