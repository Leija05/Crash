from math import ceil

# Parámetros del modelo de negocio C.R.A.S.H. (todos en MXN).
# Fuente: modelo de negocios del proyecto (certamen InnovaTecNM 2026).
SALES_DEFAULTS = {
    "b2b_price_per_driver": 150,   # Suscripción SaaS por repartidor/mes (empresas)
    "b2c_subscription": 49,        # Suscripción app por usuario/mes (público general)
    "device_cost": 800,            # Costo de producción del hardware por unidad
    "device_price_b2c": 1499,      # Venta dispositivo B2C (margen 46%)
    "device_price_b2b": 1999,      # Venta dispositivo B2B (incluye instalación y soporte)
    "fixed_monthly": 1300,         # Gastos operativos fijos (servidor + servicios)
    "target_margin": 0.35,         # Margen de utilidad objetivo sobre ingreso recurrente
}


def _resolve(params: dict) -> dict:
    d = dict(SALES_DEFAULTS)
    for k in SALES_DEFAULTS:
        if params.get(k) is not None:
            try:
                d[k] = float(params[k])
            except (TypeError, ValueError):
                pass
    d["target_margin"] = max(0.0, min(0.95, d["target_margin"]))
    return d


def analyze_scenario(drivers: int, d: dict) -> dict:
    p = d["b2b_price_per_driver"]
    fixed = d["fixed_monthly"]
    device_cost = d["device_cost"]
    revenue = p * drivers
    profit = revenue - fixed
    margin = (profit / revenue) if revenue > 0 else 0.0
    device_investment = device_cost * drivers
    roi_months = (device_investment / profit) if profit > 0 else None
    meets_target = margin >= d["target_margin"]
    return {
        "drivers": drivers,
        "monthly_revenue": round(revenue, 2),
        "monthly_profit": round(profit, 2),
        "margin_pct": round(margin * 100, 1),
        "device_investment": round(device_investment, 2),
        "roi_months": round(roi_months, 1) if roi_months else None,
        "meets_target_margin": meets_target,
    }


async def compute_logistics(params: dict) -> dict:
    d = _resolve(params)
    p = d["b2b_price_per_driver"]
    fixed = d["fixed_monthly"]
    device_cost = d["device_cost"]

    # Punto de equilibrio recurrente: conductores para cubrir gastos fijos mensuales.
    breakeven_drivers = ceil(fixed / p) if p > 0 else 0
    # Conductores mínimos para alcanzar el margen objetivo sobre el ingreso.
    denom = p * (1 - d["target_margin"])
    min_drivers_for_margin = ceil(fixed / denom) if denom > 0 else 0

    drivers = params.get("drivers")
    try:
        drivers = int(drivers) if drivers is not None else None
    except (TypeError, ValueError):
        drivers = None

    scenario = analyze_scenario(drivers, d) if drivers and drivers > 0 else None

    # Escenarios de referencia para la tabla.
    sample_points = sorted(set([breakeven_drivers, 10, 25, 50, 100, 250, 500]))
    scenarios = [analyze_scenario(n, d) for n in sample_points if n > 0]

    b2c = {
        "subscription": d["b2c_subscription"],
        "device_price": d["device_price_b2c"],
        "device_unit_margin": round(d["device_price_b2c"] - device_cost, 2),
        "device_margin_pct": round((d["device_price_b2c"] - device_cost) / d["device_price_b2c"] * 100, 1),
        "breakeven_units": ceil(fixed / d["b2c_subscription"]) if d["b2c_subscription"] > 0 else 0,
    }

    # Recomendación: cuántos conductores podemos ofrecer a "buen precio" (rentable).
    # Aceptamos ofertar a empresas desde el punto de equilibrio recurrente en adelante.
    recommended_min_drivers = breakeven_drivers

    return {
        "currency": "MXN",
        "inputs": d,
        "b2b": {
            "price_per_driver_month": p,
            "fixed_monthly": fixed,
            "device_cost": device_cost,
            "breakeven_drivers": breakeven_drivers,
            "min_drivers_for_target_margin": min_drivers_for_margin,
            "recommended_min_drivers": recommended_min_drivers,
            "scenarios": scenarios,
            "scenario": scenario,
        },
        "b2c": b2c,
    }
