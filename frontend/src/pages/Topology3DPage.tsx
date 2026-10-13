import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { DeviceSummary, DeviceDetail, SecurityAlert, AnomalyEvent, HeartbeatItem } from '../types';
import { NetworkTopology3D } from '../components/NetworkTopology3D';

interface Topology3DPageProps {
  devices: DeviceSummary[];
  activeDevice: DeviceDetail | null;
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
  heartbeats: HeartbeatItem[];
}

export const Topology3DPage: React.FC<Topology3DPageProps> = ({
  devices,
  activeDevice,
  alerts,
  anomalies,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-auto' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Interactive 3D Network Spatial Scene</h2>
          <p className="text-xs text-slate-400 font-mono">
            Spatial representation of Gateway (192.168.43.1) and {devices.length} registered IoT devices
          </p>
        </div>

        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" /> Fullscreen Mode
            </>
          )}
        </button>
      </div>

      <NetworkTopology3D
        devices={devices}
        activeDevice={activeDevice}
        alerts={alerts}
        anomalies={anomalies}
      />
    </div>
  );
};
