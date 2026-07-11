import hashlib
import logging
from datetime import datetime, timezone, timedelta

from app.core.database import get_db

logger = logging.getLogger("crash.analytics")

_MAX_PATH = 300
_MAX_REF = 300
_MAX_UA = 400
_MAX_VISITOR = 100


def _clean(value, limit: int) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip()[:limit]


async def record_page_view(
    path: str,
    visitor_id: str = "",
    referrer: str = "",
    user_agent: str = "",
    ip: str = "",
) -> None:
    """Registra una vista de página. Nunca lanza excepción hacia el request."""
    try:
        path = _clean(path, _MAX_PATH) or "/"
        visitor_id = _clean(visitor_id, _MAX_VISITOR)
        if not visitor_id:
            # Visitante anónimo: huella derivada de IP + user agent (no identifica a la persona).
            visitor_id = hashlib.sha256(f"{ip}|{user_agent}".encode()).hexdigest()[:32]
        db = await get_db()
        now = datetime.now(timezone.utc)
        await db.page_views.insert_one({
            "path": path,
            "visitor_id": visitor_id,
            "referrer": _clean(referrer, _MAX_REF),
            "user_agent": _clean(user_agent, _MAX_UA),
            "created_at": now.isoformat(),
            "day": now.strftime("%Y-%m-%d"),
        })
    except Exception as e:
        logger.warning("No se pudo registrar la vista: %s", e)


async def get_page_analytics(days: int = 30) -> dict:
    """Agrega vistas por día, visitantes únicos, páginas top y orígenes de tráfico."""
    db = await get_db()
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).isoformat()
    today = now.strftime("%Y-%m-%d")
    match = {"created_at": {"$gte": cutoff}}

    # Vistas y visitantes únicos por día.
    by_day_raw = await db.page_views.aggregate([
        {"$match": match},
        {"$group": {
            "_id": "$day",
            "views": {"$sum": 1},
            "visitors": {"$addToSet": "$visitor_id"},
        }},
        {"$project": {"_id": 0, "day": "$_id", "views": 1, "unique": {"$size": "$visitors"}}},
        {"$sort": {"day": 1}},
    ]).to_list(days + 5)

    # Rellena los días sin datos para una serie continua.
    series = []
    by_day_map = {d["day"]: d for d in by_day_raw}
    for i in range(days - 1, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        entry = by_day_map.get(d, {"day": d, "views": 0, "unique": 0})
        series.append({"day": d, "views": entry.get("views", 0), "unique": entry.get("unique", 0)})

    # Páginas más visitadas.
    top_pages = await db.page_views.aggregate([
        {"$match": match},
        {"$group": {"_id": "$path", "views": {"$sum": 1}, "visitors": {"$addToSet": "$visitor_id"}}},
        {"$project": {"_id": 0, "path": "$_id", "views": 1, "unique": {"$size": "$visitors"}}},
        {"$sort": {"views": -1}},
        {"$limit": 10},
    ]).to_list(10)

    # Orígenes del tráfico (referrers).
    referrers_raw = await db.page_views.aggregate([
        {"$match": match},
        {"$group": {"_id": "$referrer", "views": {"$sum": 1}}},
        {"$sort": {"views": -1}},
        {"$limit": 8},
    ]).to_list(8)
    referrers = [
        {"source": (r["_id"] or "Directo"), "views": r["views"]}
        for r in referrers_raw
    ]

    # Totales del periodo.
    total_views = sum(d["views"] for d in series)
    unique_period = await db.page_views.aggregate([
        {"$match": match},
        {"$group": {"_id": None, "visitors": {"$addToSet": "$visitor_id"}}},
        {"$project": {"_id": 0, "count": {"$size": "$visitors"}}},
    ]).to_list(1)
    unique_visitors = unique_period[0]["count"] if unique_period else 0

    today_entry = next((d for d in series if d["day"] == today), {"views": 0, "unique": 0})

    # Promedio diario.
    avg_views = round(total_views / days, 1) if days else 0

    return {
        "period_days": days,
        "total_views": total_views,
        "unique_visitors": unique_visitors,
        "views_today": today_entry.get("views", 0),
        "unique_today": today_entry.get("unique", 0),
        "avg_views_per_day": avg_views,
        "views_by_day": series,
        "top_pages": top_pages,
        "referrers": referrers,
        "timestamp": now.isoformat(),
    }
