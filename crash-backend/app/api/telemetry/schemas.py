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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_m: Optional[float] = None
    helmet_connected: Optional[bool] = None
    client_event_id: Optional[str] = None


class LocationInput(BaseModel):
    latitude: float
    longitude: float
    gps_accuracy_m: Optional[float] = None
    helmet_connected: Optional[bool] = None
