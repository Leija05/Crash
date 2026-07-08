import re
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent.parent / ".env")

import os


class Settings:
    MONGO_URL: str = os.environ["MONGO_URL"]
    DB_NAME: str = os.environ.get("DB_NAME", "crash_database")

    JWT_SECRET: str = os.environ["JWT_SECRET"]
    JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))
    JWT_ISSUER: str = "crash-api"
    JWT_AUDIENCE: str = "crash-clients"

    GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    COHERE_API_KEY: str = os.environ.get("COHERE_API_KEY", "")

    WHATSAPP_ACCESS_TOKEN: str = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_API_VERSION: str = os.environ.get("WHATSAPP_API_VERSION", "v20.0")
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = os.environ.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "")
    WHATSAPP_APP_SECRET: str = os.environ.get("WHATSAPP_APP_SECRET", "")
    WHATSAPP_COLLISION_TEMPLATE_NAME: str = os.environ.get("WHATSAPP_COLLISION_TEMPLATE_NAME", "")
    WHATSAPP_TEMPLATE_LANGUAGE: str = os.environ.get("WHATSAPP_TEMPLATE_LANGUAGE", "es_MX")
    WHATSAPP_TEMPLATE_FALLBACK_ON_24H: bool = os.environ.get("WHATSAPP_TEMPLATE_FALLBACK_ON_24H", "true").lower() == "true"

    SUPERADMIN_EMAIL: str = os.environ.get("SUPERADMIN_EMAIL", "superadmin@crash.io")
    SUPERADMIN_PASSWORD: str = os.environ.get("SUPERADMIN_PASSWORD", "SuperAdmin2024!")
    ADMIN_EMAIL: str = os.environ.get("ADMIN_EMAIL", "admin@crash.io")
    ADMIN_PASSWORD: str = os.environ.get("ADMIN_PASSWORD", "admin123")
    MONITOR_EMAIL: str = os.environ.get("MONITOR_EMAIL", "monitor@crash.io")
    MONITOR_PASSWORD: str = os.environ.get("MONITOR_PASSWORD", "monitor123")
    MOBILE_ADMIN_EMAIL: str = os.environ.get("MOBILE_ADMIN_EMAIL", "admin@crash.com")
    MOBILE_ADMIN_PASSWORD: str = os.environ.get("MOBILE_ADMIN_PASSWORD", "CrashAdmin2024!")

    DEMO_MODE: bool = os.environ.get("DEMO_MODE", "false").lower() == "true"

    ALLOWED_ORIGINS: list[str] = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

    LOGIN_MAX_ATTEMPTS: int = int(os.environ.get("LOGIN_MAX_ATTEMPTS", "10"))
    LOGIN_LOCKOUT_MINUTES: int = int(os.environ.get("LOGIN_LOCKOUT_MINUTES", "15"))
    PASSWORD_MIN_LENGTH: int = int(os.environ.get("PASSWORD_MIN_LENGTH", "8"))

    SMTP_HOST: str = os.environ.get("SMTP_HOST", "")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER: str = os.environ.get("SMTP_USER", "")
    SMTP_PASSWORD: str = os.environ.get("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.environ.get("SMTP_FROM", "noreply@crash.io")


settings = Settings()
