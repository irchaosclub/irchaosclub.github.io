import { useEffect, useRef, memo } from "react";
import * as d3 from "d3-force";
import { select } from "d3-selection";
import { zoom } from "d3-zoom";
import { drag } from "d3-drag";
import { KnowledgeGraph, GraphNode, GraphEdge } from "@/lib/knowledge-graph";

type ForceGraphProps = {
  graph: KnowledgeGraph;
  selectedNodes?: Set<string>; // Selected node IDs
  onNodeClick?: (node: GraphNode) => void;
  width: number;
  height: number;
};

type SimulationNode = GraphNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type SimulationEdge = {
  source: SimulationNode;
  target: SimulationNode;
  relationship: GraphEdge['relationship'];
};

function ForceGraphComponent({ graph, selectedNodes, onNodeClick, width, height }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationEdge> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // Add dotted grid pattern
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "dot-pattern")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 20)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("circle")
      .attr("cx", 1)
      .attr("cy", 1)
      .attr("r", 1)
      .attr("fill", "hsl(var(--border))")
      .attr("opacity", 0.3);

    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#dot-pattern)");

    const container = svg.append("g");

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const nodes: SimulationNode[] = Array.from(graph.nodes.values()).map(n => ({ ...n }));
    const edges: SimulationEdge[] = Array.from(graph.edges.values()).map(e => {
      const source = nodes.find(n => n.id === e.nodeA)!;
      const target = nodes.find(n => n.id === e.nodeB)!;
      return { source, target, relationship: e.relationship };
    });

    // Build post-to-author mapping for clustering
    const postToAuthor = new Map<string, string>();
    
    edges.forEach(edge => {
      const source = edge.source as SimulationNode;
      const target = edge.target as SimulationNode;
      
      if (source.type === 'author' && target.type === 'post') {
        postToAuthor.set(target.id, source.id);
      } else if (source.type === 'post' && target.type === 'author') {
        postToAuthor.set(source.id, target.id);
      }
    });

    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force("link", d3.forceLink<SimulationNode, SimulationEdge>(edges)
        .id(d => d.id)
        .distance(d => {
          const source = d.source as SimulationNode;
          const target = d.target as SimulationNode;
          
          // Comfortable distance for author-post relationships - not too cramped!
          if ((source.type === 'author' && target.type === 'post') || 
              (source.type === 'post' && target.type === 'author')) {
            return 80; // Back to comfortable spacing within clusters
          }
          
          // Normal distance for tag relationships  
          if (source.type === 'tags' || target.type === 'tags') {
            return 100;
          }
          
          // SHORTER distances for cross-cluster connections to bring clusters closer
          const sourceConnections = graph.connections.get((source as SimulationNode).id)?.size || 0;
          const targetConnections = graph.connections.get((target as SimulationNode).id)?.size || 0;
          const maxConnections = Math.max(sourceConnections, targetConnections);

          // Reduced distances for hub nodes to compress overall graph
          if (maxConnections > 10) {
            return 120 + (maxConnections * 5); // Much shorter than before (was 250 + 15)
          }

          return 100 + (maxConnections * 3); // Much shorter than before (was 180 + 8)
        })
        .strength(d => {
          const source = d.source as SimulationNode;
          const target = d.target as SimulationNode;
          
          // ULTRA MAXIMUM strength for author-post bonds - iron grip!
          if ((source.type === 'author' && target.type === 'post') || 
              (source.type === 'post' && target.type === 'author')) {
            return 2.0; // Maximum possible strength!
          }
          
          // Stronger tag relationships too
          if (source.type === 'tags' || target.type === 'tags') {
            return 0.8;
          }
          
          // Weak strength for date relationships (they tend to be hubs)
          if (source.type === 'date' || target.type === 'date') {
            return 0.1;
          }
          
          // Weaker links for everything else
          const sourceConnections = graph.connections.get((source as SimulationNode).id)?.size || 0;
          const targetConnections = graph.connections.get((target as SimulationNode).id)?.size || 0;
          const maxConnections = Math.max(sourceConnections, targetConnections);

          if (maxConnections > 10) return 0.15;
          return 0.3;
        })
      )
      .force("charge", d3.forceManyBody()
        .strength(d => {
          const node = d as SimulationNode;
          const connectionCount = graph.connections.get(node.id)?.size || 0;

          // Moderate author repulsion - let the custom authorSeparation force handle the spacing
          if (node.type === 'author') {
            return -500 - (connectionCount * 25); // Back to moderate strength
          }

          // Keep reduced repulsion for posts within clusters
          if (connectionCount > 15) {
            return -400 - (connectionCount * 40);
          }
          if (connectionCount > 10) {
            return -250 - (connectionCount * 30);
          }

          return -150 - (connectionCount * 10); // Even weaker to keep things tighter
        })
        .distanceMax(600) // Back to smaller distance for tighter overall graph
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.02))
      .force("authorAttraction", (alpha) => {
        // Very strong custom force to pull posts super tight to their authors
        nodes.forEach(node => {
          if (node.type === 'post') {
            const authorId = postToAuthor.get(node.id);
            if (authorId) {
              const author = nodes.find(n => n.id === authorId);
              if (author && author.x !== undefined && author.y !== undefined && 
                  node.x !== undefined && node.y !== undefined) {
                const dx = author.x - node.x;
                const dy = author.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                  // Moderate clustering force - comfortable but grouped
                  const strength = 0.3 * alpha; // Back to moderate strength
                  const force = strength * distance / 500; // Gentler scaling
                  
                  node.vx = (node.vx || 0) + dx * force;
                  node.vy = (node.vy || 0) + dy * force;
                  
                  // Small counter-force for natural movement
                  author.vx = (author.vx || 0) - dx * force * 0.1;
                  author.vy = (author.vy || 0) - dy * force * 0.1;
                }
              }
            }
          }
        });
      })
      .force("authorSeparation", (alpha) => {
        // Strong separation - push author clusters well apart
        const authorNodes = nodes.filter(n => n.type === 'author');
        for (let i = 0; i < authorNodes.length; i++) {
          for (let j = i + 1; j < authorNodes.length; j++) {
            const authorA = authorNodes[i];
            const authorB = authorNodes[j];
            
            if (authorA.x !== undefined && authorA.y !== undefined &&
                authorB.x !== undefined && authorB.y !== undefined) {
              const dx = authorB.x - authorA.x;
              const dy = authorB.y - authorA.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 0 && distance < 250) { // Increased from 150 - repel when closer than 250px
                const strength = 0.3 * alpha; // Much stronger separation (was 0.1)
                const force = strength / (distance * distance) * 15000; // Much stronger force (was 5000)
                
                authorA.vx = (authorA.vx || 0) - dx * force;
                authorA.vy = (authorA.vy || 0) - dy * force;
                authorB.vx = (authorB.vx || 0) + dx * force;
                authorB.vy = (authorB.vy || 0) + dy * force;
              }
            }
          }
        }
      })
      .force("authorCentering", (alpha) => {
        // Keep authors at the center of their post clusters
        nodes.forEach(author => {
          if (author.type === 'author' && author.x !== undefined && author.y !== undefined) {
            // Find all posts connected to this author
            const authorPosts = nodes.filter(node => 
              node.type === 'post' && postToAuthor.get(node.id) === author.id
            );
            
            if (authorPosts.length > 0) {
              // Calculate centroid of all connected posts
              let centerX = 0;
              let centerY = 0;
              let validPosts = 0;
              
              authorPosts.forEach(post => {
                if (post.x !== undefined && post.y !== undefined) {
                  centerX += post.x;
                  centerY += post.y;
                  validPosts++;
                }
              });
              
              if (validPosts > 0) {
                centerX /= validPosts;
                centerY /= validPosts;
                
                // Pull author toward the centroid of their posts
                const dx = centerX - author.x;
                const dy = centerY - author.y;
                const strength = 0.2 * alpha; // Moderate centering strength
                
                author.vx = (author.vx || 0) + dx * strength;
                author.vy = (author.vy || 0) + dy * strength;
              }
            }
          }
        });
      })
      .force("collision", d3.forceCollide<SimulationNode>().radius(d => {
        // Normal collision bubbles for comfortable spacing within clusters
        const connectionCount = graph.connections.get(d.id)?.size || 0;
        const baseRadius = d.type === 'post' ? 60 : 55; // Back to comfortable size
        const scaleFactor = connectionCount > 10 ? 3 : 2; // Normal scaling
        return baseRadius + (connectionCount * scaleFactor);
      }).strength(0.8));

    simulationRef.current = simulation;

    const getColor = (varName: string) => {
      const temp = document.createElement('div');
      temp.style.color = `var(--${varName})`;
      document.body.appendChild(temp);
      const color = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      return color;
    };

    const primaryColor = getColor('primary');
    const accentColor = getColor('accent');
    const cardColor = getColor('card');
    const foregroundColor = getColor('foreground');
    const mutedForegroundColor = getColor('muted-foreground');

    // Color map for different relationship types
    const relationshipColors: Record<string, string> = {
      'authors': primaryColor,
      'tags': accentColor,
      'date': mutedForegroundColor,
      'readingTime': '#8b5cf6', // purple
      'external': '#3b82f6', // blue
      'corporate': '#f59e0b', // amber
      'spotifyTrack': '#22c55e', // green
    };

    const link = container.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", d => relationshipColors[d.relationship] || mutedForegroundColor)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", d => {
        // Different dash patterns for different relationships
        if (d.relationship === 'tags') return "5,5";
        if (d.relationship === 'date') return "2,3";
        if (d.relationship === 'spotifyTrack') return "8,4";
        return "none";
      });

    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(
        drag<SVGGElement, SimulationNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      })
      .style("cursor", "pointer");
    const isSelected = (d: SimulationNode) => {
      return selectedNodes?.has(d.id) || false;
    };

    node.append("rect")
      .attr("width", d => {
        const baseWidth = d.type === 'post' ? 140 : 100;
        return baseWidth;
      })
      .attr("height", 50)
      .attr("x", d => {
        const baseWidth = d.type === 'post' ? 140 : 100;
        return -baseWidth / 2;
      })
      .attr("y", -25)
      .attr("fill", cardColor)
      .attr("stroke", d => {
        if (d.type === 'author') return primaryColor;
        if (d.type === 'tag') return accentColor;
        return mutedForegroundColor;
      })
      .attr("stroke-width", d => isSelected(d) ? 3 : 2)
      .attr("stroke-opacity", d => isSelected(d) ? 1 : 0.7)
      .attr("rx", 4)
      .style("filter", d => isSelected(d) ? "brightness(1.2)" : "none");

    // Node type indicator (dynamic)
    node.append("text")
      .attr("x", d => {
        const baseWidth = d.type === 'post' ? 140 : 100;
        return -baseWidth / 2 + 6;
      })
      .attr("y", -12)
      .attr("font-family", "monospace")
      .attr("font-size", "9px")
      .attr("fill", d => {
        if (d.type === 'authors') return primaryColor;
        if (d.type === 'tags') return accentColor;
        return mutedForegroundColor;
      })
      .attr("text-anchor", "start")
      .text(d => `[${d.type.toUpperCase()}]`);

    node.append("text")
      .attr("x", 0)
      .attr("y", 5)
      .attr("font-family", "monospace")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", foregroundColor)
      .attr("text-anchor", "middle")
      .text(d => {
        const maxLen = d.type === 'post' ? 18 : 12;
        return d.label.length > maxLen
          ? d.label.substring(0, maxLen - 2) + ".."
          : d.label;
      })
      .append("title")
      .text(d => d.label);

    node.append("text")
      .attr("x", 0)
      .attr("y", 18)
      .attr("font-family", "monospace")
      .attr("font-size", "8px")
      .attr("fill", mutedForegroundColor)
      .attr("text-anchor", "middle")
      .text(d => {
        if (d.type === 'post') {
          const date = new Date(d.metadata.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        }
        return `${d.metadata.postCount} posts`;
      });

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimulationNode).x ?? 0)
        .attr("y1", d => (d.source as SimulationNode).y ?? 0)
        .attr("x2", d => (d.target as SimulationNode).x ?? 0)
        .attr("y2", d => (d.target as SimulationNode).y ?? 0);

      node.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph, onNodeClick, width, height]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          background: 'hsl(var(--background))',
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Legend Card */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'hsl(var(--foreground))',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
          minWidth: '140px',
          zIndex: 10
        }}
      >
        <div style={{ 
          fontWeight: '600', 
          marginBottom: '8px',
          color: 'white'
        }}>
          Link Types
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <hr style={{ 
              width: '24px', 
              height: '3px', 
              backgroundColor: '#8ec07c',
              border: 'none',
              margin: 0
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Authors</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <hr style={{ 
              width: '24px', 
              height: '0px', 
              backgroundColor: 'transparent',
              border: 'none',
              borderTop: '3px dashed #83a598',
              margin: 0
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Tags</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ForceGraph = memo(ForceGraphComponent);
