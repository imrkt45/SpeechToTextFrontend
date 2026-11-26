import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { transcriptionsApi } from '../api/client.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import TranscriptionForm from '../components/TranscriptionForm.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { formatDateTime, formatDuration, languageLabel, wordCount } from '../utils/format.js';

const formatOffset = (ms) => formatDuration(ms / 1000);

const TranscriptionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    transcriptionsApi
      .get(id, controller.signal)
      .then((result) => {
        setTranscription(result.data);
        setLoading(false);
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return;
        setError(requestError.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  const handleSave = async (values) => {
    const result = await transcriptionsApi.update(id, values);
    setTranscription((current) => ({ ...current, ...result.data }));
    setEditing(false);
    toast.success('Transcription updated');
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await transcriptionsApi.remove(id);
      toast.success('Transcription deleted');
      navigate('/dashboard');
    } catch (deleteError) {
      toast.error(deleteError.message);
      setDeleteBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcription.content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const download = () => {
    const blob = new Blob([transcription.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${transcription.title.replace(/[^\w\- ]+/g, '').trim() || 'transcription'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state card">
          <h3>{error}</h3>
          <Link to="/dashboard" className="button button-primary">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/dashboard" className="back-link">
        Back to dashboard
      </Link>

      <section className="page-header">
        <div>
          <h1>{transcription.title}</h1>
          <div className="meta-row muted">
            <span className={`tag tag-${transcription.source}`}>
              {transcription.source === 'live' ? 'Live' : 'Manual'}
            </span>
            <span>{languageLabel(transcription.language)}</span>
            {transcription.detected_language && <span>Detected: {transcription.detected_language}</span>}
            <span>{formatDuration(transcription.duration_seconds)}</span>
            <span>{wordCount(transcription.content)} words</span>
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="button button-ghost" onClick={copy}>
            Copy
          </button>
          <button type="button" className="button button-ghost" onClick={download}>
            Download
          </button>
          <button type="button" className="button button-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="button button-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </div>
      </section>

      <div className="detail-grid">
        <section className="card">
          <header className="card-header">
            <h2>Transcript</h2>
          </header>
          <div className="transcript transcript-static">
            {transcription.content || <p className="placeholder">This transcript is empty.</p>}
          </div>
          <footer className="card-footer muted">
            Created {formatDateTime(transcription.created_at)}, updated {formatDateTime(transcription.updated_at)}
          </footer>
        </section>

        {transcription.segments?.length > 0 && (
          <section className="card">
            <header className="card-header">
              <h2>Original segments</h2>
              <span className="muted">{transcription.segments.length}</span>
            </header>
            <ol className="segment-list">
              {transcription.segments.map((segment) => (
                <li key={segment.id}>
                  <span className="segment-time">
                    {formatOffset(segment.start_ms)} - {formatOffset(segment.end_ms)}
                  </span>
                  <p>{segment.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {editing && (
        <TranscriptionForm
          title="Edit transcription"
          submitLabel="Save changes"
          initialValues={transcription}
          onSubmit={handleSave}
          onClose={() => setEditing(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete transcription?"
          message={`"${transcription.title}" will be permanently deleted. This cannot be undone.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default TranscriptionDetailPage;
