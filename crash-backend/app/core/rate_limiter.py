import time
import threading
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class RateLimitConfig:
    window_seconds: int = 60
    max_requests: int = 100


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""

    def __init__(self):
        self._windows: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str, config: RateLimitConfig = RateLimitConfig()) -> bool:
        now = time.monotonic()
        with self._lock:
            window = self._windows[key]
            cutoff = now - config.window_seconds
            window[:] = [t for t in window if t > cutoff]
            if len(window) >= config.max_requests:
                return False
            window.append(now)
            return True

    def remaining(self, key: str, config: RateLimitConfig = RateLimitConfig()) -> int:
        now = time.monotonic()
        with self._lock:
            window = self._windows[key]
            cutoff = now - config.window_seconds
            window[:] = [t for t in window if t > cutoff]
            return max(0, config.max_requests - len(window))

    def reset(self, key: str) -> None:
        with self._lock:
            self._windows.pop(key, None)


    def stats(self) -> dict:
        with self._lock:
            total_keys = len(self._windows)
            total_requests = sum(len(times) for times in self._windows.values())
            return {
                "active_keys": total_keys,
                "total_tracked_requests": total_requests,
                "window_seconds_default": 60,
                "max_requests_default": 100,
            }

rate_limiter = RateLimiter()
