import { apiFetch, unwrapData } from './client.js';

function buildQuery(params) {
  if (!params || typeof params !== 'object') return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function listPolls(params, signal) {
  const json = await apiFetch(`/polls${buildQuery(params)}`, { signal });
  return unwrapData(json);
}

export async function listMyPolls(token, signal) {
  const json = await apiFetch('/polls/mine', { token, signal });
  return unwrapData(json);
}

export async function getPoll(id, token, signal) {
  const json = await apiFetch(`/polls/${encodeURIComponent(id)}`, {
    token,
    signal,
  });
  return unwrapData(json);
}

export async function createPoll(payload, token, signal) {
  const json = await apiFetch('/polls', {
    method: 'POST',
    body: payload,
    token,
    signal,
  });
  return unwrapData(json);
}

export async function updatePoll(id, payload, token, signal) {
  const json = await apiFetch(`/polls/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
    token,
    signal,
  });
  return unwrapData(json);
}

export async function deletePoll(id, token, signal) {
  await apiFetch(`/polls/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
    signal,
  });
}
