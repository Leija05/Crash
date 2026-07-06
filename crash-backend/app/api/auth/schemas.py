from typing import Optional

from pydantic import BaseModel, EmailStr


class RegisterInput(BaseModel):
    email: str
    password: str
    name: str


class LoginInput(BaseModel):
    email: str
    password: str


class MonitorLoginInput(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: dict


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
