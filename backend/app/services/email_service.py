import logging
import smtplib
from email.message import EmailMessage
from typing import Tuple, Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)


def is_smtp_configured() -> bool:
    """
    Checks if live SMTP email delivery is fully configured in backend/.env.
    """
    return bool(
        settings.SMTP_HOST
        and settings.SMTP_USER
        and settings.SMTP_PASSWORD
    )


def get_missing_smtp_config() -> List[str]:
    """
    Returns list of missing SMTP environment variable names.
    """
    missing = []
    if not settings.SMTP_HOST:
        missing.append("SMTP_HOST")
    if not settings.SMTP_USER:
        missing.append("SMTP_USER")
    if not settings.SMTP_PASSWORD:
        missing.append("SMTP_PASSWORD")
    if not settings.SMTP_FROM_EMAIL and not settings.SMTP_USER:
        missing.append("SMTP_FROM_EMAIL")
    return missing


def send_verification_email(
    to_email: str,
    recipient_name: str,
    otp_code: str,
) -> Tuple[bool, Optional[str]]:
    """
    Dispatches a real email containing the 6-digit verification OTP.
    
    SECURITY NOTE:
    The plaintext otp_code is NEVER logged to backend logs or console.
    """
    if not is_smtp_configured():
        return False, "SMTP email delivery is not configured in backend/.env."

    try:
        from_addr = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        from_header = f"{settings.SMTP_FROM_NAME} <{from_addr}>"

        msg = EmailMessage()
        msg["Subject"] = f"SecureCipher — Your Verification Code is {otp_code}"
        msg["From"] = from_header
        msg["To"] = to_email

        # Plain text alternative
        plain_content = (
            f"Hello {recipient_name},\n\n"
            f"Your SecureCipher verification code is: {otp_code}\n\n"
            "This code will expire in 5 minutes. If you did not request this verification, please disregard this email.\n\n"
            "Stay secure,\n"
            "The SecureCipher Security Team"
        )
        msg.set_content(plain_content)

        # Styled HTML email matching SecureCipher cybersecurity aesthetic
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #030704; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #030704; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="560px" style="max-width: 560px; background-color: #061208; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px;">
                        <span style="color: #34d399; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">SecureCipher Cryptography</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;">Verify Your Email Address</h1>
                      <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hello {recipient_name}, use the one-time code below to complete your registration.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 24px 0;">
                      <div style="background-color: #030804; border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 12px; padding: 16px 32px; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; font-family: monospace; color: #10b981;">
                        {otp_code}
                      </div>
                      <p style="color: #64748b; font-size: 12px; margin-top: 12px;">This code expires in <strong style="color: #cbd5e1;">5 minutes</strong> (maximum 5 attempts).</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
                      <p style="margin: 0 0 8px 0;">If you did not initiate this request, you can safely ignore this message.</p>
                      <p style="margin: 0;">Multi-Algorithm Cryptography and Secure Data Protection System</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        msg.add_alternative(html_content, subtype="html")

        # Connect and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("Verification email successfully dispatched to recipient.")
        return True, None

    except Exception as exc:
        logger.error("Failed to dispatch verification email: %s", str(exc))
        return False, f"Failed to send email: {str(exc)}"
