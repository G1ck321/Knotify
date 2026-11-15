"""Single source of truth for every amount Knotify charges.

The old copy drifted constantly (the pic fee was 150 in code, 100 in tests and
100 in the Telegram message), so any number that ends up on a Flutterwave
session must live here and nowhere else.

Both add-on charges are SERVICE charges, not goods: they are non-refundable
because they pay for work that is delivered at the moment of sale (taking and
sending the photo, running the platform and hosting). Goods remain refundable
under normal consumer-protection rules - never conflate the two in copy.
"""

from __future__ import annotations

# "Request a knotted tie pic" - covers delivery of the photo and the service
# (development, platform) behind it. Non-refundable once the photo is sent.
PIC_FEE: float = 200.0

# Optional priority restock/delivery alerts add-on. Charged once per order when
# the checkout payload says email_updates=true, which the UI does by default:
# the fee is included in the displayed total and the buyer removes it with the
# tick box under the Pay button (email_updates=false). It is not the receipt
# email: that is required, always sent, and free, so this fee must never be
# presented as a cost of being contacted.
UPDATES_FEE: float = 100.0

# Flat hall-delivery + handoff fee added to every order server-side.
DELIVERY_FEE: float = 200.0

# Hard cap on how many of ONE tie a single order may contain. Stops one buyer
# clearing the shelf and keeps the per-line stock check meaningful.
MAX_PER_TIE: int = 4

__all__ = ["PIC_FEE", "UPDATES_FEE", "DELIVERY_FEE", "MAX_PER_TIE"]
