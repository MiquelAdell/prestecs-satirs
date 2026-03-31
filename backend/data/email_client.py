from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backend.config import Settings


class EmailClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def send_access_link(self, to_email: str, display_name: str, url: str) -> bool:
        """Send a password-set link email. Returns True if sent, False if SMTP not configured."""
        if not self._settings.smtp_configured:
            return False

        html = f"""\
<html>
<body style="font-family: system-ui, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
    <h2>Hola {display_name}!</h2>
    <p>Benvingut/da a <strong>Prestecs Satirs</strong>, l'aplicació de préstec de jocs del Refugio del Satyro.</p>
    <p>Per accedir-hi, fes clic al següent enllaç per establir la teva contrasenya:</p>
    <p style="margin: 24px 0;">
        <a href="{url}"
           style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Establir contrasenya
        </a>
    </p>
    <p style="color: #6b7280; font-size: 14px;">
        Aquest enllaç caduca en 48 hores. Si no has sol·licitat aquest accés, ignora aquest missatge.
    </p>
    <p style="color: #6b7280; font-size: 14px;">
        Si el botó no funciona, copia i enganxa aquest enllaç al teu navegador:<br>
        <a href="{url}" style="color: #2563eb;">{url}</a>
    </p>
</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Prestecs Satirs — Accés al teu compte"
        msg["From"] = self._settings.smtp_from  # type: ignore[assignment]
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(self._settings.smtp_host, self._settings.smtp_port) as server:  # type: ignore[arg-type]
            server.starttls()
            server.login(self._settings.smtp_user, self._settings.smtp_password)  # type: ignore[arg-type]
            server.sendmail(self._settings.smtp_from, to_email, msg.as_string())  # type: ignore[arg-type]

        return True
