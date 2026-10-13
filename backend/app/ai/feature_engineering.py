import numpy as np
from typing import List, Dict, Any, Tuple
from app.models import Heartbeat

FEATURE_NAMES = [
    "avg_rssi",
    "std_rssi",
    "min_rssi",
    "max_rssi",
    "avg_interval_sec",
    "std_interval_sec",
    "hb_count",
    "ip_changes"
]

def extract_features_from_heartbeats(heartbeats: List[Heartbeat]) -> List[float]:
    """
    Extracts a 1D numerical feature vector from a list of Heartbeat database objects.
    
    Feature definitions:
    1. avg_rssi: Mean RSSI signal strength (dBm).
    2. std_rssi: Standard deviation of RSSI values.
    3. min_rssi: Minimum RSSI observed.
    4. max_rssi: Maximum RSSI observed.
    5. avg_interval_sec: Mean duration (seconds) between consecutive heartbeats.
    6. std_interval_sec: Standard deviation of heartbeat intervals.
    7. hb_count: Number of heartbeats in the window.
    8. ip_changes: Number of distinct IP address transitions.
    """
    if not heartbeats:
        return [0.0] * len(FEATURE_NAMES)

    rssi_vals = [float(hb.rssi) for hb in heartbeats]
    avg_rssi = float(np.mean(rssi_vals))
    std_rssi = float(np.std(rssi_vals)) if len(rssi_vals) > 1 else 0.0
    min_rssi = float(np.min(rssi_vals))
    max_rssi = float(np.max(rssi_vals))

    # Sort heartbeats chronologically to compute interval statistics
    sorted_hbs = sorted(heartbeats, key=lambda x: x.timestamp)
    intervals = []
    for i in range(1, len(sorted_hbs)):
        delta = (sorted_hbs[i].timestamp - sorted_hbs[i-1].timestamp).total_seconds()
        if delta >= 0:
            intervals.append(delta)

    if intervals:
        avg_interval_sec = float(np.mean(intervals))
        std_interval_sec = float(np.std(intervals)) if len(intervals) > 1 else 0.0
    else:
        avg_interval_sec = 10.0  # Default expected heartbeat interval (10s)
        std_interval_sec = 0.0

    hb_count = float(len(heartbeats))

    # Calculate IP transitions
    distinct_ips = len(set(hb.ip for hb in heartbeats))
    ip_changes = float(max(0, distinct_ips - 1))

    return [
        avg_rssi,
        std_rssi,
        min_rssi,
        max_rssi,
        avg_interval_sec,
        std_interval_sec,
        hb_count,
        ip_changes
    ]

def prepare_device_feature_matrix(heartbeats_by_device: Dict[str, List[Heartbeat]]) -> Tuple[List[str], np.ndarray]:
    """
    Constructs a 2D NumPy feature matrix X from heartbeats grouped by device ID.
    Returns (device_ids, X).
    """
    device_ids = []
    matrix = []

    for dev_id, hbs in heartbeats_by_device.items():
        if len(hbs) >= 1:
            vec = extract_features_from_heartbeats(hbs)
            device_ids.append(dev_id)
            matrix.append(vec)

    if not matrix:
        return [], np.empty((0, len(FEATURE_NAMES)))

    return device_ids, np.array(matrix, dtype=np.float64)
