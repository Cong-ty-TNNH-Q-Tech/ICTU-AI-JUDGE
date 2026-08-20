"""
Google Auth Client Interface.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any

class IGoogleAuthClient(ABC):
    @abstractmethod
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Google Token and return token payload containing email, name, etc.
        Raises AuthenticationError if token is invalid.
        """
        ...


class IMailClient(ABC):
    @abstractmethod
    def send_email(self, to_email: str, subject: str, html_content: str) -> None:
        """
        Gửi email qua SMTP.
        """
        ...

class ICacheClient(ABC):
    @abstractmethod
    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        ...

    @abstractmethod
    def get(self, key: str) -> str | None:
        ...

    @abstractmethod
    def delete(self, key: str) -> None:
        ...
