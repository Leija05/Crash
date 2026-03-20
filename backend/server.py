from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List
import uuid
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class CrashAnalysisRequest(BaseModel):
    g_force: float
    language: str = "es"  # es or en

class CrashAnalysisResponse(BaseModel):
    severity: str
    probable_injuries: List[str]
    first_aid_steps: List[str]

class ReportRequest(BaseModel):
    language: str = "es"  # es or en

class ReportResponse(BaseModel):
    content: str
    generated_with_ai: bool


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "C.R.A.S.H. API - Smart Impact Detector", "status": "online"}


@api_router.post("/generate-report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """Generate comprehensive project report with AI enhancement"""
    
    # Static report content (fallback)
    def get_static_report(lang: str) -> str:
        if lang == "es":
            return """# C.R.A.S.H. - REPORTE TÉCNICO COMPLETO
## Colisión: Respuesta y Alerta para Seguridad Humana

---

## 1. RESUMEN EJECUTIVO

C.R.A.S.H. es un sistema de detección inteligente de impactos diseñado para motociclistas, que combina hardware embebido con inteligencia artificial para proporcionar respuesta automática en situaciones de emergencia.

**Objetivo Principal:** Reducir el tiempo de respuesta en accidentes de motocicleta mediante detección automática y análisis predictivo de lesiones.

---

## 2. IDENTIFICACIÓN DEL PROBLEMA

### Contexto
En México, los accidentes de motocicleta presentan un crecimiento crítico. El factor determinante entre la vida y la muerte es el tiempo de respuesta inicial.

### Estadística Clave
La automatización de la alerta puede reducir el tiempo de auxilio en un 40%.

### Ámbito de Impacto

**Social:** Seguridad vial colectiva
- Reducción de fatalidades en accidentes viales
- Protección para usuarios vulnerables de la vía

**Laboral:** Protección delivery 24/7
- Seguridad para repartidores y mensajeros
- Cobertura continua durante jornadas laborales

**Educativo:** IoT y Sistemas Embebidos
- Aplicación práctica de conceptos de ingeniería
- Integración de múltiples disciplinas tecnológicas

---

## 3. HARDWARE Y COMPONENTES (BOM)

### 3.1 Cerebro MCU - Arduino Nano (ATmega328P)
- Controlador de bajo consumo
- Integra lógica de detección
- Gestión de memoria dinámica
- Voltaje de operación: 5V
- Velocidad de reloj: 16 MHz

### 3.2 Sensor MPU-6050
- Acelerómetro de 3 ejes
- Giroscopio de 3 ejes
- Rango de medición: ±16g
- Frecuencia de muestreo: hasta 1kHz
- Detección de impacto en milisegundos

### 3.3 Radio HC-05
- Protocolo: UART Bluetooth
- Frecuencia: 2.4 GHz
- Rango: hasta 10 metros
- Baudrate: 9600 bps
- Enlace estable para señales críticas

### 3.4 Case PETG
- Material: Filamento PETG
- Resistente a tracción y vibraciones
- Soporta temperaturas extremas (-40°C a 85°C)
- Diseño personalizado para componentes

### 3.5 App UI
- Interfaz móvil de respuesta rápida
- Geolocalización GPS
- Contacto de emergencia automático
- Sistema de cancelación de falsas alarmas

### 3.6 Power Unit
- Batería Li-Po recargable
- Protección contra cortocircuitos
- Regulación de voltaje integrada
- Autonomía: 48+ horas en modo standby

---

## 4. ARQUITECTURA DE COMPUTADORAS

### 4.1 Protocolos de Comunicación

#### Bus I2C (Síncrono)
- **Función:** Lectura de registros del sensor MPU
- **Líneas:** SDA (datos) y SCL (reloj)
- **Características:**
  - Comunicación bidireccional
  - Múltiples dispositivos en un bus
  - Manejo de colisiones de bus
  - Velocidad: 100-400 kHz

#### UART Serial (Asíncrono)
- **Función:** Transmisión a módulo Bluetooth
- **Líneas:** TX (transmisión) y RX (recepción)
- **Características:**
  - Comunicación full-duplex
  - Sin señal de reloj
  - Baudrate: 9600 bps
  - Protocolo simple y robusto

### 4.2 Algoritmo de Detección (detection_logic.ino)

**Flujo de Operación:**
1. Inicialización del sensor MPU-6050
2. Calibración de valores base
3. Lectura continua de aceleración (loop)
4. Cálculo de magnitud vectorial de impacto
5. Comparación con umbral de detección (≥5G)
6. Transmisión de alerta vía Bluetooth
7. Envío de telemetría a aplicación móvil

**Fórmula de Detección:**
```
Magnitud_G = √(ax² + ay² + az²) / 16384.0
```

---

## 5. INTEGRACIÓN DE INTELIGENCIA ARTIFICIAL

### 5.1 Gemini AI - Diagnóstico Predictivo

**Modelo:** Google Gemini 2.5 Flash
**Función:** Análisis de gravedad y recomendaciones médicas

**Proceso:**
1. Recepción de telemetría (valor G-force)
2. Análisis contextual del impacto
3. Generación de:
   - Clasificación de gravedad (Baja/Media/Alta/Crítica)
   - Lista de lesiones probables
   - Pasos de primeros auxilios específicos

**Clasificación de Severidad:**
- **Baja:** <5G - Contusiones menores
- **Media:** 5-10G - Posibles fracturas
- **Alta:** 10-15G - Trauma múltiple
- **Crítica:** >15G - Riesgo de vida

### 5.2 Ventajas de la Integración IA

- Diagnóstico inmediato sin conocimiento médico previo
- Guía personalizada según fuerza de impacto
- Información crítica para testigos y paramédicos
- Mejora continua mediante aprendizaje del modelo

---

## 6. CASOS DE USO

### 6.1 Escenario: Delivery Nocturno
**Usuario:** Repartidor de plataforma digital
**Situación:** Colisión durante entrega nocturna
**Respuesta del Sistema:**
1. Detección automática del impacto
2. Envío de ubicación GPS a contactos de emergencia
3. Análisis IA: severidad media, posible fractura
4. Guía de primeros auxilios enviada a testigos cercanos
5. Tiempo de respuesta reducido en 40%

### 6.2 Escenario: Motociclista Recreativo
**Usuario:** Usuario en ruta turística
**Situación:** Impacto moderado en zona rural
**Respuesta del Sistema:**
1. Alerta de emergencia activada
2. Usuario puede cancelar si es falsa alarma
3. Si no hay respuesta en 15s, envío automático de SOS
4. Análisis IA con recomendaciones específicas
5. Geolocalización precisa para servicios de rescate

---

## 7. ESPECIFICACIONES TÉCNICAS

### 7.1 Backend
- **Framework:** FastAPI (Python)
- **API REST:** Endpoints para análisis y reportes
- **Integración IA:** emergentintegrations library
- **Protocolo:** HTTPS con CORS configurado

### 7.2 Frontend
- **Framework:** React 19
- **UI Library:** Tailwind CSS + Radix UI
- **Características:**
  - Interfaz responsiva
  - Soporte bilingüe (ES/EN)
  - Tema claro/oscuro
  - Visualización en tiempo real

### 7.3 Comunicación
- **Hardware → App:** Bluetooth UART
- **App → Backend:** REST API (HTTPS)
- **Backend → IA:** Gemini API

---

## 8. CONCLUSIONES

### Logros Principales
✅ Sistema funcional de detección de impactos
✅ Integración exitosa de IA generativa
✅ Interfaz de usuario intuitiva y responsiva
✅ Arquitectura escalable y modular
✅ Protocolo de comunicación robusto

### Impacto Esperado
- Reducción de tiempo de respuesta en emergencias
- Mejor tasa de supervivencia en accidentes
- Democratización de tecnología de seguridad
- Aplicación educativa en sistemas embebidos

### Trabajo Futuro
1. Integración con servicios médicos de emergencia (911)
2. Almacenamiento de historial de viajes
3. Análisis predictivo de zonas de riesgo
4. Expansión a otros vehículos (bicicletas, scooters)
5. Certificación médica del sistema de diagnóstico

---

## 9. RECONOCIMIENTOS

**Evento:** InnovaTec 2026
**Categoría:** Sistemas Embebidos y Arquitectura de Computadoras
**Institución:** Tecnológico de Monterrey

---

**Generado por:** C.R.A.S.H. Report Generator v1.0
**Fecha:** 2026
**Contacto:** crash-project@innovatec.mx

---

## APÉNDICE: REFERENCIAS TÉCNICAS

### Datasheets Consultados:
- ATmega328P Microcontroller Datasheet
- MPU-6050 Six-Axis (Gyro + Accelerometer) MEMS
- HC-05 Bluetooth Module Specifications
- FastAPI Official Documentation
- Google Gemini AI API Reference

### Estándares Aplicados:
- IEEE 802.15.1 (Bluetooth)
- I2C-bus specification (NXP)
- UART Communication Protocol Standard

**FIN DEL REPORTE**
"""
        else:  # English
            return """# C.R.A.S.H. - COMPLETE TECHNICAL REPORT
## Collision: Response and Alert for Human Safety

---

## 1. EXECUTIVE SUMMARY

C.R.A.S.H. is an intelligent impact detection system designed for motorcyclists, combining embedded hardware with artificial intelligence to provide automatic response in emergency situations.

**Main Objective:** Reduce response time in motorcycle accidents through automatic detection and predictive injury analysis.

---

## 2. PROBLEM IDENTIFICATION

### Context
In Mexico, motorcycle accidents show critical growth. The determining factor between life and death is the initial response time.

### Key Statistic
Alert automation can reduce assistance time by 40%.

### Impact Scope

**Social:** Collective road safety
- Reduction of road accident fatalities
- Protection for vulnerable road users

**Labor:** 24/7 delivery protection
- Safety for delivery and courier workers
- Continuous coverage during work shifts

**Educational:** IoT and Embedded Systems
- Practical application of engineering concepts
- Integration of multiple technological disciplines

---

## 3. HARDWARE AND COMPONENTS (BOM)

### 3.1 MCU Brain - Arduino Nano (ATmega328P)
- Low-power controller
- Integrates detection logic
- Dynamic memory management
- Operating voltage: 5V
- Clock speed: 16 MHz

### 3.2 MPU-6050 Sensor
- 3-axis accelerometer
- 3-axis gyroscope
- Measurement range: ±16g
- Sampling frequency: up to 1kHz
- Millisecond impact detection

### 3.3 HC-05 Radio
- Protocol: UART Bluetooth
- Frequency: 2.4 GHz
- Range: up to 10 meters
- Baudrate: 9600 bps
- Stable link for critical signals

### 3.4 PETG Case
- Material: PETG filament
- Resistant to traction and vibrations
- Supports extreme temperatures (-40°C to 85°C)
- Custom design for components

### 3.5 App UI
- Fast response mobile interface
- GPS geolocation
- Automatic emergency contact
- False alarm cancellation system

### 3.6 Power Unit
- Rechargeable Li-Po battery
- Short-circuit protection
- Integrated voltage regulation
- Autonomy: 48+ hours in standby mode

---

## 4. COMPUTER ARCHITECTURE

### 4.1 Communication Protocols

#### I2C Bus (Synchronous)
- **Function:** MPU sensor register reading
- **Lines:** SDA (data) and SCL (clock)
- **Features:**
  - Bidirectional communication
  - Multiple devices on one bus
  - Bus collision handling
  - Speed: 100-400 kHz

#### UART Serial (Asynchronous)
- **Function:** Transmission to Bluetooth module
- **Lines:** TX (transmit) and RX (receive)
- **Features:**
  - Full-duplex communication
  - No clock signal
  - Baudrate: 9600 bps
  - Simple and robust protocol

### 4.2 Detection Algorithm (detection_logic.ino)

**Operation Flow:**
1. MPU-6050 sensor initialization
2. Base value calibration
3. Continuous acceleration reading (loop)
4. Impact vector magnitude calculation
5. Comparison with detection threshold (≥5G)
6. Alert transmission via Bluetooth
7. Telemetry sent to mobile application

**Detection Formula:**
```
G_Magnitude = √(ax² + ay² + az²) / 16384.0
```

---

## 5. ARTIFICIAL INTELLIGENCE INTEGRATION

### 5.1 Gemini AI - Predictive Diagnosis

**Model:** Google Gemini 2.5 Flash
**Function:** Severity analysis and medical recommendations

**Process:**
1. Telemetry reception (G-force value)
2. Contextual impact analysis
3. Generation of:
   - Severity classification (Low/Medium/High/Critical)
   - List of probable injuries
   - Specific first aid steps

**Severity Classification:**
- **Low:** <5G - Minor bruises
- **Medium:** 5-10G - Possible fractures
- **High:** 10-15G - Multiple trauma
- **Critical:** >15G - Life-threatening

### 5.2 AI Integration Advantages

- Immediate diagnosis without prior medical knowledge
- Personalized guidance based on impact force
- Critical information for witnesses and paramedics
- Continuous improvement through model learning

---

## 6. USE CASES

### 6.1 Scenario: Night Delivery
**User:** Digital platform delivery worker
**Situation:** Collision during night delivery
**System Response:**
1. Automatic impact detection
2. GPS location sent to emergency contacts
3. AI analysis: medium severity, possible fracture
4. First aid guide sent to nearby witnesses
5. Response time reduced by 40%

### 6.2 Scenario: Recreational Motorcyclist
**User:** User on tourist route
**Situation:** Moderate impact in rural area
**System Response:**
1. Emergency alert activated
2. User can cancel if false alarm
3. If no response in 15s, automatic SOS sent
4. AI analysis with specific recommendations
5. Precise geolocation for rescue services

---

## 7. TECHNICAL SPECIFICATIONS

### 7.1 Backend
- **Framework:** FastAPI (Python)
- **REST API:** Endpoints for analysis and reports
- **AI Integration:** emergentintegrations library
- **Protocol:** HTTPS with configured CORS

### 7.2 Frontend
- **Framework:** React 19
- **UI Library:** Tailwind CSS + Radix UI
- **Features:**
  - Responsive interface
  - Bilingual support (ES/EN)
  - Light/dark theme
  - Real-time visualization

### 7.3 Communication
- **Hardware → App:** Bluetooth UART
- **App → Backend:** REST API (HTTPS)
- **Backend → AI:** Gemini API

---

## 8. CONCLUSIONS

### Main Achievements
✅ Functional impact detection system
✅ Successful generative AI integration
✅ Intuitive and responsive user interface
✅ Scalable and modular architecture
✅ Robust communication protocol

### Expected Impact
- Reduced emergency response time
- Better survival rate in accidents
- Democratization of safety technology
- Educational application in embedded systems

### Future Work
1. Integration with emergency medical services (911)
2. Trip history storage
3. Predictive analysis of risk zones
4. Expansion to other vehicles (bicycles, scooters)
5. Medical certification of diagnosis system

---

## 9. ACKNOWLEDGMENTS

**Event:** InnovaTec 2026
**Category:** Embedded Systems and Computer Architecture
**Institution:** Tecnológico de Monterrey

---

**Generated by:** C.R.A.S.H. Report Generator v1.0
**Date:** 2026
**Contact:** crash-project@innovatec.mx

---

## APPENDIX: TECHNICAL REFERENCES

### Consulted Datasheets:
- ATmega328P Microcontroller Datasheet
- MPU-6050 Six-Axis (Gyro + Accelerometer) MEMS
- HC-05 Bluetooth Module Specifications
- FastAPI Official Documentation
- Google Gemini AI API Reference

### Applied Standards:
- IEEE 802.15.1 (Bluetooth)
- I2C-bus specification (NXP)
- UART Communication Protocol Standard

**END OF REPORT**
"""
    
    # Try to generate enhanced report with Gemini AI
    try:
        if EMERGENT_LLM_KEY:
            system_prompt = """Eres un asistente técnico especializado en generar reportes de ingeniería profesionales.
            Genera reportes bien estructurados, detallados y con formato apropiado para documentación técnica.""" if request.language == "es" else """You are a technical assistant specialized in generating professional engineering reports.
            Generate well-structured, detailed reports with appropriate formatting for technical documentation."""
            
            static_content = get_static_report(request.language)
            
            user_query = f"""Basándote en el siguiente reporte técnico, mejora el formato y presenta la información de manera más profesional y detallada. Mantén toda la información técnica pero hazla más legible y bien organizada:

{static_content}

Responde con el reporte mejorado en formato Markdown, mantén los títulos, secciones y toda la información técnica.""" if request.language == "es" else f"""Based on the following technical report, improve the format and present the information in a more professional and detailed way. Keep all technical information but make it more readable and well-organized:

{static_content}

Respond with the improved report in Markdown format, maintain titles, sections and all technical information."""

            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"report-{uuid.uuid4()}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-flash")
            
            user_message = UserMessage(text=user_query)
            enhanced_report = await chat.send_message(user_message)
            
            return ReportResponse(
                content=enhanced_report,
                generated_with_ai=True
            )
    except Exception as e:
        logging.warning(f"AI report generation failed, using fallback: {str(e)}")
    
    # Fallback to static report
    return ReportResponse(
        content=get_static_report(request.language),
        generated_with_ai=False
    )


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
