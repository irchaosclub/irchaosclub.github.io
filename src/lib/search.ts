export type Query = {
  text: string[];
  authors?: string[];
  tags?: string[];
  after?: string;
  before?: string;
};

export function parseQuery(raw: string): Query {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const q: Query = { text: [] };
  for (const t of tokens) {
    const m = t.match(/^(\w+):(.*)$/);
    if (m) {
      const key = m[1].toLowerCase();
      const val = m[2];
      if (!val) continue;
      if (key === "author" || key === "authors")
        (q.authors ??= []).push(val.toLowerCase());
      else if (key === "tag" || key === "tags")
        (q.tags ??= []).push(val.toLowerCase());
      else if (key === "after" || key === "since") q.after = val;
      else if (key === "before" || key === "until") q.before = val;
      else q.text.push(t.toLowerCase());
    } else q.text.push(t.toLowerCase());
  }
  return q;
}

// Helper to format date as YYYY-MM-DD
export function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Add a filter to a query string
export function addFilter(query: string, key: string, value: string): string {
  const parts = query.trim().split(/\s+/).filter(Boolean);
  const filterToken = `${key}:${value}`;

  // Don't add if already exists
  if (parts.some(p => p.toLowerCase() === filterToken.toLowerCase())) {
    return query;
  }

  return [...parts, filterToken].join(' ');
}

// Remove a filter from query string
export function removeFilter(query: string, key: string, value?: string): string {
  const parts = query.trim().split(/\s+/).filter(Boolean);

  return parts
    .filter(p => {
      const m = p.match(/^(\w+):(.*)$/);
      if (!m) return true; // Keep non-filter tokens

      const [, k, v] = m;
      if (k.toLowerCase() !== key.toLowerCase()) return true;

      // If value specified, only remove exact match
      if (value !== undefined) {
        return v.toLowerCase() !== value.toLowerCase();
      }

      // If no value specified, remove all filters with this key
      return false;
    })
    .join(' ');
}

// Toggle a filter (add if not present, remove if present)
export function toggleFilter(query: string, key: string, value: string): string {
  const parts = query.trim().split(/\s+/).filter(Boolean);
  const filterToken = `${key}:${value}`;
  const hasFilter = parts.some(p => p.toLowerCase() === filterToken.toLowerCase());

  if (hasFilter) {
    return removeFilter(query, key, value);
  } else {
    return addFilter(query, key, value);
  }
}

export function matchesQuery(
  post: {
    title?: string;
    authors?: string[];
    tags?: string[];
    date?: string;
    description?: string;
  },
  q: Query
) {
  if (q.after && post.date && new Date(post.date) < new Date(q.after))
    return false;
  if (q.before && post.date && new Date(post.date) > new Date(q.before))
    return false;

  const hay = [
    (post.title ?? "").toLowerCase(),
    (post.description ?? "").toLowerCase(),
    ...(post.authors ?? []).map((a) => a.toLowerCase()),
    ...(post.tags ?? []).map((t) => t.toLowerCase()),
  ].join(" ");

  for (const term of q.text) if (!hay.includes(term)) return false;

  if (q.authors?.length) {
    const all = (post.authors ?? []).map((a) => a.toLowerCase());
    if (!q.authors.every((req) => all.some((a) => a.includes(req))))
      return false;
  }
  if (q.tags?.length) {
    const all = (post.tags ?? []).map((t) => t.toLowerCase());
    if (!q.tags.every((req) => all.some((t) => t.includes(req)))) return false;
  }
  return true;
}
