import asyncio
import json
import logging

import httpx
from app.core.config import settings

logger = logging.getLogger("crash.ai")


async def generate_ai_diagnosis(impact: dict, profile: dict | None) -> dict:
    profile_info = ""
    if profile:
        profile_info = (
            f"Nombre: {profile.get('full_name', 'N/A')}\n"
            f"Tipo de sangre: {profile.get('blood_type', 'N/A')}\n"
            f"Alergias: {', '.join(profile.get('allergies', [])) or 'Ninguna'}\n"
            f"Condiciones médicas: {', '.join(profile.get('medical_conditions', [])) or 'Ninguna'}\n"
            f"Discapacidades: {', '.join(profile.get('disabilities', [])) or 'Ninguna'}\n"
            f"Notas de emergencia: {profile.get('emergency_notes', 'N/A')}"
        )

    severity_label = impact.get("severity_label", "N/A")
    injury_probability = impact.get("injury_probability")
    triage = impact.get("triage_label") or impact.get("triage_level") or "N/A"
    speed = impact.get("speed_kmh")
    speed_text = f"{speed:.0f} km/h" if isinstance(speed, (int, float)) else "No registrada"

    system_msg = (
        "Eres un médico especialista en medicina de emergencias y traumatología avanzada (ATLS/PHTLS), "
        "con amplia experiencia en cinemática de trauma en accidentes de motocicleta. "
        "Tu tarea es generar un INFORME MÉDICO CLÍNICO PRELIMINAR enfocado estrictamente en la salud del paciente, "
        "posibles lesiones anatomopatológicas y recomendaciones médicas vitales, más que en tecnicismos de sensores. "
        "Debes correlacionar la fuerza G, giroscopio y perfil clínico con lesiones reales:\n"
        "- Desaceleración violenta: latigazo cervical (whiplash), contusión miocárdica/pulmonar, traumatismo craneoencefálico (TCE).\n"
        "- Fuerzas rotacionales (giroscopio elevado): cizallamiento axonal difuso, torsión cervical, luxación escapulohumeral.\n"
        "- Fuerzas G >10-15G: riesgo elevado de politrauma, neumotórax, fracturas vertebrales o hemorragia interna.\n\n"
        "Redacta en español formal y médico pero comprensible para familiares y paramédicos. "
        "Responde SIEMPRE en formato JSON válido y sin bloques de código markdown, con estas claves exactas:\n"
        "- severity_assessment (string): Juicio clínico de 1-2 oraciones describiendo el estado de gravedad médica y fisiopatológica.\n"
        "- priority_level (string, uno de: bajo/medio/alto/crítico): Nivel de prioridad de triaje médico.\n"
        "- estimated_injury_probability (string con símbolo %): Probabilidad clínica de lesiones estructurales.\n"
        "- mechanism_of_injury (string): Descripción médica del mecanismo lesional y transferencia de energía cinética.\n"
        "- body_areas_at_risk (array de strings): Regiones anatómicas con mayor vulnerabilidad lesional.\n"
        "- possible_injuries (array de strings): Lista de 3 a 5 lesiones específicas y verosímiles (ej. Traumatismo Craneoencefálico, Esguince Cervical Grado II, Contusión Torácica Anterior).\n"
        "- first_aid_steps (array de strings): Directivas clínicas prioritarias para primeros respondientes.\n"
        "- emergency_recommendations (array de strings): Recomendaciones médicas urgentes (ej. NO retirar el casco para proteger médula espinal, inmovilizar raquis, solicitar unidad de soporte avanzado).\n"
        "- profile_warnings (string): Advertencias sobre alergias, patologías de base o grupo sanguíneo.\n"
        "- when_to_call_emergency (string): Indicación médica concreta de activación inmediata del sistema de ambulancias."
    )

    prompt = (
        f"DATOS DEL IMPACTO:\n"
        f"- Fuerza G registrada: {impact.get('g_force', 0):.2f}G\n"
        f"- Clasificación de severidad: {severity_label}\n"
        f"- Probabilidad de lesión estimada (modelo): {injury_probability if isinstance(injury_probability, (int, float)) else 'N/A'}%\n"
        f"- Nivel de triaje: {triage}\n"
        f"- Velocidad estimada: {speed_text}\n"
        f"- Aceleración (m/s²): X={impact['acceleration']['x']:.2f}, Y={impact['acceleration']['y']:.2f}, Z={impact['acceleration']['z']:.2f}\n"
        f"- Giroscopio (°/s): X={impact['gyroscope']['x']:.2f}, Y={impact['gyroscope']['y']:.2f}, Z={impact['gyroscope']['z']:.2f}\n"
        f"- Ubicación: {'Lat ' + str(impact['location']['latitude']) + ', Lon ' + str(impact['location']['longitude']) if impact.get('location') else 'No disponible'}\n\n"
        f"PERFIL MÉDICO DEL USUARIO:\n{profile_info or 'No disponible'}\n\n"
        f"Genera el informe clínico preliminar en el JSON indicado."
    )

    combined_prompt = f"{system_msg}\n\n{prompt}"
    response = None
    last_error = None

    for provider in ["gemini", "groq", "cohere"]:
        try:
            if provider == "gemini":
                if not settings.GOOGLE_API_KEY:
                    raise RuntimeError("GOOGLE_API_KEY no configurada")
                # Active 2026 models with smart fallback
                candidates = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]
                seen = set()
                model_list = []
                for m in candidates:
                    if m and m not in seen and "1.5" not in m and "2.0" not in m:
                        seen.add(m)
                        model_list.append(m)
                if not model_list:
                    model_list = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]

                gemini_last_err = None
                genai_client = None
                try:
                    from google import genai
                    genai_client = genai.Client(api_key=settings.GOOGLE_API_KEY)
                except Exception as import_err:
                    logger.info(f"google-genai SDK not available ({import_err}), using direct REST API")

                if genai_client:
                    for candidate_model in model_list:
                        try:
                            gemini_resp = await asyncio.wait_for(
                                asyncio.to_thread(
                                    genai_client.models.generate_content,
                                    model=candidate_model,
                                    contents=combined_prompt,
                                ),
                                timeout=10.0,
                            )
                            response = (getattr(gemini_resp, "text", "") or "").strip()
                            if response:
                                break
                        except Exception as g_err:
                            gemini_last_err = g_err
                            logger.warning(f"Gemini SDK candidate {candidate_model} failed: {g_err}")

                if not response:
                    async with httpx.AsyncClient(timeout=10.0) as http_client:
                        for candidate_model in model_list:
                            try:
                                url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate_model}:generateContent?key={settings.GOOGLE_API_KEY}"
                                rest_resp = await http_client.post(
                                    url,
                                    headers={"Content-Type": "application/json", "User-Agent": "CRASH-API/1.0"},
                                    json={"contents": [{"parts": [{"text": combined_prompt}]}]},
                                )
                                rest_resp.raise_for_status()
                                r_data = rest_resp.json()
                                candidates_list = r_data.get("candidates") or []
                                if candidates_list:
                                    parts = ((candidates_list[0].get("content") or {}).get("parts") or [])
                                    if parts:
                                        response = (parts[0].get("text") or "").strip()
                                        if response:
                                            break
                            except Exception as rest_err:
                                gemini_last_err = rest_err
                                logger.warning(f"Gemini REST candidate {candidate_model} failed: {rest_err}")

                if not response and gemini_last_err:
                    raise gemini_last_err

            elif provider == "groq":
                if not settings.GROQ_API_KEY:
                    raise RuntimeError("GROQ_API_KEY no configurada")
                groq_models = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"]
                async with httpx.AsyncClient(timeout=8.0) as http_client:
                    for g_model in groq_models:
                        try:
                            groq_resp = await http_client.post(
                                "https://api.groq.com/openai/v1/chat/completions",
                                headers={
                                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                                    "Content-Type": "application/json",
                                    "User-Agent": "CRASH-API/1.0",
                                },
                                json={
                                    "model": g_model,
                                    "temperature": 0.2,
                                    "messages": [
                                        {"role": "system", "content": system_msg},
                                        {"role": "user", "content": prompt},
                                    ],
                                },
                            )
                            groq_resp.raise_for_status()
                            data = groq_resp.json()
                            response = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
                            if response:
                                break
                        except Exception as groq_err:
                            logger.warning(f"Groq candidate {g_model} failed: {groq_err}")
                            continue

            else:
                if not settings.COHERE_API_KEY:
                    raise RuntimeError("COHERE_API_KEY no configurada")
                cohere_models = ["command-r-08-2024", "command-a-03-2025", "command-r-plus-08-2024"]
                async with httpx.AsyncClient(timeout=8.0) as http_client:
                    for c_model in cohere_models:
                        try:
                            cohere_resp = await http_client.post(
                                "https://api.cohere.com/v2/chat",
                                headers={
                                    "Authorization": f"Bearer {settings.COHERE_API_KEY}",
                                    "Content-Type": "application/json",
                                    "User-Agent": "CRASH-API/1.0",
                                },
                                json={
                                    "model": c_model,
                                    "temperature": 0.2,
                                    "messages": [
                                        {"role": "system", "content": system_msg},
                                        {"role": "user", "content": prompt},
                                    ],
                                },
                            )
                            cohere_resp.raise_for_status()
                            data = cohere_resp.json()
                            message_content = (data.get("message") or {}).get("content") or []
                            response = (message_content[0].get("text", "") if message_content else "").strip()
                            if response:
                                break
                        except Exception as cohere_err:
                            logger.warning(f"Cohere candidate {c_model} failed: {cohere_err}")
                            continue

            if response:
                logger.info(f"AI diagnosis generated with {provider}")
                break
        except Exception as exc:
            last_error = exc
            logger.warning(f"AI provider {provider} failed: {exc}")

    if not response:
        logger.error(f"All AI providers failed. Last error: {last_error}. Using fallback diagnosis.")
        return _generate_fallback_diagnosis(impact)

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        parsed = json.loads(cleaned)

        def _as_list(v):
            if isinstance(v, list):
                return [str(x).strip() for x in v if str(x).strip()]
            if isinstance(v, str) and v.strip():
                return [s.strip() for s in v.replace("•", "\n").split("\n") if s.strip()]
            return []

        def _as_str(v):
            if v is None:
                return ""
            if isinstance(v, str):
                return v.strip()
            if isinstance(v, list):
                return " ".join(str(x) for x in v)
            return str(v)

        # Normaliza claves para que la app móvil siempre reciba el esquema esperado.
        return {
            "severity_assessment": _as_str(parsed.get("severity_assessment")) or f"Impacto de {impact.get('g_force', 0):.1f}G clasificado como {impact.get('severity_label', 'N/A')}.",
            "priority_level": str(_as_str(parsed.get("priority_level")) or impact.get("severity", "medio")).lower(),
            "estimated_injury_probability": _as_str(parsed.get("estimated_injury_probability")) or f"{impact.get('injury_probability', 0)}%",
            "mechanism_of_injury": _as_str(parsed.get("mechanism_of_injury")) or "Mecanismo no determinado.",
            "body_areas_at_risk": _as_list(parsed.get("body_areas_at_risk")) or [],
            "possible_injuries": _as_list(parsed.get("possible_injuries")) or ["Evaluación no disponible - consulte a un profesional médico."],
            "first_aid_steps": _as_list(parsed.get("first_aid_steps")) or [
                "Mantener la calma y evaluar si el rider responde.",
                "No mover al paciente si hay sospecha de lesión cervical.",
                "Llamar a servicios de emergencia (911).",
            ],
            "emergency_recommendations": _as_list(parsed.get("emergency_recommendations")) or ["Activar servicios de emergencia 911."],
            "profile_warnings": _as_str(parsed.get("profile_warnings")) or "Ninguna",
            "when_to_call_emergency": _as_str(parsed.get("when_to_call_emergency")) or "Ante pérdida de conocimiento, sangrado abundante o dolor intenso, llamar al 911.",
        }
    except json.JSONDecodeError:
        logger.warning("AI response JSON decode failed. Using fallback diagnosis.")
        return _generate_fallback_diagnosis(impact)


def _generate_fallback_diagnosis(impact: dict) -> dict:
    """Genera un diagnóstico clínico de emergencia basado en cinemática de trauma."""
    g = impact.get("g_force", 0)
    severity = impact.get("severity_label", "N/A")
    injury_prob = impact.get("injury_probability", 0)

    if g >= 15:
        priority = "crítico"
        assessment = (
            f"Politraumatismo crítico por impacto de energía extrema ({g:.1f}G). "
            f"Riesgo inminente de traumatismo craneoencefálico grave, lesión espinal cervical y hemorragia toracoabdominal."
        )
        injuries = [
            "Traumatismo craneoencefálico severo con pérdida de alerta",
            "Lesión raquimedular / fractura cervical inestable",
            "Contusión pulmonar bilateral y neumotórax traumático",
            "Trauma abdominal cerrado con sospecha de sangrado interno",
            "Fracturas osteoarticulares complejas",
        ]
        recommendations = [
            "¡BAJO NINGUNA CIRCUNSTANCIA RETIRAR EL CASCO! Alto riesgo de sección medular ante posible fractura cervical.",
            "Inmovilizar en bloque (eje cabeza-cuello-tronco) sin permitir flexión, rotación ni extensión.",
            "Despachar unidad médica de soporte vital avanzado (SVA / 911) comunicando cinemática de impacto extrema.",
            "Monitorear permeabilidad de vía aérea y patrón ventilatorio sin manipular columna cervical.",
        ]
        call_emergency = "ACTIVACIÓN INMEDIATA DEL 911. Traslado urgente con código de trauma crítico."
    elif g >= 10:
        priority = "alto"
        assessment = (
            f"Traumatismo cerrado de alta energía por desaceleración violenta ({g:.1f}G). "
            f"Sospecha clínica de traumatismo craneoencefálico moderado, compromiso del raquis cervical y contusión de pared torácica."
        )
        injuries = [
            "Conmoción cerebral / traumatismo craneoencefálico moderado",
            "Esguince cervical severo (síndrome de latigazo o whiplash)",
            "Contusión de reja costal con restricción respiratoria antiálgica",
            "Luxación acromioclavicular o fractura de clavícula",
            "Contusiones y dermoabrasiones profundas",
        ]
        recommendations = [
            "¡NO RETIRAR EL CASCO! Mantener la cabeza alineada manualmente hasta la llegada de paramédicos.",
            "Evaluar escala de Glasgow (respuesta ocular, verbal y motora) sin movilizar al paciente.",
            "Solicitar ambulancia de urgencias informando choque en motocicleta de alta cinemática.",
            "Verificar ausencia de deformidades óseas evidentes y vigilar dificultad respiratoria.",
        ]
        call_emergency = "Llamar al 911 de inmediato. Paciente requiere inmovilización con collarín rígido y tabla espinal."
    elif g >= 5:
        priority = "medio"
        assessment = (
            f"Trauma cerrado de mediana energía cinética ({g:.1f}G). "
            f"Cuadro compatible con esguince cervical agudo, contusión toracoabdominal y lesiones de partes blandas."
        )
        injuries = [
            "Esguince cervical agudo grado I-II por desaceleración",
            "Contusión de hombro / extremidad superior ipsilateral al impacto",
            "Traumatismo muscular en región dorsolumbar",
            "Dermoabrasiones y hematomas múltiples",
        ]
        recommendations = [
            "No retirar el casco bruscamente; mantener al paciente en reposo en el suelo unos minutos.",
            "Evaluar orientación temporoespacial (nombre, fecha, lugar) para descartar conmoción cerebral.",
            "Trasladar a valoración médica traumatológica para estudio radiológico de columna y extremidades.",
            "Acudir a urgencias inmediatamente si aparecen náuseas, vómitos, mareo o visión borrosa.",
        ]
        call_emergency = "Activar servicios de emergencia si hay dolor cervical intenso, hormigueo en extremidades o mareo."
    else:
        priority = "bajo"
        assessment = (
            f"Traumatismo de baja energía ({g:.1f}G). "
            f"Compromiso principalmente osteomuscular superficial sin signos evidentes de descompensación hemodinámica."
        )
        injuries = [
            "Contusión muscular leve",
            "Dermoabrasiones superficiales",
            "Tensión muscular cervical reactiva",
        ]
        recommendations = [
            "Retirar el casco con calma únicamente si no existe dolor ni molestia cervical.",
            "Reposo relativo y aplicación de frío local en zonas contusas.",
            "Monitoreo de síntomas durante las siguientes 24 horas.",
        ]
        call_emergency = "Consultar a un médico si el dolor persiste o se incrementa en las próximas horas."

    return {
        "severity_assessment": assessment,
        "priority_level": priority,
        "estimated_injury_probability": f"{injury_prob}%",
        "mechanism_of_injury": f"Desaceleración brusca de {g:.1f}G; transferencia de energía compatible con traumatismo de {'energía crítica' if g >= 15 else 'alta energía' if g >= 10 else 'mediana energía' if g >= 5 else 'baja energía'}.",
        "body_areas_at_risk": ["Raquis cervical", "Región craneal", "Tórax anterior", "Cintura escapular", "Extremidades"],
        "possible_injuries": injuries,
        "first_aid_steps": [
            "Conservar la calma y evaluar respuesta verbal del paciente.",
            "Evitar cualquier movimiento o flexión de la cabeza y cuello.",
            "Comprobar respiración espontánea y coloración de la piel.",
            "Cubrir al paciente para evitar hipotermia hasta el arribo de paramédicos.",
        ],
        "emergency_recommendations": recommendations,
        "profile_warnings": "Revisar alergias y antecedentes patológicos en el expediente médico del rider.",
        "when_to_call_emergency": call_emergency,
    }
