export type ActiveTab =
  | 'dashboard'
  | 'devices'
  | 'devices-trusted'
  | 'devices-untrusted'
  | 'alerts'
  | 'anomalies'
  | 'topology'
  | 'heartbeats'
  | 'settings';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface SecurityStateResponse {
  state: 'NORMAL' | 'UNKNOWN_DEVICE' | 'CRITICAL_THREAT';
  unknown_devices: number;
  critical_alerts: number;
  last_state_change: string;
}

export interface DeviceDetail {
  device_id: string;
  device_name?: string | null;
  ip: string;
  mac: string;
  hostname?: string | null;
  rssi: number | null;
  firmware: string;
  status: string;
  is_trusted: boolean;
  trusted_at?: string | null;
  first_seen: string;
  last_seen: string;
  last_discovered?: string | null;
}

export interface DeviceSummary {
  device_id: string;
  device_name?: string | null;
  ip: string;
  mac: string;
  hostname?: string | null;
  status: string;
  is_trusted: boolean;
  trusted_at?: string | null;
  last_seen: string;
  last_discovered?: string | null;
}

export interface DeviceListResponse {
  devices: DeviceSummary[];
}

export interface TrustActionResponse {
  status: string;
  device_id: string;
  is_trusted: boolean;
  trusted_at?: string | null;
}

export interface DiscoveryStatus {
  running: boolean;
  is_scanning: boolean;
  last_scan?: string | null;
  next_scan?: string | null;
  devices_found: number;
  network: string;
}

export interface ManualScanResponse {
  status: string;
  devices_found: number;
  new_devices: number;
  updated_devices: number;
  stale_devices: number;
}

export interface HeartbeatItem {
  id: number;
  device_id: string;
  ip: string;
  mac: string;
  rssi: number;
  firmware: string;
  status: string;
  timestamp: string;
}

export interface SecurityAlert {
  id: number;
  source: string;
  alert: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  source_ip: string;
  source_port?: number | null;
  destination_ip: string;
  destination_port?: number | null;
  protocol: string;
  timestamp: string;
  created_at: string;
}

export interface AnomalyEvent {
  id: number;
  device_id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  reason?: string | null;
  timestamp: string;
  created_at: string;
}

export interface TrainResponse {
  status: string;
  samples: number;
  model: string;
}
