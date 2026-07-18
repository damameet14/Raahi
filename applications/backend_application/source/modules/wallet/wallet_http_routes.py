"""FastAPI routes for employee wallet balance, ledger, and recharge."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.application_startup.database_connection import get_database_session
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.current_employee_http_dependency import (
    resolve_current_employee,
)
from source.modules.payment_gateway.public_interface import RazorpayGatewayService
from source.modules.wallet.wallet_contracts import (
    CreateWalletRechargeOrderRequest,
    VerifyWalletRechargeRequest,
    WalletBalanceResponse,
    WalletRechargeOrderResponse,
    WalletTransactionResponse,
)
from source.modules.wallet.wallet_service import (
    WalletRechargeNotFoundError,
    create_wallet_recharge_order,
    get_wallet_balance,
    list_wallet_transactions,
    verify_wallet_recharge,
)
from source.shared_infrastructure.application_configuration_dependency import (
    get_application_configuration,
)

wallet_router = APIRouter(prefix="/api/v1/wallet", tags=["Wallet"])


@wallet_router.get("", response_model=WalletBalanceResponse)
def get_my_wallet_balance(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the authenticated employee's current wallet balance."""
    return get_wallet_balance(
        database_session,
        organization_id=employee.organization_id,
        employee_id=employee.id,
    )


@wallet_router.get(
    "/transactions", response_model=list[WalletTransactionResponse]
)
def list_my_wallet_transactions(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the authenticated employee's wallet ledger, newest first."""
    return list_wallet_transactions(
        database_session,
        organization_id=employee.organization_id,
        employee_id=employee.id,
    )


@wallet_router.post(
    "/recharge/orders", response_model=WalletRechargeOrderResponse
)
async def create_my_wallet_recharge_order(
    request: CreateWalletRechargeOrderRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(
        get_application_configuration
    ),
):
    """Create a Razorpay order to top up the authenticated employee's wallet."""
    return await create_wallet_recharge_order(
        database_session,
        RazorpayGatewayService(configuration),
        configuration,
        organization_id=employee.organization_id,
        employee_id=employee.id,
        request=request,
    )


@wallet_router.post("/recharge/verify", response_model=WalletBalanceResponse)
def verify_my_wallet_recharge(
    request: VerifyWalletRechargeRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(
        get_application_configuration
    ),
):
    """Verify a Razorpay recharge and credit the wallet on success."""
    try:
        return verify_wallet_recharge(
            database_session,
            RazorpayGatewayService(configuration),
            organization_id=employee.organization_id,
            employee_id=employee.id,
            request=request,
        )
    except WalletRechargeNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending wallet recharge matches this order",
        )
