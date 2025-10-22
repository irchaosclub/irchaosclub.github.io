import { useMemo, useState, useEffect, useCallback } from "react";
import { allPosts } from "contentlayer/generated";
import { ExtendedPost } from "@/types/post";
import { SEO } from "@/components/seo/SEO";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { User, Tag, Filter, X, ExternalLink, House, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ForceGraph } from "@/components/graph/ForceGraph";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  buildKnowledgeGraph,
  filterGraph,
  getGraphStats,
  GraphNode,
} from "@/lib/knowledge-graph";
import Link from "next/link";

export async function getStaticProps() {
  const posts = [...allPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((post) => {
      const metadata: any = {
        slug: post.slug,
        title: post.title,
        date: post.date,
      };

      // Include all available fields
      if (post.authors) metadata.authors = post.authors;
      if (post.tags) metadata.tags = post.tags;
      if (post.description) metadata.description = post.description;
      if (post.readingTime) metadata.readingTime = post.readingTime;
      if (post.external) metadata.external = post.external;
      if (post.spotifyTrack) metadata.spotifyTrack = post.spotifyTrack;
      if (post.corporate !== undefined) metadata.corporate = post.corporate;

      return metadata;
    });
  return { props: { posts: posts as ExtendedPost[] } };
}

type Props = { posts: ExtendedPost[] };

export default function GraphPage({ posts }: Props) {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set()); // Store node IDs
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExtendedPost | null>(null);
  const [postSheetOpen, setPostSheetOpen] = useState(false);

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
    () => filterGraph(fullGraph, selectedNodes),
    [fullGraph, selectedNodes]
  );

  const stats = getGraphStats(filteredGraph);

  const handleNodeClick = useCallback((node: GraphNode) => {
    // Posts open in modal
    if (node.type === "post") {
      setSelectedPost(node.metadata as ExtendedPost);
      setPostSheetOpen(true);
      return;
    }

    // All other node types toggle selection
    setSelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);

  const resetSelection = () => {
    setSelectedNodes(new Set());
  };

  // Group nodes by type for filter UI (exclude posts)
  const nodesByType = useMemo(() => {
    const result: Record<string, GraphNode[]> = {};

    fullGraph.nodes.forEach((node) => {
      if (node.type !== 'post') {
        if (!result[node.type]) {
          result[node.type] = [];
        }
        result[node.type].push(node);
      }
    });

    // Sort each type by label
    Object.keys(result).forEach((type) => {
      result[type].sort((a, b) => a.label.localeCompare(b.label));
    });

    return result;
  }, [fullGraph]);

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
              [{stats.totalNodes} nodes] [{stats.edgeCount} edges] [{stats.postCount} posts]
            </p>
          </div>
          <div className="flex gap-2">
            {selectedNodes.size > 0 && (
              <Button
                onClick={resetSelection}
                variant="outline"
                size="sm"
                className="font-mono gap-2"
              >
                <X className="h-4 w-4" />
                [CLEAR]
              </Button>
            )}
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
        </div>

        {/* Full-width graph area */}
        <div className="flex-1 bg-muted relative overflow-hidden">
          <ForceGraph
            graph={filteredGraph}
            selectedNodes={selectedNodes}
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
                  {/* Dynamic sections for each node type */}
                  {Object.entries(nodesByType).map(([type, nodes]) => {
                    const icon = type === 'author' ? <User className="h-3 w-3 text-primary" />
                      : type === 'tag' ? <Tag className="h-3 w-3 text-accent-foreground" />
                      : null;

                    return (
                      <div key={type}>
                        <div className="flex items-center gap-1 mb-2">
                          {icon}
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                            {type} ({nodes.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {nodes.map((node) => (
                            <Pill
                              key={node.id}
                              variant={selectedNodes.has(node.id) ? "solid" : "soft"}
                              onClick={() => {
                                setSelectedNodes((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(node.id)) {
                                    next.delete(node.id);
                                  } else {
                                    next.add(node.id);
                                  }
                                  return next;
                                });
                              }}
                              className="cursor-pointer hover:bg-primary/20 text-xs font-mono"
                            >
                              {node.label}
                            </Pill>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Stats */}
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span>Total Nodes:</span>
                        <span className="font-semibold text-foreground">
                          {stats.totalNodes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Edges:</span>
                        <span className="font-semibold text-foreground">
                          {stats.edgeCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Posts:</span>
                        <span className="font-semibold text-foreground">
                          {stats.postCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Authors:</span>
                        <span className="font-semibold text-foreground">
                          {stats.authorCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tags:</span>
                        <span className="font-semibold text-foreground">
                          {stats.tagCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Years:</span>
                        <span className="font-semibold text-foreground">
                          {stats.yearCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading Times:</span>
                        <span className="font-semibold text-foreground">
                          {stats.readingTimeCount}
                        </span>
                      </div>
                      {stats.spotifyTrackCount > 0 && (
                        <div className="flex justify-between">
                          <span>Spotify Tracks:</span>
                          <span className="font-semibold text-foreground">
                            {stats.spotifyTrackCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Clear button at bottom */}
              {selectedNodes.size > 0 && (
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

        {/* Post detail dialog */}
        <Dialog open={postSheetOpen} onOpenChange={setPostSheetOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto font-mono">
            {selectedPost && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-2">
                    {selectedPost.external ? (
                      <Globe className="h-5 w-5 shrink-0 text-blue-500 mt-1" />
                    ) : (
                      <House className="h-5 w-5 shrink-0 text-primary mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-xl font-bold break-words pr-6">
                        {selectedPost.title}
                      </DialogTitle>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                      Publication Date:
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      <time dateTime={selectedPost.date}>
                        {new Date(selectedPost.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "2-digit",
                        })}
                      </time>
                    </p>
                  </div>

                  {selectedPost.authors && selectedPost.authors.length > 0 && (
                    <div>
                      <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                        Authors:
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPost.authors.map((author) => (
                          <Pill
                            key={author}
                            variant={
                              selectedNodes.has(`authors-${author.toLowerCase()}`)
                                ? "solid"
                                : "soft"
                            }
                            className="cursor-pointer hover:bg-primary/20"
                            onClick={() => {
                              setSelectedNodes((prev) => {
                                const next = new Set(prev);
                                const authorId = `authors-${author.toLowerCase()}`;
                                if (next.has(authorId)) {
                                  next.delete(authorId);
                                } else {
                                  next.add(authorId);
                                }
                                return next;
                              });
                              setPostSheetOpen(false);
                            }}
                          >
                            {author}
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
                      <div className="border border-border bg-muted/50 p-3 rounded text-sm break-words">
                        {selectedPost.description}
                      </div>
                    </div>
                  )}

                  {selectedPost.tags && selectedPost.tags.length > 0 && (
                    <div>
                      <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                        Tags:
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPost.tags.map((tag) => (
                          <Pill
                            key={tag}
                            variant={
                              selectedNodes.has(`tags-${tag.toLowerCase()}`)
                                ? "solid"
                                : "soft"
                            }
                            className="cursor-pointer hover:bg-accent/20"
                            onClick={() => {
                              setSelectedNodes((prev) => {
                                const next = new Set(prev);
                                const tagId = `tags-${tag.toLowerCase()}`;
                                if (next.has(tagId)) {
                                  next.delete(tagId);
                                } else {
                                  next.add(tagId);
                                }
                                return next;
                              });
                              setPostSheetOpen(false);
                            }}
                          >
                            {tag}
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

                  {selectedPost.spotifyTrack && (
                    <div>
                      <h3 className="text-xs font-mono text-foreground underline decoration-primary/50 underline-offset-2 mb-2 font-medium">
                        Soundtrack:
                      </h3>
                      <div className="border border-border bg-muted/50 p-3 rounded">
                        <code className="text-xs text-green-500 break-all">
                          {selectedPost.spotifyTrack}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 flex-col sm:flex-row">
                  {selectedPost.external ? (
                    <a
                      href={selectedPost.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors font-mono w-full sm:w-auto"
                    >
                      <ExternalLink className="h-4 w-4" />
                      [OPEN EXTERNAL]
                    </a>
                  ) : (
                    <Link
                      href={`/${selectedPost.slug}/`}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors font-mono w-full sm:w-auto"
                    >
                      <House className="h-4 w-4" />
                      [READ POST]
                    </Link>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
