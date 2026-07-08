from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.core.security import validate_password_strength


class RegisterInput(BaseModel):
    email: str
    password: str
    name: str
    company_id: Optional[str] = ""

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        err = validate_password_strength(v)
        if err:
            raise ValueError(err)
        return v

    @field_validator("name")
    @classmethod
    def non_empty_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre no puede estar vac\u00edo")
        return v.strip()


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

    class Config:
        from_attributes = True