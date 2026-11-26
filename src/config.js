const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export const API_URL = apiUrl;

export const WS_URL = import.meta.env.VITE_WS_URL || `${apiUrl.replace(/^http/, 'ws')}/ws/transcribe`;

export const LANGUAGES = [
  { code: 'auto', label: 'Auto detect (Hinglish / mixed)' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
];
