import React, { useState } from 'react';
import {
  X,
  Cpu,
  Wifi,
  ShieldCheck,
  ShieldAlert as ShieldIcon,
  Clock,
  Bell,
  BrainCircuit
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { DeviceDetail, SecurityAlert, AnomalyEvent, HeartbeatItem } from '../types';
import { SmartShieldApi } from '../services/api';
import { formatISTDateTime, formatISTTime } from '../utils/formatters';

interface DeviceDetailsModalProps {
  device: DeviceDetail | null;
  heartbeats: HeartbeatItem[];
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
  onClose: () => void;
  onRefresh: () => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  heartbeats,
  alerts,
  anomalies,
  onClose,
  onRefresh,
}) => {
  const [trustLoading, setTrustLoading] = useState(false);

  if (!device) return null;

  const deviceAlerts = alerts.filter(
    a => a.source_ip === device.ip || a.destination_ip === device.ip
  );
  const deviceAnomalies = anomalies.filter(a => a.device_id === device.device_id);

  const chartData = heartbeats
    .slice()
    .reverse()
    .map(hb => ({
      time: formatISTTime(hb.timestamp),
      rssi: hb.rssi,
    }));

  const handleToggleTrust = async () => {
    setTrustLoading(true);
    try {
      if (device.is_trusted) {
        await SmartShieldApi.untrustDevice(device.device_id);
      } else {
        await SmartShieldApi.trustDevice(device.device_id);
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle trust:', err);
    } finally {
      setTrustLoading(false);
    }
  };

  const isOnline = device.status.toLowerCase() === 'online';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel-glow max-w-3xl w-full rounded-2xl p-6 border border-cyan-500/30 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{device.device_id}</h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {device.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-medium">
                {device.device_name ? `Name: ${device.device_name}` : 'No custom device name assigned'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleTrust}
            disabled={trustLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
              device.is_trusted
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {device.is_trusted ? (
              <>
                <ShieldIcon className="w-4 h-4 text-amber-400" />
                Remove Trust
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mark as Trusted
              </>
            )}
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">IP Address</span>
            <span className="font-mono text-cyan-300 text-xs font-semibold">{device.ip}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">MAC Address</span>
            <span className="font-mono text-slate-300 text-xs">{device.mac}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Hostname</span>
            <span className="font-mono text-slate-300 text-xs truncate block">{device.hostname || 'Unknown'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Firmware</span>
            <span className="font-mono text-slate-300 text-xs">v{device.firmware}</span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 font-mono text-[11px]">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">First Seen (IST)</span>
              <span className="text-slate-200">{formatISTDateTime(device.first_seen)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Last Heartbeat (IST)</span>
              <span className="text-slate-200">{formatISTDateTime(device.last_seen)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Last Discovered (IST)</span>
              <span className="text-slate-200">
                {device.last_discovered ? formatISTDateTime(device.last_discovered) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* RSSI Signal Strength History */}
        {chartData.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              Wi-Fi RSSI Signal Strength History (IST)
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis domain={[-100, -20]} stroke="#64748b" fontSize={10} unit="dBm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rssi"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Logs Tabs (Alerts & Anomalies) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Related Snort Alerts */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Snort Security Alerts
              </h4>
              <span className="text-[10px] font-mono text-slate-400">{deviceAlerts.length} Total</span>
            </div>
            {deviceAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No Snort alerts for this device.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {deviceAlerts.slice(0, 10).map(a => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]">
                    <div className="flex items-center justify-between text-amber-300 font-medium mb-1">
                      <span>{a.alert}</span>
                      <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20">{a.severity}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span>{a.protocol} {a.source_ip}:{a.source_port}</span>
                      <span>{formatISTTime(a.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related AI Anomalies */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                AI Anomaly Events
              </h4>
              <span className="text-[10px] font-mono text-slate-400">{deviceAnomalies.length} Total</span>
            </div>
            {deviceAnomalies.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No AI anomalies recorded.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {deviceAnomalies.slice(0, 10).map(a => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-200">{a.reason || 'Telemetry Anomaly'}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          a.is_anomaly ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {a.is_anomaly ? 'ANOMALY' : 'NORMAL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span>Score: {a.anomaly_score.toFixed(4)}</span>
                      <span>{formatISTTime(a.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
