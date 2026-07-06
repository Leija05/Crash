from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient | None = None


async def get_db():
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.MONGO_URL)
    return client[settings.DB_NAME]


async def close_db():
    global client
    if client:
        client.close()
        client = None
