"""
CLI script to generate site tokens for companies in C.R.A.S.H.
and optionally generate individual driver tokens for each conductor
based on the company's plan (max_drivers).

Usage:
    python generate_token.py                  # interactive menu
    python generate_token.py --list           # list companies with token status
    python generate_token.py --assign-token   # assign/generate token for companies without
    python generate_token.py --generate-drivers  # generate driver tokens for a company
"""
import argparse
import uuid
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient


async def list_companies(db):
    companies = await db.companies.find({}).sort("created_at", -1).to_list(500)

    print()
    print("=" * 80)
    print("  C.R.A.S.H. — LISTADO DE EMPRESAS")
    print("=" * 80)
    if not companies:
        print("  (No hay empresas registradas)")
        print("=" * 80)
        return

    for i, c in enumerate(companies, 1):
        name = c.get("name", "Sin nombre")
        token = c.get("site_token", "")
        plan = c.get("plan_name", "Sin plan")
        max_d = c.get("max_drivers", "?")
        status = c.get("status", "active")
        drivers_used = c.get("driver_count", 0)

        token_status = f"\033[92mTOKEN ASIGNADO\033[0m" if token else f"\033[93mSIN TOKEN\033[0m"
        active_mark = "\033[92m[*]\033[0m" if status == "active" else "\033[90m[ ]\033[0m"

        print(f"  {active_mark} \033[1m{name}\033[0m — {token_status}")
        print(f"         Plan: {plan} ({max_d} cond.) | Conductores: {drivers_used}/{max_d}")
        print(f"         Token: \033[93m{token}\033[0m" if token else "")
        print(f"         Creada: {c.get('created_at', '')[:10]}")

    print("=" * 80)
    print(f"  Total: {len(companies)} empresa(s)")
    print("=" * 80)
    print()

    return companies


async def generate_driver_tokens(db, company, count: int = None):
    max_drivers = company.get("max_drivers", 3)
    existing_drivers = await db.driver_tokens.count_documents({"company_id": str(company["_id"])})
    available = max_drivers - existing_drivers

    if available <= 0:
        print(f"  \033[93mLimite alcanzado: {existing_drivers}/{max_drivers} conductores ya tienen token.\033[0m")
        return []

    to_generate = count if count and count <= available else available
    company_id_str = str(company["_id"])
    tokens = []

    print(f"\n  Generando {to_generate} token(s) de conductor para {company['name']}...")

    for i in range(to_generate):
        raw = uuid.uuid4().hex[:16].upper()
        doc = {
            "token": raw,
            "name": f"Conductor {existing_drivers + i + 1}",
            "company_id": company_id_str,
            "company_name": company.get("name", ""),
            "active": True,
            "used": False,
            "used_by": None,
            "used_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.driver_tokens.insert_one(doc)
        tokens.append(doc)

    await db.companies.update_one(
        {"_id": company["_id"]},
        {"$set": {"driver_count": existing_drivers + to_generate}}
    )

    return tokens


async def assign_token_flow(db):
    print()
    print("=" * 60)
    print("  C.R.A.S.H. — GENERAR TOKEN DE ACCESO")
    print("=" * 60)

    all_companies = await db.companies.find({}).to_list(500)
    companies_without = [c for c in all_companies if not c.get("site_token")]

    if not companies_without:
        print("  \033[92mTodas las empresas ya tienen token asignado.\033[0m")
        print(f"  Total: {len(all_companies)} empresa(s)")
        return

    print(f"\n  Empresas sin token: {len(companies_without)}")
    print()

    print("  EMPRESAS SIN TOKEN:")
    for i, c in enumerate(companies_without, 1):
        print(f"    [{i}] {c.get('name', 'Sin nombre')} ({c.get('plan_name', 'Sin plan')})")
    print()

    while True:
        choice = input(f"  Selecciona empresa (1-{len(companies_without)}), 0 = todas: ").strip()
        if choice == "0":
            selected = companies_without
            break
        if choice.isdigit() and 1 <= int(choice) <= len(companies_without):
            selected = [companies_without[int(choice) - 1]]
            break
        print("  Opcion invalida.")

    print()
    all_generated = []
    for c in selected:
        site_token = uuid.uuid4().hex[:12].upper()
        await db.companies.update_one(
            {"_id": c["_id"]},
            {"$set": {
                "site_token": site_token,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        max_d = c.get("max_drivers", 3)
        print(f"  Token monitorista generado para \033[1m{c['name']}\033[0m: \033[93m{site_token}\033[0m")

        gen_drivers = input(f"  Generar tokens de conductor (max {max_d})? (s/N): ").strip().lower()
        driver_tokens = []
        if gen_drivers == "s":
            count_str = input(f"  Cantidad (1-{max_d}): ").strip()
            count = int(count_str) if count_str.isdigit() else max_d
            driver_tokens = await generate_driver_tokens(db, c, min(count, max_d))

        all_generated.append((c["name"], site_token, driver_tokens))

    print()
    print("=" * 60)
    print(f"  \033[92m{len(all_generated)} EMPRESA(S) PROCESADA(S)\033[0m")
    print("=" * 60)
    for name, token, dtokens in all_generated:
        print(f"  Empresa      : \033[1m{name}\033[0m")
        print(f"  Token monitor: \033[93m{token}\033[0m")
        if dtokens:
            print(f"  Tokens conductor ({len(dtokens)}):")
            for t in dtokens:
                print(f"    \033[36m{t['token']}\033[0m — {t['name']}")
        else:
            print(f"  Tokens conductor: \033[90mninguno\033[0m")
        print()
    print("=" * 60)
    print("  Token monitorista: usalo para registrarte como monitor en la pagina.")
    print("  Token conductor:  ingresalo en la app movil en Configuracion > Empresa.")
    print("=" * 60)


async def generate_drivers_flow(db):
    print()
    print("=" * 60)
    print("  C.R.A.S.H. — GENERAR TOKENS DE CONDUCTOR")
    print("=" * 60)

    companies = await db.companies.find({}).to_list(500)
    if not companies:
        print("  No hay empresas registradas.")
        return

    print("\n  EMPRESAS:")
    for i, c in enumerate(companies, 1):
        max_d = c.get("max_drivers", 3)
        used = c.get("driver_count", 0)
        token_status = "token OK" if c.get("site_token") else "SIN TOKEN"
        print(f"    [{i}] {c['name']} — {used}/{max_d} cond. ({token_status})")

    while True:
        choice = input(f"\n  Selecciona empresa (1-{len(companies)}): ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(companies):
            company = companies[int(choice) - 1]
            break
        print("  Opcion invalida.")

    max_d = company.get("max_drivers", 3)
    existing = await db.driver_tokens.count_documents({"company_id": str(company["_id"])})
    available = max_d - existing

    if available <= 0:
        print(f"  \033[93mLimite alcanzado: {existing}/{max_d} conductores.\033[0m")
        return

    count_str = input(f"  Cantidad a generar (max {available}): ").strip()
    count = int(count_str) if count_str.isdigit() and 0 < int(count_str) <= available else available

    tokens = await generate_driver_tokens(db, company, count)
    if not tokens:
        return

    print()
    print("=" * 60)
    print(f"  \033[92m{len(tokens)} TOKEN(S) DE CONDUCTOR GENERADO(S)\033[0m")
    print("=" * 60)
    for t in tokens:
        print(f"  \033[36m{t['token']}\033[0m — {t['name']} ({company['name']})")
    print("=" * 60)
    print("  El conductor ingresa este token en la app movil")
    print("  en Configuracion > Vincular empresa.")
    print("=" * 60)


async def interactive(db):
    while True:
        print()
        print("=" * 60)
        print("  \033[1mC.R.A.S.H. — ADMINISTRACION DE TOKENS\033[0m")
        print("=" * 60)
        print("  \033[97m[1]\033[0m  Listar empresas (con estado de tokens)")
        print("  \033[97m[2]\033[0m  Generar token(s) para empresa(s) sin token")
        print("  \033[97m[3]\033[0m  Generar tokens de conductor para una empresa")
        print("  \033[97m[4]\033[0m  Salir")
        print("=" * 60)

        choice = input("  Selecciona (1-4): ").strip()

        if choice == "1":
            await list_companies(db)
        elif choice == "2":
            await assign_token_flow(db)
        elif choice == "3":
            await generate_drivers_flow(db)
        elif choice == "4":
            print("  Saliendo...")
            break
        else:
            print("  Opcion invalida.")


async def main():
    parser = argparse.ArgumentParser(description="C.R.A.S.H. — Administracion de tokens de empresas y conductores")
    parser.add_argument("--mongo-url", default=None, help="MongoDB URL (default from .env)")
    parser.add_argument("--db", default=None, help="Database name (default from .env)")
    parser.add_argument("--list", action="store_true", help="List companies with token status")
    parser.add_argument("--assign-token", action="store_true", help="Generate tokens for companies without")
    parser.add_argument("--generate-drivers", action="store_true", help="Generate driver tokens for a company")
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

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    if args.list:
        await list_companies(db)
    elif args.assign_token:
        await assign_token_flow(db)
    elif args.generate_drivers:
        await generate_drivers_flow(db)
    else:
        await interactive(db)

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
