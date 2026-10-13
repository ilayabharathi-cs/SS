from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app.schemas import HealthCheckResponse
from app.routes.device import router as device_router
from app.routes.security import router as security_router
from app.routes.ai import router as ai_router
from app.routes.discovery import router as discovery_router
from app.discovery.scheduler import discovery_scheduler

# Initialize database tables on application startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartShield IoT API",
    description="Backend API for SmartShield IoT Security System monitoring, telemetry, IDS alerts, AI anomaly detection, and automated 30-second network discovery.",
    version="1.0"
)

# Startup & Shutdown lifecycle hooks for discovery scheduler
@app.on_event("startup")
def startup_event():
    discovery_scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    discovery_scheduler.stop()

# CORS configuration for development frontend access
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(
    "/api/health",
    response_model=HealthCheckResponse,
    tags=["System"],
    summary="API Health Check",
    description="Verifies that the SmartShield API backend service is operational."
)
def health_check() -> HealthCheckResponse:
    return HealthCheckResponse(status="ok", service="SmartShield API", version="1.0")

# Mount API routers under /api
app.include_router(device_router, prefix="/api")
app.include_router(security_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(discovery_router, prefix="/api")
