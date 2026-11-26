import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LevelMeter from '../components/LevelMeter.jsx';
import { useTranscriber } from '../hooks/useTranscriber.js';
import { LANGUAGES } from '../config.js';
import { defaultRecordingTitle, formatDuration, wordCount } from '../utils/format.js';

const STATUS_TEXT = {
  idle: 'Ready to record',
  connecting: 'Connecting...',
  recording: 'Listening...',
  processing: 'Finishing transcription...',
  done: 'Saved',
  error: 'Something went wrong',
};

const LivePage = () => {
  const [language, setLanguage] = useState('auto');
  const [title, setTitle] = useState('');
  const transcriptRef = useRef(null);
  const { status, segments, partial, level, elapsed, error, result, transcript, start, stop, cancel, reset } =
    useTranscriber();

  const isBusy = status === 'connecting' || status === 'recording' || status === 'processing';

  useEffect(() => {
    const element = transcriptRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [segments, partial]);

  const handleStart = () => start({ language, title: title.trim() || defaultRecordingTitle() });

  const handleNew = () => {
    reset();
    setTitle('');
  };

  const copyTranscript = () => navigator.clipboard?.writeText(transcript);

  return (
    <div className="page live-page">
      <section className="page-header">
        <div>
          <h1>Record</h1>
          <p className="muted">
            Speak in English, Hindi or a mix of both. The text shows up while you speak and gets saved
            when you stop.
          </p>
        </div>
      </section>

      <div className="live-grid">
        <section className="card recorder-card">
          <div className="field">
            <label htmlFor="session-title">Title</label>
            <input
              id="session-title"
              type="text"
              placeholder="e.g. Team standup notes"
              value={title}
              maxLength={255}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isBusy}
            />
          </div>
          <div className="field">
            <label htmlFor="session-language">Language</label>
            <select
              id="session-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={isBusy}
            >
              {LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="recorder">
            <button
              type="button"
              className={`mic-button ${status === 'recording' ? 'is-recording' : ''}`}
              onClick={status === 'recording' ? stop : handleStart}
              disabled={status === 'connecting' || status === 'processing'}
              aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
            >
              {status === 'recording' ? <span className="stop-icon" /> : <MicIcon />}
            </button>
            <LevelMeter level={level} active={status === 'recording'} />
            <div className="recorder-meta">
              <span className={`status-pill status-${status}`}>{STATUS_TEXT[status]}</span>
              <span className="timer">{formatDuration(elapsed)}</span>
            </div>
            {status === 'recording' && (
              <button type="button" className="button button-ghost button-small" onClick={cancel}>
                Discard recording
              </button>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
        </section>

        <section className="card transcript-card">
          <header className="card-header">
            <h2>Transcript</h2>
            <span className="muted">{wordCount(transcript)} words</span>
          </header>
          <div className="transcript" ref={transcriptRef} aria-live="polite">
            {segments.length === 0 && !partial && (
              <p className="placeholder">
                {status === 'recording' ? 'Start speaking...' : 'Press the mic button and start speaking.'}
              </p>
            )}
            {segments.map((segment) => (
              <span key={segment.segmentId} className="segment">
                {segment.text}{' '}
              </span>
            ))}
            {partial && <span className="segment partial">{partial}</span>}
            {status === 'processing' && <span className="typing-dots" aria-label="Processing" />}
          </div>

          {status === 'done' && (
            <div className="result-bar">
              {result?.transcription ? (
                <>
                  <span>Saved.</span>
                  <div className="result-actions">
                    <button type="button" className="button button-ghost" onClick={copyTranscript}>
                      Copy
                    </button>
                    <Link className="button button-ghost" to={`/transcriptions/${result.transcription.id}`}>
                      View
                    </Link>
                    <button type="button" className="button button-primary" onClick={handleNew}>
                      New recording
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="muted">{result?.message || 'Nothing was saved.'}</span>
                  <button type="button" className="button button-primary" onClick={handleNew}>
                    Try again
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const MicIcon = () => (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

export default LivePage;
