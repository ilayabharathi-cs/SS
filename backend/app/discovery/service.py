import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app import models, crud
from app.discovery import scanner

logger = logging.getLogger("smartshield.discovery.service")

STALE_THRESHOLD_SECONDS = 90  # 3 missed 30-second discovery cycles

def reconcile_network_inventory(db: Session, network_range: str = None) -> dict:
    """
    Executes an authorized network discovery scan, reconciles results with PostgreSQL,
    preserves user trust status, registers new UNTRUSTED devices, and flags stale devices.
    """
    now = datetime.now(timezone.utc)
    discovered_list = scanner.scan_network(network_range) if network_range else scanner.scan_network()

    logger.info(f"[DISCOVERY] Starting network scan...")
    logger.info(f"[DISCOVERY] Devices found in scan: {len(discovered_list)}")

    new_count = 0
    updated_count = 0
    stale_count = 0

    # 1. Update/Add discovered devices
    for item in discovered_list:
        ip = item["ip"]
        mac = item["mac"].strip().upper()
        hostname = item["hostname"]

        # Match by MAC address first (PRIMARY IDENTITY)
        existing_device = crud.get_device_by_mac(db, mac)

        if existing_device:
            # Update existing device record (SAME DEVICE)
            existing_device.ip = ip
            existing_device.mac = mac
            if hostname and hostname != "Unknown Host":
                existing_device.hostname = hostname
            existing_device.status = "online"
            existing_device.last_discovered = now
            existing_device.last_seen = now
            updated_count += 1
        else:
            # Generate stable local identifier for newly discovered device based on MAC
            mac_clean = mac.replace(":", "").lower()
            device_id = f"discovered-{mac_clean[-8:]}"

            # Create new device record (defaults to UNTRUSTED / UNKNOWN)
            new_device = models.Device(
                device_id=device_id,
                ip=ip,
                mac=mac,
                hostname=hostname,
                firmware="unknown",
                status="online",
                first_seen=now,
                last_seen=now,
                last_discovered=now
            )
            db.add(new_device)

            # Create initial default untrusted record
            trust_record = models.DeviceTrust(
                device_id=device_id,
                is_trusted=False,
                trusted_at=None
            )
            db.add(trust_record)
            new_count += 1

    db.commit()

    # 2. Check for stale devices (last_discovered > 90s AND last_seen > 90s)
    all_devices = crud.get_all_devices(db)
    stale_cutoff = now - timedelta(seconds=STALE_THRESHOLD_SECONDS)

    for dev in all_devices:
        last_activity = dev.last_discovered or dev.last_seen
        if last_activity and last_activity < stale_cutoff:
            if dev.status.lower() != "offline":
                dev.status = "offline"
                stale_count += 1

    db.commit()

    logger.info(f"[DISCOVERY] Scan completed. Devices found: {len(discovered_list)}, New: {new_count}, Updated: {updated_count}, Stale: {stale_count}")

    return {
        "status": "completed",
        "devices_found": len(discovered_list),
        "new_devices": new_count,
        "updated_devices": updated_count,
        "stale_devices": stale_count
    }
