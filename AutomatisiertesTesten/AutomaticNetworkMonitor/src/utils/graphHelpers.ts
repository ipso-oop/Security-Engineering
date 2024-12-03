import { NetworkNode, NetworkConnection } from '../types/network';

export function validateConnections(nodes: NetworkNode[], connections: NetworkConnection[]): NetworkConnection[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  return connections.filter(conn => 
    nodeIds.has(conn.source) && nodeIds.has(conn.target)
  );
}

export function getNodeColor(status: NetworkNode['status']): string {
  switch (status) {
    case 'threat': return '#ef4444';
    case 'suspicious': return '#f59e0b';
    default: return '#3b82f6';
  }
}

export function getConnectionColor(type: NetworkConnection['type']): string {
  return type === 'attack' ? '#ef4444' : '#94a3b8';
}