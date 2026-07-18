"""Payment processing module.

Settles the fare on a completed ride booking. The passenger is the payer and
the driver is the payee; whatever the method (cash, card, UPI, or wallet), a
successful payment marks the booking PAID and credits the fare into the driver's
wallet. Card and UPI go through Razorpay Checkout; wallet payments also debit
the passenger's balance. Depends on ``payment_gateway`` for Razorpay,
``wallet`` for the balance transfers, and ``ride_coordination`` for the booking.
"""
