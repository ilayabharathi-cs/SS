import React from 'react';
import { RefreshCw, Server, Clock, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { ActiveTab, SecurityStateResponse } from '../types';
import { formatISTTime } from '../utils/formatters';

interface GlobalHeaderProps {
  activeTab: ActiveTab;
  isOnline: boolean;
  securityState?: SecurityStateResponse | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

const TAB_NAMES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Overview', subtitle: 'Real-Time System Health & Threat Metrics' },
  devices: { title: 'Device Management', subtitle: 'All Registered IoT Nodes & Telemetry Status' },
  'devices-trusted': { title: 'Trusted Devices', subtitle: 'Explicitly Approved & Authenticated Devices' },
  'devices-untrusted': { title: 'Unknown / Untrusted Devices', subtitle: 'Unverified Network Devices Requiring Approval' },
  alerts: { title: 'Snort IDS Security Alerts', subtitle: 'Network Intrusion Signatures & Packet Alerts' },
  anomalies: { title: 'AI Anomaly Events', subtitle: 'Unsupervised Machine Learning IsolationForest Detection' },
  topology: { title: '3D Network Topology', subtitle: 'Interactive 3D Spatial Scene & Relationships' },
  heartbeats: { title: 'Heartbeats & RSSI Monitoring', subtitle: 'Live Telemetry Signal Strength & Pulse History' },
  settings: { title: 'System Settings & Info', subtitle: 'Backend Configuration, Database & AI Status' },
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  activeTab,
  isOnline,
  securityState,
  lastUpdated,
  onRefresh,
}) => {
  const current = TAB_NAMES[activeTab] || { title: 'SmartShield SOC', subtitle: 'IoT Security Platform' };
  const secState = securityState?.state || 'NORMAL';

  return (
    <header className="glass-panel-glow mb-6 px-6 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Physical Security State Indicator Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <span className="text-slate-400 font-sans">Physical State:</span>
          {secState === 'CRITICAL_THREAT' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              🔴 CRITICAL THREAT ({securityState?.critical_alerts || 1})
            </span>
          )}
          {secState === 'UNKNOWN_DEVICE' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              🟡 UNKNOWN DEVICE ({securityState?.unknown_devices || 1})
            </span>
          )}
          {secState === 'NORMAL' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              🟢 NORMAL
            </span>
          )}
        </div>

        {/* Backend Connection Badge */}
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

        {/* Refresh Timestamp & IST Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {lastUpdated && (
            <span className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Updated: {formatISTTime(lastUpdated)} <span className="text-[10px] text-slate-400 font-sans">(IST)</span>
            </span>
          )}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors flex items-center gap-1.5 active:scale-95"
            title="Refresh System Telemetry"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
