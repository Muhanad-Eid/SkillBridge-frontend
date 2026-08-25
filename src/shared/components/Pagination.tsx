import Button from "./Button";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
};

// Shared pager for every server-paginated list. Renders nothing meaningful
// when there is only one page.
export default function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  isLoading = false,
  itemLabel = "results",
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="pagination" role="status">
        <span>
          {totalCount} {itemLabel}
        </span>
      </div>
    );
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <Button
        type="button"
        variant="secondary"
        disabled={page <= 1 || isLoading}
        aria-label={`Previous page, page ${page - 1} of ${totalPages}`}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span aria-live="polite">
        Page {page} of {totalPages} · {totalCount} {itemLabel}
      </span>
      <Button
        type="button"
        variant="secondary"
        disabled={page >= totalPages || isLoading}
        aria-label={`Next page, page ${page + 1} of ${totalPages}`}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
