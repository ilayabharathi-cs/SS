import React from 'react';
import { X, Cpu, Wifi, Tag, ShieldCheck, Clock, ShieldAlert, BrainCircuit } from 'lucide-react';
import type { DeviceDetail, SecurityAlert, AnomalyEvent } from '../types';

interface DeviceDetailModalProps {
  device: DeviceDetail | null;
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
  onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  alerts,
  anomalies,
  onClose,
}) => {
  if (!device) return null;

  const deviceAlerts = alerts.filter(
    a => a.source_ip === device.ip || a.destination_ip === device.ip
  );
  const deviceAnomalies = anomalies.filter(a => a.device_id === device.device_id);
  const latestAnomaly = deviceAnomalies.length > 0 ? deviceAnomalies[0] : null;

  const isOnline = device.status.toLowerCase() === 'online';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-glow max-w-lg w-full rounded-2xl p-6 border border-cyan-500/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {device.device_id}
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {device.status.toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">IP: {device.ip}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-6">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>MAC Address</span>
            </div>
            <span className="font-mono text-slate-200 font-medium">{device.mac}</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Firmware Version</span>
            </div>
            <span className="font-mono text-slate-200 font-medium">v{device.firmware}</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wi-Fi Signal</span>
            </div>
            <span className="font-mono text-slate-200 font-medium">{device.rssi ?? -99} dBm</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last Heartbeat</span>
            </div>
            <span className="text-slate-200 font-medium text-[11px]">
              {new Date(device.last_seen).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Security & AI Status Summary */}
        <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-semibold">Snort Security Alerts:</span>
            </div>
            <span className="font-mono font-bold text-white">{deviceAlerts.length} Alerts</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <BrainCircuit className="w-4 h-4" />
              <span className="font-semibold">AI Anomaly Status:</span>
            </div>
            <span className="font-mono font-bold text-white">
              {latestAnomaly
                ? latestAnomaly.is_anomaly
                  ? `ANOMALOUS (Score: ${latestAnomaly.anomaly_score.toFixed(4)})`
                  : 'NORMAL'
                : 'NO ANOMALIES'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
