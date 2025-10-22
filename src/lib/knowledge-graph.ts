import { ExtendedPost } from "@/types/post";

export type NodeType = 'author' | 'post' | 'tag';

export type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  metadata: Record<string, any>;
};

export type GraphEdge = {
  id: string;
  nodeA: string;
  nodeB: string;
  relationship: 'authored' | 'tagged';
};

export type KnowledgeGraph = {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  connections: Map<string, Set<string>>;
  nodesByType: Map<NodeType, Set<string>>;
};

/**
 * Build a non-directional knowledge graph from posts
 */
export function buildKnowledgeGraph(posts: ExtendedPost[]): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const connections = new Map<string, Set<string>>();
  const nodesByType = new Map<NodeType, Set<string>>();

  // Initialize type indexes
  nodesByType.set('author', new Set());
  nodesByType.set('post', new Set());
  nodesByType.set('tag', new Set());

  // Filter out corporate posts
  const filteredPosts = posts.filter((p) => !p.corporate);

  // Helper to add a node
  const addNode = (node: GraphNode) => {
    nodes.set(node.id, node);
    nodesByType.get(node.type)?.add(node.id);
    if (!connections.has(node.id)) {
      connections.set(node.id, new Set());
    }
  };

  // Helper to add an edge (non-directional)
  const addEdge = (nodeAId: string, nodeBId: string, relationship: GraphEdge['relationship']) => {
    const edgeId = `${nodeAId}--${nodeBId}`;
    edges.set(edgeId, {
      id: edgeId,
      nodeA: nodeAId,
      nodeB: nodeBId,
      relationship,
    });

    // Add bidirectional connections
    connections.get(nodeAId)?.add(nodeBId);
    connections.get(nodeBId)?.add(nodeAId);
  };

  // First pass: count occurrences for metadata
  const authorPostCount = new Map<string, number>();
  const tagPostCount = new Map<string, number>();

  filteredPosts.forEach((post) => {
    post.authors?.forEach((author) => {
      const normalized = author.toLowerCase();
      authorPostCount.set(normalized, (authorPostCount.get(normalized) || 0) + 1);
    });
    post.tags?.forEach((tag) => {
      const normalized = tag.toLowerCase();
      tagPostCount.set(normalized, (tagPostCount.get(normalized) || 0) + 1);
    });
  });

  // Second pass: create nodes and edges
  // Create author nodes
  authorPostCount.forEach((count, author) => {
    addNode({
      id: `author-${author}`,
      type: 'author',
      label: author,
      metadata: { postCount: count },
    });
  });

  // Create tag nodes
  tagPostCount.forEach((count, tag) => {
    addNode({
      id: `tag-${tag}`,
      type: 'tag',
      label: tag,
      metadata: { postCount: count },
    });
  });

  // Create post nodes and edges
  filteredPosts.forEach((post) => {
    const postId = `post-${post.slug}`;

    addNode({
      id: postId,
      type: 'post',
      label: post.title,
      metadata: {
        slug: post.slug,
        date: post.date,
        external: post.external || false,
      },
    });

    // Connect author <-> post
    post.authors?.forEach((author) => {
      const authorId = `author-${author.toLowerCase()}`;
      addEdge(authorId, postId, 'authored');
    });

    // Connect post <-> tag
    post.tags?.forEach((tag) => {
      const tagId = `tag-${tag.toLowerCase()}`;
      addEdge(postId, tagId, 'tagged');
    });
  });

  return { nodes, edges, connections, nodesByType };
}

/**
 * Filter the graph by selected authors and tags
 */
export function filterGraph(
  graph: KnowledgeGraph,
  selectedAuthors: Set<string>,
  selectedTags: Set<string>
): KnowledgeGraph {
  const hasSelection = selectedAuthors.size > 0 || selectedTags.size > 0;

  if (!hasSelection) {
    return graph;
  }

  const filteredNodes = new Map<string, GraphNode>();
  const filteredEdges = new Map<string, GraphEdge>();
  const filteredConnections = new Map<string, Set<string>>();
  const filteredNodesByType = new Map<NodeType, Set<string>>();

  filteredNodesByType.set('author', new Set());
  filteredNodesByType.set('post', new Set());
  filteredNodesByType.set('tag', new Set());

  // Find matching posts
  const matchingPostIds = new Set<string>();

  graph.nodesByType.get('post')?.forEach((postId) => {
    const postNode = graph.nodes.get(postId);
    if (!postNode) return;

    // Get connected authors and tags
    const connectedNodes = graph.connections.get(postId) || new Set();
    const connectedAuthors = Array.from(connectedNodes)
      .map(id => graph.nodes.get(id))
      .filter(n => n?.type === 'author')
      .map(n => n!.label);

    const connectedTags = Array.from(connectedNodes)
      .map(id => graph.nodes.get(id))
      .filter(n => n?.type === 'tag')
      .map(n => n!.label);

    // Check if post matches selection
    const hasSelectedAuthor =
      selectedAuthors.size === 0 ||
      connectedAuthors.some(a => selectedAuthors.has(a));

    const hasSelectedTag =
      selectedTags.size === 0 ||
      connectedTags.some(t => selectedTags.has(t));

    if (hasSelectedAuthor && hasSelectedTag) {
      matchingPostIds.add(postId);
    }
  });

  // Include all nodes connected to matching posts
  const includedNodeIds = new Set<string>(matchingPostIds);

  matchingPostIds.forEach((postId) => {
    const connectedNodes = graph.connections.get(postId) || new Set();
    connectedNodes.forEach(nodeId => includedNodeIds.add(nodeId));
  });

  // Build filtered graph
  includedNodeIds.forEach((nodeId) => {
    const node = graph.nodes.get(nodeId);
    if (node) {
      filteredNodes.set(nodeId, node);
      filteredNodesByType.get(node.type)?.add(nodeId);
      filteredConnections.set(nodeId, new Set());
    }
  });

  // Add edges between included nodes
  graph.edges.forEach((edge) => {
    if (includedNodeIds.has(edge.nodeA) && includedNodeIds.has(edge.nodeB)) {
      filteredEdges.set(edge.id, edge);
      filteredConnections.get(edge.nodeA)?.add(edge.nodeB);
      filteredConnections.get(edge.nodeB)?.add(edge.nodeA);
    }
  });

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    connections: filteredConnections,
    nodesByType: filteredNodesByType,
  };
}

/**
 * Get stats from the graph
 */
export function getGraphStats(graph: KnowledgeGraph) {
  return {
    authorCount: graph.nodesByType.get('author')?.size || 0,
    postCount: graph.nodesByType.get('post')?.size || 0,
    tagCount: graph.nodesByType.get('tag')?.size || 0,
    edgeCount: graph.edges.size,
  };
}
