export type Query = { text: string[]; authors?: string[]; tags?: string[]; after?: string; before?: string };

export function parseQuery(raw: string): Query {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    const q: Query = { text: [] };
    for (const t of tokens) {
        const m = t.match(/^(\w+):(.*)$/);
        if (m) {
            const key = m[1].toLowerCase();
            const val = m[2];
            if (!val) continue;
            if (key === "author" || key === "authors") (q.authors ??= []).push(val.toLowerCase());
            else if (key === "tag" || key === "tags") (q.tags ??= []).push(val.toLowerCase());
            else if (key === "after" || key === "since") q.after = val;
            else if (key === "before" || key === "until") q.before = val;
            else q.text.push(t.toLowerCase());
        } else q.text.push(t.toLowerCase());
    }
    return q;
}

export function matchesQuery(
    post: { title?: string; authors?: string[]; tags?: string[]; date?: string; description?: string },
    q: Query
) {
    if (q.after && post.date && new Date(post.date) < new Date(q.after)) return false;
    if (q.before && post.date && new Date(post.date) > new Date(q.before)) return false;

    const hay = [
        (post.title ?? "").toLowerCase(),
        (post.description ?? "").toLowerCase(),
        ...(post.authors ?? []).map((a) => a.toLowerCase()),
        ...(post.tags ?? []).map((t) => t.toLowerCase()),
    ].join(" ");

    for (const term of q.text) if (!hay.includes(term)) return false;

    if (q.authors?.length) {
        const all = (post.authors ?? []).map((a) => a.toLowerCase());
        if (!q.authors.every((req) => all.some((a) => a.includes(req)))) return false;
    }
    if (q.tags?.length) {
        const all = (post.tags ?? []).map((t) => t.toLowerCase());
        if (!q.tags.every((req) => all.some((t) => t.includes(req)))) return false;
    }
    return true;
}
