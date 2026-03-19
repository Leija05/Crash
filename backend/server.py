from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CrashAnalysisRequest(BaseModel):
    g_force: float
    language: str = "es"  # es or en

class CrashAnalysisResponse(BaseModel):
    severity: str
    probable_injuries: List[str]
    first_aid_steps: List[str]


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "C.R.A.S.H. API - Smart Impact Detector"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/analyze-crash", response_model=CrashAnalysisResponse)
async def analyze_crash(request: CrashAnalysisRequest):
    """Analyze crash severity using Gemini AI"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    try:
        # Set up prompts based on language
        if request.language == "es":
            system_prompt = """Eres un asistente médico de emergencias especializado en accidentes de motocicleta. 
            Analiza los datos de telemetría y proporciona un informe conciso.
            IMPORTANTE: Responde SOLO con un JSON válido, sin texto adicional."""
            
            user_query = f"""Se ha detectado un impacto de {request.g_force:.2f}G en un motociclista.
            
            Basándote en esta fuerza de impacto, genera un análisis de emergencia.
            
            Responde ÚNICAMENTE con este formato JSON exacto (sin markdown, sin código):
            {{"severity": "Baja|Media|Alta|Crítica", "probable_injuries": ["lesión1", "lesión2", "lesión3"], "first_aid_steps": ["paso1", "paso2", "paso3"]}}
            
            - severity: Baja (<5G), Media (5-10G), Alta (10-15G), Crítica (>15G)
            - probable_injuries: Lista de 3-5 lesiones probables según la fuerza G
            - first_aid_steps: Lista de 3-5 pasos de primeros auxilios críticos"""
        else:
            system_prompt = """You are an emergency medical assistant specialized in motorcycle accidents.
            Analyze telemetry data and provide a concise report.
            IMPORTANT: Respond ONLY with valid JSON, no additional text."""
            
            user_query = f"""An impact of {request.g_force:.2f}G has been detected on a motorcyclist.
            
            Based on this impact force, generate an emergency analysis.
            
            Respond ONLY with this exact JSON format (no markdown, no code blocks):
            {{"severity": "Low|Medium|High|Critical", "probable_injuries": ["injury1", "injury2", "injury3"], "first_aid_steps": ["step1", "step2", "step3"]}}
            
            - severity: Low (<5G), Medium (5-10G), High (10-15G), Critical (>15G)
            - probable_injuries: List of 3-5 probable injuries based on G-force
            - first_aid_steps: List of 3-5 critical first aid steps"""
        
        # Initialize chat with Gemini
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"crash-analysis-{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Send message
        user_message = UserMessage(text=user_query)
        response_text = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        
        # Clean response - remove markdown code blocks if present
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```"):
            lines = cleaned_response.split("\n")
            cleaned_response = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        cleaned_response = cleaned_response.strip()
        
        try:
            analysis_data = json.loads(cleaned_response)
        except json.JSONDecodeError:
            # Fallback response based on G-force
            if request.g_force < 5:
                severity = "Baja" if request.language == "es" else "Low"
                injuries = ["Contusiones menores", "Abrasiones superficiales"] if request.language == "es" else ["Minor bruises", "Surface abrasions"]
                steps = ["Verificar estado de consciencia", "Evaluar movilidad", "Aplicar hielo en zonas afectadas"] if request.language == "es" else ["Check consciousness", "Evaluate mobility", "Apply ice to affected areas"]
            elif request.g_force < 10:
                severity = "Media" if request.language == "es" else "Medium"
                injuries = ["Posibles fracturas", "Trauma craneal leve", "Lesiones de tejidos blandos"] if request.language == "es" else ["Possible fractures", "Mild head trauma", "Soft tissue injuries"]
                steps = ["No mover a la víctima", "Llamar servicios de emergencia", "Mantener vías respiratorias despejadas"] if request.language == "es" else ["Do not move victim", "Call emergency services", "Keep airways clear"]
            elif request.g_force < 15:
                severity = "Alta" if request.language == "es" else "High"
                injuries = ["Fracturas múltiples", "Trauma craneoencefálico", "Lesiones internas", "Hemorragias"] if request.language == "es" else ["Multiple fractures", "Head trauma", "Internal injuries", "Hemorrhages"]
                steps = ["Llamar 911 inmediatamente", "No mover bajo ninguna circunstancia", "Controlar hemorragias visibles", "Mantener temperatura corporal"] if request.language == "es" else ["Call 911 immediately", "Do not move under any circumstances", "Control visible bleeding", "Maintain body temperature"]
            else:
                severity = "Crítica" if request.language == "es" else "Critical"
                injuries = ["Trauma severo múltiple", "Posible lesión medular", "Daño orgánico interno", "Riesgo de vida"] if request.language == "es" else ["Severe multiple trauma", "Possible spinal injury", "Internal organ damage", "Life-threatening"]
                steps = ["Emergencia máxima - 911", "Inmovilización total", "RCP si no hay pulso", "No retirar casco", "Mantener calma"] if request.language == "es" else ["Maximum emergency - 911", "Total immobilization", "CPR if no pulse", "Do not remove helmet", "Stay calm"]
            
            analysis_data = {
                "severity": severity,
                "probable_injuries": injuries,
                "first_aid_steps": steps
            }
        
        return CrashAnalysisResponse(
            severity=analysis_data.get("severity", "Unknown"),
            probable_injuries=analysis_data.get("probable_injuries", []),
            first_aid_steps=analysis_data.get("first_aid_steps", [])
        )
        
    except Exception as e:
        logging.error(f"Error analyzing crash: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing crash: {str(e)}")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
