"""Message and subject builders for outbound notifications.

Kept separate from delivery so the wording of every email/WhatsApp message
lives in one place. Phase 1 uses the account templates; ride-lifecycle and
payment templates are added by later phases.
"""

from source.modules.notifications.email_delivery_service import OutboundEmail
from source.modules.notifications.notification_contracts import (
    PaymentNotificationDetails,
)


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


def build_payment_success_email(
    *, details: PaymentNotificationDetails, platform_name: str
) -> OutboundEmail:
    """Confirm a completed fare payment to the passenger who paid."""
    body_text = (
        f"Hi {details.payer_full_name},\n\n"
        f"Your fare payment was successful.\n"
        f"  Ride:   {details.route_summary}\n"
        f"  Amount: {details.currency} {details.amount:.2f}\n"
        f"  Method: {details.method}\n\n"
        f"Thank you for riding with {platform_name}.\n\n"
        f"— The {platform_name} team"
    )
    return OutboundEmail(
        to_address=details.payer_email or "",
        to_name=details.payer_full_name,
        subject=f"Payment received — {platform_name}",
        body_text=body_text,
    )


def build_payment_failed_email(
    *, details: PaymentNotificationDetails, platform_name: str
) -> OutboundEmail:
    """Tell the passenger a fare payment did not go through, without gateway detail."""
    body_text = (
        f"Hi {details.payer_full_name},\n\n"
        f"We could not complete your fare payment.\n"
        f"  Ride:   {details.route_summary}\n"
        f"  Amount: {details.currency} {details.amount:.2f}\n\n"
        f"No money has been charged. Please retry from the Raahi app.\n\n"
        f"— The {platform_name} team"
    )
    return OutboundEmail(
        to_address=details.payer_email or "",
        to_name=details.payer_full_name,
        subject=f"Payment could not be completed — {platform_name}",
        body_text=body_text,
    )


def build_payment_success_whatsapp_message(
    details: PaymentNotificationDetails,
) -> str:
    """Short WhatsApp confirmation of a successful fare payment."""
    return (
        f"Hi {details.payer_full_name}, we received your "
        f"{details.currency} {details.amount:.0f} fare payment "
        f"({details.method}) for {details.route_summary}. Thank you!"
    )
