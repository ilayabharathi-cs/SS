from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.ai.service import evaluate_heartbeat_nonblocking
from app import crud, schemas

router = APIRouter(tags=["Device"])

def _format_device_summary(dev) -> schemas.DeviceSummaryItem:
    is_trusted = dev.trust_info.is_trusted if dev.trust_info else False
    trusted_at = dev.trust_info.trusted_at if dev.trust_info else None
    return schemas.DeviceSummaryItem(
        device_id=dev.device_id,
        device_name=dev.device_name,
        ip=dev.ip,
        mac=dev.mac,
        hostname=dev.hostname,
        status=dev.status,
        is_trusted=is_trusted,
        trusted_at=trusted_at,
        last_seen=dev.last_seen,
        last_discovered=dev.last_discovered
    )

@router.post(
    "/device/heartbeat",
    response_model=schemas.HeartbeatResponse,
    status_code=status.HTTP_200_OK,
    summary="Receive Heartbeat Telemetry",
    description="Accepts device telemetry, updates device registry in PostgreSQL, appends heartbeat history row, triggers non-blocking AI anomaly evaluation, and reports active untrusted device alert state."
)
def receive_heartbeat(
    payload: schemas.HeartbeatRequest,
    db: Session = Depends(get_db)
) -> schemas.HeartbeatResponse:
    crud.process_heartbeat(db, payload)
    
    # Non-blocking AI evaluation hook
    evaluate_heartbeat_nonblocking(db, payload.device_id)

    # Check for active untrusted devices in PostgreSQL inventory
    untrusted_devices = [d for d in crud.get_untrusted_devices(db) if d.status.lower() == "online"]
    has_untrusted = len(untrusted_devices) > 0
    untrusted_count = len(untrusted_devices)
    
    # Check for active security attacks / critical alerts & AI anomalies
    security_alerts = crud.get_security_alerts(db, limit=20)
    critical_alerts = [a for a in security_alerts if a.severity.lower() in ["high", "critical"]]
    anomaly_events = crud.get_anomaly_events(db, limit=20)
    active_anomalies = [a for a in anomaly_events if a.is_anomaly and a.anomaly_score > 0.6]

    has_attack = len(critical_alerts) > 0 or len(active_anomalies) > 0
    attack_count = len(critical_alerts) + len(active_anomalies)

    return schemas.HeartbeatResponse(
        status="received",
        device_id=payload.device_id,
        has_untrusted_devices=has_untrusted,
        untrusted_count=untrusted_count,
        has_attack_alert=has_attack,
        attack_count=attack_count
    )

@router.get(
    "/devices",
    response_model=schemas.DeviceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List All Registered Devices",
    description="Returns a list of all registered SmartShield devices from the database."
)
def list_devices(
    db: Session = Depends(get_db)
) -> schemas.DeviceListResponse:
    devices = crud.get_all_devices(db)
    items = [_format_device_summary(d) for d in devices]
    return schemas.DeviceListResponse(devices=items)

@router.get(
    "/devices/trusted",
    response_model=schemas.DeviceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Trusted Devices",
    description="Returns all explicitly approved trusted devices."
)
def list_trusted_devices(
    db: Session = Depends(get_db)
) -> schemas.DeviceListResponse:
    devices = crud.get_trusted_devices(db)
    items = [_format_device_summary(d) for d in devices]
    return schemas.DeviceListResponse(devices=items)

@router.get(
    "/devices/untrusted",
    response_model=schemas.DeviceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Untrusted Devices",
    description="Returns all untrusted/unknown devices."
)
def list_untrusted_devices(
    db: Session = Depends(get_db)
) -> schemas.DeviceListResponse:
    devices = crud.get_untrusted_devices(db)
    items = [_format_device_summary(d) for d in devices]
    return schemas.DeviceListResponse(devices=items)

@router.patch(
    "/devices/{device_id}",
    response_model=schemas.DeviceDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Device Information",
    description="Edits a device's custom friendly name/alias or hostname."
)
def update_device_info(
    device_id: str,
    payload: schemas.DeviceUpdatePayload,
    db: Session = Depends(get_db)
) -> schemas.DeviceDetailResponse:
    device = crud.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    
    updated_device = crud.update_device(
        db,
        device_id=device_id,
        device_name=payload.device_name,
        hostname=payload.hostname
    )

    latest_hb = crud.get_device_heartbeats(db, device_id, limit=1)
    rssi_val = latest_hb[0].rssi if latest_hb else None

    is_trusted = updated_device.trust_info.is_trusted if updated_device.trust_info else False
    trusted_at = updated_device.trust_info.trusted_at if updated_device.trust_info else None

    return schemas.DeviceDetailResponse(
        device_id=updated_device.device_id,
        device_name=updated_device.device_name,
        ip=updated_device.ip,
        mac=updated_device.mac,
        hostname=updated_device.hostname,
        rssi=rssi_val,
        firmware=updated_device.firmware,
        status=updated_device.status,
        is_trusted=is_trusted,
        trusted_at=trusted_at,
        first_seen=updated_device.first_seen,
        last_seen=updated_device.last_seen,
        last_discovered=updated_device.last_discovered
    )

@router.post(
    "/devices/{device_id}/trust",
    response_model=schemas.TrustActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Trust Device",
    description="Marks a device as explicitly trusted in PostgreSQL."
)
def trust_device(
    device_id: str,
    db: Session = Depends(get_db)
) -> schemas.TrustActionResponse:
    device = crud.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    trust = crud.set_device_trust(db, device_id, is_trusted=True)
    return schemas.TrustActionResponse(
        status="updated",
        device_id=device_id,
        is_trusted=True,
        trusted_at=trust.trusted_at if trust else None
    )

@router.post(
    "/devices/{device_id}/untrust",
    response_model=schemas.TrustActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Untrust Device",
    description="Removes trust state from a device in PostgreSQL."
)
def untrust_device(
    device_id: str,
    db: Session = Depends(get_db)
) -> schemas.TrustActionResponse:
    device = crud.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    crud.set_device_trust(db, device_id, is_trusted=False)
    return schemas.TrustActionResponse(
        status="updated",
        device_id=device_id,
        is_trusted=False,
        trusted_at=None
    )

@router.get(
    "/device/{device_id}",
    response_model=schemas.DeviceDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Device Status",
    description="Retrieves status, device_name, hostname, discovery and trust information for a specific device."
)
def get_device_status(
    device_id: str,
    db: Session = Depends(get_db)
) -> schemas.DeviceDetailResponse:
    device = crud.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    
    latest_hb = crud.get_device_heartbeats(db, device_id, limit=1)
    rssi_val = latest_hb[0].rssi if latest_hb else None

    is_trusted = device.trust_info.is_trusted if device.trust_info else False
    trusted_at = device.trust_info.trusted_at if device.trust_info else None

    return schemas.DeviceDetailResponse(
        device_id=device.device_id,
        device_name=device.device_name,
        ip=device.ip,
        mac=device.mac,
        hostname=device.hostname,
        rssi=rssi_val,
        firmware=device.firmware,
        status=device.status,
        is_trusted=is_trusted,
        trusted_at=trusted_at,
        first_seen=device.first_seen,
        last_seen=device.last_seen,
        last_discovered=device.last_discovered
    )

@router.get(
    "/device/{device_id}/heartbeats",
    response_model=List[schemas.HeartbeatHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get Device Heartbeat History",
    description="Returns recent heartbeat history records for a specific device."
)
def get_heartbeat_history(
    device_id: str,
    limit: int = Query(20, ge=1, le=500, description="Maximum number of historical records to return"),
    db: Session = Depends(get_db)
) -> List[schemas.HeartbeatHistoryItem]:
    device = crud.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    return crud.get_device_heartbeats(db, device_id, limit=limit)
