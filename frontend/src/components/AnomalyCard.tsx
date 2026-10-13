import React from 'react';
import { AlertTriangle, CheckCircle, Cpu, BrainCircuit } from 'lucide-react';
import type { AnomalyEvent } from '../types';
import { formatISTTime } from '../utils/formatters';

interface AnomalyCardProps {
  anomalies: AnomalyEvent[];
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomalies }) => {
  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">AI Anomaly Events (IsolationForest)</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">{anomalies.length} Logged</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {anomalies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
            <CheckCircle className="w-8 h-8 text-emerald-500/50 mb-2" />
            <span>No AI telemetry anomalies detected. Behavior is normal.</span>
          </div>
        ) : (
          anomalies.map(item => (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border transition-colors ${
                item.is_anomaly
                  ? 'bg-purple-950/30 border-purple-800/60 hover:border-purple-700'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-medium text-slate-200">{item.device_id}</span>
                </div>

                {item.is_anomaly ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-purple-400" /> ANOMALOUS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> NORMAL
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                {item.reason || 'Telemetry anomaly detected by IsolationForest model.'}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="font-mono">
                  Score: <strong className="text-purple-300">{item.anomaly_score.toFixed(4)}</strong>
                </span>
                <span className="text-slate-500 font-mono text-[11px]">{formatISTTime(item.timestamp)} (IST)</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
