"""Wallet module.

Owns each employee's spendable balance and the append-only ledger behind it.
Balances change through three transaction types: RECHARGE (top-up via Razorpay),
RIDE_PAYMENT (a passenger paying a fare from their balance), and RIDE_EARNING
(a driver receiving a fare into their balance). Fare settlement in
``payment_processing`` credits driver earnings through this module's public
interface; wallet recharge is self-contained here.
"""
