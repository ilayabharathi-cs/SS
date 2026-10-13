import React from 'react';
import { Cpu, Wifi, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DeviceDetail } from '../types';

interface DeviceStatusCardProps {
  device: DeviceDetail | null;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ device }) => {
  if (!device) {
    return (
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Device Status</h3>
        <p className="text-slate-500 text-sm">No device registered yet.</p>
      </div>
    );
  }

  const isOnline = device.status.toLowerCase() === 'online';
  const rssi = device.rssi ?? -99;
  
  // Calculate RSSI quality percentage (-100 to -30 dBm)
  const rssiPercent = Math.max(0, Math.min(100, ((rssi + 100) / 70) * 100));

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Primary Sentinel</span>
          <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            {device.device_id}
          </h2>
        </div>

        {/* Status Badge */}
        {isOnline ? (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            ONLINE
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            OFFLINE
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 block mb-1">IP Address</span>
          <span className="font-mono font-medium text-slate-200 text-sm">{device.ip}</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 block mb-1">Wi-Fi RSSI</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-medium text-slate-200 text-sm">{rssi} dBm</span>
          </div>
        </div>
      </div>

      {/* Signal Strength Gauge Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Signal Strength</span>
          <span>{Math.round(rssiPercent)}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              rssiPercent > 60
                ? 'bg-emerald-400'
                : rssiPercent > 30
                ? 'bg-amber-400'
                : 'bg-rose-400'
            }`}
            style={{ width: `${rssiPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
