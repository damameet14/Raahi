"""Input and output contracts for the wallet module."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

WalletTransactionType = Literal["RECHARGE", "RIDE_PAYMENT", "RIDE_EARNING"]
WalletTransactionDirection = Literal["CREDIT", "DEBIT"]
WalletTransactionStatus = Literal["PENDING", "COMPLETED", "FAILED"]


class WalletBalanceResponse(BaseModel):
    """The current spendable balance for one employee."""

    employee_id: str
    balance_amount: float
    currency: str


class WalletTransactionResponse(BaseModel):
    """One ledger entry as returned to the wallet owner."""

    id: str
    transaction_type: WalletTransactionType
    direction: WalletTransactionDirection
    amount: float
    balance_after: float | None
    status: WalletTransactionStatus
    reference_type: str | None
    reference_id: str | None
    description: str | None
    created_at: datetime


class CreateWalletRechargeOrderRequest(BaseModel):
    """Request to top up the wallet by a rupee amount via Razorpay."""

    amount: float = Field(gt=0)


class WalletRechargeOrderResponse(BaseModel):
    """Frontend-safe Razorpay Checkout details for a wallet top-up."""

    transaction_id: str
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int
    currency: str
    company_name: str
    description: str
    theme_color: str


class VerifyWalletRechargeRequest(BaseModel):
    """Razorpay Checkout response returned to verify a wallet recharge."""

    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
