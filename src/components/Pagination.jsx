const Pagination = ({ page, totalPages, total, onChange }) => {
  if (total === 0) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">
        Page {page} of {totalPages} ({total} {total === 1 ? 'transcription' : 'transcriptions'})
      </span>
      <div className="pagination-buttons">
        <button type="button" className="button button-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="button button-ghost"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
