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


def build_organization_registration_received_email(
    *,
    administrator_name: str,
    organization_name: str,
    administrator_email: str,
    platform_name: str,
) -> OutboundEmail:
    """Acknowledge a company registration that is now awaiting review."""
    body_text = (
        f"Hi {administrator_name},\n\n"
        f"Thank you for registering {organization_name} on {platform_name}.\n\n"
        f"Your request has been received and is now awaiting review by the "
        f"{platform_name} team. Once it is approved you will receive a second "
        f"email with your administrator sign-in credentials.\n\n"
        f"We will contact you at {administrator_email}.\n\n"
        f"— The {platform_name} team"
    )
    return OutboundEmail(
        to_address=administrator_email,
        to_name=administrator_name,
        subject=f"{organization_name} registration received — {platform_name}",
        body_text=body_text,
    )


def build_organization_approved_email(
    *,
    administrator_name: str,
    organization_name: str,
    login_email: str,
    temporary_password: str,
    login_url: str,
    platform_name: str,
) -> OutboundEmail:
    """Notify a company admin their organization is approved, with credentials."""
    body_text = (
        f"Hi {administrator_name},\n\n"
        f"Good news — {organization_name} has been approved on {platform_name}.\n\n"
        f"Sign in to the administration portal with these temporary credentials:\n"
        f"  Email:    {login_email}\n"
        f"  Password: {temporary_password}\n\n"
        f"You will be asked to set a new password on first login.\n"
        f"Sign in here: {login_url}\n\n"
        f"— The {platform_name} team"
    )
    return OutboundEmail(
        to_address=login_email,
        to_name=administrator_name,
        subject=f"{organization_name} is approved — welcome to {platform_name}",
        body_text=body_text,
    )


def build_organization_rejected_email(
    *,
    administrator_name: str,
    organization_name: str,
    administrator_email: str,
    rejection_reason: str,
    platform_name: str,
) -> OutboundEmail:
    """Notify a company admin their onboarding request was declined."""
    body_text = (
        f"Hi {administrator_name},\n\n"
        f"We're sorry, but the registration request for {organization_name} on "
        f"{platform_name} could not be approved at this time.\n\n"
        f"Reason: {rejection_reason}\n\n"
        f"If you believe this is a mistake, please reply to this email.\n\n"
        f"— The {platform_name} team"
    )
    return OutboundEmail(
        to_address=administrator_email,
        to_name=administrator_name,
        subject=f"Update on your {organization_name} registration — {platform_name}",
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
