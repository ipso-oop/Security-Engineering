export interface NetworkNode {
  id: string;
  type: 'host' | 'attacker' | 'target';
  ip: string;
  status: 'normal' | 'suspicious' | 'threat';
  lastSeen: Date;
}

export interface NetworkConnection {
  source: string;
  target: string;
  type: 'normal' | 'suspicious' | 'attack';
  timestamp: Date;
  protocol: string;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  sourceIp: string;
  targetIp: string;
}