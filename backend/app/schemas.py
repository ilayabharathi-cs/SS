from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class HeartbeatRequest(BaseModel):
    device_id: str = Field(..., description="Unique hardware identifier", json_schema_extra={"example": "smartshield-01"})
    ip: str = Field(..., description="Device IP address", json_schema_extra={"example": "192.168.43.184"})
    mac: str = Field(..., description="Device MAC address", json_schema_extra={"example": "14:C1:9F:2E:6E:A8"})
    rssi: int = Field(..., description="Wi-Fi Signal Strength in dBm", json_schema_extra={"example": -40})
    firmware: str = Field(..., description="Firmware version string", json_schema_extra={"example": "1.0"})
    status: str = Field(..., description="Device operational status", json_schema_extra={"example": "online"})

class HeartbeatResponse(BaseModel):
    status: str = Field("received", json_schema_extra={"example": "received"})
    device_id: str = Field(..., json_schema_extra={"example": "smartshield-01"})
    has_untrusted_devices: bool = Field(False, description="True if any active untrusted/unknown device is connected")
    untrusted_count: int = Field(0, description="Count of active untrusted devices")
    has_attack_alert: bool = Field(False, description="True if any security attack or critical threat is detected")
    attack_count: int = Field(0, description="Count of active security attacks")

class HealthCheckResponse(BaseModel):
    status: str = Field("ok", json_schema_extra={"example": "ok"})
    service: str = Field("SmartShield API", json_schema_extra={"example": "SmartShield API"})
    version: str = Field("1.0", json_schema_extra={"example": "1.0"})

class SecurityStateResponse(BaseModel):
    state: str = Field(..., description="NORMAL, UNKNOWN_DEVICE, or CRITICAL_THREAT", json_schema_extra={"example": "NORMAL"})
    unknown_devices: int = Field(0, description="Count of active untrusted devices", json_schema_extra={"example": 0})
    critical_alerts: int = Field(0, description="Count of active critical threats", json_schema_extra={"example": 0})
    last_state_change: datetime = Field(..., description="Timestamp when state last changed")

class DeviceDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    device_name: Optional[str] = None
    ip: str
    mac: str
    hostname: Optional[str] = None
    rssi: Optional[int] = None
    firmware: str
    status: str
    is_trusted: bool = False
    trusted_at: Optional[datetime] = None
    first_seen: datetime
    last_seen: datetime
    last_discovered: Optional[datetime] = None

class DeviceSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    device_name: Optional[str] = None
    ip: str
    mac: str
    hostname: Optional[str] = None
    status: str
    is_trusted: bool = False
    trusted_at: Optional[datetime] = None
    last_seen: datetime
    last_discovered: Optional[datetime] = None

class DeviceUpdatePayload(BaseModel):
    device_name: Optional[str] = Field(None, description="Custom friendly device name/alias")
    hostname: Optional[str] = Field(None, description="Hostname string")

class DeviceListResponse(BaseModel):
    devices: List[DeviceSummaryItem]

class TrustActionResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "updated"})
    device_id: str = Field(..., json_schema_extra={"example": "smartshield-01"})
    is_trusted: bool = Field(..., json_schema_extra={"example": True})
    trusted_at: Optional[datetime] = None

class HeartbeatHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    ip: str
    mac: str
    rssi: int
    firmware: str
    status: str
    timestamp: datetime

# Security Alerts Schemas
class SecurityAlertCreate(BaseModel):
    source: str = Field("snort", description="Security alert source module", json_schema_extra={"example": "snort"})
    alert: str = Field(..., description="Alert description message", json_schema_extra={"example": "SMARTSHIELD TEST - Traffic to SmartShield API Port 8000"})
    severity: str = Field("medium", description="Alert severity (low, medium, high, critical)", json_schema_extra={"example": "medium"})
    source_ip: str = Field(..., description="Source IP address", json_schema_extra={"example": "192.168.43.184"})
    source_port: Optional[int] = Field(None, description="Source port number", json_schema_extra={"example": 59020})
    destination_ip: str = Field(..., description="Destination IP address", json_schema_extra={"example": "192.168.43.120"})
    destination_port: Optional[int] = Field(None, description="Destination port number", json_schema_extra={"example": 8000})
    protocol: str = Field("TCP", description="Network protocol", json_schema_extra={"example": "TCP"})
    timestamp: datetime = Field(..., description="Timestamp when alert occurred")

class SecurityAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    alert: str
    severity: str
    source_ip: str
    source_port: Optional[int] = None
    destination_ip: str
    destination_port: Optional[int] = None
    protocol: str
    timestamp: datetime
    created_at: datetime

class SecurityAlertActionResponse(BaseModel):
    status: str = Field("received", json_schema_extra={"example": "received"})
    id: int

# AI Anomaly Detection Schemas
class TrainResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "trained"})
    samples: int = Field(..., json_schema_extra={"example": 100})
    model: str = Field("isolation_forest", json_schema_extra={"example": "isolation_forest"})

class AnomalyAnalysisResponse(BaseModel):
    device_id: str = Field(..., json_schema_extra={"example": "smartshield-01"})
    anomaly_score: float = Field(..., json_schema_extra={"example": 0.12})
    is_anomaly: bool = Field(..., json_schema_extra={"example": False})
    reason: Optional[str] = Field(None, json_schema_extra={"example": "Normal telemetry behavior."})
    status: str = Field("analyzed", json_schema_extra={"example": "analyzed"})

class AnomalyEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    anomaly_score: float
    is_anomaly: bool
    reason: Optional[str] = None
    timestamp: datetime
    created_at: datetime

# Discovery Schemas
class DiscoveryStatusResponse(BaseModel):
    running: bool
    is_scanning: bool
    last_scan: Optional[datetime] = None
    next_scan: Optional[datetime] = None
    devices_found: int
    network: str

class ManualScanResponse(BaseModel):
    status: str
    devices_found: int
    new_devices: int
    updated_devices: int
    stale_devices: int
