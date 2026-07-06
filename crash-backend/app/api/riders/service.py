import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.infrastructure.whatsapp_client import validate_whatsapp_contact


async def get_profile(user_id: str) -> dict:
    db = await get_db()
    profile = await db.user_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        profile = {
            "user_id": user_id, "full_name": "", "blood_type": "",
            "allergies": [], "medical_conditions": [],
            "disabilities": [], "emergency_notes": "",
        }
    return profile


async def update_profile(user_id: str, body) -> dict:
    db = await get_db()
    update_data = body.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.user_profiles.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True,
    )
    profile = await db.user_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return profile


async def get_contacts(user_id: str) -> list:
    db = await get_db()
    contacts = await db.emergency_contacts.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(100)
    return contacts


async def add_contact(user_id: str, body) -> dict:
    db = await get_db()
    whatsapp_validation = await validate_whatsapp_contact(body.phone.strip())
    contact_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": body.name.strip(),
        "phone": body.phone.strip(),
        "relationship": body.relationship.strip() if body.relationship else "",
        "verified": True,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "whatsapp_validation": whatsapp_validation,
    }
    await db.emergency_contacts.insert_one(contact_doc)
    contact_doc.pop("_id", None)
    return contact_doc


async def delete_contact(user_id: str, contact_id: str) -> bool:
    db = await get_db()
    result = await db.emergency_contacts.delete_one({"id": contact_id, "user_id": user_id})
    return result.deleted_count > 0


async def get_settings(user_id: str) -> dict:
    db = await get_db()
    settings = await db.user_settings.find_one({"user_id": user_id}, {"_id": 0})
    if not settings:
        settings = {
            "user_id": user_id, "alert_threshold": 5.0,
            "auto_call": True, "auto_whatsapp": True,
            "location_tracking_enabled": True,
        }
    return settings


async def update_settings(user_id: str, body) -> dict:
    db = await get_db()
    update_data = body.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.user_settings.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True,
    )
    settings = await db.user_settings.find_one({"user_id": user_id}, {"_id": 0})
    return settings
