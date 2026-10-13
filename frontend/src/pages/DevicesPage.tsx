import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert as ShieldIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Radio,
  Play,
  Pencil,
  X,
  Save,
  Tag
} from 'lucide-react';
import type { DeviceSummary, DeviceDetail, HeartbeatItem, SecurityAlert, AnomalyEvent, DiscoveryStatus } from '../types';
import { SmartShieldApi } from '../services/api';
import { DeviceDetailsModal } from '../components/DeviceDetailsModal';
import { formatISTDateTime, formatISTTime } from '../utils/formatters';

interface DevicesPageProps {
  devices: DeviceSummary[];
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
  heartbeats: HeartbeatItem[];
  discoveryStatus: DiscoveryStatus | null;
  defaultFilter?: 'all' | 'trusted' | 'untrusted';
  onRefresh: () => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({
  devices,
  alerts,
  anomalies,
  heartbeats,
  discoveryStatus,
  defaultFilter = 'all',
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [trustTab, setTrustTab] = useState<'all' | 'trusted' | 'untrusted'>(defaultFilter);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDetail | null>(null);
  const [editingDevice, setEditingDevice] = useState<DeviceSummary | null>(null);
  const [editDeviceName, setEditDeviceName] = useState('');
  const [editHostname, setEditHostname] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const filteredDevices = devices.filter(dev => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      dev.device_id.toLowerCase().includes(query) ||
      (dev.device_name && dev.device_name.toLowerCase().includes(query)) ||
      dev.ip.toLowerCase().includes(query) ||
      dev.mac.toLowerCase().includes(query) ||
      (dev.hostname && dev.hostname.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'all' || dev.status.toLowerCase() === statusFilter;

    const matchesTrust =
      trustTab === 'all' ||
      (trustTab === 'trusted' && dev.is_trusted) ||
      (trustTab === 'untrusted' && !dev.is_trusted);

    return matchesSearch && matchesStatus && matchesTrust;
  });

  const handleToggleTrust = async (dev: DeviceSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(dev.device_id);
    try {
      if (dev.is_trusted) {
        await SmartShieldApi.untrustDevice(dev.device_id);
      } else {
        await SmartShieldApi.trustDevice(dev.device_id);
      }
      onRefresh();
    } catch (err) {
      console.error('Failed trust toggle:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEditModal = (dev: DeviceSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDevice(dev);
    setEditDeviceName(dev.device_name || '');
    setEditHostname(dev.hostname || '');
  };

  const handleSaveDeviceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    setSaveLoading(true);
    try {
      await SmartShieldApi.updateDevice(editingDevice.device_id, {
        device_name: editDeviceName,
        hostname: editHostname,
      });
      setEditingDevice(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update device:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleManualScan = async () => {
    setScanLoading(true);
    try {
      await SmartShieldApi.triggerManualScan();
      onRefresh();
    } catch (err) {
      console.error('Failed manual discovery scan:', err);
    } finally {
      setScanLoading(false);
    }
  };

  const handleOpenDetails = async (deviceId: string) => {
    try {
      const detail = await SmartShieldApi.getDeviceStatus(deviceId);
      setSelectedDevice(detail);
    } catch (err) {
      console.error('Failed to load device details:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 30-Second Discovery Scan Banner */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              Automated 30-Second Network Discovery Scanner
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {discoveryStatus?.network || '192.168.43.0/24'}
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
              <span>
                Last Scan:{' '}
                <strong className="text-slate-200">
                  {discoveryStatus?.last_scan ? formatISTTime(discoveryStatus.last_scan) : 'N/A'} (IST)
                </strong>
              </span>
              <span>•</span>
              <span>
                Next Scan:{' '}
                <strong className="text-slate-200">
                  {discoveryStatus?.next_scan ? formatISTTime(discoveryStatus.next_scan) : 'N/A'} (IST)
                </strong>
              </span>
              <span>•</span>
              <span>
                Discovered Devices:{' '}
                <strong className="text-cyan-400">{discoveryStatus?.devices_found ?? devices.length}</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleManualScan}
          disabled={scanLoading || discoveryStatus?.is_scanning}
          className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" />
          {scanLoading || discoveryStatus?.is_scanning ? 'Scanning Subnet...' : 'Trigger Manual Scan'}
        </button>
      </div>

      {/* Top Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Trust Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => setTrustTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              trustTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({devices.length})
          </button>
          <button
            onClick={() => setTrustTab('trusted')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              trustTab === 'trusted' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Trusted ({devices.filter(d => d.is_trusted).length})
          </button>
          <button
            onClick={() => setTrustTab('untrusted')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              trustTab === 'untrusted' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldIcon className="w-3.5 h-3.5 text-amber-400" />
            Unknown ({devices.filter(d => !d.is_trusted).length})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, ID, IP, MAC, Hostname..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 text-slate-300 text-xs rounded-xl px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {filteredDevices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No registered devices found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Device Name</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">MAC Address</th>
                  <th className="py-3 px-4">Hostname</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trust Status</th>
                  <th className="py-3 px-4">Last Discovered (IST)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredDevices.map(dev => {
                  const isOnline = dev.status.toLowerCase() === 'online';
                  return (
                    <tr
                      key={dev.device_id}
                      onClick={() => handleOpenDetails(dev.device_id)}
                      className="hover:bg-slate-900/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-cyan-300">
                        {dev.device_name || <span className="text-slate-500 italic">No custom name</span>}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {dev.device_id}
                      </td>
                      <td className="py-3.5 px-4 text-cyan-300">{dev.ip}</td>
                      <td className="py-3.5 px-4 text-slate-400">{dev.mac}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-sans">{dev.hostname || 'Unknown Host'}</td>
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {isOnline ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                          )}
                          {dev.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            dev.is_trusted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {dev.is_trusted ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Trusted
                            </>
                          ) : (
                            <>
                              <ShieldIcon className="w-3 h-3 text-amber-400" /> Unknown
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                        {dev.last_discovered ? formatISTDateTime(dev.last_discovered) : formatISTDateTime(dev.last_seen)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={e => handleOpenEditModal(dev, e)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                            title="Edit Device Name & Hostname"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleToggleTrust(dev, e)}
                            disabled={actionLoading === dev.device_id}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                              dev.is_trusted
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {dev.is_trusted ? 'Remove Trust' : 'Trust'}
                          </button>
                          <button
                            onClick={() => handleOpenDetails(dev.device_id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Device Name Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Device Details</h3>
                  <p className="text-xs text-slate-400 font-mono">{editingDevice.device_id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDevice(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeviceEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Device Name / Friendly Alias
                </label>
                <input
                  type="text"
                  placeholder="e.g. SmartShield ESP32 Gateway, Living Room Camera..."
                  value={editDeviceName}
                  onChange={e => setEditDeviceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Hostname
                </label>
                <input
                  type="text"
                  placeholder="e.g. esp32-sentinel.local..."
                  value={editHostname}
                  onChange={e => setEditHostname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDevice && (
        <DeviceDetailsModal
          device={selectedDevice}
          heartbeats={heartbeats}
          alerts={alerts}
          anomalies={anomalies}
          onClose={() => setSelectedDevice(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
