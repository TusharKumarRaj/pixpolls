import { io } from 'socket.io-client';

let socket;

function resolveSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).replace(/\/$/, '');
  }
  const api = import.meta.env.VITE_API_URL ?? '';
  if (/^https?:\/\//i.test(api)) {
    try {
      const u = new URL(api);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Singleton Socket.IO client (shared across poll pages). */
export function getPollSocket() {
  if (!socket) {
    const url = resolveSocketUrl();
    socket = io(url, {
      path: '/socket.io/',
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
