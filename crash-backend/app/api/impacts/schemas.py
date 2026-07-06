from typing import Optional
from pydantic import BaseModel


class ImpactInput(BaseModel):
    acceleration_x: float
    acceleration_y: float
    acceleration_z: float
    gyroscope_x: float
    gyroscope_y: float
    gyroscope_z: float
    g_force: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
