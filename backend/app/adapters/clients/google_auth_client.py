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
    USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Google access_token via userinfo endpoint.
        Raises AuthenticationError if token is invalid or expired.
        """
        req = urllib.request.Request(
            self.USERINFO_URL,
            headers={"Authorization": f"Bearer {token}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            logger.warning("Google userinfo failed: HTTP %s — %s", e.code, e.reason)
            raise AuthenticationError("Token Google không hợp lệ hoặc đã hết hạn.")
        except urllib.error.URLError as e:
            logger.warning("Google userinfo connection error: %s", e)
            raise AuthenticationError("Có lỗi xảy ra khi xác thực với Google.")
