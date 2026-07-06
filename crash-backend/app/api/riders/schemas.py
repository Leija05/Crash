from typing import Optional, List
from pydantic import BaseModel


class ProfileInput(BaseModel):
    full_name: Optional[str] = ""
    blood_type: Optional[str] = ""
    allergies: Optional[List[str]] = []
    medical_conditions: Optional[List[str]] = []
    disabilities: Optional[List[str]] = []
    emergency_notes: Optional[str] = ""


class ContactInput(BaseModel):
    name: str
    phone: str
    relationship: Optional[str] = ""


class ThresholdInput(BaseModel):
    alert_threshold: float = 5.0
    auto_call: Optional[bool] = True
    auto_whatsapp: Optional[bool] = True
    location_tracking_enabled: Optional[bool] = True
