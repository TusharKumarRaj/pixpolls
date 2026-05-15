import { useEffect, useLayoutEffect, useRef } from 'react';
import { getPollSocket } from '../socket/pollSocket.js';

/**
 * Join a per-poll Socket.IO room for live server pushes (responses, edits, delete).
 * Handler object may change every render; latest handlers are always invoked.
 */
export function usePollRoom(pollId, handlers) {
  const handlersRef = useRef(handlers);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!pollId) return undefined;

    const socket = getPollSocket();
    const pid = String(pollId);

    const join = () => {
      socket.emit('poll:join', pid);
    };

    socket.on('connect', join);
    if (socket.connected) join();

    const onResponses = () => handlersRef.current?.onResponses?.();
    const onPollUpdated = () => handlersRef.current?.onPollUpdated?.();
    const onPollDeleted = () => handlersRef.current?.onPollDeleted?.();

    socket.on('poll:responses', onResponses);
    socket.on('poll:updated', onPollUpdated);
    socket.on('poll:deleted', onPollDeleted);

    return () => {
      socket.off('connect', join);
      socket.emit('poll:leave', pid);
      socket.off('poll:responses', onResponses);
      socket.off('poll:updated', onPollUpdated);
      socket.off('poll:deleted', onPollDeleted);
    };
  }, [pollId]);
}
