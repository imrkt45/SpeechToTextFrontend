import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transcriptionsApi } from '../api/client.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Pagination from '../components/Pagination.jsx';
import TranscriptionForm from '../components/TranscriptionForm.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { LANGUAGES } from '../config.js';
import { formatDateTime, formatDuration, languageLabel, truncate } from '../utils/format.js';

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'updated_at:desc', label: 'Recently edited' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'duration:desc', label: 'Longest first' },
];

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

const DashboardPage = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, language, source, sort]);

  useEffect(() => {
    const controller = new AbortController();
    const [sortBy, order] = sort.split(':');
    setLoading(true);
    setError('');

    Promise.all([
      transcriptionsApi.list(
        { page, limit: PAGE_SIZE, search: debouncedSearch, language, source, sortBy, order },
        controller.signal,
      ),
      transcriptionsApi.stats(controller.signal),
    ])
      .then(([listResult, statsResult]) => {
        setList(listResult);
        setStats(statsResult.data);
        setLoading(false);
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return;
        setError(requestError.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [page, debouncedSearch, language, source, sort, refreshKey]);

  const handleSave = async (values) => {
    if (editing?.id) {
      await transcriptionsApi.update(editing.id, values);
      toast.success('Transcription updated');
    } else {
      await transcriptionsApi.create(values);
      toast.success('Transcription created');
    }
    setEditing(null);
    refresh();
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await transcriptionsApi.remove(deleting.id);
      toast.success('Transcription deleted');
      setDeleting(null);
      if (list.data.length === 1 && page > 1) setPage(page - 1);
      else refresh();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const hasFilters = Boolean(search || language || source);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">All saved transcriptions.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="button button-ghost" onClick={() => setEditing({})}>
            Add new
          </button>
          <Link to="/" className="button button-primary">
            Record
          </Link>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Transcriptions" value={stats ? stats.total : '-'} />
        <StatCard label="Total audio" value={stats ? formatDuration(stats.total_duration_seconds) : '-'} />
        <StatCard label="Words transcribed" value={stats ? stats.total_words.toLocaleString() : '-'} />
        <StatCard label="Last 7 days" value={stats ? stats.last_7_days : '-'} />
      </section>

      <section className="card">
        <div className="toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Search title or transcript..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language">
            <option value="">All languages</option>
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Source">
            <option value="">All sources</option>
            <option value="live">Live recording</option>
            <option value="manual">Manual entry</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}{' '}
            <button type="button" className="link-button" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        <div className={`table-wrapper ${loading ? 'is-loading' : ''}`}>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th className="hide-mobile">Language</th>
                <th className="hide-mobile">Duration</th>
                <th className="hide-mobile">Created</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/transcriptions/${item.id}`} className="row-title">
                      {item.title}
                    </Link>
                    <p className="row-preview">{truncate(item.content) || <em>Empty transcript</em>}</p>
                    <span className={`tag tag-${item.source}`}>{item.source === 'live' ? 'Live' : 'Manual'}</span>
                  </td>
                  <td className="hide-mobile">
                    {languageLabel(item.language)}
                    {item.detected_language && item.language === 'auto' && (
                      <small className="muted block">detected: {item.detected_language}</small>
                    )}
                  </td>
                  <td className="hide-mobile">{formatDuration(item.duration_seconds)}</td>
                  <td className="hide-mobile">{formatDateTime(item.created_at)}</td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <Link to={`/transcriptions/${item.id}`} className="button button-ghost button-small">
                        View
                      </Link>
                      <button type="button" className="button button-ghost button-small" onClick={() => setEditing(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button-danger-ghost button-small"
                        onClick={() => setDeleting(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && list.data.length === 0 && !error && (
            <div className="empty-state">
              <h3>{hasFilters ? 'No matching transcriptions' : 'No transcriptions yet'}</h3>
              <p className="muted">
                {hasFilters ? 'Try a different search or filter.' : 'Record something and it will show up here.'}
              </p>
              {!hasFilters && (
                <Link to="/" className="button button-primary">
                  Start recording
                </Link>
              )}
            </div>
          )}
        </div>

        <Pagination
          page={list.pagination.page}
          totalPages={list.pagination.totalPages}
          total={list.pagination.total}
          onChange={setPage}
        />
      </section>

      {editing && (
        <TranscriptionForm
          title={editing.id ? 'Edit transcription' : 'New transcription'}
          submitLabel={editing.id ? 'Save changes' : 'Create'}
          initialValues={editing}
          onSubmit={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete transcription?"
          message={`"${deleting.title}" will be permanently deleted. This cannot be undone.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
