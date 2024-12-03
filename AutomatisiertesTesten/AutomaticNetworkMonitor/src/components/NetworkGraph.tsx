import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NetworkNode, NetworkConnection } from '../types/network';

interface NetworkGraphProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
}

export function NetworkGraph({ nodes, connections }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 800;
    const height = 600;
    svg.attr('viewBox', [0, 0, width, height]);

    // Create the simulation with nodes
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(connections)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    // Create container groups
    const g = svg.append('g');
    
    // Draw connections
    const link = g.append('g')
      .selectAll('line')
      .data(connections)
      .join('line')
      .attr('stroke', d => d.type === 'attack' ? '#ef4444' : '#94a3b8')
      .attr('stroke-width', d => d.type === 'attack' ? 2 : 1);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => {
        switch (d.status) {
          case 'threat': return '#ef4444';
          case 'suspicious': return '#f59e0b';
          default: return '#3b82f6';
        }
      });

    // Add labels to nodes
    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.ip)
      .attr('font-size', '10px')
      .attr('fill', '#4b5563');

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, connections]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full h-[600px]" />
    </div>
  );
}