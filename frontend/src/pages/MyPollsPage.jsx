import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listMyPolls } from '../api/polls.js';
import { ApiError } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';

export function MyPollsPage() {
  const { user, token } = useAuth();
  const location = useLocation();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id || !token) return undefined;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listMyPolls(token, ac.signal);
        setPolls(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'Failed to load your polls');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [user?.id, token, location.key]);

  return (
    <div className="mine-padding">
      <div className="section__head">
        <h1 className="section__title">Mine</h1>
        <p className="section__subtitle">
          Every poll you own—drafts, private, and published—newest first.
        </p>
      </div>

      {loading ? (
        <p className="spinner-text">Loading…</p>
      ) : error ? (
        <div className="banner banner--error">{error}</div>
      ) : polls.length === 0 ? (
        <div className="card card--shadow empty-state">
          You have no polls yet. <Link to="/polls/new">Create one</Link>.
        </div>
      ) : (
        <div className="poll-list">
          {polls.map((poll) => (
            <article key={poll._id} className="poll-row">
              <div className="flex-grow">
                <h2 className="poll-row__title">{poll.title}</h2>
                <p className="poll-row__meta">
                  {!poll.is_published ? 'Draft' : 'Open'}
                  {' · '}
                  {poll.results_published ? 'Results live' : 'Collecting'}
                  {' · '}
                  {poll.is_private ? 'Private' : 'Public'}
                  {' · '}
                  {poll.questions?.length ?? 0} question
                  {(poll.questions?.length ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
              <Link to={`/polls/${poll._id}`} className="btn btn--primary btn--sm">
                Open
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
