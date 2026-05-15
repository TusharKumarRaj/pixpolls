import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PollResultsView } from '../components/PollResultsView.jsx';
import { deletePoll, getPoll, updatePoll } from '../api/polls.js';
import { getPollResults, submitResponse } from '../api/responses.js';
import { ApiError } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';
import { usePollRoom } from '../hooks/usePollRoom.js';
import { getPollSocket } from '../socket/pollSocket.js';
import { getPollAuthorName, getPollOwnerId } from '../utils/poll.js';
import { normalizePollResults } from '../utils/results.js';
import { copyTextToClipboard, getPollShareUrl } from '../utils/shareUrl.js';

function isoToDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isPollExpired(p) {
  if (!p?.expires_at) return false;
  return new Date(p.expires_at).getTime() < Date.now();
}

export function PollPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selection, setSelection] = useState({});
  const [voteError, setVoteError] = useState(null);
  const [voteOk, setVoteOk] = useState(false);
  const [voting, setVoting] = useState(false);

  const [oTitle, setOTitle] = useState('');
  const [oPrivate, setOPrivate] = useState(false);
  const [oAnon, setOAnon] = useState(false);
  const [oPublished, setOPublished] = useState(false);
  const [oResultsPublished, setOResultsPublished] = useState(false);
  const [oExpires, setOExpires] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [liveConnected, setLiveConnected] = useState(() => getPollSocket().connected);
  const [publishingResults, setPublishingResults] = useState(false);
  const [ownerError, setOwnerError] = useState(null);
  const [ownerOk, setOwnerOk] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [realtimeTick, setRealtimeTick] = useState(0);
  const [ownerActivityHint, setOwnerActivityHint] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const pollRef = useRef(null);
  const userRef = useRef(null);
  const loadKeyRef = useRef(null);

  useLayoutEffect(() => {
    pollRef.current = poll;
    userRef.current = user;
  });

  const ownerId = poll ? getPollOwnerId(poll) : null;
  const isOwner = Boolean(user && ownerId && String(user.id) === ownerId);
  const showPublicResults = Boolean(poll?.results_published);
  const canVote =
    poll &&
    poll.is_published &&
    !showPublicResults &&
    !expired &&
    (token || poll.allow_anonymous);

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

  usePollRoom(id, {
    onPollUpdated: () => setRealtimeTick((n) => n + 1),
    onPollDeleted: () => navigate('/', { replace: true }),
    onResponses: () => {
      const p = pollRef.current;
      const u = userRef.current;
      if (p?.results_published) {
        setRealtimeTick((n) => n + 1);
      } else if (p && u && getPollOwnerId(p) === String(u.id)) {
        setOwnerActivityHint(true);
      }
    },
  });

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
          setVoteOk(false);
          setVoteError(null);
        }
        const data = await getPoll(id, token, ac.signal);
        setPoll(data);
        setExpired(isPollExpired(data));
        if (showSpinner) {
          setSelection({});
        }
        setOTitle(data.title ?? '');
        setOPrivate(Boolean(data.is_private));
        setOAnon(Boolean(data.allow_anonymous));
        setOPublished(Boolean(data.is_published));
        setOResultsPublished(Boolean(data.results_published));
        setOExpires(isoToDatetimeLocal(data.expires_at));
        if (!data.results_published) {
          setAnalytics(null);
        }
        if (showSpinner) {
          setOwnerActivityHint(false);
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'Failed to load poll');
        setPoll(null);
        setExpired(false);
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    })();
    return () => ac.abort();
  }, [id, token, realtimeTick]);

  useEffect(() => {
    if (!id || !poll?.results_published) return undefined;
    const ac = new AbortController();
    (async () => {
      setResultsLoading(true);
      setResultsError(null);
      try {
        const raw = await getPollResults(id, token, ac.signal);
        setAnalytics(normalizePollResults(raw));
      } catch (e) {
        if (e.name === 'AbortError' || ac.signal.aborted) return;
        setAnalytics(
          normalizePollResults({ total_responses: 0, by_question: [] }),
        );
        setResultsError(
          e instanceof ApiError ? e.message : 'Could not load final results',
        );
      } finally {
        if (!ac.signal.aborted) setResultsLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id, token, poll?.results_published, realtimeTick]);

  const shareUrl = poll?._id ? getPollShareUrl(poll._id) : '';

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      await copyTextToClipboard(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* clipboard blocked or unavailable */
    }
  }

  async function onVote(ev) {
    ev.preventDefault();
    setVoteError(null);
    if (!poll) return;
    if (!poll.is_published) {
      setVoteError('This poll is not published yet.');
      return;
    }
    if (poll.results_published) {
      setVoteError('This poll is closed — final results have been published.');
      return;
    }
    if (isPollExpired(poll)) {
      setVoteError('This poll has expired.');
      return;
    }
    if (!token && !poll.allow_anonymous) {
      setVoteError('Please log in to respond to this poll.');
      return;
    }
    for (const q of poll.questions) {
      if (q.is_required && !selection[q._id]) {
        setVoteError('Answer every required question.');
        return;
      }
    }
    const answers = poll.questions
      .filter((q) => selection[q._id])
      .map((q) => ({
        question_id: q._id,
        option_id: selection[q._id],
      }));
    if (answers.length < 1) {
      setVoteError('Select at least one answer.');
      return;
    }
    setVoting(true);
    try {
      await submitResponse({ pollId: poll._id, answers }, token);
      setVoteOk(true);
    } catch (err) {
      setVoteError(err instanceof ApiError ? err.message : 'Submit failed');
    } finally {
      setVoting(false);
    }
  }

  async function onSaveOwner(ev) {
    ev.preventDefault();
    if (!id || !token) return;
    setOwnerError(null);
    setOwnerOk(null);
    setSaving(true);
    const body = {
      title: oTitle.trim(),
      is_private: oPrivate,
      allow_anonymous: oAnon,
      is_published: oPublished,
      results_published: oResultsPublished,
    };
    if (oExpires) {
      body.expires_at = new Date(oExpires).toISOString();
    }
    try {
      const updated = await updatePoll(id, body, token);
      setPoll(updated);
      setExpired(isPollExpired(updated));
      setOwnerOk('Saved.');
    } catch (err) {
      setOwnerError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!id || !token) return;
    if (!window.confirm('Delete this poll permanently?')) return;
    setDeleting(true);
    setOwnerError(null);
    try {
      await deletePoll(id, token);
      navigate('/', { replace: true });
    } catch (err) {
      setOwnerError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="spinner-text">Loading poll…</p>;
  }

  if (error || !poll) {
    return (
      <div className="page-narrow">
        <div className="card card--shadow">
          <h1 className="card__title">Poll unavailable</h1>
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
        <h1 className="card__title">{poll.title}</h1>
        <p className="card__desc">By {getPollAuthorName(poll)}</p>
        {expired ? (
          <div className="banner banner--warning" style={{ marginBottom: '0.75rem' }}>
            This poll has expired.
          </div>
        ) : null}
        {!poll.is_published ? (
          <div className="banner banner--warning" style={{ marginBottom: '0.75rem' }}>
            Draft — not on the public list until published (and not private).
          </div>
        ) : null}
        {showPublicResults ? (
          <div className="banner banner--success" style={{ marginBottom: '0.75rem' }}>
            Final results are published — outcomes are shown below. Voting is closed.
          </div>
        ) : null}
        {isOwner ? (
          <div className="flex-row" style={{ marginBottom: '0.75rem' }}>
            <Link to={`/polls/${poll._id}/results`} className="btn btn--primary btn--sm">
              Analytics dashboard
            </Link>
          </div>
        ) : null}
        <div className="share-block">
          <h3 className="share-block__title">Share poll</h3>
          <p className="field__hint" style={{ margin: 0 }}>
            {showPublicResults
              ? 'Anyone with this link can view final outcomes on this page.'
              : 'Send this link so people can respond. Private polls still work for anyone who has the URL.'}
          </p>
          <div className="share-row">
            <input
              readOnly
              className="input share-url"
              value={shareUrl}
              aria-label="Poll share link"
              onFocus={(ev) => ev.target.select()}
            />
            <button type="button" className="btn btn--secondary" onClick={copyShareLink}>
              {shareCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </section>

      {isOwner ? (
        <section className="card card--shadow">
          <h2 className="card__title">Owner settings</h2>
          <p className="card__desc">Update visibility, expiry, and publication status.</p>
          {ownerActivityHint ? (
            <div className="banner banner--success" style={{ marginBottom: '0.75rem' }}>
              New responses on this poll —{' '}
              <Link to={`/polls/${id}/results`}>view results</Link>.
            </div>
          ) : null}
          <form className="form-stack" onSubmit={onSaveOwner}>
            {ownerError ? <div className="banner banner--error">{ownerError}</div> : null}
            {ownerOk ? <div className="banner banner--success">{ownerOk}</div> : null}
            <div className="field">
              <label htmlFor="owner-title">Title</label>
              <input
                id="owner-title"
                type="text"
                className="input"
                value={oTitle}
                onChange={(ev) => setOTitle(ev.target.value)}
                required
                minLength={3}
                maxLength={100}
              />
            </div>
            <div className="checkbox-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={oPrivate}
                  onChange={(ev) => setOPrivate(ev.target.checked)}
                />
                Private
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={oAnon}
                  onChange={(ev) => setOAnon(ev.target.checked)}
                />
                Allow anonymous
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={oPublished}
                  onChange={(ev) => setOPublished(ev.target.checked)}
                />
                Open for responses
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={oResultsPublished}
                  onChange={(ev) => setOResultsPublished(ev.target.checked)}
                />
                Publish final results
              </label>
            </div>
            {!oResultsPublished ? (
              <div className="flex-row">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={publishingResults || saving}
                  onClick={async () => {
                    if (!id || !token) return;
                    setPublishingResults(true);
                    setOwnerError(null);
                    try {
                      const updated = await updatePoll(
                        id,
                        { results_published: true },
                        token,
                      );
                      setPoll(updated);
                      setOResultsPublished(true);
                      setOwnerOk('Final results are now public on this link.');
                    } catch (err) {
                      setOwnerError(
                        err instanceof ApiError ? err.message : 'Could not publish results',
                      );
                    } finally {
                      setPublishingResults(false);
                    }
                  }}
                >
                  {publishingResults ? 'Publishing…' : 'Publish final results now'}
                </button>
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="owner-expires">Expires</label>
              <input
                id="owner-expires"
                type="datetime-local"
                className="input"
                value={oExpires}
                onChange={(ev) => setOExpires(ev.target.value)}
              />
              <p className="field__hint">Must stay in the future when set.</p>
            </div>
            <div className="flex-row">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn--delete"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? '…' : 'Delete poll'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {showPublicResults ? (
        resultsLoading && !analytics ? (
          <p className="spinner-text">Loading final results…</p>
        ) : (
          <>
            {resultsError ? (
              <div className="banner banner--error">{resultsError}</div>
            ) : null}
            <PollResultsView
              poll={poll}
              totalResponses={analytics?.totalResponses ?? 0}
              participation={analytics?.participation ?? { is_closed: true }}
              byQuestion={analytics?.byQuestion ?? []}
              liveConnected={liveConnected}
              showLivePill
            />
          </>
        )
      ) : (
        <section className="card card--shadow">
          <h2 className="card__title">Vote</h2>
        {voteOk ? (
          <div className="banner banner--success">Response recorded. Thank you.</div>
        ) : (
          <form className="form-stack" onSubmit={onVote}>
            {voteError ? <div className="banner banner--error">{voteError}</div> : null}
            {!token && !poll.allow_anonymous ? (
              <p className="muted">
                <Link to="/login">Log in</Link> to submit your answers.
              </p>
            ) : null}
            {(poll.questions ?? []).map((q) => (
              <div key={q._id} className="question-card">
                <p className="question-card__prompt">
                  {q.content}
                  {q.is_required ? (
                    <span className="question-card__req"> *</span>
                  ) : null}
                </p>
                <div className="choice-list">
                  {(q.options ?? []).map((opt) => {
                    const optId = opt._id ?? opt.id;
                    return (
                      <label key={String(optId)} className="choice">
                        <input
                          type="radio"
                          name={`question_${q._id}`}
                          checked={selection[q._id] === optId}
                          onChange={() =>
                            setSelection((s) => ({ ...s, [q._id]: optId }))
                          }
                        />
                        <span>{opt.content}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
              <button
                type="submit"
                className="btn btn--primary"
                disabled={voting || !canVote}
              >
                {voting ? 'Sending…' : 'Submit answers'}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
