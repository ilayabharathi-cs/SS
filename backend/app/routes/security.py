from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/security", tags=["Security Alerts"])

_last_security_state: str = "NORMAL"
_last_state_change_time: datetime = datetime.now(timezone.utc)

@router.get(
    "/state",
    response_model=schemas.SecurityStateResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Global Physical Security State",
    description="Returns the aggregated physical security state (NORMAL, UNKNOWN_DEVICE, CRITICAL_THREAT) along with active counts."
)
def get_security_state(
    db: Session = Depends(get_db)
) -> schemas.SecurityStateResponse:
    global _last_security_state, _last_state_change_time

    # 1. Untrusted/unknown devices count
    untrusted_devices = [d for d in crud.get_untrusted_devices(db) if d.status.lower() == "online"]
    unknown_count = len(untrusted_devices)

    # 2. Critical threats count (High/Critical Snort alert OR active AI anomaly score > 0.6)
    security_alerts = crud.get_security_alerts(db, limit=20)
    critical_alerts = [a for a in security_alerts if a.severity.lower() in ["high", "critical"]]
    
    anomaly_events = crud.get_anomaly_events(db, limit=20)
    critical_anomalies = [a for a in anomaly_events if a.is_anomaly and a.anomaly_score > 0.6]

    total_critical_threats = len(critical_alerts) + len(critical_anomalies)

    # 3. State decision priority
    if total_critical_threats > 0:
        current_state = "CRITICAL_THREAT"
    elif unknown_count > 0:
        current_state = "UNKNOWN_DEVICE"
    else:
        current_state = "NORMAL"

    if current_state != _last_security_state:
        _last_security_state = current_state
        _last_state_change_time = datetime.now(timezone.utc)

    return schemas.SecurityStateResponse(
        state=current_state,
        unknown_devices=unknown_count,
        critical_alerts=total_critical_threats,
        last_state_change=_last_state_change_time
    )

@router.post(
    "/alerts",
    response_model=schemas.SecurityAlertActionResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit Security Alert",
    description="Accepts Pydantic-validated IDS security alert payload and persists it in PostgreSQL."
)
def submit_security_alert(
    payload: schemas.SecurityAlertCreate,
    db: Session = Depends(get_db)
) -> schemas.SecurityAlertActionResponse:
    alert = crud.create_security_alert(db, payload)
    return schemas.SecurityAlertActionResponse(status="received", id=alert.id)

@router.get(
    "/alerts",
    response_model=List[schemas.SecurityAlertResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Security Alerts",
    description="Retrieves security alerts from PostgreSQL with optional filtering by severity, source, and limit."
)
def get_security_alerts(
    severity: Optional[str] = Query(None, description="Filter by alert severity (low, medium, high, critical)"),
    source: Optional[str] = Query(None, description="Filter by alert source module (e.g. snort)"),
    limit: int = Query(20, ge=1, le=500, description="Maximum number of alert records to return"),
    db: Session = Depends(get_db)
) -> List[schemas.SecurityAlertResponse]:
    return crud.get_security_alerts(db, severity=severity, source=source, limit=limit)
