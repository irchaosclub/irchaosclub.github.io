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

    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force("link", d3.forceLink<SimulationNode, SimulationEdge>(edges)
        .id(d => d.id)
        .distance(d => {
          // Longer distances for high-cardinality nodes
          const sourceConnections = graph.connections.get((d.source as SimulationNode).id)?.size || 0;
          const targetConnections = graph.connections.get((d.target as SimulationNode).id)?.size || 0;
          const maxConnections = Math.max(sourceConnections, targetConnections);

          // Very long distances for hub nodes (low cardinality, high connections)
          if (maxConnections > 10) {
            return 150 + (maxConnections * 8);
          }

          return 100 + (maxConnections * 5);
        })
        .strength(d => {
          // Weaker links for hub nodes
          const sourceConnections = graph.connections.get((d.source as SimulationNode).id)?.size || 0;
          const targetConnections = graph.connections.get((d.target as SimulationNode).id)?.size || 0;
          const maxConnections = Math.max(sourceConnections, targetConnections);

          if (maxConnections > 10) return 0.2;
          return 0.5;
        })
      )
      .force("charge", d3.forceManyBody()
        .strength(d => {
          // Low cardinality nodes = MUCH stronger repulsion
          const node = d as SimulationNode;
          const connectionCount = graph.connections.get(node.id)?.size || 0;

          // Hub nodes push EVERYTHING away strongly
          if (connectionCount > 15) {
            return -1000 - (connectionCount * 100);
          }
          if (connectionCount > 10) {
            return -600 - (connectionCount * 80);
          }

          return -300 - (connectionCount * 30);
        })
        .distanceMax(800)
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.03))
      .force("collision", d3.forceCollide<SimulationNode>().radius(d => {
        // Calculate radius based on actual connection count (cardinality)
        const connectionCount = graph.connections.get(d.id)?.size || 0;

        // Base radius varies by type
        const baseRadius = d.type === 'post' ? 70 : 60;

        // Larger collision bubbles for hub nodes
        const scaleFactor = connectionCount > 10 ? 5 : 3;

        return baseRadius + (connectionCount * scaleFactor);
      }).strength(0.9));

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
  );
}

export const ForceGraph = memo(ForceGraphComponent);
