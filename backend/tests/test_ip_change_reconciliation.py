#!/usr/bin/env python3
import time
import json
import urllib.request
import urllib.error
import sys
import os
from datetime import datetime, timezone

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
    from clear_db import clear_all_test_data
    clear_all_test_data()

def run_ip_change_test():
    print("=" * 80)
    print("  SMARTSHIELD — MANDATORY DEVICE IP CHANGE RECONCILIATION TEST SUITE  ")
    print("=" * 80)

    # 1. Clean DB
    clear_db()

    # 2. Register Initial Device
    mac_addr = "AA:BB:CC:11:22:33"
    initial_ip = "192.168.43.184"
    new_ip = "192.168.43.205"
    device_id = "esp32-smartshield-01"

    print(f"\n[STEP 1] Registering Initial Device...")
    print(f"  - MAC:   {mac_addr}")
    print(f"  - IP:    {initial_ip}")
    
    hb_initial = {
        "device_id": device_id,
        "ip": initial_ip,
        "mac": mac_addr,
        "rssi": -48,
        "firmware": "1.0.0",
        "status": "online"
    }
    status, res = http_post("/device/heartbeat", hb_initial)
    assert status == 200, f"Failed to send initial heartbeat: {status}"

    # Set Trust = TRUE
    print(f"  - Setting Trust = TRUE for '{device_id}'...")
    status, trust_res = http_post(f"/devices/{device_id}/trust", {})
    assert status == 200, f"Failed to trust device: {status}"
    assert trust_res["is_trusted"] == True

    # Inspect DB record BEFORE IP Change
    from app.database import SessionLocal
    from app import models, crud

    db = SessionLocal()
    dev_before = crud.get_device_by_mac(db, mac_addr)
    all_devs_before = crud.get_all_devices(db)
    
    before_state = {
        "device_id": dev_before.device_id,
        "mac": dev_before.mac,
        "ip": dev_before.ip,
        "is_trusted": dev_before.trust_info.is_trusted if dev_before.trust_info else False,
        "first_seen": dev_before.first_seen.isoformat(),
        "last_seen": dev_before.last_seen.isoformat(),
        "status": dev_before.status,
        "db_row_count": len(all_devs_before)
    }
    db.close()

    status, sec_before = http_get("/security/state")
    status, devs_before_api = http_get("/devices")

    print("\n" + "-" * 50)
    print("  BEFORE IP CHANGE — DATABASE & API STATE  ")
    print("-" * 50)
    print(f"  DB Rows Count    : {before_state['db_row_count']}")
    print(f"  Device ID        : {before_state['device_id']}")
    print(f"  MAC Address      : {before_state['mac']}")
    print(f"  IP Address       : {before_state['ip']}")
    print(f"  Is Trusted       : {before_state['is_trusted']}")
    print(f"  First Seen       : {before_state['first_seen']}")
    print(f"  Last Seen        : {before_state['last_seen']}")
    print(f"  Security State   : {sec_before['state']}")
    print(f"  3D Nodes (API)   : {len(devs_before_api['devices'])}")
    print("-" * 50)

    # 3. Simulate Device Reconnect / IP Change to 192.168.43.205
    print(f"\n[STEP 2] Simulating IP Change for MAC '{mac_addr}' -> New IP '{new_ip}'...")
    time.sleep(1.2) # Ensure timestamp advances

    # Send heartbeat with new IP
    hb_new_ip = {
        "device_id": device_id,
        "ip": new_ip,
        "mac": mac_addr,
        "rssi": -45,
        "firmware": "1.0.0",
        "status": "online"
    }
    status, res = http_post("/device/heartbeat", hb_new_ip)
    assert status == 200, f"Failed to send heartbeat with updated IP: {status}"

    # Also test discovery scan reconciliation logic directly
    db = SessionLocal()
    from app.discovery.service import reconcile_network_inventory
    # Inject simulated scanner result
    from unittest.mock import patch
    mock_scan_results = [{"ip": new_ip, "mac": mac_addr, "hostname": "esp32-node.local"}]
    with patch("app.discovery.scanner.scan_network", return_value=mock_scan_results):
        reconcile_network_inventory(db)
    db.close()

    # 4. Inspect DB record AFTER IP Change
    db = SessionLocal()
    dev_after = crud.get_device_by_mac(db, mac_addr)
    all_devs_after = crud.get_all_devices(db)
    hbs_after = crud.get_device_heartbeats(db, device_id, limit=10)
    
    after_state = {
        "device_id": dev_after.device_id,
        "mac": dev_after.mac,
        "ip": dev_after.ip,
        "is_trusted": dev_after.trust_info.is_trusted if dev_after.trust_info else False,
        "first_seen": dev_after.first_seen.isoformat(),
        "last_seen": dev_after.last_seen.isoformat(),
        "status": dev_after.status,
        "db_row_count": len(all_devs_after),
        "heartbeats_count": len(hbs_after)
    }
    db.close()

    status, sec_after = http_get("/security/state")
    status, devs_after_api = http_get("/devices")

    print("\n" + "-" * 50)
    print("  AFTER IP CHANGE — DATABASE & API STATE  ")
    print("-" * 50)
    print(f"  DB Rows Count    : {after_state['db_row_count']}")
    print(f"  Device ID        : {after_state['device_id']}")
    print(f"  MAC Address      : {after_state['mac']}")
    print(f"  IP Address       : {after_state['ip']}")
    print(f"  Is Trusted       : {after_state['is_trusted']}")
    print(f"  First Seen       : {after_state['first_seen']}")
    print(f"  Last Seen        : {after_state['last_seen']}")
    print(f"  Security State   : {sec_after['state']}")
    print(f"  3D Nodes (API)   : {len(devs_after_api['devices'])}")
    print(f"  Heartbeat History: {after_state['heartbeats_count']} entries preserved")
    print("-" * 50)

    # 5. MANDATORY VERIFICATION ASSERTIONS
    print("\n[STEP 3] Running Mandatory Verification Checkpoints...")

    # Checkpoint 1: Same MAC + new IP = same device (Exactly 1 DB row)
    assert after_state["db_row_count"] == 1, f"FAILED: Expected 1 DB row, got {after_state['db_row_count']}"
    print("  [✓] DB devices == 1 row (No duplicate device row created)")

    # Checkpoint 2: Device ID remains unchanged
    assert after_state["device_id"] == before_state["device_id"], f"FAILED: Device ID changed from {before_state['device_id']} to {after_state['device_id']}"
    print(f"  [✓] Device ID remains unchanged ({after_state['device_id']})")

    # Checkpoint 3: MAC remains unchanged
    assert after_state["mac"] == mac_addr, f"FAILED: MAC changed"
    print(f"  [✓] MAC address remains unchanged ({after_state['mac']})")

    # Checkpoint 4: IP updates
    assert after_state["ip"] == new_ip, f"FAILED: IP was not updated to {new_ip}"
    print(f"  [✓] IP updated successfully to {after_state['ip']}")

    # Checkpoint 5: Trust remains unchanged (TRUE)
    assert after_state["is_trusted"] == True, "FAILED: Trust state was reset after IP change!"
    print("  [✓] Trust state remains TRUE (IP change did NOT reset trust)")

    # Checkpoint 6: First seen remains unchanged
    assert after_state["first_seen"] == before_state["first_seen"], f"FAILED: first_seen changed!"
    print(f"  [✓] First Seen remains unchanged ({after_state['first_seen']})")

    # Checkpoint 7: Last seen updates
    assert after_state["last_seen"] > before_state["last_seen"], "FAILED: last_seen was not updated!"
    print(f"  [✓] Last Seen timestamp updated ({after_state['last_seen']})")

    # Checkpoint 8: No false UNKNOWN_DEVICE alert
    assert sec_after["state"] == "NORMAL", f"FAILED: Security state became {sec_after['state']}"
    assert sec_after["unknown_devices"] == 0, f"FAILED: unknown_devices is {sec_after['unknown_devices']}"
    print("  [✓] Global Security State remains NORMAL (No false UNKNOWN_DEVICE alert)")

    # Checkpoint 9: 3D Nodes = 1 (No duplicate 3D node)
    assert len(devs_after_api["devices"]) == 1, f"FAILED: API returned {len(devs_after_api['devices'])} devices"
    assert devs_after_api["devices"][0]["ip"] == new_ip, "FAILED: 3D topology API device item IP not updated"
    print(f"  [✓] 3D Network Topology returned 1 node with updated IP ({new_ip})")

    # Checkpoint 10: PostgreSQL history intact
    assert after_state["heartbeats_count"] >= 2, "FAILED: Heartbeat history was lost!"
    print(f"  [✓] PostgreSQL history remains intact ({after_state['heartbeats_count']} heartbeat logs)")

    print("\n" + "=" * 80)
    print("  ALL MANDATORY CHECKPOINTS PASSED PERFECTLY! IP CHANGE TEST SUCCESSFUL!  ")
    print("=" * 80)

if __name__ == "__main__":
    run_ip_change_test()
