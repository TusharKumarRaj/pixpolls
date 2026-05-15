import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPoll } from '../api/polls.js';
import { ApiError } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';

function emptyOption() {
  return { content: '' };
}

function emptyQuestion() {
  return {
    content: '',
    is_required: false,
    options: [emptyOption(), emptyOption()],
  };
}

export function CreatePollPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState(() => {
    const draft = location.state?.draftTitle;
    return typeof draft === 'string' && draft.trim() ? draft.trim() : '';
  });
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateQuestion(idx, patch) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(qIdx, oIdx, content) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((o, j) =>
          j === oIdx ? { ...o, content } : o,
        );
        return { ...q, options };
      }),
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((qs) => (qs.length <= 1 ? qs : qs.filter((_, i) => i !== idx)));
  }

  function addOption(qIdx) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, emptyOption()] } : q,
      ),
    );
  }

  function removeOption(qIdx, oIdx) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) return q;
        return {
          ...q,
          options: q.options.filter((_, j) => j !== oIdx),
        };
      }),
    );
  }

  function validateClient() {
    if (title.trim().length < 3) return 'Title must be at least 3 characters.';
    for (let qi = 0; qi < questions.length; qi += 1) {
      const q = questions[qi];
      if (q.content.trim().length < 3) {
        return `Question ${qi + 1}: text must be at least 3 characters.`;
      }
      if (q.options.length < 2) {
        return `Question ${qi + 1}: add at least two options.`;
      }
      for (let oi = 0; oi < q.options.length; oi += 1) {
        if (q.options[oi].content.trim().length < 1) {
          return `Question ${qi + 1}, option ${oi + 1}: cannot be empty.`;
        }
      }
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validateClient();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      is_private: isPrivate,
      allow_anonymous: allowAnonymous,
      is_published: isPublished,
      questions: questions.map((q) => ({
        content: q.content.trim(),
        is_required: q.is_required,
        options: q.options.map((o) => ({ content: o.content.trim() })),
      })),
    };
    if (expiresAt) {
      payload.expires_at = new Date(expiresAt).toISOString();
    }
    try {
      const poll = await createPoll(payload, token);
      navigate(`/polls/${poll._id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create poll');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wide">
      <div className="page-head">
        <h1 className="page-head__title">New poll</h1>
        <p className="page-head__desc">
          Add a title, questions, and answer choices. You can publish when you are ready.
        </p>
      </div>
      <form className="card card--shadow form-stack" onSubmit={handleSubmit}>
        {error ? <div className="banner banner--error">{error}</div> : null}

        <div className="field">
          <label htmlFor="poll-title">Poll title</label>
          <input
            id="poll-title"
            type="text"
            className="input"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            required
            minLength={3}
            maxLength={100}
            placeholder="e.g. Team lunch preference"
          />
        </div>

        <div className="checkbox-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(ev) => setIsPrivate(ev.target.checked)}
            />
            Private (only you can open by link)
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={allowAnonymous}
              onChange={(ev) => setAllowAnonymous(ev.target.checked)}
            />
            Allow anonymous responses
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(ev) => setIsPublished(ev.target.checked)}
            />
            Published on discover
          </label>
        </div>

        <div className="field">
          <label htmlFor="poll-expires">Expires (optional)</label>
          <input
            id="poll-expires"
            type="datetime-local"
            className="input"
            value={expiresAt}
            onChange={(ev) => setExpiresAt(ev.target.value)}
          />
        </div>

        <div className="stack-gap">
          {questions.map((q, qi) => (
            <div key={qi} className="card" style={{ background: '#fafbfc' }}>
              <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="card__title" style={{ margin: 0 }}>
                  Question {qi + 1}
                </h3>
                <button
                  type="button"
                  className="btn btn--delete btn--sm"
                  onClick={() => removeQuestion(qi)}
                  disabled={questions.length <= 1}
                >
                  Remove
                </button>
              </div>
              <div className="field">
                <label htmlFor={`q-text-${qi}`}>Prompt</label>
                <textarea
                  id={`q-text-${qi}`}
                  className="textarea"
                  rows={3}
                  value={q.content}
                  onChange={(ev) => updateQuestion(qi, { content: ev.target.value })}
                  required
                  minLength={3}
                  maxLength={255}
                />
              </div>
              <label className="checkbox" style={{ marginBottom: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={q.is_required}
                  onChange={(ev) =>
                    updateQuestion(qi, { is_required: ev.target.checked })
                  }
                />
                Required question
              </label>
              <p className="field__hint" style={{ marginBottom: '0.5rem' }}>
                Answer options
              </p>
              <div className="stack-gap">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex-row">
                    <div className="field flex-grow" style={{ margin: 0 }}>
                      <label htmlFor={`q-${qi}-o-${oi}`}>Option {oi + 1}</label>
                      <input
                        id={`q-${qi}-o-${oi}`}
                        type="text"
                        className="input"
                        value={o.content}
                        onChange={(ev) => updateOption(qi, oi, ev.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      style={{ alignSelf: 'flex-end' }}
                      onClick={() => removeOption(qi, oi)}
                      disabled={q.options.length <= 2}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                style={{ marginTop: '0.5rem' }}
                onClick={() => addOption(qi)}
              >
                Add option
              </button>
            </div>
          ))}
        </div>

        <div className="flex-row">
          <button type="button" className="btn btn--secondary" onClick={addQuestion}>
            Add question
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create poll'}
          </button>
        </div>
      </form>
    </div>
  );
}
