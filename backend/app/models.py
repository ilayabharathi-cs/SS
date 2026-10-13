from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    device_name = Column(String(128), nullable=True)
    ip = Column(String(45), nullable=False)
    mac = Column(String(32), unique=True, index=True, nullable=False)
    hostname = Column(String(128), nullable=True)
    firmware = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    first_seen = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_discovered = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    heartbeats = relationship("Heartbeat", back_populates="device", cascade="all, delete-orphan")
    anomaly_events = relationship("AnomalyEvent", back_populates="device", cascade="all, delete-orphan")
    trust_info = relationship("DeviceTrust", back_populates="device", uselist=False, cascade="all, delete-orphan")

class DeviceTrust(Base):
    __tablename__ = "device_trusts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), ForeignKey("devices.device_id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    is_trusted = Column(Boolean, default=False, nullable=False)
    trusted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    device = relationship("Device", back_populates="trust_info")

class Heartbeat(Base):
    __tablename__ = "heartbeats"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), ForeignKey("devices.device_id", ondelete="CASCADE"), index=True, nullable=False)
    ip = Column(String(45), nullable=False)
    mac = Column(String(32), index=True, nullable=False)
    rssi = Column(Integer, nullable=False)
    firmware = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)

    device = relationship("Device", back_populates="heartbeats")

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String(32), default="snort", nullable=False)
    alert = Column(String(255), nullable=False)
    severity = Column(String(16), index=True, nullable=False)
    source_ip = Column(String(45), index=True, nullable=False)
    source_port = Column(Integer, nullable=True)
    destination_ip = Column(String(45), nullable=False)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(16), nullable=False)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), ForeignKey("devices.device_id", ondelete="CASCADE"), index=True, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, index=True, nullable=False)
    reason = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    device = relationship("Device", back_populates="anomaly_events")
