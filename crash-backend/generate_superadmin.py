"""
Seed/create a SuperAdmin user in the C.R.A.S.H. database.
Generates and displays a site token for the admin to log in.

Usage:
    python generate_superadmin.py                        # interactive
    python generate_superadmin.py --email super@crash.io --password MiPass123
    python generate_superadmin.py --list                 # list superadmins

This creates or updates a user with role='superadmin' in the users collection
and generates a site_token for that account.
"""
import argparse
import uuid
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient


async def list_superadmins(db):
    admins = await db.users.find(
        {"role": "superadmin"},
        {"_id": 1, "email": 1, "name": 1, "site_token": 1, "created_at": 1, "updated_at": 1},
    ).sort("created_at", -1).to_list(100)

    print()
    print("=" * 60)
    print("  C.R.A.S.H. — SUPERADMINISTRADORES")
    print("=" * 60)
    if not admins:
        print("  No hay superadministradores registrados.")
        print("=" * 60)
        return

    for i, a in enumerate(admins, 1):
        email = a.get("email", "?")
        name = a.get("name", "?")
        token = a.get("site_token", "")
        created = a.get("created_at", "")[:10]
        token_str = f"\n       Token: \033[93m{token}\033[0m" if token else " \033[90m(sin token)\033[0m"
        print(f"  [{i}] {email} — {name}{token_str}")
        print(f"       Creado: {created} | ID: {a['_id']}")

    print("=" * 60)
    print(f"  Total: {len(admins)} superadministrador(es)")
    print("=" * 60)
    print()


async def create_superadmin(db, email: str, password: str, name: str = None):
    try:
        from app.core.security import hash_password
    except ImportError:
        print("ERROR: No se puede importar desde app.core.security")
        print("Ejecuta este script desde el directorio crash-backend/")
        return

    email = email.strip().lower()
    existing = await db.users.find_one({"email": email})
    now = datetime.now(timezone.utc).isoformat()
    site_token = uuid.uuid4().hex[:12].upper()

    if existing:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "role": "superadmin",
                "password_hash": hash_password(password),
                "name": name or existing.get("name", "SuperAdmin"),
                "site_token": site_token,
                "updated_at": now,
            }}
        )
        print(f"\n  \033[93mSuperAdmin actualizado:\033[0m {email}")
    else:
        doc = {
            "email": email,
            "name": name or "SuperAdmin",
            "password_hash": hash_password(password),
            "role": "superadmin",
            "site_token": site_token,
            "created_at": now,
            "updated_at": now,
        }
        await db.users.insert_one(doc)
        print(f"\n  \033[92mSuperAdmin creado:\033[0m {email}")

    print()
    print("=" * 60)
    print("  \033[92mCREDENCIALES DE SUPERADMINISTRADOR\033[0m")
    print("=" * 60)
    print(f"  Email    : {email}")
    print(f"  Password : {password}")
    print(f"  Role     : superadmin")
    print(f"  Token    : \033[93m{site_token}\033[0m")
    print(f"  Panel    : http://localhost:3000/admin")
    print("=" * 60)
    print(f"  Usa este token para iniciar sesion en el panel SuperAdmin.")
    print(f"  Token de acceso para monitor: \033[93m{site_token}\033[0m")
    print("=" * 60)
    print()


async def interactive(db):
    print()
    print("=" * 60)
    print("  \033[1mC.R.A.S.H. — CREAR SUPERADMINISTRADOR\033[0m")
    print("=" * 60)
    email = input("  Email del SuperAdmin: ").strip()
    while not email or "@" not in email:
        email = input("  Email valido (obligatorio): ").strip()

    password = input("  Contrasena: ").strip()
    while len(password) < 6:
        password = input("  Contrasena (min 6 caracteres): ").strip()

    name = input("  Nombre (opcional): ").strip() or None
    print()

    await create_superadmin(db, email, password, name)


async def main():
    parser = argparse.ArgumentParser(description="C.R.A.S.H. — Administracion de SuperAdmin")
    parser.add_argument("--mongo-url", default=None, help="MongoDB URL (default from .env)")
    parser.add_argument("--db", default=None, help="Database name (default from .env)")
    parser.add_argument("--list", action="store_true", help="List superadmins")
    parser.add_argument("--email", default=None, help="SuperAdmin email (default from .env)")
    parser.add_argument("--password", default=None, help="SuperAdmin password (default from .env)")
    parser.add_argument("--name", default=None, help="SuperAdmin display name")
    args = parser.parse_args()

    try:
        from app.core.config import settings
        mongo_url = args.mongo_url or settings.MONGO_URL
        db_name = args.db or settings.DB_NAME
        email = args.email or settings.SUPERADMIN_EMAIL
        password = args.password or settings.SUPERADMIN_PASSWORD
    except ImportError:
        mongo_url = args.mongo_url or input("MongoDB URL: ")
        db_name = args.db or input("Database name: ")
        email = args.email
        password = args.password

    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL and DB_NAME are required")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    if args.list:
        await list_superadmins(db)
    elif email and password:
        await create_superadmin(db, email, password, args.name)
    else:
        await interactive(db)

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
