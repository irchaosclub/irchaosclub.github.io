// Build-time RSS generator (works with Next.js static export + Contentlayer)

import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://irchaos.club";
const SITE_TITLE = process.env.NEXT_PUBLIC_SITE_TITLE || "irchaos.club";
const SITE_DESC =
  process.env.NEXT_PUBLIC_SITE_DESC || "Latest posts from irchaos.club";
const MAX_ITEMS = Number.isFinite(parseInt(process.env.MAX_RSS_ITEMS || "", 10))
  ? parseInt(process.env.MAX_RSS_ITEMS, 10)
  : undefined;
const ONLY_INTERNAL = !!process.env.RSS_ONLY_INTERNAL;

// --- utils ---
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cdata = (s = "") => String(s).replace(/]]>/g, "]]]]><![CDATA[>");

const isExternal = (p) =>
  typeof p.external === "string" ? p.external.trim().length > 0 : !!p.external;

const urlFor = (p) =>
  isExternal(p) ? String(p.external).trim() : `${SITE_URL}/${p.slug}`;

const authorText = (p) => {
  const a = Array.isArray(p.authors) ? p.authors.filter(Boolean) : [];
  return a.length ? a.join(", ") : "";
};

const categoryTags = (p) =>
  (Array.isArray(p.tags) ? p.tags : [])
    .filter(Boolean)
    .map((t) => `<category>${esc(String(t))}</category>`)
    .join("");

// --- load contentlayer output (must run after `contentlayer build`) ---
const postsJsonPath = path.join(
  process.cwd(),
  ".contentlayer",
  "generated",
  "Post",
  "_index.json"
);
try {
  await fs.access(postsJsonPath);
} catch {
  console.error(
    "[generate-rss] Contentlayer output missing. Run `contentlayer build` (part of your `npm run build`)."
  );
  process.exit(1);
}
const postsJson = await fs.readFile(postsJsonPath, "utf8");
const allPosts = JSON.parse(postsJson);

// --- build feed ---
let posts = [...allPosts].sort(
  (a, b) => +new Date(b.date || 0) - +new Date(a.date || 0)
);
if (ONLY_INTERNAL) posts = posts.filter((p) => !isExternal(p));
if (MAX_ITEMS) posts = posts.slice(0, MAX_ITEMS);

const itemsXml = posts
  .map((p) => {
    const link = urlFor(p);
    const desc = p.description || "";
    const authors = authorText(p);
    const cats = categoryTags(p);
    return `
  <item>
    <title>${esc(p.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${new Date(p.date || 0).toUTCString()}</pubDate>
    ${authors ? `<author>${esc(authors)}</author>` : ""}
    ${cats}
    <description><![CDATA[${cdata(desc)}]]></description>
  </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(SITE_DESC)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;

const dest = process.argv[2] ?? path.join(process.cwd(), "public", "rss.xml");
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, xml, "utf8");
console.log(`[generate-rss] ✔ Wrote ${dest} with ${posts.length} item(s).`);
