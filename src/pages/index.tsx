import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { allPosts, Post } from "contentlayer/generated";
import { ExtendedPost, getPostType } from "@/types/post";
import { Pill } from "@/components/ui/pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel } from "@/components/shell/Panel";
import { Button } from "@/components/ui/button";
import {
  PostAreaInteractive,
  Bin,
} from "@/components/charts/PostAreaInteractive";
import { parseQuery, matchesQuery, toggleFilter, addFilter, removeFilter, formatDateForQuery } from "@/lib/search";
import {
  ExternalLink,
  Search,
  House,
  Globe,
  Link2,
  ArrowUpRight,
} from "lucide-react";
import { InfoBox } from "@/components/ui/infobox";
import { MobilePostSheet } from "@/components/mobile/MobilePostSheet";
import { CliSearch } from "@/components/search/CliSearch";
import { SEO } from "@/components/seo/SEO";

// Detects if the title wraps >1 line and adds extra vertical padding only then.
// Adds a bit of vertical padding only when the title wraps onto multiple lines.
// Adds a bit of vertical padding only when the title wraps onto multiple lines (desktop table cell).
function TitleCell({
  title,
  slug,
  external,
}: {
  title: string;
  slug: string;
  external?: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [wrapped, setWrapped] = useState(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const compute = () => {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight || "20");
      const lines = Math.max(1, Math.round(el.scrollHeight / (lh || 1)));
      setWrapped(lines > 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [title]);

  return (
    <TableCell
      className={`max-w-[80ch] min-w-0 whitespace-normal break-words ${
        wrapped ? "py-3" : ""
      }`}
    >
      {external ? (
        <a
          href={external}
          className="hover:text-primary underline inline-flex items-center gap-1 min-w-0 font-medium"
        >
          <Globe className="h-4 w-4 flex-none shrink-0 text-muted-foreground" />
          <span ref={spanRef} className="break-words whitespace-normal">
            {title}
          </span>
        </a>
      ) : (
        <Link
          href={`/${slug}/`}
          className="hover:text-primary underline inline-flex items-center gap-1 min-w-0 font-medium"
        >
          <House className="h-4 w-4 flex-none shrink-0 text-primary" />
          <span ref={spanRef} className="break-words whitespace-normal">
            {title}
          </span>
        </Link>
      )}
    </TableCell>
  );
}

// Mobile-friendly "card" list of posts (used only on < md).
function MobilePosts({
  posts,
  onCardClick,
  authorFacet,
  tagFacet,
  toggleAuthor,
  toggleTag,
}: {
  posts: ExtendedPost[];
  onCardClick: (p: ExtendedPost) => void;
  authorFacet: Set<string>;
  tagFacet: Set<string>;
  toggleAuthor: (a: string) => void;
  toggleTag: (t: string) => void;
}) {
  return (
    <div className="space-y-2">
      {posts.map((p) => {
        const ext = p.external;
        const authors = p.authors ?? [];
        const tags = p.tags ?? [];
        return (
          <button
            key={p.slug}
            className={`w-full text-left rounded-md border border-border p-3 hover:bg-muted-10 transition ${
              ext ? "bg-card/60" : "bg-card/80 internal-post-mobile"
            }`}
            onClick={() => onCardClick(p)}
          >
            <div className="flex items-center justify-between gap-2">
              <time className="text-xs text-muted-foreground" dateTime={p.date}>
                {new Date(p.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })}
              </time>
            </div>

            <div className="mt-1 font-medium underline break-words whitespace-normal flex items-center gap-1">
              {ext ? (
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <House className="h-4 w-4 shrink-0 text-primary" />
              )}
              <span>{p.title}</span>
            </div>

            {authors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {authors.map((a) => (
                  <Pill
                    key={a}
                    variant={authorFacet.has(a) ? "solid" : "soft"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAuthor(a);
                    }}
                  >
                    {a}
                  </Pill>
                ))}
              </div>
            )}

            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Pill
                    key={t}
                    variant={tagFacet.has(t) ? "solid" : "soft"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTag(t);
                    }}
                  >
                    {t}
                  </Pill>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----- build-time data ----- */
export async function getStaticProps() {
  const posts = [...allPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return { props: { posts: posts as ExtendedPost[] } };
}
type Props = { posts: ExtendedPost[] };

/* ----- helpers ----- */
type Counts = Record<string, number>;
function countValues(values: string[] | undefined): Counts {
  const out: Counts = {};
  for (const v of values ?? []) out[v] = (out[v] ?? 0) + 1;
  return out;
}

// Normalize author names (case-insensitive, trim whitespace) and preserve first occurrence casing
function countAuthors(values: string[] | undefined): Counts {
  const out: Counts = {};
  const canonicalNames: Record<string, string> = {}; // lowercase -> display name

  for (const v of values ?? []) {
    const trimmed = v.trim();
    const normalized = trimmed.toLowerCase();

    // Store the first occurrence as the canonical display name
    if (!canonicalNames[normalized]) {
      canonicalNames[normalized] = trimmed;
    }

    const displayName = canonicalNames[normalized];
    out[displayName] = (out[displayName] ?? 0) + 1;
  }
  return out;
}

export default function Home({ posts }: Props) {
  const router = useRouter();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  function resetAll() {
    setQuery("");
    setRange(null);
    setAuthorFacet(new Set());
    setTagFacet(new Set());
    setTypeFacet(new Set());
    setDaysFacet(null);
  }

  const [isMobile, setIsMobile] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showHistogram, setShowHistogram] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [accordionOpenSections, setAccordionOpenSections] = useState([
    "time",
    "authors",
    "type",
    "tags",
  ]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener?.("change", set);
    return () => mq.removeEventListener?.("change", set);
  }, []);

  useEffect(() => {
    const checkHeight = () => {
      const viewportHeight = window.innerHeight;
      // Hide histogram and footer when viewport height is less than 900px
      setShowHistogram(viewportHeight >= 900);
      setShowFooter(viewportHeight >= 1000);

      // Progressive accordion collapse based on height
      if (viewportHeight >= 800) {
        // Full height: show all sections
        setAccordionOpenSections(["time", "authors", "type", "tags"]);
      } else if (viewportHeight >= 650) {
        // Medium height: collapse tags (least important)
        setAccordionOpenSections(["time", "authors", "type"]);
      } else {
        // Small height: only keep time (most important)
        setAccordionOpenSections(["time"]);
      }
    };

    checkHeight();
    window.addEventListener("resize", checkHeight);
    window.addEventListener("orientationchange", checkHeight);
    return () => {
      window.removeEventListener("resize", checkHeight);
      window.removeEventListener("orientationchange", checkHeight);
    };
  }, []);

  const scrollWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isMobile) return;
    const el = scrollWrapRef.current;
    if (!el) return;

    const cssPixels = () =>
      Math.min(
        window.visualViewport?.height ?? Infinity,
        window.innerHeight ?? Infinity,
        document.documentElement.clientHeight ?? Infinity
      );

    const outerHeight = (node: Element | null) => {
      if (!node) return 0;
      const r = node.getBoundingClientRect();
      const cs = getComputedStyle(node as HTMLElement);
      return (
        r.height +
        parseFloat(cs.marginTop || "0") +
        parseFloat(cs.marginBottom || "0")
      );
    };

    const compute = () => {
      const viewportH = cssPixels();
      const top = el.getBoundingClientRect().top;
      const footer = document.querySelector("footer");
      // Only account for footer height if it's visible
      const footerH = showFooter ? outerHeight(footer) : 0;
      const gap = showFooter ? 24 : 12; // less gap when footer is hidden

      // Calculate max height to prevent underflow under footer (or bottom of screen)
      const maxH = viewportH - top - footerH - gap;

      // Set maxHeight but allow content to determine actual height
      el.style.maxHeight = `${Math.max(200, maxH)}px`;
      // Don't force a specific height, let content size naturally
      el.style.height = "auto";
    };

    compute();
    const ro = new ResizeObserver(compute);
    const footerEl = document.querySelector("footer");
    if (footerEl) ro.observe(footerEl);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [isMobile, showFooter]);

  // state
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selected, setSelected] = useState<string | null>(
    posts[0]?.slug ?? null
  );
  const [authorFacet, setAuthorFacet] = useState<Set<string>>(new Set());
  const [tagFacet, setTagFacet] = useState<Set<string>>(new Set());
  const [typeFacet, setTypeFacet] = useState<Set<string>>(new Set());
  const [daysFacet, setDaysFacet] = useState<number | null>(null);

  // Load filters from URL on mount
  useEffect(() => {
    if (!router.isReady || initialLoadDone) return;

    const { q, authors, tags, type, days } = router.query;

    // Build query string from URL params if no explicit query is provided
    let queryParts: string[] = [];

    if (q && typeof q === 'string') {
      queryParts.push(q);
    }

    if (authors) {
      const authorList = typeof authors === 'string' ? authors.split(',') : authors;
      setAuthorFacet(new Set(authorList));
      // Add to query string if not already in q param
      if (!q) {
        authorList.forEach(a => queryParts.push(`author:${a}`));
      }
    }
    if (tags) {
      const tagList = typeof tags === 'string' ? tags.split(',') : tags;
      setTagFacet(new Set(tagList));
      // Add to query string if not already in q param
      if (!q) {
        tagList.forEach(t => queryParts.push(`tag:${t}`));
      }
    }
    if (type) {
      const typeList = typeof type === 'string' ? type.split(',') : type;
      setTypeFacet(new Set(typeList));
    }
    if (days && typeof days === 'string') {
      const d = parseInt(days, 10);
      if (!isNaN(d)) setDaysFacet(d);
    }

    // Set the constructed query in the search box
    if (queryParts.length > 0) {
      setQuery(queryParts.join(' '));
    }

    setInitialLoadDone(true);
  }, [router.isReady, router.query, initialLoadDone]);

  // Sync filters to URL
  useEffect(() => {
    if (!initialLoadDone) return;

    const params = new URLSearchParams();

    if (query) params.set('q', query);
    if (authorFacet.size) params.set('authors', Array.from(authorFacet).join(','));
    if (tagFacet.size) params.set('tags', Array.from(tagFacet).join(','));
    if (typeFacet.size) params.set('type', Array.from(typeFacet).join(','));
    if (daysFacet !== null) params.set('days', daysFacet.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : '/';

    // Only update if URL changed
    if (router.asPath !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [query, authorFacet, tagFacet, typeFacet, daysFacet, initialLoadDone, router]);

  // Clear daysFacet when range is selected from histogram (mutually exclusive)
  useEffect(() => {
    if (range && daysFacet !== null) {
      setDaysFacet(null);
    }
  }, [range, daysFacet]);

  // query parse
  const q = useMemo(() => parseQuery(query), [query]);

  // filter by query
  const filteredByQuery = useMemo(
    () =>
      posts.filter((p) =>
        matchesQuery(
          {
            title: p.title,
            authors: p.authors,
            tags: p.tags,
            date: p.date,
            description: p.description,
          },
          q
        )
      ),
    [posts, q]
  );

  // Build histogram from data that ignores TIME (range & daysFacet).
  // It still respects query + author/tag/type facets.
  const histogramSource = useMemo(() => {
    return filteredByQuery.filter((p) => {
      if (authorFacet.size) {
        const pa = new Set<string>((p.authors ?? []).map(a => a.trim().toLowerCase()));
        let ok = false;
        for (const a of authorFacet)
          if (pa.has(a.trim().toLowerCase())) {
            ok = true;
            break;
          }
        if (!ok) return false;
      }
      if (tagFacet.size) {
        const pt = new Set<string>(p.tags ?? []);
        let ok = false;
        for (const t of tagFacet)
          if (pt.has(t)) {
            ok = true;
            break;
          }
        if (!ok) return false;
      }
      if (typeFacet.size) {
        const postType = getPostType(p);
        if (!typeFacet.has(postType)) return false;
      }
      return true;
    });
  }, [filteredByQuery, authorFacet, tagFacet, typeFacet]);

  // quick time facet
  const quickRange = useMemo(() => {
    if (!daysFacet) return null;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysFacet + 1);
    return { start, end };
  }, [daysFacet]);

  // Filter posts for facet computation: query + time, but NOT author/tag/type facets
  // This ensures facets update when time range changes
  const filteredForFacets = useMemo(() => {
    return filteredByQuery.filter((p) => {
      const d = new Date(p.date);
      if (range && !(d >= range.start && d <= range.end)) return false;
      if (quickRange && !(d >= quickRange.start && d <= quickRange.end))
        return false;
      return true;
    });
  }, [filteredByQuery, range, quickRange]);

  // facet counts
  const authorCounts = useMemo(
    () =>
      countAuthors(
        filteredForFacets
          .filter((p) => !p.corporate) // Exclude corporate posts from author facet
          .flatMap((p) => p.authors ?? [])
      ),
    [filteredForFacets]
  );
  const tagCounts = useMemo(
    () => countValues(filteredForFacets.flatMap((p) => p.tags ?? [])),
    [filteredForFacets]
  );
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of filteredForFacets) {
      const type = getPostType(p);
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  }, [filteredForFacets]);

  // apply all filters
  const fullyFiltered = useMemo(() => {
    return filteredByQuery.filter((p) => {
      const d = new Date(p.date);
      if (range && !(d >= range.start && d <= range.end)) return false;
      if (quickRange && !(d >= quickRange.start && d <= quickRange.end))
        return false;

      if (authorFacet.size) {
        const pa = new Set<string>((p.authors ?? []).map(a => a.trim().toLowerCase()));
        let ok = false;
        for (const a of authorFacet)
          if (pa.has(a.trim().toLowerCase())) {
            ok = true;
            break;
          }
        if (!ok) return false;
      }
      if (tagFacet.size) {
        const pt = new Set<string>(p.tags ?? []);
        let ok = false;
        for (const t of tagFacet)
          if (pt.has(t)) {
            ok = true;
            break;
          }
        if (!ok) return false;
      }
      if (typeFacet.size) {
        const postType = getPostType(p);
        if (!typeFacet.has(postType)) return false;
      }
      return true;
    });
  }, [filteredByQuery, range, quickRange, authorFacet, tagFacet, typeFacet]);

  // current selection
  const selectedPost = useMemo(
    () =>
      fullyFiltered.find((p) => p.slug === selected) ??
      fullyFiltered[0] ??
      null,
    [fullyFiltered, selected]
  );

  // histogram bins (12 months)
  const bins: Bin[] = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const arr: Bin[] = [];
    for (let i = 0; i < 12; i++) {
      const s = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const e = new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59, 59, 999);
      const key = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      arr.push({ key, label: key, start: s, end: e, count: 0 });
    }

    for (const p of histogramSource) {
      const d = new Date(p.date);
      const idx = arr.findIndex((b) => d >= b.start && d <= b.end);
      if (idx >= 0) arr[idx].count += 1;
    }
    return arr;
  }, [histogramSource]);

  // helpers
  function toggleFacet(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string
  ) {
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }
  function resetFacets() {
    setAuthorFacet(new Set());
    setTagFacet(new Set());
    setTypeFacet(new Set());
    setDaysFacet(null);
    setRange(null);
  }
  function insertSnippet(snippet: string) {
    setQuery((cur) => (cur ? `${cur} ${snippet}` : snippet));
  }

  // Handle histogram range selection
  function handleRangeSelect(newRange: { start: Date; end: Date } | null) {
    setRange(newRange);
    setDaysFacet(null); // Clear quick time buttons when range selected

    // Update query string to include after:/before: dates
    let updatedQuery = query;

    // Remove existing after:/before: filters
    updatedQuery = removeFilter(removeFilter(updatedQuery, 'after'), 'before');
    updatedQuery = removeFilter(removeFilter(updatedQuery, 'since'), 'until');

    // Add new date filters if range selected
    if (newRange) {
      updatedQuery = addFilter(updatedQuery, 'after', formatDateForQuery(newRange.start));
      updatedQuery = addFilter(updatedQuery, 'before', formatDateForQuery(newRange.end));
    }

    setQuery(updatedQuery);
  }

  // Handle quick time buttons (Last 7d, 30d, 90d)
  function handleQuickTime(days: number | null) {
    if (daysFacet === days) {
      // Toggle off if clicking the same button
      setDaysFacet(null);
      setRange(null);
      // Remove date filters from query
      let updatedQuery = query;
      updatedQuery = removeFilter(removeFilter(updatedQuery, 'after'), 'before');
      updatedQuery = removeFilter(removeFilter(updatedQuery, 'since'), 'until');
      setQuery(updatedQuery);
    } else if (days === null) {
      // "All time" button
      setDaysFacet(null);
      setRange(null);
      // Remove date filters from query
      let updatedQuery = query;
      updatedQuery = removeFilter(removeFilter(updatedQuery, 'after'), 'before');
      updatedQuery = removeFilter(removeFilter(updatedQuery, 'since'), 'until');
      setQuery(updatedQuery);
    } else {
      // Set the time range
      setDaysFacet(days);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days + 1);
      const calculatedRange = { start, end };
      setRange(calculatedRange);

      // Update query string
      let updatedQuery = query;
      updatedQuery = removeFilter(removeFilter(updatedQuery, 'after'), 'before');
      updatedQuery = removeFilter(removeFilter(updatedQuery, 'since'), 'until');
      updatedQuery = addFilter(updatedQuery, 'after', formatDateForQuery(start));
      updatedQuery = addFilter(updatedQuery, 'before', formatDateForQuery(end));
      setQuery(updatedQuery);
    }
  }

  // Add/remove class to document to control footer visibility
  useEffect(() => {
    if (showFooter) {
      document.documentElement.classList.remove("hide-footer");
    } else {
      document.documentElement.classList.add("hide-footer");
    }
    return () => {
      document.documentElement.classList.remove("hide-footer");
    };
  }, [showFooter]);

  // ---------- JSX ----------
  return (
    <>
      <SEO canonical="/" />
      <div className="overflow-x-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,260px)_minmax(0,1fr)_minmax(300px,340px)] gap-5 min-h-0 px-4 md:px-6 xl:px-8 overflow-hidden">
        {" "}
        <aside className="order-2 xl:order-1">
          <Panel
            header="Facets"
            description="Refine the result set"
            className="sticky top-[calc(var(--header-h)+8px)]"
          >
            <Accordion
              type="multiple"
              value={accordionOpenSections}
              onValueChange={setAccordionOpenSections}
              className="space-y-1"
            >
              <AccordionItem value="time">
                <AccordionTrigger>Time</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={daysFacet === 7 ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleQuickTime(7)}
                    >
                      Last 7d
                    </Button>
                    <Button
                      variant={daysFacet === 30 ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleQuickTime(30)}
                    >
                      Last 30d
                    </Button>
                    <Button
                      variant={daysFacet === 90 ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleQuickTime(90)}
                    >
                      Last 90d
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickTime(null)}
                    >
                      All time
                    </Button>
                  </div>

                  {range && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">
                        Selected Range:
                      </div>
                      <Pill
                        variant="solid"
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => handleQuickTime(null)}
                      >
                        {formatDateForQuery(range.start)} to {formatDateForQuery(range.end)}
                      </Pill>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="authors">
                <AccordionTrigger>Authors</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-[200px] pr-1">
                    <ul className="space-y-1">
                      {Object.entries(authorCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, count]) => (
                          <li
                            key={name}
                            className="flex items-center justify-between gap-2"
                          >
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={authorFacet.has(name)}
                                onCheckedChange={() =>
                                  toggleFacet(setAuthorFacet, name)
                                }
                              />
                              <span className="text-sm">{name}</span>
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {count}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="type">
                <AccordionTrigger>Type</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {Object.entries(typeCounts)
                      .sort((a, b) =>
                        a[0] === "internal"
                          ? -1
                          : b[0] === "internal"
                          ? 1
                          : b[1] - a[1]
                      )
                      .map(([type, count]) => (
                        <li
                          key={type}
                          className="flex items-center justify-between gap-2"
                        >
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={typeFacet.has(type)}
                              onCheckedChange={() =>
                                toggleFacet(setTypeFacet, type)
                              }
                            />
                            <div className="flex items-center gap-1.5">
                              {type === "internal" ? (
                                <House className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span
                                className={`text-sm capitalize ${
                                  type === "internal" ? "font-medium" : ""
                                }`}
                              >
                                {type}
                              </span>
                            </div>
                          </label>
                          <span className="text-xs text-muted-foreground">
                            {count}
                          </span>
                        </li>
                      ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tags">
                <AccordionTrigger>Tags</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-[240px] pr-1">
                    <ul className="space-y-1">
                      {Object.entries(tagCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([tag, count]) => (
                          <li
                            key={tag}
                            className="flex items-center justify-between gap-2"
                          >
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={tagFacet.has(tag)}
                                onCheckedChange={() =>
                                  toggleFacet(setTagFacet, tag)
                                }
                              />
                              <span className="text-sm">{tag}</span>
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {count}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Panel>
        </aside>
        {/* CENTER (offset to align with sticky side panels) */}
        <div className="order-1 xl:order-2 flex flex-col gap-4 mt-[calc(var(--header-h)+8px)] min-h-0">
          <Panel
            header="Search"
            description={
              <>
                Type queries like{" "}
                <code>author:humpty tag:reverse after:2025-01-01</code>
              </>
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                title="Reset all filters"
              >
                Reset Filters
              </Button>
            }
          >
            <div className="relative">
              <CliSearch
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="reverse author:humpty after:2025-01-01"
              />

              {/* (Optional) subtle right hint */}
              <span className="pointer-events-none absolute inset-y-0 right-3 hidden items-center text-xs text-[#928374] md:flex">
                ↵ to search
              </span>
            </div>

            {/* Quick tokens remain the same */}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setQuery((s) => (s ? s + " author:humpty" : "author:humpty"))
                }
              >
                author:humpty
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setQuery((s) => (s ? s + " tag:reverse" : "tag:reverse"))
                }
              >
                tag:reverse
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setQuery((s) =>
                    s ? s + " after:2025-01-01" : "after:2025-01-01"
                  )
                }
              >
                after:2025-01-01
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setQuery((s) =>
                    s ? s + " before:2025-12-31" : "before:2025-12-31"
                  )
                }
              >
                before:2025-12-31
              </Button>
            </div>
          </Panel>

          {!isMobile && showHistogram && (
            <Panel header="New Posts" description="Monthly volume of new posts">
              <PostAreaInteractive
                bins={bins}
                selectedRange={range}
                onRangeSelect={handleRangeSelect}
              />
            </Panel>
          )}

          <Panel
            header={`Posts (${fullyFiltered.length})`}
            className="[&>*:last-child]:p-0"
          >
            {" "}
            {/* Mobile list unchanged */}
            {isMobile && (
              <MobilePosts
                posts={fullyFiltered}
                onCardClick={(p) => {
                  setSelected(p.slug);
                  setMobileSheetOpen(true);
                }}
                authorFacet={authorFacet}
                tagFacet={tagFacet}
                toggleAuthor={(a) => toggleFacet(setAuthorFacet, a)}
                toggleTag={(t) => toggleFacet(setTagFacet, t)}
              />
            )}
            {/* Desktop: scrollable table that fills the remaining height */}
            {!isMobile && (
              <div className="posts-container">
                <div
                  ref={scrollWrapRef}
                  className="overflow-y-auto overflow-x-hidden posts-scrollbar"
                  style={{
                    scrollbarGutter: "stable both-edges",
                    height: "fit-content",
                    maxHeight: "60vh",
                  }}
                >
                  <Table className="zebra w-full posts-table">
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Author(s)</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="md:whitespace-nowrap">
                          Tags
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fullyFiltered.map((p) => {
                        const isSel = p.slug === selectedPost?.slug;
                        const ext = p.external;
                        return (
                          <TableRow
                            key={p.slug}
                            className={`${isSel ? "bg-muted-40" : ""} ${
                              !ext ? "internal-post" : ""
                            } cursor-pointer`}
                            onClick={() => setSelected(p.slug)}
                            onDoubleClick={() =>
                              (window.location.href = ext ? ext : `/${p.slug}/`)
                            }
                          >
                            <TableCell className="whitespace-nowrap align-top">
                              <time dateTime={p.date}>
                                {new Date(p.date).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                  }
                                )}
                              </time>
                            </TableCell>

                            <TableCell className="whitespace-nowrap align-top">
                              <div className="flex flex-wrap gap-1">
                                {(p.authors ?? []).length
                                  ? (p.authors ?? []).map(
                                      (a) => (
                                        <Pill
                                          key={a}
                                          variant={
                                            authorFacet.has(a)
                                              ? "solid"
                                              : "soft"
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFacet(setAuthorFacet, a);
                                          }}
                                        >
                                          {a}
                                        </Pill>
                                      )
                                    )
                                  : "—"}
                              </div>
                            </TableCell>

                            <TitleCell
                              title={p.title}
                              slug={p.slug}
                              external={ext}
                            />

                            <TableCell className="align-top">
                              <div className="flex flex-wrap gap-1">
                                {(p.tags ?? []).map(
                                  (t) => (
                                    <Pill
                                      key={t}
                                      variant={
                                        tagFacet.has(t) ? "solid" : "soft"
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFacet(setTagFacet, t);
                                      }}
                                    >
                                      {t}
                                    </Pill>
                                  )
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {fullyFiltered.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-6 text-muted-foreground"
                          >
                            No results. Try clearing facets or the query.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </Panel>
        </div>
        {/* RIGHT META (sticky under header) */}
        <aside className="order-3 space-y-4 hidden md:block">
          <Panel
            header="Selected Post"
            className="sticky top-[calc(var(--header-h)+8px)]"
          >
            {!selectedPost ? (
              <p className="text-muted-foreground text-sm">Nothing selected.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                    Title:
                  </h3>
                  <h2 className="text-base font-semibold">
                    {selectedPost.title}
                  </h2>
                </div>

                <div>
                  <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                    Publication Date:
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={selectedPost.date}>
                      {new Date(selectedPost.date).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "long", day: "2-digit" }
                      )}
                    </time>
                  </p>
                </div>

                {(selectedPost.authors ?? []).length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                      Authors:
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {(selectedPost.authors ?? []).map((a) => (
                        <Pill
                          key={a}
                          variant={authorFacet.has(a) ? "solid" : "soft"}
                          onClick={() => toggleFacet(setAuthorFacet, a)}
                        >
                          {a}
                        </Pill>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.description && (
                  <div>
                    <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                      Description:
                    </h3>
                    <InfoBox className="break-words">
                      {selectedPost.description}
                    </InfoBox>
                  </div>
                )}

                {(selectedPost.tags ?? []).length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                      Tags:
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {(selectedPost.tags ?? []).map((t) => (
                        <Pill
                          key={t}
                          variant={tagFacet.has(t) ? "solid" : "soft"}
                          onClick={() => toggleFacet(setTagFacet, t)}
                        >
                          {t}
                        </Pill>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.readingTime && (
                  <div>
                    <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                      Reading Time:
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      ~{selectedPost.readingTime} min read
                    </p>
                  </div>
                )}

                <div className="pt-1">
                  {selectedPost.external ? (
                    <a
                      href={selectedPost.external}
                      className="text-primary underline inline-flex items-center gap-1"
                    >
                      Open{" "}
                      <ExternalLink className="h-4 w-4 flex-none shrink-0" />
                    </a>
                  ) : (
                    <Link
                      href={`/${selectedPost.slug}/`}
                      className="text-primary underline"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </aside>
      </div>
      <MobilePostSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        post={selectedPost}
      />
    </div>
    </>
  );
}
