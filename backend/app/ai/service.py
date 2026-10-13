from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.ai.feature_engineering import extract_features_from_heartbeats, prepare_device_feature_matrix
from app.ai.anomaly_detector import detector_instance
from app import crud, models

def train_ai_model(db: Session) -> Dict[str, Any]:
    """
    Loads all historical heartbeats from database, constructs feature samples,
    and trains/retrains the IsolationForest model.
    """
    heartbeats = db.query(models.Heartbeat).order_by(models.Heartbeat.timestamp.asc()).all()
    if not heartbeats:
        return {"status": "error", "message": "No historical heartbeats available in database for training.", "samples": 0}

    # Group heartbeats by device_id
    heartbeats_by_device: Dict[str, list] = {}
    for hb in heartbeats:
        heartbeats_by_device.setdefault(hb.device_id, []).append(hb)

    device_ids, X = prepare_device_feature_matrix(heartbeats_by_device)

    # Also build sub-window samples if historical dataset has multiple records
    all_samples = []
    for dev_id, hbs in heartbeats_by_device.items():
        # Sliding window of 5 heartbeats
        window_size = 5
        for i in range(0, max(1, len(hbs) - window_size + 1)):
            sub_window = hbs[i:i + window_size]
            all_samples.append(extract_features_from_heartbeats(sub_window))

    import numpy as np
    X_full = np.array(all_samples, dtype=np.float64)

    samples_fitted = detector_instance.fit(X_full)
    return {
        "status": "trained",
        "samples": int(samples_fitted),
        "model": "isolation_forest"
    }

def analyze_device_telemetry(db: Session, device_id: str) -> Dict[str, Any]:
    """
    Analyzes current telemetry features for device_id using trained IsolationForest model.
    """
    now = datetime.now(timezone.utc)
    if not detector_instance.is_trained:
        return {
            "device_id": device_id,
            "anomaly_score": 0.0,
            "is_anomaly": False,
            "reason": "Model is not trained yet. Call /api/ai/train first.",
            "status": "model_not_trained",
            "timestamp": now
        }

    # Fetch recent heartbeats for this device
    recent_hbs = crud.get_device_heartbeats(db, device_id, limit=20)
    if not recent_hbs:
        return {
            "device_id": device_id,
            "anomaly_score": 0.0,
            "is_anomaly": False,
            "reason": "No recent heartbeat telemetry available for device.",
            "status": "no_data",
            "timestamp": now
        }

    feature_vec = extract_features_from_heartbeats(recent_hbs)
    score, is_anomaly = detector_instance.predict_one(feature_vec)

    reason = "Normal telemetry behavior."
    if is_anomaly:
        reason = f"Anomalous telemetry detected (score: {score:.4f})."
        # Persist anomaly event in PostgreSQL
        crud.create_anomaly_event(
            db=db,
            device_id=device_id,
            anomaly_score=score,
            is_anomaly=is_anomaly,
            reason=reason,
            timestamp=now
        )

    return {
        "device_id": device_id,
        "anomaly_score": score,
        "is_anomaly": is_anomaly,
        "reason": reason,
        "status": "analyzed",
        "timestamp": now
    }

def evaluate_heartbeat_nonblocking(db: Session, device_id: str) -> None:
    """
    Safe, non-blocking AI evaluation call invoked after heartbeat storage.
    Errors or untrained model states are caught silently.
    """
    try:
        if detector_instance.is_trained:
            analyze_device_telemetry(db, device_id)
    except Exception as err:
        print(f"[AI EVALUATION WARNING] Non-blocking AI evaluation failed for {device_id}: {err}")
