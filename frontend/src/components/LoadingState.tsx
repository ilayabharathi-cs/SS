import React from 'react';
import { Shield } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-4 animate-bounce">
        <Shield className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Connecting to SmartShield SOC</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-4">
        Fetching live ESP32 device telemetry, Snort IDS security alerts, and AI anomaly scores...
      </p>
      <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
        <div className="w-1/2 h-full bg-cyan-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};
