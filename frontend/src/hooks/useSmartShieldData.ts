import { useState, useEffect, useCallback, useRef } from 'react';
import { SmartShieldApi } from '../services/api';
import type {
  HealthResponse,
  SecurityStateResponse,
  DeviceSummary,
  DeviceDetail,
  HeartbeatItem,
  SecurityAlert,
  AnomalyEvent,
  DiscoveryStatus
} from '../types';

export interface SmartShieldDataState {
  health: HealthResponse | null;
  securityState: SecurityStateResponse | null;
  devices: DeviceSummary[];
  activeDevice: DeviceDetail | null;
  selectedDeviceId: string;
  heartbeats: HeartbeatItem[];
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
  discoveryStatus: DiscoveryStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useSmartShieldData(pollIntervalMs = 3000) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('smartshield-01');
  const [state, setState] = useState<SmartShieldDataState>({
    health: null,
    securityState: null,
    devices: [],
    activeDevice: null,
    selectedDeviceId: 'smartshield-01',
    heartbeats: [],
    alerts: [],
    anomalies: [],
    discoveryStatus: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Health
      const healthRes = await SmartShieldApi.getHealth().catch(() => null);
      if (!healthRes) {
        throw new Error('SmartShield Backend Unreachable');
      }

      // 2. Fetch Devices List, Discovery Status, & Security State
      const [devicesRes, discoveryRes, secStateRes] = await Promise.all([
        SmartShieldApi.getDevices().catch(() => ({ devices: [] })),
        SmartShieldApi.getDiscoveryStatus().catch(() => null),
        SmartShieldApi.getSecurityState().catch(() => null)
      ]);

      const devicesList = devicesRes.devices || [];
      const targetDeviceId = selectedDeviceId || (devicesList.length > 0 ? devicesList[0].device_id : 'smartshield-01');

      // 3. Fetch Primary Device Detail, Heartbeats, Snort Alerts, and AI Anomalies
      const [deviceDetail, heartbeatsList, alertsList, anomaliesList] = await Promise.all([
        SmartShieldApi.getDeviceStatus(targetDeviceId).catch(() => null),
        SmartShieldApi.getHeartbeatHistory(targetDeviceId, 50).catch(() => []),
        SmartShieldApi.getSecurityAlerts(undefined, 50).catch(() => []),
        SmartShieldApi.getAnomalies(undefined, 50).catch(() => [])
      ]);

      if (isMounted.current) {
        setState({
          health: healthRes,
          securityState: secStateRes,
          devices: devicesList,
          activeDevice: deviceDetail,
          selectedDeviceId: targetDeviceId,
          heartbeats: heartbeatsList,
          alerts: alertsList,
          anomalies: anomaliesList,
          discoveryStatus: discoveryRes,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
      }
    } catch (err: any) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to communicate with SmartShield backend.',
        }));
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, pollIntervalMs);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [fetchData, pollIntervalMs]);

  return {
    ...state,
    setSelectedDeviceId,
    refetch: fetchData
  };
}
