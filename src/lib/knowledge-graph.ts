import { ExtendedPost } from "@/types/post";

// NodeType is completely dynamic - can be any field name from the contentlayer schema
// e.g., 'post', 'author', 'tag', 'year', 'readingTime', 'spotifyTrack', 'external', 'corporate', etc.
export type NodeType = string;

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
  relationship: string; // Dynamic - based on field name (e.g., 'authors', 'tags', 'date', etc.)
};

export type KnowledgeGraph = {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  connections: Map<string, Set<string>>;
  nodesByType: Map<NodeType, Set<string>>;
};

/**
 * Build a schema-driven knowledge graph from posts
 * Every field in the contentlayer schema automatically becomes a node type
 */
export function buildKnowledgeGraph(posts: ExtendedPost[]): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const connections = new Map<string, Set<string>>();
  const nodesByType = new Map<NodeType, Set<string>>();

  // Filter out corporate internal posts (keep external posts even if corporate)
  const filteredPosts = posts.filter((p) => !p.corporate || p.external);

  // Helper to add a node
  const addNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) {
      nodes.set(node.id, node);
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, new Set());
      }
      nodesByType.get(node.type)!.add(node.id);
      connections.set(node.id, new Set());
    }
  };

  // Helper to add an edge (non-directional)
  const addEdge = (nodeAId: string, nodeBId: string, relationship: string) => {
    const edgeId = `${nodeAId}--${nodeBId}`;
    if (!edges.has(edgeId)) {
      edges.set(edgeId, {
        id: edgeId,
        nodeA: nodeAId,
        nodeB: nodeBId,
        relationship,
      });
      connections.get(nodeAId)?.add(nodeBId);
      connections.get(nodeBId)?.add(nodeAId);
    }
  };

  // Helper to normalize value for node creation
  const normalizeValue = (value: any): string => {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
  };

  // Helper to create a readable label from a value
  const createLabel = (fieldName: string, value: any): string => {
    if (fieldName === 'date') {
      return new Date(value).getFullYear().toString();
    }
    if (fieldName === 'readingTime' && typeof value === 'number') {
      return value < 10 ? '<10 min' : value <= 20 ? '10-20 min' : '>20 min';
    }
    if (fieldName === 'external') {
      return value ? 'external' : 'internal';
    }
    if (fieldName === 'corporate') {
      return value ? 'corporate' : 'personal';
    }
    return normalizeValue(value);
  };

  // Fields to skip (internal metadata, not useful for graph)
  const skipFields = new Set(['_id', '_raw', 'body', 'slug', 'title', 'description']);

  // Track node counts: Map<nodeId, count>
  const nodeCounts = new Map<string, number>();

  // Process all posts and create nodes dynamically from schema
  filteredPosts.forEach((post) => {
    const postId = `post-${post.slug}`;

    // Create post node
    addNode({
      id: postId,
      type: 'post',
      label: post.title,
      metadata: post,
    });

    // Iterate over all fields in the post
    Object.entries(post).forEach(([fieldName, fieldValue]) => {
      if (skipFields.has(fieldName) || fieldValue === undefined || fieldValue === null) {
        return;
      }

      // Handle array fields (authors, tags, etc.)
      if (Array.isArray(fieldValue)) {
        fieldValue.forEach((item) => {
          const normalized = typeof item === 'string' ? item.toLowerCase() : normalizeValue(item);
          const nodeId = `${fieldName}-${normalized}`;
          const label = typeof item === 'string' ? item : normalizeValue(item);

          // Count occurrences
          nodeCounts.set(nodeId, (nodeCounts.get(nodeId) || 0) + 1);

          // Create/update node
          addNode({
            id: nodeId,
            type: fieldName,
            label: label,
            metadata: { postCount: nodeCounts.get(nodeId)! },
          });

          // Connect post to field value
          addEdge(postId, nodeId, fieldName);
        });
      }
      // Handle scalar fields
      else {
        const label = createLabel(fieldName, fieldValue);
        const nodeId = `${fieldName}-${label}`;

        // Count occurrences
        nodeCounts.set(nodeId, (nodeCounts.get(nodeId) || 0) + 1);

        // Create/update node
        addNode({
          id: nodeId,
          type: fieldName,
          label: label,
          metadata: { postCount: nodeCounts.get(nodeId)!, originalValue: fieldValue },
        });

        // Connect post to field value
        addEdge(postId, nodeId, fieldName);
      }
    });
  });

  // Update all node counts after processing
  nodeCounts.forEach((count, nodeId) => {
    const node = nodes.get(nodeId);
    if (node) {
      node.metadata.postCount = count;
    }
  });

  return { nodes, edges, connections, nodesByType };
}

/**
 * Filter the graph by selected node IDs (works for any node type)
 */
export function filterGraph(
  graph: KnowledgeGraph,
  selectedNodeIds: Set<string>
): KnowledgeGraph {
  // No selection = show everything
  if (selectedNodeIds.size === 0) {
    return graph;
  }

  const filteredNodes = new Map<string, GraphNode>();
  const filteredEdges = new Map<string, GraphEdge>();
  const filteredConnections = new Map<string, Set<string>>();
  const filteredNodesByType = new Map<NodeType, Set<string>>();

  filteredNodesByType.set('author', new Set());
  filteredNodesByType.set('post', new Set());
  filteredNodesByType.set('tag', new Set());
  filteredNodesByType.set('year', new Set());
  filteredNodesByType.set('readingTime', new Set());
  filteredNodesByType.set('spotifyTrack', new Set());
  filteredNodesByType.set('postType', new Set());
  filteredNodesByType.set('corporateStatus', new Set());

  // Find matching posts - a post matches if it's connected to ANY selected node
  const matchingPostIds = new Set<string>();

  graph.nodesByType.get('post')?.forEach((postId) => {
    const connectedNodes = graph.connections.get(postId) || new Set();

    // Check if this post is connected to any selected node
    for (const connectedNodeId of connectedNodes) {
      if (selectedNodeIds.has(connectedNodeId)) {
        matchingPostIds.add(postId);
        break;
      }
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
    yearCount: graph.nodesByType.get('year')?.size || 0,
    readingTimeCount: graph.nodesByType.get('readingTime')?.size || 0,
    spotifyTrackCount: graph.nodesByType.get('spotifyTrack')?.size || 0,
    postTypeCount: graph.nodesByType.get('postType')?.size || 0,
    corporateStatusCount: graph.nodesByType.get('corporateStatus')?.size || 0,
    edgeCount: graph.edges.size,
    totalNodes: graph.nodes.size,
  };
}
