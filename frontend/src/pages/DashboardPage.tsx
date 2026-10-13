import React from 'react';
import { useSmartShieldData } from '../hooks/useSmartShieldData';
import { Header } from '../components/Header';
import { DeviceStatusCard } from '../components/DeviceStatusCard';
import { DeviceInfoCard } from '../components/DeviceInfoCard';
import { NetworkStatsCard } from '../components/NetworkStatsCard';
import { NetworkTopology3D } from '../components/NetworkTopology3D';
import { SecurityAlertCard } from '../components/SecurityAlertCard';
import { AnomalyCard } from '../components/AnomalyCard';
import { ChartsSection } from '../components/ChartsSection';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const DashboardPage: React.FC = () => {
  const {
    health,
    devices,
    activeDevice,
    selectedDeviceId,
    setSelectedDeviceId,
    heartbeats,
    alerts,
    anomalies,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useSmartShieldData(5000);

  if (loading && !health) {
    return <LoadingState />;
  }

  if (error && !health) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header
          isOnline={!!health}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          lastUpdated={lastUpdated}
          onRefresh={refetch}
        />

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <DeviceStatusCard device={activeDevice} />
          <DeviceInfoCard device={activeDevice} />
          <NetworkStatsCard devices={devices} alerts={alerts} anomalies={anomalies} />
        </div>

        {/* 3D Network Topology Scene */}
        <NetworkTopology3D
          devices={devices}
          activeDevice={activeDevice}
          alerts={alerts}
          anomalies={anomalies}
        />

        {/* Recharts Visualizations */}
        <ChartsSection heartbeats={heartbeats} alerts={alerts} />

        {/* Security Alerts & AI Anomalies Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityAlertCard alerts={alerts} />
          <AnomalyCard anomalies={anomalies} />
        </div>
      </div>
    </div>
  );
};
