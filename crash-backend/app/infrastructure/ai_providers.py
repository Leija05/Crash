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
        "Eres un médico de urgencias especializado en traumatología de accidentes de motocicleta. "
        "Redactas un INFORME CLÍNICO PRELIMINAR y realista para los paramédicos y el propio rider, "
        "basado en la telemetría del impacto y el perfil médico. "
        "Sé preciso, profesional y práctico; no inventes datos que no se derivan de la telemetría. "
        "Responde SIEMPRE en español, en formato JSON válido y sin markdown, con estas claves exactas:\n"
        "- severity_assessment (string): 1-2 frases explicando la gravedad estimada y el porqué.\n"
        "- priority_level (string, uno de: bajo/medio/alto/crítico): nivel de prioridad de atención.\n"
        "- estimated_injury_probability (string con símbolo %): probabilidad estimada de lesión.\n"
        "- mechanism_of_injury (string): mecanismo probable del traumatismo según la fuerza G y la aceleración.\n"
        "- body_areas_at_risk (array de strings): regiones anatómicas más expuestas.\n"
        "- possible_injuries (array de strings): lesiones específicas y plausibles para ese nivel de energía.\n"
        "- first_aid_steps (array de strings): pasos de primeros auxilios priorizados y accionables.\n"
        "- emergency_recommendations (array de strings): recomendaciones claras para emergencias (cuándo llamar, qué indicar).\n"
        "- profile_warnings (string): advertencias personalizadas según alergias, condiciones o tipo de sangre del perfil; usa 'Ninguna' si no aplica.\n"
        "- when_to_call_emergency (string): criterio concreto para activar servicios de emergencia (911)."
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
                from google import genai
                client = genai.Client(api_key=settings.GOOGLE_API_KEY)
                gemini_resp = await asyncio.to_thread(
                    client.models.generate_content,
                    model=settings.GEMINI_MODEL,
                    contents=combined_prompt,
                )
                response = (getattr(gemini_resp, "text", "") or "").strip()

            elif provider == "groq":
                if not settings.GROQ_API_KEY:
                    raise RuntimeError("GROQ_API_KEY no configurada")
                async with httpx.AsyncClient(timeout=30.0) as http_client:
                    groq_resp = await http_client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "llama-3.1-8b-instant",
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

            else:
                if not settings.COHERE_API_KEY:
                    raise RuntimeError("COHERE_API_KEY no configurada")
                async with httpx.AsyncClient(timeout=30.0) as http_client:
                    cohere_resp = await http_client.post(
                        "https://api.cohere.com/v2/chat",
                        headers={
                            "Authorization": f"Bearer {settings.COHERE_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "command-r-plus",
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
                logger.info(f"AI diagnosis generated with {provider}")
                break
        except Exception as exc:
            last_error = exc
            logger.warning(f"AI provider {provider} failed: {exc}")

    if not response:
        raise RuntimeError(f"All AI providers failed. Last error: {last_error}")

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
        g = impact.get("g_force", 0)
        return {
            "severity_assessment": f"Impacto de {g:.1f}G clasificado como {impact.get('severity_label', 'N/A')}. Evalúe al paciente en sitio y vigile signos de trauma.",
            "priority_level": impact.get("severity", "medio"),
            "estimated_injury_probability": f"{impact.get('injury_probability', 0)}%",
            "mechanism_of_injury": f"Deceleración brusca de ~{g:.1f}G; energía transferida compatible con traumatismo por impacto.",
            "body_areas_at_risk": ["Cabeza y cuello", "Columna", "Tórax", "Extremidades"],
            "possible_injuries": ["Traumatismo craneoencefálico", "Lesión cervical", "Contusiones y fracturas"],
            "first_aid_steps": [
                "Mantener la calma y verificar si el rider responde.",
                "No mover al paciente si hay sospecha de lesión cervical.",
                "Llamar a servicios de emergencia (911) y compartir ubicación.",
            ],
            "emergency_recommendations": ["Activar servicios de emergencia 911.", "No retirar el casco sin inmovilizar la columna."],
            "profile_warnings": "Ninguna",
            "when_to_call_emergency": "Ante pérdida de conocimiento, sangrado abundante o dolor intenso, llamar al 911 de inmediato.",
        }
