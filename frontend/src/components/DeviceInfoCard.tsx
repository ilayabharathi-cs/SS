import React from 'react';
import { Tag, ShieldCheck, Clock, Layers } from 'lucide-react';
import type { DeviceDetail } from '../types';
import { formatISTDateTime } from '../utils/formatters';

interface DeviceInfoCardProps {
  device: DeviceDetail | null;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ device }) => {
  if (!device) return null;

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" /> Hardware Metadata
        </h3>
        <span className="text-[10px] font-mono font-bold text-slate-300">
          ID: {device.device_id}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="flex items-center gap-2 text-slate-400">
            <Tag className="w-3.5 h-3.5 text-slate-400" /> MAC Address
          </span>
          <span className="font-mono text-slate-200 font-semibold">{device.mac}</span>
        </div>

        <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Firmware
          </span>
          <span className="font-mono text-cyan-300 font-semibold">v{device.firmware}</span>
        </div>

        <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> First Seen
          </span>
          <span className="text-slate-300 font-sans text-[11px]">
            {formatISTDateTime(device.first_seen)}
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Last Heartbeat
          </span>
          <span className="text-emerald-400 font-sans text-[11px]">
            {formatISTDateTime(device.last_seen)}
          </span>
        </div>
      </div>
    </div>
  );
};
