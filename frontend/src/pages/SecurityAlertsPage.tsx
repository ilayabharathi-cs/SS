import React, { useState } from 'react';
import { ShieldAlert, Search, RefreshCw, Filter } from 'lucide-react';
import type { SecurityAlert } from '../types';
import { formatISTDateTime } from '../utils/formatters';

interface SecurityAlertsPageProps {
  alerts: SecurityAlert[];
  onRefresh: () => void;
}

export const SecurityAlertsPage: React.FC<SecurityAlertsPageProps> = ({
  alerts,
  onRefresh,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity =
      severityFilter === 'all' || alert.severity.toLowerCase() === severityFilter.toLowerCase();
    
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      alert.alert.toLowerCase().includes(query) ||
      alert.source_ip.toLowerCase().includes(query) ||
      alert.destination_ip.toLowerCase().includes(query) ||
      alert.protocol.toLowerCase().includes(query);

    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse';
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'low':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Snort IDS Intrusion Detection Logs</h2>
          <span className="text-xs text-slate-400 font-mono">({filteredAlerts.length} Alerts)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert description or IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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

      {/* Alerts Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No security alerts match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Alert Description</th>
                  <th className="py-3 px-4">Source IP : Port</th>
                  <th className="py-3 px-4">Destination IP : Port</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                      {formatISTDateTime(alert.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadgeClass(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-sans">{alert.alert}</td>
                    <td className="py-3.5 px-4 text-cyan-300">
                      {alert.source_ip}
                      {alert.source_port ? `:${alert.source_port}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {alert.destination_ip}
                      {alert.destination_port ? `:${alert.destination_port}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-bold">{alert.protocol}</td>
                    <td className="py-3.5 px-4 text-slate-400 uppercase text-[10px]">{alert.source}</td>
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
