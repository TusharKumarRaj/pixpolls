import { useMemo } from 'react';
import { buildCountsByQuestion } from '../utils/results.js';

/**
 * @param {{
 *   poll: { title?: string, questions?: Array<{ _id: string, content: string, options?: Array<{ _id: string, content: string }> }> },
 *   totalResponses: number,
 *   participation?: Record<string, unknown> | null,
 *   byQuestion: Array<{ _id: unknown, options?: Array<{ option_id: unknown, count?: number }> }>,
 *   liveConnected?: boolean,
 *   showLivePill?: boolean,
 * }} props
 */
export function PollResultsView({
  poll,
  totalResponses,
  participation,
  byQuestion,
  liveConnected = false,
  showLivePill = false,
}) {
  const countsByQuestion = useMemo(
    () => buildCountsByQuestion(byQuestion),
    [byQuestion],
  );

  return (
    <>
      <section className="card card--shadow analytics-summary">
        <h2 className="card__title" style={{ fontSize: '1.15rem' }}>
          Participation
          {showLivePill && liveConnected ? (
            <span className="live-pill" title="Connected for live updates">
              Live
            </span>
          ) : null}
        </h2>
        <div className="analytics-grid">
          <Stat label="Total responses" value={totalResponses} />
          <Stat
            label="Questions"
            value={participation?.question_count ?? poll.questions?.length ?? 0}
          />
          {participation != null ? (
            <>
              <Stat label="Required" value={participation.required_question_count ?? 0} />
              <Stat label="Optional" value={participation.optional_question_count ?? 0} />
            </>
          ) : null}
        </div>
        {participation?.is_closed ? (
          <p className="field__hint" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            Final results are published — voting is closed.
          </p>
        ) : null}
        {participation?.expired && !participation?.is_closed ? (
          <p className="field__hint" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            Poll has expired; new responses are not accepted.
          </p>
        ) : null}
      </section>

      {(poll.questions ?? []).map((q) => {
        const optCounts = countsByQuestion.get(String(q._id)) ?? new Map();
        const total = (q.options ?? []).reduce(
          (sum, o) => sum + (optCounts.get(String(o._id)) ?? 0),
          0,
        );
        return (
          <section key={q._id} className="card card--shadow">
            <h2 className="card__title" style={{ fontSize: '1.05rem' }}>
              {q.content}
            </h2>
            <p className="card__desc">{total} vote{total === 1 ? '' : 's'}</p>
            <div className="stack-gap">
              {(q.options ?? []).map((o) => {
                const c = optCounts.get(String(o._id)) ?? 0;
                const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                return (
                  <div key={o._id}>
                    <div className="stat-row">
                      <span>{o.content}</span>
                      <span className="muted">
                        {c} ({pct}%)
                      </span>
                    </div>
                    <div className="stat-bar" role="presentation">
                      <div className="stat-bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="analytics-stat">
      <span className="analytics-stat__value">{value}</span>
      <span className="analytics-stat__label">{label}</span>
    </div>
  );
}
