import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import type { SecurityAlert } from '../types';
import { formatISTTime } from '../utils/formatters';

interface SecurityAlertCardProps {
  alerts: SecurityAlert[];
}

export const SecurityAlertCard: React.FC<SecurityAlertCardProps> = ({ alerts }) => {
  const getSeverityBadge = (severity: string) => {
    const sev = severity.toLowerCase();
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Info className="w-3 h-3" /> MEDIUM
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> LOW
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Snort 3 IDS Security Alerts</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">{alerts.length} Total</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
            <ShieldCheck className="w-8 h-8 text-emerald-500/50 mb-2" />
            <span>No Snort security alerts recorded yet.</span>
          </div>
        ) : (
          alerts.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-200 leading-snug">{item.alert}</span>
                {getSeverityBadge(item.severity)}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3 font-mono">
                  <span>Src: <strong className="text-slate-300">{item.source_ip}</strong>{item.source_port ? `:${item.source_port}` : ''}</span>
                  <span>→</span>
                  <span>Dst: <strong className="text-slate-300">{item.destination_ip}</strong>{item.destination_port ? `:${item.destination_port}` : ''}</span>
                  <span className="px-1.5 py-0.2 bg-slate-800 rounded text-cyan-300 text-[10px]">{item.protocol}</span>
                </div>

                <span className="text-slate-500 font-mono text-[11px]">{formatISTTime(item.timestamp)} (IST)</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
