"""
Genera y gestiona el token personal de SuperAdministrador para C.R.A.S.H.

Uso:
    python generate_supertoken.py                          # menú interactivo
    python generate_supertoken.py --email super@crash.io --password MiPass123
    python generate_supertoken.py --list                   # listar superadmins
    python generate_supertoken.py --rotate                 # regenerar el token del superadmin por defecto

El token se guarda en la colección `users` (role="superadmin", campo site_token) y es
validado por el frontend en /login vía POST /auth/verify-site-token (igual que SafeDrive).
"""
import argparse
import uuid
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient


async def list_superadmins(db):
    admins = await db.users.find(
        {"role": "superadmin"},
        {"_id": 0, "email": 1, "name": 1, "site_token": 1, "created_at": 1},
    ).sort("created_at", -1).to_list(100)
    print()
    print("=" * 60)
    print("  C.R.A.S.H. — SUPERADMINISTRADORES")
    print("=" * 60)
    if not admins:
        print("  No hay superadministradores registrados.")
    for i, a in enumerate(admins, 1):
        print(f"  [{i}] {a.get('email')} — {a.get('name')}")
        print(f"       Token: {a.get('site_token', '')}")
    print("=" * 60)
    print()


async def create_superadmin(db, email: str, password: str, name: str = None):
    from app.core.security import hash_password
    email = email.strip().lower()
    site_token = uuid.uuid4().hex[:12].upper()
    existing = await db.users.find_one({"email": email})
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "role": "superadmin",
                "password_hash": hash_password(password),
                "name": name or existing.get("name", "SuperAdmin"),
                "site_token": site_token,
                "updated_at": now,
            }},
        )
        print(f"\n  SuperAdmin actualizado: {email}")
    else:
        await db.users.insert_one({
            "email": email, "name": name or "SuperAdmin",
            "password_hash": hash_password(password), "role": "superadmin",
            "site_token": site_token, "created_at": now, "updated_at": now,
        })
        print(f"\n  SuperAdmin creado: {email}")

    print()
    print("=" * 60)
    print("  CREDENCIALES DE SUPERADMINISTRADOR")
    print("=" * 60)
    print(f"  Email : {email}")
    print(f"  Pass  : {password}")
    print(f"  Token : {site_token}")
    print(f"  Panel : /admin")
    print("=" * 60)
    print("  Usa este token en la pantalla de login (paso 1) para acceder al panel.")
    print("=" * 60)
    print()


async def main():
    parser = argparse.ArgumentParser(description="C.R.A.S.H. — Token de SuperAdmin")
    parser.add_argument("--mongo-url", default=None)
    parser.add_argument("--db", default=None)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--email", default=None)
    parser.add_argument("--password", default=None)
    parser.add_argument("--name", default=None)
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
        email = args.email or input("Email del SuperAdmin: ")
        password = args.password or input("Contraseña: ")

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
        # Interactive
        while True:
            print()
            print("=" * 50)
            print("  C.R.A.S.H. — SUPERADMIN TOKEN")
            print("=" * 50)
            print("  [1] Listar superadmins")
            print("  [2] Crear/actualizar superadmin")
            print("  [3] Salir")
            choice = input("  Selecciona (1-3): ").strip()
            if choice == "1":
                await list_superadmins(db)
            elif choice == "2":
                e = input("  Email: ").strip()
                while not e or "@" not in e:
                    e = input("  Email válido: ").strip()
                p = input("  Contraseña: ").strip()
                while len(p) < 6:
                    p = input("  Contraseña (min 6): ").strip()
                n = input("  Nombre (opcional): ").strip() or None
                await create_superadmin(db, e, p, n)
            elif choice == "3":
                break
            else:
                print("  Opción inválida.")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
