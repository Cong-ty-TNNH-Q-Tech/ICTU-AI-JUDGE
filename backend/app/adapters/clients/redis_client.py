import redis
from app.application.interfaces.clients import ICacheClient
from app.core.config import get_settings

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client

class RedisCacheClient(ICacheClient):
    def __init__(self):
        self._redis = get_redis_client()

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        self._redis.setex(key, ttl_seconds, value)

    def get(self, key: str) -> str | None:
        return self._redis.get(key)

    def delete(self, key: str) -> None:
        self._redis.delete(key)
