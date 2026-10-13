# SmartShield Backend API

FastAPI backend service for the **SmartShield IoT Security System**. Integrates device telemetry ingestion, PostgreSQL persistence, defensive Snort 3 Intrusion Detection System (IDS) alerts, and AI-based anomaly detection using scikit-learn (`IsolationForest`).

---

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── security/
│   │   └── snort_parser.py
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── feature_engineering.py
│   │   ├── anomaly_detector.py
│   │   └── service.py
│   └── routes/
│       ├── __init__.py
│       ├── device.py
│       ├── security.py
│       └── ai.py
├── requirements.txt
├── .env.example
├── .env
└── README.md
```

---

## AI Anomaly Detection (`scikit-learn` IsolationForest)

### Feature Engineering Pipeline
The AI module extracts 8 numerical features per device from historical telemetry sequences:
1. `avg_rssi`: Mean Wi-Fi signal strength (dBm).
2. `std_rssi`: Standard deviation of RSSI values.
3. `min_rssi`: Minimum RSSI value observed.
4. `max_rssi`: Maximum RSSI value observed.
5. `avg_interval_sec`: Mean duration (seconds) between consecutive heartbeats.
6. `std_interval_sec`: Standard deviation of heartbeat intervals.
7. `hb_count`: Number of heartbeats in window.
8. `ip_changes`: Count of distinct IP transitions.

### Machine Learning Algorithm
- **Algorithm**: `sklearn.ensemble.IsolationForest` (Unsupervised CPU-friendly anomaly detection)
- **Model File**: Saved to `backend/app/ai/model.joblib`
- **Anomaly Score**: Higher values represent higher anomaly severity based on the IsolationForest decision function.

---

## Database Schemas (PostgreSQL)

1. **`devices`**: Device hardware metadata (`device_id`, `ip`, `mac`, `firmware`, `status`, `first_seen`, `last_seen`).
2. **`heartbeats`**: Historical device telemetry (`device_id`, `ip`, `mac`, `rssi`, `firmware`, `status`, `timestamp`).
3. **`security_alerts`**: Snort 3 IDS alerts (`source`, `alert`, `severity`, `source_ip`, `destination_ip`, `protocol`, `timestamp`).
4. **`anomaly_events`**: AI-detected telemetry anomaly events (`device_id`, `anomaly_score`, `is_anomaly`, `reason`, `timestamp`).

---

## API Endpoint Reference

### System & Health
- `GET /api/health` — API health check status.

### Device Telemetry
- `POST /api/device/heartbeat` — Ingests device heartbeat telemetry & triggers non-blocking AI evaluation.
- `GET /api/device/{device_id}` — Retrieves device registry & status metrics.
- `GET /api/devices` — Lists all registered SmartShield devices.
- `GET /api/device/{device_id}/heartbeats` — Retrieves historical device telemetry.

### Security IDS Alerts (Snort)
- `POST /api/security/alerts` — Ingests structured Snort 3 IDS security alerts.
- `GET /api/security/alerts` — Queries security alerts with optional `severity`, `source`, and `limit` filters.

### AI Anomaly Detection
- `POST /api/ai/train` — Trains/retrains the `IsolationForest` model on historical heartbeat data.
- `POST /api/ai/analyze/{device_id}` — Analyzes current telemetry behavior for a specific device.
- `GET /api/ai/anomalies` — Queries stored anomaly events from PostgreSQL (`anomaly_events` table).
