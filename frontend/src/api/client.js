const rawBase = import.meta.env.VITE_API_URL ?? '/api';

function joinBase(path) {
  const base = rawBase.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Typed fetch wrapper: attaches JSON, optional Bearer token, and normalizes errors.
 * Success payloads follow backend `{ success, message, data }` when JSON.
 */
export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, token, signal, headers: extraHeaders } = options;
  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(joinBase(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON body */
    }
  }

  if (!res.ok) {
    const message =
      (json && typeof json.message === 'string' && json.message) ||
      res.statusText ||
      'Request failed';
    throw new ApiError(message, res.status, json);
  }

  return json;
}

export function unwrapData(response) {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}
