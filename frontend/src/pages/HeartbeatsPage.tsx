import React from 'react';
import { Activity, RefreshCw, Cpu, Wifi } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { HeartbeatItem, DeviceSummary } from '../types';
import { formatISTTime, formatISTDateTime } from '../utils/formatters';

interface HeartbeatsPageProps {
  devices: DeviceSummary[];
  heartbeats: HeartbeatItem[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  onRefresh: () => void;
}

export const HeartbeatsPage: React.FC<HeartbeatsPageProps> = ({
  devices,
  heartbeats,
  selectedDeviceId,
  onSelectDevice,
  onRefresh,
}) => {
  const limit = 50;

  const filteredHeartbeats = heartbeats.filter(
    hb => hb.device_id === selectedDeviceId
  );

  const chartData = filteredHeartbeats
    .slice(0, limit)
    .reverse()
    .map(hb => ({
      time: formatISTTime(hb.timestamp),
      rssi: hb.rssi,
    }));

  return (
    <div className="space-y-6">
      {/* Selector & Refresh Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Live Heartbeats & RSSI Monitoring</h2>
            <p className="text-[11px] text-slate-400">10-second JSON pulse history & signal strength trajectory (IST)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Device:</span>
            <select
              value={selectedDeviceId}
              onChange={e => onSelectDevice(e.target.value)}
              className="bg-transparent text-cyan-300 font-mono focus:outline-none"
            >
              {devices.map(d => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_id} ({d.ip})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* RSSI Signal Trend Line Chart */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-cyan-400" />
          Wi-Fi Signal Strength (RSSI in dBm) for {selectedDeviceId} (IST Time)
        </h3>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
            No heartbeat history records found for {selectedDeviceId}.
          </div>
        ) : (
          <div className="h-56 w-full">
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
        )}
      </div>

      {/* Heartbeat History Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white">Recent Heartbeat Log History</h3>
          <span className="text-xs text-slate-400 font-mono">{filteredHeartbeats.length} Heartbeats Logged</span>
        </div>
        {filteredHeartbeats.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No heartbeats logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">MAC Address</th>
                  <th className="py-3 px-4">RSSI Signal</th>
                  <th className="py-3 px-4">Firmware</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredHeartbeats.slice(0, limit).map(hb => (
                  <tr key={hb.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                      {formatISTDateTime(hb.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{hb.device_id}</td>
                    <td className="py-3 px-4 text-cyan-300">{hb.ip}</td>
                    <td className="py-3 px-4 text-slate-400">{hb.mac}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{hb.rssi} dBm</td>
                    <td className="py-3 px-4 text-slate-300">v{hb.firmware}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {hb.status.toUpperCase()}
                      </span>
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
