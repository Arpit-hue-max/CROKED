"""
Email service for CROKED.

Sends transactional emails (e.g. password reset codes) via SMTP.
When SMTP credentials are not configured, falls back to console logging
so development workflows continue to work without email setup.

Configuration (in backend/.env):
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your-address@gmail.com
    EMAIL_PASS=your-app-password
    EMAIL_FROM=CROKED <your-address@gmail.com>
"""

import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

# Import settings lazily to avoid circular imports
def _get_email_settings():
    try:
        from app.config import settings
        return settings
    except Exception:
        return None


def send_verification_code(to_email: str, code: str) -> bool:
    """
    Send a 6-digit verification code to the given email address.

    Returns True if email was sent, False if it fell back to console log.
    """
    settings = _get_email_settings()

    email_host = getattr(settings, "email_host", "") if settings else ""
    email_user = getattr(settings, "email_user", "") if settings else ""
    email_pass = getattr(settings, "email_pass", "") if settings else ""
    email_port = getattr(settings, "email_port", 587) if settings else 587
    email_from = getattr(settings, "email_from", email_user) if settings else email_user

    if not all([email_host, email_user, email_pass]):
        # Dev fallback — code is only in server console
        logger.info("=" * 60)
        logger.info(f"[DEV EMAIL FALLBACK] Cannot send email — SMTP not configured.")
        logger.info(f"[DEV EMAIL FALLBACK] To: {to_email}")
        logger.info(f"[DEV EMAIL FALLBACK] Verification Code: {code}")
        logger.info("=" * 60)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "CROKED — Your Password Reset Code"
        msg["From"] = email_from or f"CROKED <{email_user}>"
        msg["To"] = to_email

        text_body = (
            f"Your CROKED password reset code is: {code}\n\n"
            f"This code is valid for 10 minutes. Do not share it.\n\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"— CROKED Team (Educational Stock Analytics)"
        )

        html_body = f"""
        <html><body style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
          <div style="background: #0f172a; border-radius: 16px; padding: 32px; text-align: center;">
            <h1 style="color: #38bdf8; font-size: 20px; margin: 0 0 8px;">CROKED</h1>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 24px;">Password Reset</p>
            <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">Your verification code</p>
              <p style="color: #f8fafc; font-size: 36px; font-weight: 900; font-family: monospace; letter-spacing: 0.3em; margin: 0;">{code}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 4px;">Valid for 10 minutes. Do not share this code.</p>
            <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">If you did not request this, you can safely ignore it.</p>
          </div>
          <p style="color: #94a3b8; font-size: 10px; text-align: center; margin-top: 16px;">
            CROKED — Educational Indian Stock Analytics. Not financial advice.
          </p>
        </body></html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP(email_host, int(email_port)) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(email_user, email_pass)
            server.sendmail(email_from or email_user, to_email, msg.as_string())

        logger.info(f"Verification email sent to {to_email}")
        return True

    except Exception as exc:
        logger.error(f"Failed to send verification email to {to_email}: {exc}")
        logger.info(f"[FALLBACK] Verification code for {to_email}: {code}")
        return False


def send_welcome_email(to_email: str) -> bool:
    """
    Send a welcome email to a newly registered user.

    Returns True if email was sent, False if it fell back to console log.
    """
    settings = _get_email_settings()

    email_host = getattr(settings, "email_host", "") if settings else ""
    email_user = getattr(settings, "email_user", "") if settings else ""
    email_pass = getattr(settings, "email_pass", "") if settings else ""
    email_port = getattr(settings, "email_port", 587) if settings else 587
    email_from = getattr(settings, "email_from", email_user) if settings else email_user

    if not all([email_host, email_user, email_pass]):
        logger.info("=" * 60)
        logger.info(f"[DEV EMAIL FALLBACK] Cannot send email — SMTP not configured.")
        logger.info(f"[DEV EMAIL FALLBACK] Welcome email would be sent to: {to_email}")
        logger.info("=" * 60)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to CROKED — Your Stock Analytics Journey Begins 🚀"
        msg["From"] = email_from or f"CROKED <{email_user}>"
        msg["To"] = to_email

        text_body = (
            f"Welcome to CROKED!\n\n"
            f"Thank you for creating your account ({to_email}).\n\n"
            f"Here's what you can do:\n"
            f"  • Search & analyze 2000+ Indian stocks (NSE/BSE)\n"
            f"  • Get ML-powered predictions (XGBoost, LSTM, Ensemble)\n"
            f"  • Build your personal watchlist\n"
            f"  • Track prediction accuracy with drift monitoring\n\n"
            f"IMPORTANT: CROKED is an educational tool. Predictions are NOT financial advice.\n\n"
            f"Happy analyzing!\n"
            f"— The CROKED Team\n"
        )

        html_body = f"""\
        <html><body style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: auto; padding: 32px; background: #020617;">
          <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 20px; padding: 40px 32px; text-align: center; border: 1px solid #334155;">
            <!-- Logo -->
            <div style="margin-bottom: 24px;">
              <h1 style="color: #f59e0b; font-size: 28px; font-weight: 900; letter-spacing: 0.15em; margin: 0;">CROKED</h1>
              <p style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0;">Indian Stock Analytics</p>
            </div>

            <!-- Welcome -->
            <div style="background: linear-gradient(135deg, #f59e0b22, #d9740022); border-radius: 16px; padding: 28px 24px; margin: 0 0 24px; border: 1px solid #f59e0b33;">
              <p style="color: #fbbf24; font-size: 20px; font-weight: 800; margin: 0 0 8px;">Welcome aboard! 🎉</p>
              <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
                Your account <strong style="color: #e2e8f0;">{to_email}</strong> has been created successfully.
              </p>
            </div>

            <!-- Features -->
            <div style="text-align: left; margin: 0 0 28px;">
              <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px;">What you can do</p>

              <div style="background: #0f172a; border-radius: 12px; padding: 14px 16px; margin: 0 0 8px; border: 1px solid #1e293b;">
                <p style="color: #f8fafc; font-size: 13px; font-weight: 600; margin: 0;">📊 Analyze 2000+ Stocks</p>
                <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Real-time data from NSE & BSE exchanges</p>
              </div>

              <div style="background: #0f172a; border-radius: 12px; padding: 14px 16px; margin: 0 0 8px; border: 1px solid #1e293b;">
                <p style="color: #f8fafc; font-size: 13px; font-weight: 600; margin: 0;">🤖 ML Predictions</p>
                <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">XGBoost, LSTM & Ensemble models at your fingertips</p>
              </div>

              <div style="background: #0f172a; border-radius: 12px; padding: 14px 16px; margin: 0 0 8px; border: 1px solid #1e293b;">
                <p style="color: #f8fafc; font-size: 13px; font-weight: 600; margin: 0;">⭐ Personal Watchlist</p>
                <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Track your favorite stocks in one place</p>
              </div>

              <div style="background: #0f172a; border-radius: 12px; padding: 14px 16px; border: 1px solid #1e293b;">
                <p style="color: #f8fafc; font-size: 13px; font-weight: 600; margin: 0;">📈 Drift Monitoring</p>
                <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">See how accurate our predictions really are</p>
              </div>
            </div>

            <!-- CTA -->
            <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #0f172a; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.03em;">
              Start Exploring →
            </a>

            <!-- Disclaimer -->
            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #1e293b;">
              <p style="color: #475569; font-size: 10px; margin: 0; line-height: 1.5;">
                ⚠️ CROKED is an educational tool for stock analytics.<br>
                Predictions are NOT financial advice. Always do your own research.
              </p>
            </div>
          </div>

          <p style="color: #475569; font-size: 9px; text-align: center; margin-top: 16px;">
            You're receiving this because you registered at CROKED. No action needed if this was you.
          </p>
        </body></html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP(email_host, int(email_port)) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(email_user, email_pass)
            server.sendmail(email_from or email_user, to_email, msg.as_string())

        logger.info(f"Welcome email sent to {to_email}")
        return True

    except Exception as exc:
        logger.error(f"Failed to send welcome email to {to_email}: {exc}")
        return False
