"""Business workflow for completed-activity Razorpay payments."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.application_configuration import ApplicationConfiguration
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.payment_processing.email_notification_client import (
    PaymentEmailNotificationClient,
)
from source.modules.payment_processing.payment_processing_contracts import (
    CreatePendingPaymentForCompletedActivityRequest,
    CreateRazorpayOrderRequest,
    PaymentStatusResponse,
    RazorpayOrderResponse,
    VerifyRazorpayPaymentRequest,
)
from source.modules.payment_processing.payment_record_model import PaymentRecord
from source.modules.payment_processing.razorpay_gateway_service import RazorpayGatewayService
from source.modules.trip_statistics.trip_record_model import TripRecord
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
)
from source.shared_infrastructure.user_account_role import UserAccountRole

COMPLETED_ACTIVITY_STATUSES = {
    "COMPLETED",
    "FINISHED",
    "ENDED",
    "CLOSED",
    "TRIP_COMPLETED",
    "RIDE_COMPLETED",
    "JOURNEY_COMPLETED",
}
RETRYABLE_PAYMENT_STATUSES = {"pending", "created", "failed", "cancelled"}


class PaymentProcessingService:
    """Coordinates payment records, Razorpay, activity checks, and email events."""

    def __init__(self, configuration: ApplicationConfiguration):
        self.configuration = configuration
        self.razorpay_gateway_service = RazorpayGatewayService(configuration)
        self.email_notification_client = PaymentEmailNotificationClient(configuration)

    async def create_razorpay_order_for_completed_activity(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
        request: CreateRazorpayOrderRequest,
    ) -> RazorpayOrderResponse:
        """Create or reuse a pending payment, then create a Razorpay order."""
        employee_record = self.resolve_employee_for_authenticated_user(
            database_session, current_user
        )
        activity_payment_request = self.resolve_completed_payable_activity(
            database_session=database_session,
            current_user=current_user,
            employee_record=employee_record,
            activity_id=request.activity_id,
            activity_type=request.activity_type,
        )
        payment_record = await self.create_pending_payment_for_completed_activity(
            database_session=database_session,
            organization_id=current_user.organization_id,
            request=activity_payment_request,
            employee_record=employee_record,
        )
        if payment_record.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This activity payment is already completed",
            )

        razorpay_order = await self.razorpay_gateway_service.create_order(
            amount=payment_record.amount,
            currency=payment_record.currency,
            receipt=payment_record.id,
        )
        payment_record.razorpay_order_id = razorpay_order["id"]
        payment_record.status = "created"
        database_session.commit()
        database_session.refresh(payment_record)

        return RazorpayOrderResponse(
            payment_id=payment_record.id,
            razorpay_order_id=payment_record.razorpay_order_id,
            razorpay_key_id=self.configuration.razorpay_key_id,
            amount=self.razorpay_gateway_service.convert_rupees_to_paise(
                payment_record.amount
            ),
            currency=payment_record.currency,
            company_name=self.configuration.razorpay_company_name,
            description=self.configuration.razorpay_company_description,
            theme_color=self.configuration.razorpay_theme_color,
        )

    async def verify_razorpay_payment(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
        request: VerifyRazorpayPaymentRequest,
    ) -> PaymentStatusResponse:
        """Verify Checkout signature and complete payment idempotently."""
        payment_record = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.razorpay_order_id == request.razorpay_order_id,
                PaymentRecord.organization_id == current_user.organization_id,
            )
            .first()
        )
        if payment_record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        self.ensure_payment_access_is_allowed(database_session, current_user, payment_record)

        if payment_record.status == "completed":
            return self.create_payment_status_response(payment_record)

        is_signature_valid = self.razorpay_gateway_service.verify_checkout_signature(
            request.razorpay_order_id,
            request.razorpay_payment_id,
            request.razorpay_signature,
        )
        if not is_signature_valid:
            payment_record.status = "failed"
            payment_record.failure_reason = "Invalid Razorpay payment signature"
            database_session.commit()
            await self.send_payment_failed_email_for_record(database_session, payment_record)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay payment signature",
            )

        payment_record.status = "completed"
        payment_record.razorpay_payment_id = request.razorpay_payment_id
        payment_record.razorpay_signature_reference = request.razorpay_signature[-12:]
        payment_record.failure_reason = None
        payment_record.paid_at = datetime.now(timezone.utc)
        self.mark_related_activity_paid_where_supported(database_session, payment_record)
        database_session.commit()
        database_session.refresh(payment_record)
        await self.send_payment_success_email_for_record(database_session, payment_record)
        return self.create_payment_status_response(payment_record)

    async def create_pending_payment_for_completed_activity(
        self,
        database_session: Session,
        organization_id: str,
        request: CreatePendingPaymentForCompletedActivityRequest,
        employee_record: EmployeeRecord | None = None,
    ) -> PaymentRecord:
        """RAZORPAY_EMPLOYEE_PAYMENT_INTEGRATION MASTER_AGENT_INTEGRATION_POINT TRIGGER_AFTER_COMPLETED_ACTIVITY."""
        payment_record = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.organization_id == organization_id,
                PaymentRecord.activity_id == request.activity_id,
                PaymentRecord.activity_type == request.activity_type,
            )
            .first()
        )
        if payment_record is None:
            payment_record = PaymentRecord(
                organization_id=organization_id,
                employee_id=request.employee_id,
                activity_id=request.activity_id,
                activity_type=request.activity_type,
                amount=request.amount,
                currency=request.currency,
                status="pending",
                payment_metadata=request.metadata,
            )
            database_session.add(payment_record)
            database_session.commit()
            database_session.refresh(payment_record)
            if employee_record is not None:
                await self.send_payment_pending_email_for_record(
                    database_session, payment_record, employee_record
                )
        return payment_record

    def resolve_completed_payable_activity(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
        employee_record: EmployeeRecord,
        activity_id: str,
        activity_type: str,
    ) -> CreatePendingPaymentForCompletedActivityRequest:
        """Resolve payable amount from backend-owned activity data."""
        if activity_type.lower() != "trip":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported activity type for current repository",
            )
        trip_record = (
            database_session.query(TripRecord)
            .filter(
                TripRecord.id == activity_id,
                TripRecord.organization_id == current_user.organization_id,
            )
            .first()
        )
        if trip_record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        if trip_record.driver_employee_id != employee_record.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Activity is not payable by this employee")
        if trip_record.status.upper() not in COMPLETED_ACTIVITY_STATUSES:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Activity is not completed yet")
        if trip_record.trip_cost <= 0:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Activity does not have a payable amount")
        return CreatePendingPaymentForCompletedActivityRequest(
            employee_id=employee_record.id,
            activity_id=trip_record.id,
            activity_type="trip",
            amount=trip_record.trip_cost,
            currency=self.configuration.razorpay_currency,
            metadata={
                "activity_reference": trip_record.id,
                "route_summary": f"{trip_record.start_location_name} to {trip_record.end_location_name}",
                "completed_at": trip_record.completed_at.isoformat() if trip_record.completed_at else None,
            },
        )

    def resolve_employee_for_authenticated_user(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
    ) -> EmployeeRecord:
        """Find the employee record linked to the current authenticated user."""
        employee_record = (
            database_session.query(EmployeeRecord)
            .filter(
                EmployeeRecord.user_account_id == current_user.user_account_id,
                EmployeeRecord.organization_id == current_user.organization_id,
            )
            .first()
        )
        if employee_record is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee account is required for payments")
        return employee_record

    def ensure_payment_access_is_allowed(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
        payment_record: PaymentRecord,
    ) -> None:
        """Allow the owning employee or authorized administrators to inspect a payment."""
        if current_user.role in {UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN}:
            return
        employee_record = self.resolve_employee_for_authenticated_user(
            database_session, current_user
        )
        if payment_record.employee_id != employee_record.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Payment access denied")

    def get_payment_status_for_user(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
        payment_id: str,
    ) -> PaymentStatusResponse:
        """Return one payment status if the caller may view it."""
        payment_record = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.id == payment_id,
                PaymentRecord.organization_id == current_user.organization_id,
            )
            .first()
        )
        if payment_record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        self.ensure_payment_access_is_allowed(database_session, current_user, payment_record)
        return self.create_payment_status_response(payment_record)

    def list_my_payments(
        self,
        database_session: Session,
        current_user: AuthenticatedUserContext,
    ) -> list[PaymentStatusResponse]:
        """Return payment history for the authenticated employee."""
        employee_record = self.resolve_employee_for_authenticated_user(
            database_session, current_user
        )
        payment_records = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.organization_id == current_user.organization_id,
                PaymentRecord.employee_id == employee_record.id,
            )
            .order_by(PaymentRecord.created_at.desc())
            .all()
        )
        return [
            self.create_payment_status_response(payment_record)
            for payment_record in payment_records
        ]

    def create_payment_status_response(self, payment_record: PaymentRecord) -> PaymentStatusResponse:
        """Convert a database record into the public API contract."""
        return PaymentStatusResponse(
            id=payment_record.id,
            employee_id=payment_record.employee_id,
            activity_id=payment_record.activity_id,
            activity_type=payment_record.activity_type,
            amount=payment_record.amount,
            currency=payment_record.currency,
            status=payment_record.status,
            razorpay_order_id=payment_record.razorpay_order_id,
            razorpay_payment_id=payment_record.razorpay_payment_id,
            failure_reason=payment_record.failure_reason,
            metadata=payment_record.payment_metadata,
            created_at=payment_record.created_at,
            updated_at=payment_record.updated_at,
            paid_at=payment_record.paid_at,
            is_retry_available=payment_record.status in RETRYABLE_PAYMENT_STATUSES,
        )

    def mark_related_activity_paid_where_supported(
        self, database_session: Session, payment_record: PaymentRecord
    ) -> None:
        """Mark a related activity paid if the current model supports it."""
        if payment_record.activity_type != "trip":
            return
        trip_record = database_session.get(TripRecord, payment_record.activity_id)
        if trip_record is not None and hasattr(trip_record, "payment_status"):
            setattr(trip_record, "payment_status", "paid")

    def build_payment_email_payload(
        self,
        database_session: Session,
        payment_record: PaymentRecord,
        employee_record: EmployeeRecord | None = None,
    ) -> dict:
        """Build safe payment email data."""
        if employee_record is None:
            employee_record = database_session.get(EmployeeRecord, payment_record.employee_id)
        metadata = payment_record.payment_metadata or {}
        return {
            "employeeName": employee_record.full_name if employee_record else "Employee",
            "employeeEmail": employee_record.email if employee_record else "",
            "activityReference": metadata.get("activity_reference", payment_record.activity_id),
            "activityType": payment_record.activity_type,
            "routeSummary": metadata.get("route_summary", ""),
            "completionDate": metadata.get("completed_at", ""),
            "amount": payment_record.amount,
            "currency": payment_record.currency,
            "paymentStatus": payment_record.status,
            "paymentPageUrl": self.configuration.payment_page_url,
            "platformName": self.configuration.razorpay_company_name,
            "razorpayPaymentId": payment_record.razorpay_payment_id,
            "paidAt": payment_record.paid_at.isoformat() if payment_record.paid_at else "",
        }

    async def send_payment_pending_email_for_record(
        self,
        database_session: Session,
        payment_record: PaymentRecord,
        employee_record: EmployeeRecord,
    ) -> None:
        """Send pending email if configured."""
        await self.email_notification_client.send_payment_pending_email(
            self.build_payment_email_payload(database_session, payment_record, employee_record)
        )

    async def send_payment_success_email_for_record(
        self, database_session: Session, payment_record: PaymentRecord
    ) -> None:
        """Send success email after committed payment completion."""
        await self.email_notification_client.send_payment_success_email(
            self.build_payment_email_payload(database_session, payment_record)
        )

    async def send_payment_failed_email_for_record(
        self, database_session: Session, payment_record: PaymentRecord
    ) -> None:
        """Send failed email without exposing gateway-sensitive details."""
        await self.email_notification_client.send_payment_failed_email(
            self.build_payment_email_payload(database_session, payment_record)
        )

