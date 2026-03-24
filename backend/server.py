from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="C.R.A.S.H. API", description="Collision Response and Safety Hardware")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class EmergencyContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    relationship: str
    is_primary: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str
    is_primary: bool = False

class ImpactEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    g_force: float
    acceleration_x: float
    acceleration_y: float
    acceleration_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float
    severity: str  # low, medium, high, critical
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    was_false_alarm: bool = False
    ai_diagnosis: Optional[str] = None
    first_aid_guide: Optional[str] = None

class ImpactEventCreate(BaseModel):
    g_force: float
    acceleration_x: float
    acceleration_y: float
    acceleration_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DeviceSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_name: str = "CASCO_V2.0"
    impact_threshold: float = 5.0  # G-force threshold
    countdown_seconds: int = 30
    auto_call_enabled: bool = True
    sms_enabled: bool = True
    message_type: str = "sms"  # "sms" or "whatsapp"
    language: str = "es"  # es or en
    theme: str = "dark"  # dark or light
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DeviceSettingsUpdate(BaseModel):
    device_name: Optional[str] = None
    impact_threshold: Optional[float] = None
    countdown_seconds: Optional[int] = None
    auto_call_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    message_type: Optional[str] = None  # "sms" or "whatsapp"
    language: Optional[str] = None
    theme: Optional[str] = None

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    emergency_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileCreate(BaseModel):
    name: str
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    emergency_notes: Optional[str] = None

class AIDiagnosisRequest(BaseModel):
    g_force: float
    acceleration_x: float
    acceleration_y: float
    acceleration_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    language: str = "es"

class AIDiagnosisResponse(BaseModel):
    severity_assessment: str
    probable_injuries: List[str]
    first_aid_steps: List[str]
    warnings: List[str]
    recommendation: str

# ==================== HELPER FUNCTIONS ====================

def classify_severity(g_force: float) -> str:
    """Classify impact severity based on G-force"""
    if g_force < 5:
        return "low"
    elif g_force < 10:
        return "medium"
    elif g_force < 15:
        return "high"
    else:
        return "critical"

async def get_ai_diagnosis(data: AIDiagnosisRequest) -> AIDiagnosisResponse:
    """Get AI diagnosis from Gemini"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"crash-diagnosis-{uuid.uuid4()}",
            system_message="""You are an emergency medical AI assistant for the C.R.A.S.H. system (Collision Response and Safety Hardware). 
You analyze motorcycle accident telemetry data and provide:
1. Severity assessment of the impact
2. Probable injuries based on impact data
3. First aid steps for bystanders
4. Important warnings
5. Final recommendation

Always respond in the requested language. Be concise but thorough. Focus on actionable guidance for people at the accident scene.
IMPORTANT: This is for emergency guidance only, not a medical diagnosis."""
        ).with_model("gemini", "gemini-2.5-flash")
        
        severity = classify_severity(data.g_force)
        lang = "Spanish" if data.language == "es" else "English"
        
        prompt = f"""Analyze this motorcycle accident impact data and provide emergency guidance in {lang}:

IMPACT DATA:
- G-Force: {data.g_force:.2f}G
- Acceleration: X={data.acceleration_x:.2f}, Y={data.acceleration_y:.2f}, Z={data.acceleration_z:.2f}
- Gyroscope: X={data.gyro_x:.2f}, Y={data.gyro_y:.2f}, Z={data.gyro_z:.2f}
- Severity Classification: {severity.upper()}

RIDER MEDICAL INFO:
- Blood Type: {data.blood_type or 'Unknown'}
- Allergies: {data.allergies or 'None reported'}
- Medical Conditions: {data.medical_conditions or 'None reported'}

Provide your analysis in this EXACT JSON format:
{{
    "severity_assessment": "Brief assessment of the impact severity",
    "probable_injuries": ["injury1", "injury2", "injury3"],
    "first_aid_steps": ["step1", "step2", "step3", "step4", "step5"],
    "warnings": ["warning1", "warning2"],
    "recommendation": "Final recommendation for bystanders"
}}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            diagnosis_data = json.loads(json_match.group())
            return AIDiagnosisResponse(**diagnosis_data)
        else:
            raise ValueError("No valid JSON in response")
            
    except Exception as e:
        logging.error(f"AI Diagnosis error: {e}")
        # Fallback response
        severity = classify_severity(data.g_force)
        if data.language == "es":
            return AIDiagnosisResponse(
                severity_assessment=f"Impacto de severidad {severity}. Se detectó una fuerza de {data.g_force:.1f}G.",
                probable_injuries=["Posible trauma craneal", "Posibles lesiones en extremidades", "Posible trauma torácico"],
                first_aid_steps=[
                    "No mover a la víctima a menos que haya peligro inmediato",
                    "Llamar a servicios de emergencia (911)",
                    "Verificar si la víctima respira",
                    "Mantener a la víctima caliente con una manta",
                    "No quitar el casco"
                ],
                warnings=["No mover la columna vertebral", "No dar líquidos si está inconsciente"],
                recommendation="Esperar a los servicios de emergencia. Mantener la calma y hablar con la víctima si está consciente."
            )
        else:
            return AIDiagnosisResponse(
                severity_assessment=f"Impact severity: {severity}. Detected force of {data.g_force:.1f}G.",
                probable_injuries=["Possible head trauma", "Possible limb injuries", "Possible chest trauma"],
                first_aid_steps=[
                    "Do not move the victim unless there is immediate danger",
                    "Call emergency services (911)",
                    "Check if the victim is breathing",
                    "Keep the victim warm with a blanket",
                    "Do not remove the helmet"
                ],
                warnings=["Do not move the spine", "Do not give liquids if unconscious"],
                recommendation="Wait for emergency services. Stay calm and talk to the victim if conscious."
            )

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "C.R.A.S.H. API - Collision Response and Safety Hardware", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Emergency Contacts
@api_router.post("/contacts", response_model=EmergencyContact)
async def create_contact(contact: EmergencyContactCreate):
    contact_obj = EmergencyContact(**contact.dict())
    await db.emergency_contacts.insert_one(contact_obj.dict())
    return contact_obj

@api_router.get("/contacts", response_model=List[EmergencyContact])
async def get_contacts():
    contacts = await db.emergency_contacts.find().to_list(100)
    return [EmergencyContact(**c) for c in contacts]

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await db.emergency_contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}

@api_router.put("/contacts/{contact_id}", response_model=EmergencyContact)
async def update_contact(contact_id: str, contact: EmergencyContactCreate):
    contact_dict = contact.dict()
    contact_dict["id"] = contact_id
    result = await db.emergency_contacts.update_one(
        {"id": contact_id},
        {"$set": contact_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    updated = await db.emergency_contacts.find_one({"id": contact_id})
    return EmergencyContact(**updated)

# Impact Events
@api_router.post("/impacts", response_model=ImpactEvent)
async def create_impact(impact: ImpactEventCreate):
    severity = classify_severity(impact.g_force)
    impact_obj = ImpactEvent(
        **impact.dict(),
        severity=severity
    )
    await db.impact_events.insert_one(impact_obj.dict())
    return impact_obj

@api_router.get("/impacts", response_model=List[ImpactEvent])
async def get_impacts(limit: int = 50):
    impacts = await db.impact_events.find().sort("timestamp", -1).to_list(limit)
    return [ImpactEvent(**i) for i in impacts]

@api_router.get("/impacts/{impact_id}", response_model=ImpactEvent)
async def get_impact(impact_id: str):
    impact = await db.impact_events.find_one({"id": impact_id})
    if not impact:
        raise HTTPException(status_code=404, detail="Impact not found")
    return ImpactEvent(**impact)

@api_router.put("/impacts/{impact_id}/false-alarm")
async def mark_false_alarm(impact_id: str):
    result = await db.impact_events.update_one(
        {"id": impact_id},
        {"$set": {"was_false_alarm": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Impact not found")
    return {"message": "Marked as false alarm"}

# Device Settings
@api_router.get("/settings", response_model=DeviceSettings)
async def get_settings():
    settings = await db.device_settings.find_one({})
    if not settings:
        default_settings = DeviceSettings()
        await db.device_settings.insert_one(default_settings.dict())
        return default_settings
    return DeviceSettings(**settings)

@api_router.put("/settings", response_model=DeviceSettings)
async def update_settings(settings: DeviceSettingsUpdate):
    update_data = {k: v for k, v in settings.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    existing = await db.device_settings.find_one({})
    if existing:
        await db.device_settings.update_one({}, {"$set": update_data})
    else:
        new_settings = DeviceSettings(**update_data)
        await db.device_settings.insert_one(new_settings.dict())
    
    updated = await db.device_settings.find_one({})
    return DeviceSettings(**updated)

# User Profile
@api_router.get("/profile", response_model=Optional[UserProfile])
async def get_profile():
    profile = await db.user_profile.find_one({})
    if not profile:
        return None
    return UserProfile(**profile)

@api_router.post("/profile", response_model=UserProfile)
async def create_or_update_profile(profile: UserProfileCreate):
    existing = await db.user_profile.find_one({})
    if existing:
        await db.user_profile.update_one({}, {"$set": profile.dict()})
        updated = await db.user_profile.find_one({})
        return UserProfile(**updated)
    else:
        profile_obj = UserProfile(**profile.dict())
        await db.user_profile.insert_one(profile_obj.dict())
        return profile_obj

# AI Diagnosis
@api_router.post("/diagnosis", response_model=AIDiagnosisResponse)
async def get_diagnosis(request: AIDiagnosisRequest):
    return await get_ai_diagnosis(request)

# Statistics
@api_router.get("/stats")
async def get_stats():
    total_impacts = await db.impact_events.count_documents({})
    false_alarms = await db.impact_events.count_documents({"was_false_alarm": True})
    
    severity_counts = {
        "low": await db.impact_events.count_documents({"severity": "low", "was_false_alarm": False}),
        "medium": await db.impact_events.count_documents({"severity": "medium", "was_false_alarm": False}),
        "high": await db.impact_events.count_documents({"severity": "high", "was_false_alarm": False}),
        "critical": await db.impact_events.count_documents({"severity": "critical", "was_false_alarm": False})
    }
    
    return {
        "total_impacts": total_impacts,
        "false_alarms": false_alarms,
        "real_impacts": total_impacts - false_alarms,
        "severity_breakdown": severity_counts
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
