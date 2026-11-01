"""Short unit tests for the discount pricing in Backend/routers/quantity.py.

No database is touched: the Supabase-backed _paid_user_metrics() and
get_tie_by_id() are monkeypatched per test.
"""
import pytest

import routers.quantity as quantity


def _row(**overrides):
    """Minimal `ties` table row."""
    row = {
        "tie_id": "new-plain-black",
        "tie_name": "Plain Black Tie",
        "price": 2100,
        "discount_price": 1700,
        "quantity": 10,
    }
    row.update(overrides)
    return row


def _paid_users(n):
    """Fake _paid_user_metrics(): (paid_orders, unique_paid_users)."""
    return lambda: (n, n)


# ---------------------------------------------------------------------------
# disount_logic with discounts disabled
# ---------------------------------------------------------------------------
def test_promo_tie_uses_regular_price(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(2))
    assert quantity.disount_logic(_row(), "Plain Black Tie") == 2100


def test_non_promo_tie_never_discounted(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(0))
    assert quantity.disount_logic(
        _row(tie_id="corp-blue-floral", tie_name="Blue Floral Corporate Tie"),
        "Blue Floral Corporate Tie",
    ) == 2100


def test_missing_discount_price_falls_back_to_regular(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(3))
    row = _row(discount_price=None)
    assert quantity.disount_logic(row, "Plain Black Tie") == 2100  # not free


def test_missing_all_prices_returns_zero(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(3))
    row = _row(price=None, discount_price=None)
    assert quantity.disount_logic(row, "Plain Black Tie") == 0


# ---------------------------------------------------------------------------
# compute_order_total uses the regular price while discounts are disabled
# ---------------------------------------------------------------------------
def test_compute_order_total_uses_regular_price(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(2))
    monkeypatch.setattr(
        quantity,
        "get_tie_by_id",
        lambda tie_id: _row(tie_id=tie_id),
    )
    cart = [{"tie_id": "new-plain-black", "quantity": 2}]
    assert quantity.compute_order_total(cart) == 2100 * 2
