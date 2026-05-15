/**
 * Absolute URL to open a poll (for sharing). Uses VITE_PUBLIC_APP_URL when set
 * (e.g. production domain); otherwise the current browser origin in the client.
 */
export function getPollShareUrl(pollId) {
  const id = encodeURIComponent(String(pollId));
  const path = `/polls/${id}`;
  const explicit = import.meta.env.VITE_PUBLIC_APP_URL;
  if (explicit && String(explicit).trim()) {
    return `${String(explicit).replace(/\/$/, '')}${path}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
