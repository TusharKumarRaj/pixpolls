import { apiFetch, unwrapData } from './client.js';

export async function submitResponse(payload, token, signal) {
  const json = await apiFetch('/responses', {
    method: 'POST',
    body: payload,
    token,
    signal,
  });
  return unwrapData(json);
}

export async function getPollResults(pollId, token, signal) {
  const json = await apiFetch(
    `/responses/${encodeURIComponent(pollId)}/results`,
    { token, signal },
  );
  return unwrapData(json);
}
