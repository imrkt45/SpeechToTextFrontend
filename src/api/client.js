import { API_URL } from '../config.js';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
const request = async (path, { method = 'GET', body, signal } = {}) => {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the server. Is the backend running?', 0);
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.error?.details,
    );
  }

  return payload;
};

const toQuery = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const transcriptionsApi = {
  list: (params = {}, signal) => request(`/api/transcriptions${toQuery(params)}`, { signal }),
  stats: (signal) => request('/api/transcriptions/stats', { signal }),
  get: (id, signal) => request(`/api/transcriptions/${id}`, { signal }),
  create: (data) => request('/api/transcriptions', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/transcriptions/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/transcriptions/${id}`, { method: 'DELETE' }),
};

export const healthApi = {
  check: (signal) => request('/api/health', { signal }),
};
