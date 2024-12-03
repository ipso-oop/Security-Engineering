import React from 'react';
import { NetworkGraph } from './components/NetworkGraph';
import { AlertList } from './components/AlertList';
import { useNetworkData } from './hooks/useNetworkData';
import { Shield } from 'lucide-react';

function App() {
  const { nodes, connections, alerts } = useNetworkData();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Network Security Monitor</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NetworkGraph nodes={nodes} connections={connections} />
          </div>
          <div>
            <AlertList alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;