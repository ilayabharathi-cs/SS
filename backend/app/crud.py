from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import models, schemas

def get_device_by_mac(db: Session, mac: str) -> Optional[models.Device]:
    if not mac:
        return None
    mac_clean = mac.strip().upper()
    return db.query(models.Device).filter(models.Device.mac == mac_clean).first()

def get_device_by_id(db: Session, device_id: str) -> Optional[models.Device]:
    return db.query(models.Device).filter(models.Device.device_id == device_id).first()

def get_all_devices(db: Session) -> List[models.Device]:
    return db.query(models.Device).order_by(models.Device.last_seen.desc()).all()

def update_device(db: Session, device_id: str, device_name: Optional[str] = None, hostname: Optional[str] = None) -> Optional[models.Device]:
    try:
        device = get_device_by_id(db, device_id)
        if not device:
            return None
        
        if device_name is not None:
            device.device_name = device_name
        if hostname is not None:
            device.hostname = hostname

        db.commit()
        db.refresh(device)
        return device
    except Exception:
        db.rollback()
        raise

def set_device_trust(db: Session, device_id: str, is_trusted: bool) -> Optional[models.DeviceTrust]:
    now = datetime.now(timezone.utc)
    try:
        device = get_device_by_id(db, device_id)
        if not device:
            return None
        
        trust = db.query(models.DeviceTrust).filter(models.DeviceTrust.device_id == device_id).first()
        if not trust:
            trust = models.DeviceTrust(
                device_id=device_id,
                is_trusted=is_trusted,
                trusted_at=now if is_trusted else None
            )
            db.add(trust)
        else:
            trust.is_trusted = is_trusted
            trust.trusted_at = now if is_trusted else trust.trusted_at

        db.commit()
        db.refresh(trust)
        return trust
    except Exception:
        db.rollback()
        raise

def get_trusted_devices(db: Session) -> List[models.Device]:
    return (
        db.query(models.Device)
        .join(models.DeviceTrust, models.Device.device_id == models.DeviceTrust.device_id)
        .filter(models.DeviceTrust.is_trusted == True)
        .order_by(models.Device.last_seen.desc())
        .all()
    )

def get_untrusted_devices(db: Session) -> List[models.Device]:
    # Devices with is_trusted == False OR without DeviceTrust row
    all_devs = get_all_devices(db)
    untrusted = []
    for dev in all_devs:
        if not dev.trust_info or not dev.trust_info.is_trusted:
            untrusted.append(dev)
    return untrusted

def process_heartbeat(db: Session, payload: schemas.HeartbeatRequest) -> models.Device:
    now = datetime.now(timezone.utc)
    try:
        normalized_mac = payload.mac.strip().upper()
        # Primary lookup: Match by MAC address first
        device = get_device_by_mac(db, normalized_mac)
        
        # Secondary lookup: Match by device_id if MAC lookup yields nothing
        if not device:
            device = get_device_by_id(db, payload.device_id)

        if not device:
            # Create new device record (MAC does not exist in inventory)
            device = models.Device(
                device_id=payload.device_id,
                ip=payload.ip,
                mac=normalized_mac,
                firmware=payload.firmware,
                status=payload.status,
                first_seen=now,
                last_seen=now
            )
            db.add(device)
            # Create initial default untrusted record
            trust = models.DeviceTrust(
                device_id=payload.device_id,
                is_trusted=False,
                trusted_at=None
            )
            db.add(trust)
        else:
            # Update existing device record — preserve device_id, trust_info, first_seen
            device.ip = payload.ip
            device.mac = normalized_mac
            device.firmware = payload.firmware
            device.status = payload.status
            device.last_seen = now

        # Append new heartbeat history entry using the resolved device.device_id
        heartbeat_entry = models.Heartbeat(
            device_id=device.device_id,
            ip=payload.ip,
            mac=normalized_mac,
            rssi=payload.rssi,
            firmware=payload.firmware,
            status=payload.status,
            timestamp=now
        )
        db.add(heartbeat_entry)
        db.commit()
        db.refresh(device)
        return device
    except Exception:
        db.rollback()
        raise

def get_device_heartbeats(db: Session, device_id: str, limit: int = 20) -> List[models.Heartbeat]:
    return (
        db.query(models.Heartbeat)
        .filter(models.Heartbeat.device_id == device_id)
        .order_by(models.Heartbeat.timestamp.desc())
        .limit(limit)
        .all()
    )

def create_security_alert(db: Session, alert_data: schemas.SecurityAlertCreate) -> models.SecurityAlert:
    try:
        alert_entry = models.SecurityAlert(
            source=alert_data.source,
            alert=alert_data.alert,
            severity=alert_data.severity,
            source_ip=alert_data.source_ip,
            source_port=alert_data.source_port,
            destination_ip=alert_data.destination_ip,
            destination_port=alert_data.destination_port,
            protocol=alert_data.protocol,
            timestamp=alert_data.timestamp
        )
        db.add(alert_entry)
        db.commit()
        db.refresh(alert_entry)
        return alert_entry
    except Exception:
        db.rollback()
        raise

def get_security_alerts(db: Session, severity: Optional[str] = None, source: Optional[str] = None, limit: int = 50) -> List[models.SecurityAlert]:
    query = db.query(models.SecurityAlert)
    if severity:
        query = query.filter(models.SecurityAlert.severity == severity.lower())
    if source:
        query = query.filter(models.SecurityAlert.source == source.lower())
    return query.order_by(models.SecurityAlert.timestamp.desc()).limit(limit).all()

def create_anomaly_event(db: Session, device_id: str, anomaly_score: float, is_anomaly: bool, reason: Optional[str] = None, timestamp: Optional[datetime] = None) -> models.AnomalyEvent:
    now = timestamp or datetime.now(timezone.utc)
    try:
        event = models.AnomalyEvent(
            device_id=device_id,
            anomaly_score=anomaly_score,
            is_anomaly=is_anomaly,
            reason=reason,
            timestamp=now
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception:
        db.rollback()
        raise

def get_anomaly_events(db: Session, device_id: Optional[str] = None, limit: int = 50) -> List[models.AnomalyEvent]:
    query = db.query(models.AnomalyEvent)
    if device_id:
        query = query.filter(models.AnomalyEvent.device_id == device_id)
    return query.order_by(models.AnomalyEvent.timestamp.desc()).limit(limit).all()
