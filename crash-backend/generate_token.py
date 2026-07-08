"""
CLI script to generate site tokens for companies in C.R.A.S.H.
that don't already have one.

Usage:
    python generate_token.py                  # interactive menu
    python generate_token.py --list           # list companies with token status
    python generate_token.py --assign-token   # assign/generate token for companies without
"""
import argparse
import uuid
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient


async def list_companies(db):
    companies = await db.companies.find({}).sort("created_at", -1).to_list(500)

    print()
    print("=" * 70)
    print("  C.R.A.S.H. — LISTADO DE EMPRESAS")
    print("=" * 70)
    if not companies:
        print("  (No hay empresas registradas)")
        print("=" * 70)
        return

    for i, c in enumerate(companies, 1):
        name = c.get("name", "Sin nombre")
        token = c.get("site_token", "")
        plan = c.get("plan_name", "Sin plan")
        max_d = c.get("max_drivers", "?")
        status = c.get("status", "active")

        if token:
            token_status = f"\033[92m TOKEN ASIGNADO\033[0m"
        else:
            token_status = f"\033[93m SIN TOKEN\033[0m"

        active_mark = "\033[92m[*]\033[0m" if status == "active" else "\033[90m[ ]\033[0m"
        plan_info = f" | {plan} ({max_d} cond.)"
        created = c.get("created_at", "")[:10] if c.get("created_at") else "?"

        print(f"  {active_mark} \033[1m{name}\033[0m{token_status}{plan_info}")
        print(f"         Creada: {created} | ID: {c['_id']}")

    print("=" * 70)
    print(f"  Total: {len(companies)} empresa(s)")
    print("=" * 70)
    print()

    return companies


async def assign_token_flow(db):
    print()
    print("=" * 60)
    print("  C.R.A.S.H. — GENERAR TOKEN DE ACCESO")
    print("=" * 60)

    all_companies = await db.companies.find({}).to_list(500)
    companies_without = [c for c in all_companies if not c.get("site_token")]
    companies_with = [c for c in all_companies if c.get("site_token")]

    if not companies_without:
        print("  \033[92mTodas las empresas ya tienen token asignado.\033[0m")
        print(f"  Total: {len(all_companies)} empresa(s)")
        return

    print(f"\n  Empresas sin token: {len(companies_without)}")
    print(f"  Empresas con token: {len(companies_with)}")
    print()

    print("  EMPRESAS SIN TOKEN:")
    for i, c in enumerate(companies_without, 1):
        name = c.get("name", "Sin nombre")
        plan = c.get("plan_name", "Sin plan")
        print(f"    [{i}] {name} ({plan})")
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
    generated = []
    for c in selected:
        token = uuid.uuid4().hex[:12].upper()
        await db.companies.update_one(
            {"_id": c["_id"]},
            {"$set": {
                "site_token": token,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        generated.append((c["name"], token))

    print("=" * 60)
    print(f"  \033[92m{len(generated)} TOKEN(S) GENERADO(S)\033[0m")
    print("=" * 60)
    for name, token in generated:
        print(f"  Empresa : \033[1m{name}\033[0m")
        print(f"  Token   : \033[93m{token}\033[0m")
        print()
    print("=" * 60)
    print("  Los monitoristas usaran este token UNA SOLA VEZ")
    print("  al registrarse en la pagina de login.")
    print("=" * 60)


async def interactive(db):
    while True:
        print()
        print("=" * 60)
        print("  \033[1mC.R.A.S.H. — ADMINISTRACION DE TOKENS\033[0m")
        print("=" * 60)
        print("  \033[97m[1]\033[0m  Listar empresas (con estado de tokens)")
        print("  \033[97m[2]\033[0m  Generar token(s) para empresas sin token")
        print("  \033[97m[3]\033[0m  Salir")
        print("=" * 60)

        choice = input("  Selecciona (1-3): ").strip()
        print()

        if choice == "1":
            await list_companies(db)
        elif choice == "2":
            await assign_token_flow(db)
        elif choice == "3":
            print("  Saliendo...")
            break
        else:
            print("  Opcion invalida.")


async def main():
    parser = argparse.ArgumentParser(description="C.R.A.S.H. — Administracion de tokens de empresas")
    parser.add_argument("--mongo-url", default=None, help="MongoDB URL (default from .env)")
    parser.add_argument("--db", default=None, help="Database name (default from .env)")
    parser.add_argument("--list", action="store_true", help="List companies with token status")
    parser.add_argument("--assign-token", action="store_true", help="Generate tokens for companies without")
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
    else:
        await interactive(db)

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
