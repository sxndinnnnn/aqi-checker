"""
Threshold-breach email alerts via Resend (https://resend.com). Degrades to a
logged no-op stub when RESEND_API_KEY / ALERT_EMAIL_TO aren't configured -
same graceful-degradation pattern as db.py and OPENROUTER_API_KEY.
"""
import os
import requests

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO")
# Resend's shared sandbox sender - works without verifying a custom domain,
# fine for a project this size. Override with ALERT_EMAIL_FROM once a
# verified sending domain exists.
ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "onboarding@resend.dev")

RESEND_URL = "https://api.resend.com/emails"


def is_configured() -> bool:
    return bool(RESEND_API_KEY and ALERT_EMAIL_TO)


def send_threshold_alert(city_name: str, breaches: list[dict]):
    """breaches: [{"metric": str, "value": float, "threshold": float, "unit": str}, ...].
    Best-effort - never raises, so a notification failure can't break data collection."""
    if not breaches:
        return

    if not is_configured():
        print(f"[alert stub] Resend not configured - would have alerted for {city_name}: {breaches}")
        return

    lines = [f"- {b['metric']}: {b['value']} {b['unit']} (threshold {b['threshold']} {b['unit']})" for b in breaches]
    body = f"Threshold breach detected in {city_name}:\n\n" + "\n".join(lines)

    try:
        response = requests.post(
            RESEND_URL,
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": ALERT_EMAIL_FROM,
                "to": [ALERT_EMAIL_TO],
                "subject": f"Air quality alert: {city_name}",
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to send threshold alert email: {e}")
