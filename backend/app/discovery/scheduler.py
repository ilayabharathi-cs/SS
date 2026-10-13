import threading
import time
import logging
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.discovery import service, scanner

logger = logging.getLogger("smartshield.discovery.scheduler")

DISCOVERY_INTERVAL = 30  # seconds

class DiscoveryScheduler:
    def __init__(self):
        self._running = False
        self._is_scanning = False
        self._thread = None
        self._lock = threading.Lock()
        self._last_scan: datetime = None
        self._devices_found: int = 0

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True, name="DiscoveryScheduler")
        self._thread.start()
        logger.info("[DISCOVERY SCHEDULER] Started 30-second background discovery scheduler.")

    def stop(self):
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3.0)
        logger.info("[DISCOVERY SCHEDULER] Stopped discovery scheduler.")

    def _loop(self):
        while self._running:
            self.execute_scan()
            for _ in range(DISCOVERY_INTERVAL):
                if not self._running:
                    break
                time.sleep(1)

    def execute_scan(self) -> dict:
        if not self._lock.acquire(blocking=False):
            logger.warning("[DISCOVERY SCHEDULER] Scan already in progress. Skipping cycle to prevent overlap.")
            return {
                "status": "skipped",
                "message": "Scan already in progress",
                "devices_found": self._devices_found
            }

        self._is_scanning = True
        db = SessionLocal()
        try:
            res = service.reconcile_network_inventory(db)
            self._last_scan = datetime.now(timezone.utc)
            self._devices_found = res["devices_found"]
            return res
        except Exception as e:
            logger.error(f"[DISCOVERY SCHEDULER] Error during scan execution: {e}")
            return {
                "status": "error",
                "message": str(e),
                "devices_found": self._devices_found
            }
        finally:
            db.close()
            self._is_scanning = False
            self._lock.release()

    def get_status(self) -> dict:
        now = datetime.now(timezone.utc)
        next_scan = (self._last_scan + timedelta(seconds=DISCOVERY_INTERVAL)) if self._last_scan else None
        active_net = scanner.detect_active_subnet()
        return {
            "running": self._running,
            "is_scanning": self._is_scanning,
            "last_scan": self._last_scan,
            "next_scan": next_scan,
            "devices_found": self._devices_found,
            "network": active_net
        }

# Global Singleton Instance
discovery_scheduler = DiscoveryScheduler()
