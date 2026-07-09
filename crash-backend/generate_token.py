"""
CLI para gestionar empresas y tokens de C.R.A.S.H. (estilo SafeDrive).

El modelo de tokens vive en la colección `site_tokens` y soporta dos roles:
  - "empresa"      : lo usa el CONDUCTOR en la app móvil para vincular su cuenta.
  - "monitorista"  : lo usa el MONITOR en el login web para registrarse
                     (uno activo por empresa, con usos limitados por el plan).

Uso:
    python generate_token.py                  # menú interactivo
    python generate_token.py --list           # listar empresas con estado de tokens
    python generate_token.py --create-company # crear empresa (con plan -> tokens auto)
    python generate_token.py --company-token <id>   # generar/regenerar token de empresa
    python generate_token.py --monitor-token <id>   # crear token de monitorista (1 por empresa)
"""
import argparse
import asyncio
from datetime import datetime, timezone

CYCLE_OPTIONS = ["Semanal", "Mensual", "Bimestral", "Trimestral", "Anual"]


async def list_companies(db):
    from app.api.companies.service import list_companies as _list
    from app.api.tokens.service import list_company_tokens

    companies = await _list()
    print()
    print("=" * 86)
    print("  C.R.A.S.H. — LISTADO DE EMPRESAS")
    print("=" * 86)
    if not companies:
        print("  (No hay empresas registradas)")
        print("=" * 86)
        return

    for i, c in enumerate(companies, 1):
        cid = c.get("id") or c.get("_id")
        name = c.get("name", "Sin nombre")
        plan = c.get("plan_name", "Sin plan")
        has_token = c.get("has_token", False)
        max_d = c.get("max_drivers", "?")
        max_m = c.get("max_monitors", "?")

        status = c.get("status", "active")
        active_mark = "\033[92m[*]\033[0m" if status == "active" else "\033[90m[ ]\033[0m"
        token_mark = "\033[92mTOKENS\033[0m" if has_token else "\033[93mSIN TOKEN\033[0m"

        print(f"  {active_mark} \033[1m{name}\033[0m — {token_mark}")
        print(f"         ID    : {cid}")
        print(f"         Plan  : {plan} · Conductores: {max_d} · Monitores: {max_m}")

        if has_token:
            toks = await list_company_tokens(cid)
            for t in toks:
                used = t.get("use_count", 0)
                mx = t.get("max_uses", 0)
                role = t.get("role", "?")
                active = t.get("active", True)
                a_mark = "\033[92mactivo\033[0m" if active else "\033[90minactivo\033[0m"
                print(f"           - [{role}] {t.get('token')} ({used}/{mx}) {a_mark}")
        print()

    print("=" * 86)
    print(f"  Total: {len(companies)} empresa(s)")
    print("=" * 86)
    print()


async def resolve_plan(db, plan_id=None):
    from app.api.plans.service import get_plan
    if plan_id:
        p = await get_plan(plan_id)
        if p:
            return p
    p = await db.plans.find_one({"name": "Basic"})
    return p


async def create_company_flow(db):
    from app.api.companies.service import create_company
    from app.api.tokens.service import create_company_token, create_monitor_token

    print()
    print("=" * 60)
    print("  C.R.A.S.H. — CREAR EMPRESA")
    print("=" * 60)
    name = input("  Nombre de la empresa: ").strip()
    while not name:
        name = input("  Nombre (obligatorio): ").strip()
    email = input("  Email de contacto: ").strip()
    while "@" not in email:
        email = input("  Email válido (obligatorio): ").strip()
    phone = input("  Teléfono (opcional): ").strip()

    plans = await db.plans.find({}).sort("price", 1).to_list(20)
    print("\n  Planes disponibles:")
    for i, p in enumerate(plans, 1):
        print(f"    [{i}] {p['name']} — ${p.get('price')}/mes · {p.get('max_drivers')} cond. · {p.get('max_monitors')} mon.")
    print("    [0] Sin plan (la empresa queda sin tokens por ahora)")
    choice = input("  Elige plan (0-{0}): ".format(len(plans))).strip()
    plan = None
    cycle = "Mensual"
    if choice.isdigit() and 1 <= int(choice) <= len(plans):
        plan = plans[int(choice) - 1]
        print("  Ciclos:", " / ".join(CYCLE_OPTIONS))
        cycle = input("  Ciclo de facturación [Mensual]: ").strip() or "Mensual"

    company = await create_company(name, email, phone, str(plan["_id"]) if plan else None, cycle)
    cid = company.get("id")
    print(f"\n  \033[92mEmpresa creada:\033[0m {name}")
    if company.get("has_token"):
        toks = await list_company_tokens(cid)
        for t in toks:
            print(f"    [{t['role']}] {t['token']}  (usos {t['use_count']}/{t['max_uses']})")
        print("\n  Comparte el token de EMPREA al conductor (app móvil > Config > Empresa).")
        print("  Comparte el token de MONITORISTA al monitor (login web, paso 1).")
    else:
        print("  Empresa sin plan: no tiene tokens. Usa '--company-token' o compra un paquete.")


async def company_token_flow(db):
    from app.api.companies.service import get_company
    from app.api.tokens.service import regenerate_tokens

    cid = getattr(company_token_flow, "cid", None)
    if not cid:
        companies = await db.companies.find({}).to_list(500)
        if not companies:
            print("  No hay empresas.")
            return
        print("\n  EMPRESAS:")
        for i, c in enumerate(companies, 1):
            print(f"    [{i}] {c['name']} (has_token={c.get('has_token', False)})")
        choice = input("  Elige empresa: ").strip()
        if not (choice.isdigit() and 1 <= int(choice) <= len(companies)):
            print("  Opción inválida."); return
        cid = str(companies[int(choice) - 1]["_id"])
    company = await get_company(cid)
    if not company:
        print("  Empresa no encontrada."); return
    plan_id = company.get("plan_id")
    plan = await resolve_plan(db, plan_id)
    cycle = company.get("cycle", "Mensual")
    result = await regenerate_tokens(cid, plan, cycle)
    print(f"\n  \033[92mTokens regenerados para {company.get('name')}:\033[0m")
    print(f"    Empresa    : {result['company_token']}")
    print(f"    Monitorista: {result['monitor_token']}")


async def monitor_token_flow(db):
    from app.api.companies.service import get_company
    from app.api.tokens.service import create_monitor_token

    companies = await db.companies.find({}).to_list(500)
    if not companies:
        print("  No hay empresas."); return
    print("\n  EMPRESAS:")
    for i, c in enumerate(companies, 1):
        print(f"    [{i}] {c['name']}")
    choice = input("  Elige empresa: ").strip()
    if not (choice.isdigit() and 1 <= int(choice) <= len(companies)):
        print("  Opción inválida."); return
    company = companies[int(choice) - 1]
    cid = str(company["_id"])
    plan = await resolve_plan(db, company.get("plan_id"))
    cycle = company.get("cycle", "Mensual") or "Mensual"
    tok = await create_monitor_token(company, plan, cycle)
    print(f"\n  \033[92mToken de monitorista creado para {company['name']}:\033[0m")
    print(f"    {tok['token']}  (usos {tok['use_count']}/{tok['max_uses']})")
    print("  Nota: se desactivó cualquier token de monitorista anterior de esta empresa.")


async def interactive(db):
    while True:
        print()
        print("=" * 60)
        print("  \033[1mC.R.A.S.H. — GESTIÓN DE TOKENS\033[0m")
        print("=" * 60)
        print("  \033[97m[1]\033[0m  Listar empresas (con estado de tokens)")
        print("  \033[97m[2]\033[0m  Crear empresa (elige plan -> tokens automáticos)")
        print("  \033[97m[3]\033[0m  Regenerar tokens de empresa (empresa + monitorista)")
        print("  \033[97m[4]\033[0m  Crear token de monitorista (1 activo por empresa)")
        print("  \033[97m[5]\033[0m  Salir")
        print("=" * 60)
        choice = input("  Selecciona (1-5): ").strip()
        if choice == "1":
            await list_companies(db)
        elif choice == "2":
            await create_company_flow(db)
        elif choice == "3":
            await company_token_flow(db)
        elif choice == "4":
            await monitor_token_flow(db)
        elif choice == "5":
            print("  Saliendo..."); break
        else:
            print("  Opción inválida.")


async def main():
    parser = argparse.ArgumentParser(description="C.R.A.S.H. — Administración de tokens (site_tokens)")
    parser.add_argument("--mongo-url", default=None, help="MongoDB URL (default from .env)")
    parser.add_argument("--db", default=None, help="Database name (default from .env)")
    parser.add_argument("--list", action="store_true", help="List companies with token status")
    parser.add_argument("--create-company", action="store_true", help="Create a company (interactive)")
    parser.add_argument("--company-token", metavar="ID", default=None, help="Regenerate company tokens for company ID")
    parser.add_argument("--monitor-token", metavar="ID", default=None, help="Create a monitorista token for company ID")
    args = parser.parse_args()

    try:
        from app.core.config import settings
        mongo_url = args.mongo_url or settings.MONGO_URL
        db_name = args.db or settings.DB_NAME
    except ImportError:
        mongo_url = args.mongo_url or input("MongoDB URL: ")
        db_name = args.db or input("Database name: ")

    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL and DB_NAME are required")
        return

    from app.core.database import get_db
    db = await get_db()

    try:
        if args.list:
            await list_companies(db)
        elif args.create_company:
            await create_company_flow(db)
        elif args.company_token:
            company_token_flow.cid = args.company_token
            await company_token_flow(db)
        elif args.monitor_token:
            company_token_flow.cid = args.monitor_token
            await monitor_token_flow(db)
        else:
            await interactive(db)
    finally:
        from app.core.database import close_db
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
