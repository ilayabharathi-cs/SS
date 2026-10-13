import React, { useState } from 'react';
import { BrainCircuit, RefreshCw, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import type { AnomalyEvent } from '../types';
import { SmartShieldApi } from '../services/api';
import { formatISTDateTime } from '../utils/formatters';

interface AIAnomaliesPageProps {
  anomalies: AnomalyEvent[];
  onRefresh: () => void;
}

export const AIAnomaliesPage: React.FC<AIAnomaliesPageProps> = ({
  anomalies,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'anomalous' | 'normal'>('all');
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  const filteredAnomalies = anomalies.filter(a => {
    if (statusFilter === 'anomalous') return a.is_anomaly;
    if (statusFilter === 'normal') return !a.is_anomaly;
    return true;
  });

  const handleTrainModel = async () => {
    setTrainLoading(true);
    setTrainMessage(null);
    try {
      const res = await SmartShieldApi.trainAiModel();
      setTrainMessage(`Model trained on ${res.samples} telemetry samples!`);
      onRefresh();
    } catch (err) {
      setTrainMessage('Failed to trigger AI training.');
    } finally {
      setTrainLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action & Filter Header */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-sm font-bold text-white">AI Anomaly Detection Logs (IsolationForest)</h2>
            <p className="text-[11px] text-slate-400">Unsupervised anomaly scoring on ESP32 Wi-Fi & heartbeat features</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none"
            >
              <option value="all">All Events</option>
              <option value="anomalous">Anomalous Only</option>
              <option value="normal">Normal Only</option>
            </select>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={trainLoading}
            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            {trainLoading ? 'Training...' : 'Retrain AI Model'}
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {trainMessage && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs">
          {trainMessage}
        </div>
      )}

      {/* Anomalies Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {filteredAnomalies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No AI anomaly events match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Anomaly Score</th>
                  <th className="py-3 px-4">Evaluation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredAnomalies.map(anom => (
                  <tr key={anom.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                      {formatISTDateTime(anom.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{anom.device_id}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          anom.is_anomaly
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {anom.is_anomaly ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-purple-400" /> ANOMALOUS
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> NORMAL
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cyan-300">
                      {anom.anomaly_score.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {anom.reason || 'Normal telemetry behavior.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
