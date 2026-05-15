import { apiFetch, unwrapData } from './client.js';

export async function register(payload, signal) {
  const json = await apiFetch('/auth/register', {
    method: 'POST',
    body: payload,
    signal,
  });
  return unwrapData(json);
}

export async function login(payload, signal) {
  const json = await apiFetch('/auth/login', {
    method: 'POST',
    body: payload,
    signal,
  });
  return unwrapData(json);
}
