from typing import Optional
from pydantic import BaseModel


class TelemetryInput(BaseModel):
    acceleration_x: float
    acceleration_y: float
    acceleration_z: float
    gyroscope_x: float
    gyroscope_y: float
    gyroscope_z: float
    g_force: float
    speed_kmh: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_m: Optional[float] = None
    helmet_connected: Optional[bool] = None
    client_event_id: Optional[str] = None
    occurred_at: Optional[str] = None


class LocationInput(BaseModel):
    latitude: float
    longitude: float
    gps_accuracy_m: Optional[float] = None
    helmet_connected: Optional[bool] = None


class BatchTelemetryInput(BaseModel):
    """Ráfaga de telemetría de la Caja Negra del Casco (buffer local recuperado)."""
    samples: list[TelemetryInput]
