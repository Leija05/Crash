import time
import threading
from typing import Any, Optional


class MemoryCache:
    """Simple thread-safe in-memory cache with TTL support."""

    def __init__(self, default_ttl: int = 60):
        self._store: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires = entry
            if time.monotonic() > expires:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expires = time.monotonic() + (ttl if ttl is not None else self._default_ttl)
        with self._lock:
            self._store[key] = (value, expires)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def get_or_set(self, key: str, factory, ttl: Optional[int] = None) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = factory()
        self.set(key, value, ttl)
        return value

    def invalidate_pattern(self, prefix: str) -> None:
        with self._lock:
            keys = [k for k in self._store if k.startswith(prefix)]
            for k in keys:
                del self._store[k]


    def stats(self) -> dict:
        with self._lock:
            now = time.monotonic()
            expired = sum(1 for v in self._store.values() if now > v[1])
            return {
                "total_entries": len(self._store),
                "expired_entries": expired,
                "active_entries": len(self._store) - expired,
                "default_ttl": self._default_ttl,
            }

cache = MemoryCache(default_ttl=30)
