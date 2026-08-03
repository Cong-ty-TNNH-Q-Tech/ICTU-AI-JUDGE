"""
SMTP Mail Client — Adapter layer.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.application.interfaces.clients import IMailClient
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class SMTPMailClient(IMailClient):
    def __init__(self):
        self.settings = get_settings()

    def send_email(self, to_email: str, subject: str, html_content: str) -> None:
        if not self.settings.SMTP_HOST or not self.settings.SMTP_USER:
            logger.warning("SMTP is not configured. Skipping email to %s", to_email)
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.settings.SMTP_FROM_EMAIL or self.settings.SMTP_USER
        msg["To"] = to_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        try:
            with smtplib.SMTP(self.settings.SMTP_HOST, self.settings.SMTP_PORT) as server:
                server.starttls()
                server.login(self.settings.SMTP_USER, self.settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], to_email, msg.as_string())
            logger.info("Sent email to %s", to_email)
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to_email, str(e))
            raise e
