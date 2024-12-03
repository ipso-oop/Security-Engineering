import React from 'react';
import { Alert } from '../types/network';
import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Security Alerts</h2>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${
              alert.severity === 'high'
                ? 'border-red-200 bg-red-50'
                : alert.severity === 'medium'
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {alert.severity === 'high' ? (
                <ShieldAlert className="w-5 h-5 text-red-500" />
              ) : alert.severity === 'medium' ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <Shield className="w-5 h-5 text-blue-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">{alert.message}</p>
                <div className="mt-1 text-sm text-gray-600">
                  <p>Source: {alert.sourceIp}</p>
                  <p>Target: {alert.targetIp}</p>
                  <p className="mt-1">
                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}