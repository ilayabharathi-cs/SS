import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Activity, ShieldAlert } from 'lucide-react';
import type { HeartbeatItem, SecurityAlert } from '../types';
import { formatISTTime } from '../utils/formatters';

interface ChartsSectionProps {
  heartbeats: HeartbeatItem[];
  alerts: SecurityAlert[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ heartbeats, alerts }) => {
  // Format heartbeat data chronologically for line chart in IST Time
  const rssiChartData = [...heartbeats]
    .reverse()
    .map(hb => ({
      time: formatISTTime(hb.timestamp),
      rssi: hb.rssi
    }));

  // Group security alerts by severity
  const severityCounts: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  alerts.forEach(a => {
    const sev = a.severity.toLowerCase();
    if (sev in severityCounts) {
      severityCounts[sev]++;
    } else {
      severityCounts.low++;
    }
  });

  const severityChartData = [
    { name: 'Low', count: severityCounts.low, color: '#3b82f6' },
    { name: 'Medium', count: severityCounts.medium, color: '#f59e0b' },
    { name: 'High', count: severityCounts.high, color: '#f97316' },
    { name: 'Critical', count: severityCounts.critical, color: '#f43f5e' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* RSSI Signal Trend Chart */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 lg:col-span-2 flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Live Wi-Fi RSSI Signal Strength (dBm) — IST Time</h3>
        </div>

        <div className="flex-1 w-full min-h-0">
          {rssiChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No RSSI history logged yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rssiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[-100, -20]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Line
                  type="monotone"
                  dataKey="rssi"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Security Alert Severity Distribution */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Snort Severity Breakdown</h3>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
