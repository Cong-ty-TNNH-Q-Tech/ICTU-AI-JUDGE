"""
Google Auth Client Implementation.
"""
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any

from app.application.interfaces.clients import IGoogleAuthClient
from app.domain.exceptions.exceptions import AuthenticationError

logger = logging.getLogger(__name__)

class GoogleAuthClient(IGoogleAuthClient):
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Google Token using oauth2 endpoint.
        """
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode())
        except urllib.error.URLError as e:
            logger.warning(f"Google Token verification failed: {e}")
            raise AuthenticationError("Token Google không hợp lệ hoặc đã hết hạn.")
        except Exception as e:
            logger.error(f"Unexpected error during Google Token verification: {e}")
            raise AuthenticationError("Có lỗi xảy ra khi xác thực với Google.")
