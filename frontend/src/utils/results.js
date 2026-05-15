/** @param {unknown} data */
export function normalizePollResults(data) {
  if (!data) {
    return { totalResponses: 0, participation: null, byQuestion: [] };
  }
  if (Array.isArray(data)) {
    const total = data.reduce((sum, row) => {
      const opts = row.options || [];
      const qTotal = opts.reduce((s, o) => s + (o.count ?? 0), 0);
      return sum + qTotal;
    }, 0);
    return {
      totalResponses: total,
      participation: null,
      byQuestion: data,
    };
  }
  if (typeof data === 'object' && data !== null) {
    const d = /** @type {Record<string, unknown>} */ (data);
    return {
      totalResponses: typeof d.total_responses === 'number' ? d.total_responses : 0,
      participation: d.participation ?? null,
      byQuestion: Array.isArray(d.by_question) ? d.by_question : [],
    };
  }
  return { totalResponses: 0, participation: null, byQuestion: [] };
}

/** @param {Array<{ _id: unknown, options?: Array<{ option_id: unknown, count?: number }> }>} byQuestion */
export function buildCountsByQuestion(byQuestion) {
  const map = new Map();
  for (const row of byQuestion) {
    const qid = String(row._id);
    const opts = new Map();
    for (const o of row.options || []) {
      opts.set(String(o.option_id), o.count ?? 0);
    }
    map.set(qid, opts);
  }
  return map;
}
