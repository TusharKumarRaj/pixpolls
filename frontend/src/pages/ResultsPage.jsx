import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPoll, updatePoll } from '../api/polls.js';
import { getPollResults } from '../api/responses.js';
import { ApiError } from '../api/client.js';
import { PollResultsView } from '../components/PollResultsView.jsx';
import { useAuth } from '../context/useAuth.js';
import { usePollRoom } from '../hooks/usePollRoom.js';
import { getPollSocket } from '../socket/pollSocket.js';
import { getPollOwnerId } from '../utils/poll.js';
import { normalizePollResults } from '../utils/results.js';
import { copyTextToClipboard, getPollShareUrl } from '../utils/shareUrl.js';

export function ResultsPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeTick, setRealtimeTick] = useState(0);
  const [liveConnected, setLiveConnected] = useState(() => getPollSocket().connected);
  const [shareCopied, setShareCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const loadKeyRef = useRef(null);

  const isOwner =
    poll && user && getPollOwnerId(poll) === String(user.id);

  usePollRoom(id, {
    onResponses: () => setRealtimeTick((n) => n + 1),
    onPollUpdated: () => setRealtimeTick((n) => n + 1),
    onPollDeleted: () => navigate('/', { replace: true }),
  });

  useEffect(() => {
    const socket = getPollSocket();
    const onConnect = () => setLiveConnected(true);
    const onDisconnect = () => setLiveConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    const navChanged =
      loadKeyRef.current == null ||
      loadKeyRef.current.id !== id ||
      loadKeyRef.current.token !== token;
    if (navChanged) {
      loadKeyRef.current = { id, token };
    }
    const showSpinner = navChanged;

    const ac = new AbortController();
    (async () => {
      try {
        if (showSpinner) {
          setLoading(true);
          setError(null);
        }
        const [p, raw] = await Promise.all([
          getPoll(id, token, ac.signal),
          getPollResults(id, token, ac.signal),
        ]);
        setPoll(p);
        setAnalytics(normalizePollResults(raw));
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'Failed to load results');
        setPoll(null);
        setAnalytics(null);
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    })();
    return () => ac.abort();
  }, [id, token, realtimeTick]);

  const shareUrl = id ? getPollShareUrl(id) : '';

  if (loading) {
    return <p className="spinner-text">Loading results…</p>;
  }

  if (error || !poll || !analytics) {
    return (
      <div className="page-narrow">
        <div className="card card--shadow">
          <h1 className="card__title">Results unavailable</h1>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            {error ?? 'Not found'}
          </p>
          <Link to="/" className="btn btn--primary">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-gap" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <section className="card card--shadow">
        <h1 className="card__title">Analytics dashboard</h1>
        <p className="card__desc">{poll.title}</p>
        {poll.results_published ? (
          <div className="banner banner--success" style={{ marginBottom: '0.75rem' }}>
            Final results are published on the shared poll link.
          </div>
        ) : isOwner ? (
          <div className="banner banner--warning" style={{ marginBottom: '0.75rem' }}>
            Only you can see this dashboard until you publish final results.
          </div>
        ) : null}
        <div className="flex-row" style={{ marginBottom: '0.75rem' }}>
          <Link to={`/polls/${poll._id}`} className="btn btn--secondary btn--sm">
            Back to poll
          </Link>
          {isOwner && !poll.results_published ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={publishing}
              onClick={async () => {
                if (!id || !token) return;
                setPublishing(true);
                try {
                  await updatePoll(id, { results_published: true }, token);
                  setRealtimeTick((n) => n + 1);
                } catch (err) {
                  setError(
                    err instanceof ApiError ? err.message : 'Could not publish results',
                  );
                } finally {
                  setPublishing(false);
                }
              }}
            >
              {publishing ? 'Publishing…' : 'Publish final results'}
            </button>
          ) : null}
        </div>
        <div className="share-block">
          <h3 className="share-block__title">Share poll link</h3>
          <p className="field__hint" style={{ margin: 0 }}>
            {poll.results_published
              ? 'Anyone with this link can view final outcomes on the poll page.'
              : 'Send this link so people can vote. Publish results when collection ends.'}
          </p>
          <div className="share-row">
            <input
              readOnly
              className="input share-url"
              value={shareUrl}
              aria-label="Poll share link"
              onFocus={(ev) => ev.target.select()}
            />
            <button
              type="button"
              className="btn btn--secondary"
              onClick={async () => {
                if (!shareUrl) return;
                try {
                  await copyTextToClipboard(shareUrl);
                  setShareCopied(true);
                  window.setTimeout(() => setShareCopied(false), 2000);
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              {shareCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </section>

      <PollResultsView
        poll={poll}
        totalResponses={analytics.totalResponses}
        participation={analytics.participation}
        byQuestion={analytics.byQuestion}
        liveConnected={liveConnected}
        showLivePill
      />
    </div>
  );
}
