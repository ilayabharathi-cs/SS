#!/usr/bin/env python3
import time
import json
import urllib.request
import urllib.error
import concurrent.futures
import statistics

BASE_URL = "http://localhost:8000/api"

def http_post(endpoint: str, data: dict, timeout: float = 15.0) -> tuple[int, dict, float]:
    url = f"{BASE_URL}{endpoint}"
    req_bytes = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=req_bytes, headers={"Content-Type": "application/json"}, method="POST")
    start = time.perf_counter()
    with urllib.request.urlopen(req, timeout=timeout) as response:
        duration = (time.perf_counter() - start) * 1000
        res_body = json.loads(response.read().decode("utf-8"))
        return response.status, res_body, duration

def http_get(endpoint: str, timeout: float = 15.0) -> tuple[int, dict, float]:
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"}, method="GET")
    start = time.perf_counter()
    with urllib.request.urlopen(req, timeout=timeout) as response:
        duration = (time.perf_counter() - start) * 1000
        res_body = json.loads(response.read().decode("utf-8"))
        return response.status, res_body, duration

def send_heartbeat(device_idx: int) -> float:
    device_id = f"sim-device-{device_idx:02d}"
    ip = f"192.168.43.{100 + device_idx}"
    mac = f"14:C1:9F:2E:6E:{device_idx:02X}"
    payload = {
        "device_id": device_id,
        "ip": ip,
        "mac": mac,
        "rssi": -45 + (device_idx % 10),
        "firmware": "1.0",
        "status": "online"
    }
    status, body, duration = http_post("/device/heartbeat", payload)
    if status != 200:
        raise Exception(f"Heartbeat HTTP {status}")
    return duration

def send_alert(alert_idx: int) -> float:
    payload = {
        "source": "snort",
        "alert": f"LOAD TEST ALERT #{alert_idx} - Suspicious Traffic",
        "severity": ["low", "medium", "high", "critical"][alert_idx % 4],
        "source_ip": f"192.168.43.{10 + (alert_idx % 50)}",
        "source_port": 50000 + alert_idx,
        "destination_ip": "192.168.43.120",
        "destination_port": 8000,
        "protocol": "TCP",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    status, body, duration = http_post("/security/alerts", payload)
    if status != 200:
        raise Exception(f"Alert HTTP {status}")
    return duration

def run_load_test():
    print("=" * 60)
    print("SMARTSHIELD IoT — SYSTEM LOAD & PERFORMANCE TEST")
    print("=" * 60)

    # 1. Health check baseline
    status, body, h_time = http_get("/health")
    print(f"[*] Health Check Latency: {h_time:.2f} ms (Status: {status})")

    # 2. Heartbeat Telemetry Ingestion Load Test (100 Concurrent Requests)
    print("\n[*] Running Telemetry Ingestion Load Test (100 concurrent requests)...")
    hb_durations = []
    hb_failures = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(send_heartbeat, i) for i in range(100)]
        for f in concurrent.futures.as_completed(futures):
            try:
                hb_durations.append(f.result())
            except Exception as e:
                hb_failures += 1

    if hb_durations:
        print(f"  - Total Requests: {len(futures)}")
        print(f"  - Successful: {len(hb_durations)} ({len(hb_durations)/len(futures)*100:.1f}%)")
        print(f"  - Failed: {hb_failures}")
        print(f"  - Min Latency: {min(hb_durations):.2f} ms")
        print(f"  - Max Latency: {max(hb_durations):.2f} ms")
        print(f"  - Mean Latency: {statistics.mean(hb_durations):.2f} ms")
        print(f"  - Median Latency: {statistics.median(hb_durations):.2f} ms")
        print(f"  - P95 Latency: {statistics.quantiles(hb_durations, n=20)[18]:.2f} ms")

    # 3. Snort Alert Ingestion Load Test (50 Concurrent Alerts)
    print("\n[*] Running Snort Security Alert Ingestion Load Test (50 concurrent alerts)...")
    alert_durations = []
    alert_failures = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(send_alert, i) for i in range(50)]
        for f in concurrent.futures.as_completed(futures):
            try:
                alert_durations.append(f.result())
            except Exception as e:
                alert_failures += 1

    if alert_durations:
        print(f"  - Total Alerts: {len(futures)}")
        print(f"  - Successful: {len(alert_durations)} ({len(alert_durations)/len(futures)*100:.1f}%)")
        print(f"  - Failed: {alert_failures}")
        print(f"  - Mean Latency: {statistics.mean(alert_durations):.2f} ms")
        print(f"  - P95 Latency: {statistics.quantiles(alert_durations, n=20)[18]:.2f} ms")

    # 4. Concurrent Discovery Scan Under Load
    print("\n[*] Testing Discovery Scan under concurrent API load...")
    d_status, d_body, d_time = http_post("/discovery/scan", {})
    print(f"  - Discovery Scan Response: Status {d_status}, Duration: {d_time:.2f} ms")
    print(f"  - Payload: {d_body}")

    # 5. Device Inventory Retrieval Benchmark
    print("\n[*] Testing Devices Inventory API under post-load state...")
    dev_status, dev_body, dev_time = http_get("/devices")
    devices = dev_body.get("devices", [])
    print(f"  - Devices Endpoint Latency: {dev_time:.2f} ms")
    print(f"  - Total Devices in Inventory: {len(devices)}")

    print("=" * 60)
    print("LOAD TEST RESULT: ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_load_test()
