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

    system_msg = (
        "Eres un asistente médico de emergencia especializado en accidentes de motocicleta. "
        "Analiza los datos de telemetría del impacto y el perfil médico del usuario. "
        "Responde SIEMPRE en formato JSON válido con las siguientes claves: "
        "severity_assessment (string), possible_injuries (array de strings), "
        "first_aid_steps (array de strings), emergency_recommendations (array de strings), "
        "priority_level (string: bajo/medio/alto/crítico). "
        "No incluyas markdown, solo JSON puro."
    )

    prompt = (
        f"DATOS DEL IMPACTO:\n"
        f"- Fuerza G: {impact.get('g_force', 0):.2f}G\n"
        f"- Severidad: {impact.get('severity_label', 'N/A')}\n"
        f"- Aceleración: X={impact['acceleration']['x']:.2f}, Y={impact['acceleration']['y']:.2f}, Z={impact['acceleration']['z']:.2f}\n"
        f"- Giroscopio: X={impact['gyroscope']['x']:.2f}, Y={impact['gyroscope']['y']:.2f}, Z={impact['gyroscope']['z']:.2f}\n"
        f"- Ubicación: {'Lat ' + str(impact['location']['latitude']) + ', Lon ' + str(impact['location']['longitude']) if impact.get('location') else 'No disponible'}\n\n"
        f"PERFIL MÉDICO DEL USUARIO:\n{profile_info or 'No disponible'}\n\n"
        f"Genera el diagnóstico de emergencia en JSON."
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
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "severity_assessment": f"Impacto de {impact.get('g_force', 0):.1f}G clasificado como {impact.get('severity_label', 'N/A')}",
            "possible_injuries": ["Evaluación no disponible - consulte a un profesional médico"],
            "first_aid_steps": ["Llamar a servicios de emergencia", "No mover al paciente", "Mantener vías aéreas despejadas"],
            "emergency_recommendations": ["Activar servicios de emergencia 911"],
            "priority_level": impact.get("severity", "medio"),
            "raw_response": response,
        }
