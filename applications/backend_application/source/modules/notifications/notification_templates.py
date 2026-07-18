"""Message and subject builders for outbound notifications.

Kept separate from delivery so the wording of every email/WhatsApp message
lives in one place. Phase 1 uses the account templates; ride-lifecycle and
payment templates are added by later phases.
"""

from source.modules.notifications.email_delivery_service import OutboundEmail


def build_temporary_password_email(
    *,
    full_name: str,
    login_email: str,
    temporary_password: str,
    login_url: str,
    platform_name: str,
) -> OutboundEmail:
    """Email an admin-provisioned employee their first-login credentials."""
    body_text = (
        f"Hi {full_name},\n\n"
        f"An account has been created for you on {platform_name}, your "
        f"organization's carpooling platform.\n\n"
        f"Sign in with these temporary credentials:\n"
        f"  Email:    {login_email}\n"
        f"  Password: {temporary_password}\n\n"
        f"You will be asked to set a new password on first login.\n"
        f"Sign in here: {login_url}\n\n"
        f"If you did not expect this email, please contact your administrator.\n\n"
        f"— The {platform_name} team"
    )
    return OutboundEmail(
        to_address=login_email,
        to_name=full_name,
        subject=f"Your {platform_name} account is ready",
        body_text=body_text,
    )
