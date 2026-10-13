import React from 'react';
import { Activity, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import type { DeviceSummary, SecurityAlert, AnomalyEvent } from '../types';

interface NetworkStatsCardProps {
  devices: DeviceSummary[];
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
}

export const NetworkStatsCard: React.FC<NetworkStatsCardProps> = ({ devices, alerts, anomalies }) => {
  const highAlertsCount = alerts.filter(a => ['high', 'critical'].includes(a.severity.toLowerCase())).length;
  const totalAnomaliesCount = anomalies.filter(a => a.is_anomaly).length;

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
      <div>
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Network Summary</span>
        <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          SOC Telemetry Overview
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Active Devices</span>
            <span className="text-lg font-bold text-white">{devices.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Heartbeat Rate</span>
            <span className="text-lg font-bold text-white">10 sec</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Snort Alerts</span>
            <span className="text-lg font-bold text-white flex items-center gap-1">
              {alerts.length}
              {highAlertsCount > 0 && (
                <span className="text-xs font-normal text-rose-400">({highAlertsCount} High)</span>
              )}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">AI Anomalies</span>
            <span className="text-lg font-bold text-white">{totalAnomaliesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
