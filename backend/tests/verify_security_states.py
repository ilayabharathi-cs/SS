#!/usr/bin/env python3
import time
import json
import urllib.request
import urllib.error
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE_URL = "http://localhost:8000/api"

def http_get(endpoint: str) -> tuple[int, dict]:
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"}, method="GET")
    with urllib.request.urlopen(req, timeout=10) as response:
        return response.status, json.loads(response.read().decode("utf-8"))

def http_post(endpoint: str, data: dict) -> tuple[int, dict]:
    url = f"{BASE_URL}{endpoint}"
    req_bytes = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=req_bytes, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as response:
        return response.status, json.loads(response.read().decode("utf-8"))

def clear_db():
    print("[*] Clearing database to baseline...")
    import subprocess
    subprocess.run(["backend/.venv/bin/python3", "backend/clear_db.py"], check=True)

def run_tests():
    print("=" * 70)
    print("  SMARTSHIELD — PHYSICAL SECURITY ALERT STATE INTEGRATION TEST SUITE  ")
    print("=" * 70)

    # Clean DB first
    clear_db()

    # TEST 1 — NORMAL STATE
    print("\n[TEST 1] Testing STATE 1 — NORMAL...")
    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state -> HTTP {status}: {res}")
    assert status == 200, f"Expected 200, got {status}"
    assert res["state"] == "NORMAL", f"Expected NORMAL, got {res['state']}"
    assert res["unknown_devices"] == 0
    assert res["critical_alerts"] == 0
    print("  [SUCCESS] Test 1 Passed: State is NORMAL (Green ON, Yellow OFF, Red OFF, Buzzer OFF)")

    # TEST 2 — UNKNOWN DEVICE STATE
    print("\n[TEST 2] Testing STATE 2 — UNKNOWN / UNTRUSTED DEVICE...")
    # Send heartbeat for unknown device
    hb_payload = {
        "device_id": "test-unknown-dev-01",
        "ip": "192.168.43.201",
        "mac": "AA:BB:CC:DD:EE:01",
        "rssi": -50,
        "firmware": "1.0",
        "status": "online"
    }
    status, _ = http_post("/device/heartbeat", hb_payload)
    assert status == 200
    
    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state -> HTTP {status}: {res}")
    assert res["state"] == "UNKNOWN_DEVICE", f"Expected UNKNOWN_DEVICE, got {res['state']}"
    assert res["unknown_devices"] == 1
    print("  [SUCCESS] Test 2 Passed: State is UNKNOWN_DEVICE (Green OFF, Yellow ON, Red OFF, Buzzer 3s Pulse)")

    # TEST 3 — TRUST DEVICE WORKFLOW
    print("\n[TEST 3] Testing TRUST DEVICE WORKFLOW...")
    status, _ = http_post("/devices/test-unknown-dev-01/trust", {})
    assert status == 200
    
    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state -> HTTP {status}: {res}")
    assert res["state"] == "NORMAL", f"Expected NORMAL, got {res['state']}"
    assert res["unknown_devices"] == 0
    print("  [SUCCESS] Test 3 Passed: State returned to NORMAL after trusting device")

    # TEST 4 — CRITICAL SECURITY EVENT
    print("\n[TEST 4] Testing STATE 3 — CRITICAL SECURITY EVENT...")
    alert_payload = {
        "source": "snort",
        "alert": "CRITICAL TEST ALERT - SYN Flood Attack Detected",
        "severity": "critical",
        "source_ip": "192.168.43.250",
        "destination_ip": "192.168.43.120",
        "protocol": "TCP",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    status, _ = http_post("/security/alerts", alert_payload)
    assert status == 200

    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state -> HTTP {status}: {res}")
    assert res["state"] == "CRITICAL_THREAT", f"Expected CRITICAL_THREAT, got {res['state']}"
    assert res["critical_alerts"] >= 1
    print("  [SUCCESS] Test 4 Passed: State is CRITICAL_THREAT (Green OFF, Yellow OFF, Red ON, Buzzer CONTINUOUS)")

    # TEST 5 — CRITICAL + UNKNOWN (OVERRIDE PRIORITY)
    print("\n[TEST 5] Testing CRITICAL OVERRIDES UNKNOWN DEVICE...")
    # Add another unknown device while critical alert exists
    hb_payload_2 = {
        "device_id": "test-unknown-dev-02",
        "ip": "192.168.43.202",
        "mac": "AA:BB:CC:DD:EE:02",
        "rssi": -60,
        "firmware": "1.0",
        "status": "online"
    }
    http_post("/device/heartbeat", hb_payload_2)

    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state -> HTTP {status}: {res}")
    assert res["state"] == "CRITICAL_THREAT", f"Expected CRITICAL_THREAT override, got {res['state']}"
    assert res["unknown_devices"] == 1
    assert res["critical_alerts"] >= 1
    print("  [SUCCESS] Test 5 Passed: CRITICAL_THREAT state successfully overrides UNKNOWN_DEVICE")

    # TEST 6 — CLEAR CRITICAL (RETURN TO UNKNOWN DEVICE OR NORMAL)
    print("\n[TEST 6] Testing CLEAR CRITICAL THREAT...")
    # Purge security alerts in DB
    from app.database import SessionLocal
    from app.models import SecurityAlert
    db = SessionLocal()
    db.query(SecurityAlert).delete()
    db.commit()
    db.close()

    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state after clearing critical alerts -> HTTP {status}: {res}")
    assert res["state"] == "UNKNOWN_DEVICE", f"Expected fallback to UNKNOWN_DEVICE, got {res['state']}"
    assert res["unknown_devices"] == 1
    assert res["critical_alerts"] == 0
    print("  [SUCCESS] Test 6 Passed: State correctly returned to UNKNOWN_DEVICE when critical threat cleared")

    # Clear remaining unknown device
    http_post("/devices/test-unknown-dev-02/trust", {})
    status, res = http_get("/security/state")
    print(f"  - GET /api/security/state after trusting final device -> HTTP {status}: {res}")
    assert res["state"] == "NORMAL"
    print("  [SUCCESS] Test 6 Passed (Part 2): State returned to NORMAL when all devices trusted")

    print("\n" + "=" * 70)
    print("  ALL 6 SECURITY ALERT STATE INTEGRATION SCENARIOS PASSED PERFECTLY!  ")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
