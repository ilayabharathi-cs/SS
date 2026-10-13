import React, { useState } from 'react';
import { useSmartShieldData } from './hooks/useSmartShieldData';
import { Sidebar } from './components/Sidebar';
import { GlobalHeader } from './components/GlobalHeader';
import { DashboardPage } from './pages/DashboardPage';
import { DevicesPage } from './pages/DevicesPage';
import { SecurityAlertsPage } from './pages/SecurityAlertsPage';
import { AIAnomaliesPage } from './pages/AIAnomaliesPage';
import { HeartbeatsPage } from './pages/HeartbeatsPage';
import { Topology3DPage } from './pages/Topology3DPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import type { ActiveTab } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const {
    health,
    securityState,
    devices,
    activeDevice,
    selectedDeviceId,
    setSelectedDeviceId,
    heartbeats,
    alerts,
    anomalies,
    discoveryStatus,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useSmartShieldData(3000);

  if (loading && !health) {
    return <LoadingState />;
  }

  if (error && !health) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  const trustedCount = devices.filter(d => d.is_trusted).length;
  const untrustedCount = devices.filter(d => !d.is_trusted).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Persistent Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        trustedCount={trustedCount}
        untrustedCount={untrustedCount}
        alertCount={alerts.length}
        anomalyCount={anomalies.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 md:p-8">
        {/* Global Header */}
        <GlobalHeader
          activeTab={activeTab}
          isOnline={!!health}
          securityState={securityState}
          lastUpdated={lastUpdated}
          onRefresh={refetch}
        />

        {/* View Router */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <DashboardPage />
          )}

          {activeTab === 'devices' && (
            <DevicesPage
              devices={devices}
              alerts={alerts}
              anomalies={anomalies}
              heartbeats={heartbeats}
              discoveryStatus={discoveryStatus}
              defaultFilter="all"
              onRefresh={refetch}
            />
          )}

          {activeTab === 'devices-trusted' && (
            <DevicesPage
              devices={devices}
              alerts={alerts}
              anomalies={anomalies}
              heartbeats={heartbeats}
              discoveryStatus={discoveryStatus}
              defaultFilter="trusted"
              onRefresh={refetch}
            />
          )}

          {activeTab === 'devices-untrusted' && (
            <DevicesPage
              devices={devices}
              alerts={alerts}
              anomalies={anomalies}
              heartbeats={heartbeats}
              discoveryStatus={discoveryStatus}
              defaultFilter="untrusted"
              onRefresh={refetch}
            />
          )}

          {activeTab === 'alerts' && (
            <SecurityAlertsPage alerts={alerts} onRefresh={refetch} />
          )}

          {activeTab === 'anomalies' && (
            <AIAnomaliesPage anomalies={anomalies} onRefresh={refetch} />
          )}

          {activeTab === 'heartbeats' && (
            <HeartbeatsPage
              devices={devices}
              heartbeats={heartbeats}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              onRefresh={refetch}
            />
          )}

          {activeTab === 'topology' && (
            <Topology3DPage
              devices={devices}
              activeDevice={activeDevice}
              alerts={alerts}
              anomalies={anomalies}
              heartbeats={heartbeats}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              health={health}
              deviceCount={devices.length}
              trustedCount={trustedCount}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
