from typing import Optional
from pydantic import BaseModel


class IncidentLogPayload(BaseModel):
    note: str
