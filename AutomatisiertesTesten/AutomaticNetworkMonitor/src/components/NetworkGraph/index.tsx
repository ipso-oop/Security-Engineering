import React from 'react';
import { NetworkNode, NetworkConnection } from '../../types/network';
import { ForceGraph } from './ForceGraph';
import { validateConnections } from '../../utils/graphHelpers';

interface NetworkGraphProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
}

export function NetworkGraph({ nodes, connections }: NetworkGraphProps) {
  const validConnections = validateConnections(nodes, connections);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="w-full h-[600px]">
        <ForceGraph
          nodes={nodes}
          connections={validConnections}
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}