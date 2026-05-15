/** @param {Record<string, unknown> | null | undefined} poll */
export function getPollOwnerId(poll) {
  const u = poll?.user_id;
  if (u == null) return null;
  if (typeof u === 'object' && '_id' in u && u._id != null) {
    return String(u._id);
  }
  return String(u);
}

/** @param {Record<string, unknown> | null | undefined} poll */
export function getPollAuthorName(poll) {
  const u = poll?.user_id;
  if (u && typeof u === 'object' && 'name' in u && typeof u.name === 'string') {
    return u.name;
  }
  return 'Unknown';
}
