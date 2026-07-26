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
