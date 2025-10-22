import { useMemo, useState, useEffect } from "react";
import { allPosts } from "contentlayer/generated";
import { ExtendedPost } from "@/types/post";
import { SEO } from "@/components/seo/SEO";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { User, Tag, Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ForceGraph } from "@/components/graph/ForceGraph";
import {
  buildKnowledgeGraph,
  filterGraph,
  getGraphStats,
  GraphNode,
} from "@/lib/knowledge-graph";

export async function getStaticProps() {
  const posts = [...allPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((post) => {
      const metadata: any = {
        slug: post.slug,
        title: post.title,
        date: post.date,
      };

      if (post.authors) metadata.authors = post.authors;
      if (post.tags) metadata.tags = post.tags;
      if (post.corporate !== undefined) metadata.corporate = post.corporate;
      if (post.external) metadata.external = post.external;

      return metadata;
    });
  return { props: { posts: posts as ExtendedPost[] } };
}

type Props = { posts: ExtendedPost[] };

export default function GraphPage({ posts }: Props) {
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(
    new Set()
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 70, // Account for header bar
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const fullGraph = useMemo(() => buildKnowledgeGraph(posts), [posts]);

  const filteredGraph = useMemo(
    () => filterGraph(fullGraph, selectedAuthors, selectedTags),
    [fullGraph, selectedAuthors, selectedTags]
  );

  const stats = getGraphStats(filteredGraph);

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === "author") {
      setSelectedAuthors((prev) => {
        const next = new Set(prev);
        if (next.has(node.label)) {
          next.delete(node.label);
        } else {
          next.add(node.label);
        }
        return next;
      });
    } else if (node.type === "tag") {
      setSelectedTags((prev) => {
        const next = new Set(prev);
        if (next.has(node.label)) {
          next.delete(node.label);
        } else {
          next.add(node.label);
        }
        return next;
      });
    } else if (node.type === "post") {
      const url = node.metadata.external || `/${node.metadata.slug}/`;
      if (node.metadata.external) {
        window.open(url, "_blank");
      } else {
        window.location.href = url;
      }
    }
  };

  const resetSelection = () => {
    setSelectedAuthors(new Set());
    setSelectedTags(new Set());
  };

  // Collect all authors and tags
  const allAuthors = useMemo(() => {
    const authors = new Set<string>();
    posts.forEach((post) => {
      if (!post.corporate) {
        post.authors?.forEach((author) => authors.add(author.toLowerCase()));
      }
    });
    return Array.from(authors).sort();
  }, [posts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tags.add(tag.toLowerCase()));
    });
    return Array.from(tags).sort();
  }, [posts]);

  return (
    <>
      <SEO
        title="Knowledge Graph"
        description="Interactive visualization of authors, posts, and tags"
        canonical="/graph/"
      />
      <div className="h-screen flex flex-col">
        {/* Header with filter button */}
        <div className="px-4 md:px-6 py-3 border-b border-border bg-card flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono">./knowledge-graph</h1>
            <p className="text-xs text-muted-foreground font-mono">
              [{stats.authorCount} authors] [{stats.postCount} posts] [
              {stats.tagCount} tags] [{stats.edgeCount} connections]
            </p>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="font-mono gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "[HIDE FILTERS]" : "[FILTERS]"}
          </Button>
        </div>

        {/* Full-width graph area */}
        <div className="flex-1 bg-muted relative overflow-hidden">
          <ForceGraph
            graph={filteredGraph}
            onNodeClick={handleNodeClick}
            width={dimensions.width}
            height={dimensions.height}
          />

          {/* Floating filter dropdown */}
          {showFilters && (
            <div className="absolute top-4 right-4 w-96 bg-card border-2 border-border rounded-lg shadow-2xl z-10">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold font-mono">[FILTERS]</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ScrollArea className="max-h-[calc(100vh-200px)] px-4 py-3">
                <div className="space-y-4">
                  {/* Authors section */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <User className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                        Authors ({allAuthors.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allAuthors.map((author) => (
                        <Pill
                          key={author}
                          variant={
                            selectedAuthors.has(author) ? "solid" : "soft"
                          }
                          onClick={() =>
                            setSelectedAuthors((prev) => {
                              const next = new Set(prev);
                              if (next.has(author)) {
                                next.delete(author);
                              } else {
                                next.add(author);
                              }
                              return next;
                            })
                          }
                          className="cursor-pointer hover:bg-primary/20 text-xs font-mono"
                        >
                          {author}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  {/* Tags section */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <Tag className="h-3 w-3 text-accent-foreground" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                        Tags ({allTags.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <Pill
                          key={tag}
                          variant={selectedTags.has(tag) ? "solid" : "soft"}
                          onClick={() =>
                            setSelectedTags((prev) => {
                              const next = new Set(prev);
                              if (next.has(tag)) {
                                next.delete(tag);
                              } else {
                                next.add(tag);
                              }
                              return next;
                            })
                          }
                          className="cursor-pointer hover:bg-accent/20 text-xs font-mono"
                        >
                          {tag}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span>Authors:</span>
                        <span className="font-semibold text-foreground">
                          {stats.authorCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Posts:</span>
                        <span className="font-semibold text-foreground">
                          {stats.postCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tags:</span>
                        <span className="font-semibold text-foreground">
                          {stats.tagCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Connections:</span>
                        <span className="font-semibold text-foreground">
                          {stats.edgeCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Clear button at bottom */}
              {(selectedAuthors.size > 0 || selectedTags.size > 0) && (
                <div className="px-4 py-3 border-t border-border">
                  <Button
                    onClick={resetSelection}
                    variant="outline"
                    size="sm"
                    className="w-full font-mono"
                  >
                    [CLEAR]
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
