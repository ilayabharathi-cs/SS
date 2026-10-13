import React from 'react';
import { Shield, RefreshCw, Server, Cpu } from 'lucide-react';
import type { DeviceSummary } from '../types';

interface HeaderProps {
  isOnline: boolean;
  devices: DeviceSummary[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  devices,
  selectedDeviceId,
  onSelectDevice,
  lastUpdated,
  onRefresh,
}) => {
  return (
    <header className="glass-panel-glow mb-6 px-6 py-4 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
          <Shield className="w-7 h-7 animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SmartShield <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">IoT SOC</span>
          </h1>
          <p className="text-xs text-slate-400">ESP32-S3 IoT Security Monitoring & Detection Platform</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Active Device Dropdown Selector */}
        {devices.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 hidden sm:inline">Selected Device:</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="bg-slate-800 text-cyan-300 font-mono text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_id} ({d.ip})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Backend Connection Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <Server className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Backend:</span>
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Disconnected
            </span>
          )}
        </div>

        {/* Refresh Button & Time */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {lastUpdated && (
            <span className="hidden sm:inline">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 active:scale-95"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
