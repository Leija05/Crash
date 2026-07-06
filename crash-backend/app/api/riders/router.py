from fastapi import APIRouter, Depends, HTTPException

from app.api.riders.schemas import ContactInput, ProfileInput, ThresholdInput
from app.api.riders.service import (
    add_contact,
    delete_contact,
    get_contacts,
    get_profile,
    get_settings,
    update_profile,
    update_settings,
)
from app.core.security import get_current_rider

router = APIRouter(prefix="/riders", tags=["riders"])


@router.get("/profile")
async def get_my_profile(user: dict = Depends(get_current_rider)):
    return await get_profile(user["id"])


@router.put("/profile")
async def update_my_profile(body: ProfileInput, user: dict = Depends(get_current_rider)):
    return await update_profile(user["id"], body)


@router.get("/contacts")
async def list_contacts(user: dict = Depends(get_current_rider)):
    return await get_contacts(user["id"])


@router.post("/contacts")
async def create_contact(body: ContactInput, user: dict = Depends(get_current_rider)):
    return await add_contact(user["id"], body)


@router.delete("/contacts/{contact_id}")
async def remove_contact(contact_id: str, user: dict = Depends(get_current_rider)):
    deleted = await delete_contact(user["id"], contact_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    return {"message": "Contacto eliminado"}


@router.get("/settings")
async def get_my_settings(user: dict = Depends(get_current_rider)):
    return await get_settings(user["id"])


@router.put("/settings")
async def update_my_settings(body: ThresholdInput, user: dict = Depends(get_current_rider)):
    return await update_settings(user["id"], body)
