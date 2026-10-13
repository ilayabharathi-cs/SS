import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.schemas import SecurityAlertCreate

def parse_snort_json_alert(alert_raw: Dict[str, Any]) -> Optional[SecurityAlertCreate]:
    """
    Parses a Snort 3 JSON alert object into a validated SecurityAlertCreate model.
    """
    try:
        msg = alert_raw.get("msg", "Snort Alert")
        src_addr = alert_raw.get("src_addr", "0.0.0.0")
        src_port = alert_raw.get("src_port")
        dst_addr = alert_raw.get("dst_addr", "0.0.0.0")
        dst_port = alert_raw.get("dst_port")
        proto = alert_raw.get("proto", "IP")

        # Parse timestamp or fallback to current UTC time
        ts_str = alert_raw.get("timestamp")
        if ts_str:
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            except ValueError:
                dt = datetime.now(timezone.utc)
        else:
            dt = datetime.now(timezone.utc)

        # Classify severity based on class or sid
        severity = "medium"
        sid = alert_raw.get("sid", 0)
        if sid in [1000001, 1000003]:
            severity = "low"
        elif sid == 1000002:
            severity = "medium"

        return SecurityAlertCreate(
            source="snort",
            alert=msg,
            severity=severity,
            source_ip=src_addr,
            source_port=int(src_port) if src_port is not None else None,
            destination_ip=dst_addr,
            destination_port=int(dst_port) if dst_port is not None else None,
            protocol=proto,
            timestamp=dt
        )
    except Exception as err:
        print(f"[SNORT PARSER ERROR] Failed to parse Snort alert JSON: {err}")
        return None
