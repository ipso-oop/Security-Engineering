import { useState, useEffect } from 'react';
import { NetworkNode, NetworkConnection, Alert } from '../types/network';
import { generateMockData } from '../utils/mockData';

export function useNetworkData() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Initial data
    const { newNodes, newConnections, newAlerts } = generateMockData();
    setNodes(newNodes);
    setConnections(newConnections);
    setAlerts(newAlerts);

    // Update data periodically
    const interval = setInterval(() => {
      const { newNodes, newConnections, newAlerts } = generateMockData();
      
      setNodes(prevNodes => {
        const updatedNodes = [...prevNodes, ...newNodes];
        return updatedNodes.slice(-20); // Keep only the last 20 nodes
      });
      
      setConnections(prevConnections => {
        const updatedConnections = [...prevConnections, ...newConnections];
        return updatedConnections.slice(-30); // Keep only the last 30 connections
      });
      
      setAlerts(prevAlerts => {
        const updatedAlerts = [...prevAlerts, ...newAlerts];
        return updatedAlerts.slice(-10); // Keep only the last 10 alerts
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { nodes, connections, alerts };
}