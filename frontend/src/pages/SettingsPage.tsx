import React from 'react';
import { Server, Database, Shield, BrainCircuit, Cpu, Info } from 'lucide-react';
import type { HealthResponse } from '../types';

interface SettingsPageProps {
  health: HealthResponse | null;
  deviceCount: number;
  trustedCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  health,
  deviceCount,
  trustedCount,
}) => {
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.43.120:8000';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Platform Info Header */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 flex items-center gap-4">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
          <Info className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">SmartShield System Settings & Information</h2>
          <p className="text-xs text-slate-400">
            Hardware, API, Database, Snort IDS & AI Anomaly Detection Status Overview
          </p>
        </div>
      </div>

      {/* Grid of System Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend API Service */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">FastAPI REST Backend</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
              {health ? 'ONLINE' : 'UNREACHABLE'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>API Base URL:</span>
              <span className="text-cyan-300 font-bold">{backendUrl}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>API Service Name:</span>
              <span className="text-slate-200">{health?.service || 'SmartShield API'}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Backend Version:</span>
              <span className="text-slate-200">v{health?.version || '1.0'}</span>
            </div>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm">PostgreSQL Storage Layer</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
              CONNECTED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Database Name:</span>
              <span className="text-blue-300 font-bold">smartshield</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Total Registered Devices:</span>
              <span className="text-slate-200">{deviceCount} Devices</span>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Trusted Devices:</span>
              <span className="text-emerald-300 font-bold">{trustedCount} Devices</span>
            </div>
          </div>
        </div>

        {/* Snort 3 IDS */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Snort 3 Network IDS</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Ruleset File:</span>
              <span className="text-amber-300 font-bold">smartshield.rules</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Monitored Interface:</span>
              <span className="text-slate-200">wlan0 (Lab Subnet)</span>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Log Format:</span>
              <span className="text-slate-200">JSON Alert Logger</span>
            </div>
          </div>
        </div>

        {/* AI Anomaly Detection */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-sm">AI Machine Learning Engine</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40">
              TRAINED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>ML Algorithm:</span>
              <span className="text-purple-300 font-bold">IsolationForest</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Contamination Factor:</span>
              <span className="text-slate-200">0.05</span>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Evaluated Features:</span>
              <span className="text-slate-200">RSSI, Heartbeat Interval, Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Firmware & Hardware */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-sm">Target Hardware Specifications</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-1">Microcontroller:</span>
            <span className="text-white font-bold">ESP32-S3 DevKitC-1</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-1">Firmware Version:</span>
            <span className="text-cyan-300 font-bold">v1.0 (Modular C++)</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-1">Security Peripherals:</span>
            <span className="text-emerald-300 font-bold">RGB LED & Buzzer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
