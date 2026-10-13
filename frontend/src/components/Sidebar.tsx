import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  Cpu,
  ShieldCheck,
  ShieldAlert as ShieldIcon,
  Bell,
  BrainCircuit,
  Box,
  Activity,
  Settings,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  trustedCount: number;
  untrustedCount: number;
  alertCount: number;
  anomalyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  trustedCount,
  untrustedCount,
  alertCount,
  anomalyCount,
}) => {
  const [devicesExpanded, setDevicesExpanded] = useState(true);
  const [securityExpanded, setSecurityExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItemClass = (tab: ActiveTab) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
      activeTab === tab
        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold shadow-lg shadow-cyan-950/50'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
    }`;

  const subNavItemClass = (tab: ActiveTab) =>
    `flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer ${
      activeTab === tab
        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl p-4">
      {/* Brand Logo */}
      <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-md shadow-cyan-950/30">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              SmartShield
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">SOC Defense System</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {/* Dashboard */}
        <div
          onClick={() => {
            onTabChange('dashboard');
            setMobileOpen(false);
          }}
          className={navItemClass('dashboard')}
        >
          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
          <span>Dashboard Overview</span>
        </div>

        {/* Devices Section */}
        <div className="pt-2">
          <div
            onClick={() => setDevicesExpanded(!devicesExpanded)}
            className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-slate-400" /> Devices
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${devicesExpanded ? '' : '-rotate-90'}`} />
          </div>

          {devicesExpanded && (
            <div className="ml-2 pl-2 border-l border-slate-800/80 space-y-1 mt-1">
              <div
                onClick={() => {
                  onTabChange('devices');
                  setMobileOpen(false);
                }}
                className={subNavItemClass('devices')}
              >
                <span>All Registered Devices</span>
              </div>
              <div
                onClick={() => {
                  onTabChange('devices-trusted');
                  setMobileOpen(false);
                }}
                className={subNavItemClass('devices-trusted')}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Trusted Devices
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                  {trustedCount}
                </span>
              </div>
              <div
                onClick={() => {
                  onTabChange('devices-untrusted');
                  setMobileOpen(false);
                }}
                className={subNavItemClass('devices-untrusted')}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldIcon className="w-3 h-3 text-amber-400" /> Unknown Devices
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-mono">
                  {untrustedCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Security Section */}
        <div className="pt-2">
          <div
            onClick={() => setSecurityExpanded(!securityExpanded)}
            className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-slate-400" /> Security
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${securityExpanded ? '' : '-rotate-90'}`} />
          </div>

          {securityExpanded && (
            <div className="ml-2 pl-2 border-l border-slate-800/80 space-y-1 mt-1">
              <div
                onClick={() => {
                  onTabChange('alerts');
                  setMobileOpen(false);
                }}
                className={subNavItemClass('alerts')}
              >
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-amber-400" /> Snort IDS Alerts
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-mono">
                  {alertCount}
                </span>
              </div>
              <div
                onClick={() => {
                  onTabChange('anomalies');
                  setMobileOpen(false);
                }}
                className={subNavItemClass('anomalies')}
              >
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="w-3 h-3 text-purple-400" /> AI Anomalies
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-purple-500/20 text-purple-300 font-mono">
                  {anomalyCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Network Topology */}
        <div className="pt-2">
          <div
            onClick={() => {
              onTabChange('topology');
              setMobileOpen(false);
            }}
            className={navItemClass('topology')}
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span>3D Network Topology</span>
          </div>
        </div>

        {/* Monitoring */}
        <div>
          <div
            onClick={() => {
              onTabChange('heartbeats');
              setMobileOpen(false);
            }}
            className={navItemClass('heartbeats')}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Heartbeats & RSSI</span>
          </div>
        </div>

        {/* Settings */}
        <div className="pt-2">
          <div
            onClick={() => {
              onTabChange('settings');
              setMobileOpen(false);
            }}
            className={navItemClass('settings')}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & System</span>
          </div>
        </div>
      </nav>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between font-mono">
        <span>STATUS: ONLINE</span>
        <span className="text-cyan-400 font-semibold">ESP32 SOC</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 bg-slate-900/90 text-slate-200 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        />
      )}

      {/* Mobile Sidebar Container */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
};
