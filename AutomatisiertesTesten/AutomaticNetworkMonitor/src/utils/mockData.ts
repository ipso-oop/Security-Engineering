import { NetworkNode, NetworkConnection, Alert } from '../types/network';

function generateRandomIp(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

const nodeStore = new Map<string, NetworkNode>();

export function generateMockData() {
  const newNodes: NetworkNode[] = [];
  const newConnections: NetworkConnection[] = [];
  const newAlerts: Alert[] = [];

  // Generate new node
  if (Math.random() < 0.3 || nodeStore.size === 0) {
    const nodeTypes: ('host' | 'attacker' | 'target')[] = ['host', 'attacker', 'target'];
    const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    const newNode: NetworkNode = {
      id: Math.random().toString(36).substr(2, 9),
      type: nodeType,
      ip: generateRandomIp(),
      status: Math.random() < 0.2 ? 'suspicious' : 'normal',
      lastSeen: new Date()
    };
    newNodes.push(newNode);
    nodeStore.set(newNode.id, newNode);
  }

  // Generate new connection between existing nodes
  if (nodeStore.size >= 2) {
    const nodes = Array.from(nodeStore.values());
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    let target;
    do {
      target = nodes[Math.floor(Math.random() * nodes.length)];
    } while (target.id === source.id);

    if (Math.random() < 0.4) {
      newConnections.push({
        source: source.id,
        target: target.id,
        type: Math.random() < 0.1 ? 'attack' : 'normal',
        timestamp: new Date(),
        protocol: Math.random() < 0.5 ? 'TCP' : 'UDP'
      });
    }
  }

  // Generate new alert
  if (nodeStore.size >= 2 && Math.random() < 0.2) {
    const nodes = Array.from(nodeStore.values());
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    
    newAlerts.push({
      id: Math.random().toString(36).substr(2, 9),
      severity: Math.random() < 0.3 ? 'high' : Math.random() < 0.6 ? 'medium' : 'low',
      message: 'Suspicious activity detected',
      timestamp: new Date(),
      sourceIp: source.ip,
      targetIp: target.ip
    });
  }

  // Limit the number of stored nodes
  if (nodeStore.size > 20) {
    const nodes = Array.from(nodeStore.values());
    const toRemove = nodes.slice(0, nodes.length - 20);
    toRemove.forEach(node => nodeStore.delete(node.id));
  }

  return { 
    newNodes, 
    newConnections, 
    newAlerts 
  };
}