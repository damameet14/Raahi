# Wallet

## Module purpose

Owns each employee's spendable balance and the append-only ledger that explains
how it reached its current value.

## Owned responsibilities

- Persisting one `WalletRecord` (balance) per employee and the
  `WalletTransactionRecord` ledger behind it.
- Crediting and debiting balances, always with a matching ledger entry and a
  `balance_after` snapshot.
- Wallet top-up (RECHARGE) via Razorpay: creating an order and a pending ledger
  entry, then verifying the Checkout signature and crediting on success.
- Serving the balance and ledger to the owning employee.

## Responsibilities not owned

- Deciding when a fare is due or who pays whom (payment_processing).
- Talking to Razorpay directly (payment_gateway).
- Employee identity (employee_management).

## Public operations

HTTP, prefix `/api/v1/wallet`, authenticated EMPLOYEE:

- `GET /wallet` — current balance.
- `GET /wallet/transactions` — ledger, newest first.
- `POST /wallet/recharge/orders` — create a Razorpay top-up order.
- `POST /wallet/recharge/verify` — verify and credit a top-up.

Cross-module (`public_interface.py`), used by payment_processing within the
caller's transaction (flush, no commit):

- `credit_wallet_for_ride_earning(...)` — credit a driver's fare earning.
- `debit_wallet_for_ride_payment(...)` — debit a passenger's fare payment;
  raises `InsufficientWalletBalanceError`.

## Internal responsibility map

```text
wallet_record_model.py             - balance per employee
wallet_transaction_record_model.py - append-only ledger entries
wallet_contracts.py                - Pydantic request/result contracts
wallet_service.py                  - balance mutation, ledger, recharge workflow
wallet_http_routes.py              - balance/ledger/recharge endpoints
public_interface.py                - cross-module ride transfer helpers
```

## Dependencies and side effects

- Depends on `payment_gateway` for Razorpay order creation and signature checks.
- Writes to `wallet_records` and `wallet_transaction_records`.

## Invariants and security-sensitive rules

- Exactly one wallet per (organization, employee) — unique constraint.
- `debit_wallet_balance` never lets a balance go negative; it raises instead.
- Every completed balance change writes a ledger entry with `balance_after`.
- Recharge credits only after the Razorpay signature verifies; a duplicate
  verify is idempotent (already-COMPLETED recharges are not re-credited).
- All queries are scoped to the caller's organization and employee.

## Tests

`tests/test_payment_and_wallet.py` covers credit/debit balance and ledger
updates and the insufficient-balance guard against in-memory SQLite.
