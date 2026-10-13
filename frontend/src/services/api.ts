import type {
  HealthResponse,
  SecurityStateResponse,
  DeviceListResponse,
  DeviceDetail,
  HeartbeatItem,
  SecurityAlert,
  AnomalyEvent,
  TrainResponse,
  TrustActionResponse,
  DiscoveryStatus,
  ManualScanResponse
} from '../types';

const envUrl = import.meta.env.VITE_API_BASE_URL;
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE_URL = envUrl && envUrl.trim() !== '' ? envUrl : `http://${hostname}:8000`;

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`[API ERROR] ${endpoint}:`, error);
    throw error;
  }
}

export const SmartShieldApi = {
  getHealth: (): Promise<HealthResponse> => fetchJson<HealthResponse>('/api/health'),
  
  getSecurityState: (): Promise<SecurityStateResponse> => fetchJson<SecurityStateResponse>('/api/security/state'),
  
  getDevices: (): Promise<DeviceListResponse> => fetchJson<DeviceListResponse>('/api/devices'),

  getTrustedDevices: (): Promise<DeviceListResponse> => fetchJson<DeviceListResponse>('/api/devices/trusted'),

  getUntrustedDevices: (): Promise<DeviceListResponse> => fetchJson<DeviceListResponse>('/api/devices/untrusted'),

  updateDevice: (
    deviceId: string,
    payload: { device_name?: string; hostname?: string }
  ): Promise<DeviceDetail> =>
    fetchJson<DeviceDetail>(`/api/devices/${encodeURIComponent(deviceId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  trustDevice: (deviceId: string): Promise<TrustActionResponse> =>
    fetchJson<TrustActionResponse>(`/api/devices/${encodeURIComponent(deviceId)}/trust`, { method: 'POST' }),

  untrustDevice: (deviceId: string): Promise<TrustActionResponse> =>
    fetchJson<TrustActionResponse>(`/api/devices/${encodeURIComponent(deviceId)}/untrust`, { method: 'POST' }),

  getDiscoveryStatus: (): Promise<DiscoveryStatus> => fetchJson<DiscoveryStatus>('/api/discovery/status'),

  triggerManualScan: (): Promise<ManualScanResponse> =>
    fetchJson<ManualScanResponse>('/api/discovery/scan', { method: 'POST' }),
  
  getDeviceStatus: (deviceId: string): Promise<DeviceDetail> => 
    fetchJson<DeviceDetail>(`/api/device/${encodeURIComponent(deviceId)}`),
  
  getHeartbeatHistory: (deviceId: string, limit = 50): Promise<HeartbeatItem[]> => 
    fetchJson<HeartbeatItem[]>(`/api/device/${encodeURIComponent(deviceId)}/heartbeats?limit=${limit}`),
  
  getSecurityAlerts: (severity?: string, limit = 50): Promise<SecurityAlert[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (severity) params.append('severity', severity);
    return fetchJson<SecurityAlert[]>(`/api/security/alerts?${params.toString()}`);
  },
  
  getAnomalies: (deviceId?: string, limit = 50): Promise<AnomalyEvent[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (deviceId) params.append('device_id', deviceId);
    return fetchJson<AnomalyEvent[]>(`/api/ai/anomalies?${params.toString()}`);
  },

  trainAiModel: (): Promise<TrainResponse> => 
    fetchJson<TrainResponse>('/api/ai/train', { method: 'POST' }),
};
