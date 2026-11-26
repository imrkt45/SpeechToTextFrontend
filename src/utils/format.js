import { LANGUAGES } from '../config.js';

const LANGUAGE_NAMES = {
  ...Object.fromEntries(LANGUAGES.map(({ code, label }) => [code, label])),
  auto: 'Auto',
};

export const languageLabel = (code) => (code ? LANGUAGE_NAMES[code] || code.toUpperCase() : '-');

export const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-';

export const wordCount = (text) => (text?.trim() ? text.trim().split(/\s+/).length : 0);

export const truncate = (text, length = 140) =>
  text && text.length > length ? `${text.slice(0, length).trimEnd()}...` : text || '';

export const defaultRecordingTitle = () =>
  `Recording ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
