import redis
from app.application.interfaces.clients import ICacheClient
from app.core.config import get_settings

class RedisCacheClient(ICacheClient):
    def __init__(self):
        settings = get_settings()
        self._redis = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        self._redis.setex(key, ttl_seconds, value)

    def get(self, key: str) -> str | None:
        return self._redis.get(key)

    def delete(self, key: str) -> None:
        self._redis.delete(key)
