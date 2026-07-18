"""Public interface for the wallet module.

Fare settlement in ``payment_processing`` moves money through the two ride
helpers below; both flush within the caller's transaction so a fare transfer
commits atomically with the payment record. Route-facing balance, ledger, and
recharge operations are also exported here.
"""

from source.modules.wallet.wallet_contracts import (
    CreateWalletRechargeOrderRequest,
    VerifyWalletRechargeRequest,
    WalletBalanceResponse,
    WalletRechargeOrderResponse,
    WalletTransactionResponse,
)
from source.modules.wallet.wallet_service import (
    InsufficientWalletBalanceError,
    WalletRechargeNotFoundError,
    create_wallet_recharge_order,
    credit_wallet_for_ride_earning,
    debit_wallet_for_ride_payment,
    get_wallet_balance,
    list_wallet_transactions,
    verify_wallet_recharge,
)

__all__ = [
    "CreateWalletRechargeOrderRequest",
    "VerifyWalletRechargeRequest",
    "WalletBalanceResponse",
    "WalletRechargeOrderResponse",
    "WalletTransactionResponse",
    "InsufficientWalletBalanceError",
    "WalletRechargeNotFoundError",
    "create_wallet_recharge_order",
    "credit_wallet_for_ride_earning",
    "debit_wallet_for_ride_payment",
    "get_wallet_balance",
    "list_wallet_transactions",
    "verify_wallet_recharge",
]
