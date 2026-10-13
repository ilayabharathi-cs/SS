from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.ai import service
from app import crud, schemas

router = APIRouter(prefix="/ai", tags=["AI Anomaly Detection"])

@router.post(
    "/train",
    response_model=schemas.TrainResponse,
    status_code=status.HTTP_200_OK,
    summary="Train AI Anomaly Detector",
    description="Loads historical heartbeat telemetry from PostgreSQL, extracts features, and fits/saves an IsolationForest model."
)
def train_anomaly_model(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    return service.train_ai_model(db)

@router.post(
    "/analyze/{device_id}",
    response_model=schemas.AnomalyAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Device Telemetry",
    description="Extracts current feature vector for specified device and computes anomaly score via IsolationForest."
)
def analyze_device(
    device_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    return service.analyze_device_telemetry(db, device_id)

@router.get(
    "/anomalies",
    response_model=List[schemas.AnomalyEventResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Anomaly Events",
    description="Retrieves historical anomaly events from PostgreSQL with optional filtering by device_id and limit."
)
def get_anomalies(
    device_id: Optional[str] = Query(None, description="Filter by device identifier"),
    limit: int = Query(20, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
) -> List[schemas.AnomalyEventResponse]:
    return crud.get_anomaly_events(db, device_id=device_id, limit=limit)
