import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listPolls } from '../api/polls.js';
import { ApiError } from '../api/client.js';
import { getPollAuthorName } from '../utils/poll.js';
import { useAuth } from '../context/useAuth.js';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idea, setIdea] = useState('');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listPolls({}, ac.signal);
        setPolls(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'Failed to load polls');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  function handleStartPoll(ev) {
    ev.preventDefault();
    if (isAuthenticated) {
      navigate('/polls/new', { state: idea.trim() ? { draftTitle: idea.trim() } : undefined });
    } else {
      navigate('/register');
    }
  }

  return (
    <>
      <section className="hero-burst" aria-hidden="true">
        <div className="hero-burst__grid">
          <span className="hero-burst__word hero-burst__word--outline">Poll</span>
          <span className="hero-burst__word hero-burst__word--solid">Vote</span>
          <span className="hero-burst__word hero-burst__word--outline">Ask</span>
          <span className="hero-burst__word hero-burst__word--solid">Pick</span>
        </div>
      </section>

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero__badge" role="status">
          <span aria-hidden>✦</span> Polls for you, by you
        </div>
        <h1 id="hero-heading" className="hero__title">
          Crowdsource the answer.
          <span className="hero__accent">One link. One clear poll.</span>
        </h1>
        <p className="hero__lead">
          Spin up a question, share the link, and watch votes roll in—perfect for teams, classrooms,
          and friends who actually want a decision.
        </p>
        <div className="hero__actions">
          <Link
            to={isAuthenticated ? '/polls/new' : '/register'}
            className="btn btn--primary"
          >
            Create a poll →
          </Link>
          <a href="#browse" className="btn btn--secondary">
            Browse polls
          </a>
        </div>

        <form className="hero-bar" onSubmit={handleStartPoll} aria-label="Start a poll">
          <span className="hero-bar__icon" aria-hidden>
            ✦
          </span>
          <input
            className="hero-bar__input"
            type="text"
            placeholder="What would you like to ask the world?"
            value={idea}
            onChange={(ev) => setIdea(ev.target.value)}
            maxLength={100}
          />
          <button type="submit" className="hero-bar__btn" aria-label="Start">
            ↑
          </button>
        </form>

        <p className="trust-line">Built for teams, classrooms, and communities who need a clear signal.</p>
      </section>

      <section id="browse" className="section">
        <div className="section__head">
          <h2 className="section__title">Discover polls</h2>
          <p className="section__subtitle">
            Published polls from the community. Sign in to create your own or manage drafts you
            own.
          </p>
        </div>

        {loading ? (
          <p className="spinner-text">Loading polls…</p>
        ) : error ? (
          <div className="banner banner--error">{error}</div>
        ) : polls.length === 0 ? (
          <div className="card card--shadow empty-state">
            No public polls yet. Be the first to publish one.
          </div>
        ) : (
          <div className="poll-list">
            {polls.map((poll) => (
              <article key={poll._id} className="poll-row">
                <div className="flex-grow">
                  <h3 className="poll-row__title">{poll.title}</h3>
                  <p className="poll-row__meta">
                    {getPollAuthorName(poll)} · {poll.questions?.length ?? 0} question
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
      </section>
    </>
  );
}
