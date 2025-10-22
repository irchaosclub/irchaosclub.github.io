import { useEffect, useRef, memo } from "react";
import * as d3 from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { drag } from "d3-drag";
import { KnowledgeGraph, GraphNode, GraphEdge } from "@/lib/knowledge-graph";

type ForceGraphProps = {
  graph: KnowledgeGraph;
  selectedAuthors?: Set<string>;
  selectedTags?: Set<string>;
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

function ForceGraphComponent({ graph, selectedAuthors, selectedTags, onNodeClick, width, height }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationEdge> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

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
        .distance(d => d.relationship === 'authored' ? 120 : 140)
        .strength(0.6)
      )
      .force("charge", d3.forceManyBody()
        .strength(-400)
        .distanceMax(300)
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force("collision", d3.forceCollide<SimulationNode>().radius(d => {
        return d.type === 'post' ? 90 : 70;
      }).strength(1));

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

    const link = container.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", d => d.relationship === 'authored' ? primaryColor : accentColor)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", d => d.relationship === 'tagged' ? "5,5" : "none");

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
      if (d.type === 'author') return selectedAuthors?.has(d.label);
      if (d.type === 'tag') return selectedTags?.has(d.label);
      return false;
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

    // Node type indicator
    node.append("text")
      .attr("x", d => {
        const baseWidth = d.type === 'post' ? 140 : 100;
        return -baseWidth / 2 + 6;
      })
      .attr("y", -12)
      .attr("font-family", "monospace")
      .attr("font-size", "9px")
      .attr("fill", d => {
        if (d.type === 'author') return primaryColor;
        if (d.type === 'tag') return accentColor;
        return mutedForegroundColor;
      })
      .attr("text-anchor", "start")
      .text(d => {
        if (d.type === 'author') return "[AUTHOR]";
        if (d.type === 'tag') return "[TAG]";
        return "[POST]";
      });

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

    let hasAutoFit = false;
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimulationNode).x ?? 0)
        .attr("y1", d => (d.source as SimulationNode).y ?? 0)
        .attr("x2", d => (d.target as SimulationNode).x ?? 0)
        .attr("y2", d => (d.target as SimulationNode).y ?? 0);

      node.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    simulation.on("end", () => {
      if (!hasAutoFit && nodes.length > 0) {
        hasAutoFit = true;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(d => {
          if (d.x !== undefined && d.y !== undefined) {
            minX = Math.min(minX, d.x);
            minY = Math.min(minY, d.y);
            maxX = Math.max(maxX, d.x);
            maxY = Math.max(maxY, d.y);
          }
        });

        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;

        const scale = Math.min(
          width / boundsWidth,
          height / boundsHeight,
          1.5
        );

        const translateX = width / 2 - (minX + boundsWidth / 2) * scale;
        const translateY = height / 2 - (minY + boundsHeight / 2) * scale;

        (svg as any).transition()
          .duration(750)
          .call(
            zoomBehavior.transform,
            zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
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
        background: 'hsl(var(--muted))',
        display: 'block',
        width: '100%',
        height: '100%'
      }}
    />
  );
}

export const ForceGraph = memo(ForceGraphComponent);
