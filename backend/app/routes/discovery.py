from fastapi import APIRouter, status
from app import schemas
from app.discovery.scheduler import discovery_scheduler

router = APIRouter(tags=["Discovery"])

@router.get(
    "/discovery/status",
    response_model=schemas.DiscoveryStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Discovery Scheduler Status",
    description="Returns status of the 30-second automated network discovery scanner."
)
def get_discovery_status() -> schemas.DiscoveryStatusResponse:
    info = discovery_scheduler.get_status()
    return schemas.DiscoveryStatusResponse(
        running=info["running"],
        is_scanning=info["is_scanning"],
        last_scan=info["last_scan"],
        next_scan=info["next_scan"],
        devices_found=info["devices_found"],
        network=info["network"]
    )

@router.post(
    "/discovery/scan",
    response_model=schemas.ManualScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Manual Network Scan",
    description="Triggers ONE authorized network discovery scan on the lab subnet."
)
def trigger_manual_scan() -> schemas.ManualScanResponse:
    res = discovery_scheduler.execute_scan()
    return schemas.ManualScanResponse(
        status=res.get("status", "completed"),
        devices_found=res.get("devices_found", 0),
        new_devices=res.get("new_devices", 0),
        updated_devices=res.get("updated_devices", 0),
        stale_devices=res.get("stale_devices", 0)
    )
