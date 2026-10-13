#!/usr/bin/env python3
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal
from app.models import Device, DeviceTrust, Heartbeat, SecurityAlert, AnomalyEvent

def clear_all_test_data():
    db = SessionLocal()
    try:
        print("[*] Clearing all test data from PostgreSQL tables...")
        # Delete dependent child tables first
        db.query(Heartbeat).delete()
        db.query(AnomalyEvent).delete()
        db.query(DeviceTrust).delete()
        db.query(SecurityAlert).delete()
        # Delete devices table
        db.query(Device).delete()
        
        db.commit()
        print("[+] Successfully deleted all devices, heartbeats, security alerts, and anomaly events!")
    except Exception as e:
        db.rollback()
        print(f"[-] Error clearing test data: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_test_data()
