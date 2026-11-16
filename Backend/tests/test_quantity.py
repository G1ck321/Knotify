"""Short unit tests for the discount pricing in Backend/routers/quantity.py.

No database is touched: the Supabase-backed _paid_user_metrics() and
get_tie_by_id() are monkeypatched per test.
"""
import pytest
from fastapi import HTTPException

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
# Per-tie discounts come from `ties.discount_price` (see _valid_discount_price)
# ---------------------------------------------------------------------------
def test_promo_tie_is_charged_its_discount_price(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(2))
    # Row: price 2100, discount_price 1700 -> the discount is what is charged.
    assert quantity.disount_logic(_row(), "Plain Black Tie") == 1700


def test_any_tie_can_carry_its_own_discount(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(0))
    # Discounts are per row now, not restricted to a hard-coded promo list.
    assert quantity.disount_logic(
        _row(tie_id="corp-blue-floral", tie_name="Blue Floral Corporate Tie"),
        "Blue Floral Corporate Tie",
    ) == 1700


def test_missing_discount_price_falls_back_to_regular(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(3))
    row = _row(discount_price=None)
    assert quantity.disount_logic(row, "Plain Black Tie") == 2100  # not free


def test_missing_all_prices_returns_zero(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(3))
    row = _row(price=None, discount_price=None)
    assert quantity.disount_logic(row, "Plain Black Tie") == 0


# ---------------------------------------------------------------------------
# compute_order_total charges exactly what the storefront displays
# ---------------------------------------------------------------------------
def test_compute_order_total_uses_the_discounted_price(monkeypatch):
    monkeypatch.setattr(quantity, "_paid_user_metrics", _paid_users(2))
    monkeypatch.setattr(
        quantity,
        "get_tie_by_id",
        lambda tie_id: _row(tie_id=tie_id),
    )
    cart = [{"tie_id": "new-plain-black", "quantity": 2}]
    assert quantity.compute_order_total(cart) == 1700 * 2


# ---------------------------------------------------------------------------
# Inventory RPC calls stay on the pre-pic-request signatures
# ---------------------------------------------------------------------------
def _install_fake_supabase(monkeypatch, handler):
    """Replace quantity.supabase and record every rpc(name, params) call."""
    calls = []

    class _Rpc:
        def __init__(self, params):
            self.params = params
            self.data = None

        def execute(self):
            # The real client raises here, not when the builder is created.
            self.data = handler(self.params)
            return self

    class _Client:
        def rpc(self, name, params):
            calls.append((name, dict(params)))
            return _Rpc(params)

    monkeypatch.setattr(quantity, "supabase", _Client())
    return calls


class _FakeAPIError(Exception):
    """Shape-match postgrest.exceptions.APIError (message + code)."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


_ITEM = [{"tie_id": "new-plain-black", "quantity": 1}]
_ROWS = [
    {
        "tie_id": "new-plain-black",
        "requested_quantity": 1,
        "available_quantity": 4,
        "available": True,
    }
]
def test_availability_calls_the_single_argument_rpc(monkeypatch):
    calls = _install_fake_supabase(monkeypatch, lambda params: _ROWS)

    assert quantity.check_inventory_availability(_ITEM) == _ROWS
    assert calls == [("check_inventory_availability", {"p_items": _ITEM})]


def test_availability_propagates_rpc_errors(monkeypatch):
    def handler(params):
        raise _FakeAPIError("42P01", 'relation "ties" does not exist')

    _install_fake_supabase(monkeypatch, handler)
    with pytest.raises(_FakeAPIError):
        quantity.check_inventory_availability(_ITEM)


def test_reserve_uses_the_three_argument_rpc(monkeypatch):
    calls = _install_fake_supabase(monkeypatch, lambda params: None)

    quantity.reserve_inventory("tx-1", _ITEM)
    assert calls == [
        ("reserve_inventory", {"p_tx_ref": "tx-1", "p_items": _ITEM, "p_minutes": quantity.HOLD_MINUTES})
    ]


def test_reserve_reports_conflict_when_the_rpc_fails(monkeypatch):
    def handler(params):
        raise _FakeAPIError("P0001", "INSUFFICIENT_STOCK:new-plain-black:1:0")

    _install_fake_supabase(monkeypatch, handler)
    with pytest.raises(HTTPException) as excinfo:
        quantity.reserve_inventory("tx-1", _ITEM)

    assert excinfo.value.status_code == 409


# ---------------------------------------------------------------------------
# A buyer's OWN active hold never counts against them
# ---------------------------------------------------------------------------
_HELD_ROW = [
    {
        "tie_id": "new-plain-black",
        "requested_quantity": 1,
        "available_quantity": 0,
        "available": False,
    }
]


def test_availability_adds_back_the_buyers_own_active_hold(monkeypatch):
    _install_fake_supabase(monkeypatch, lambda params: [dict(_HELD_ROW[0])])
    monkeypatch.setattr(quantity, "own_held_quantities", lambda user_id: {"new-plain-black": 1})

    rows = quantity.check_inventory_availability(_ITEM, user_id="user-1")

    assert rows[0]["available_quantity"] == 1
    assert rows[0]["available"] is True


def test_availability_keeps_other_buyers_holds(monkeypatch):
    # available_quantity 0 stays 0 when the caller holds nothing.
    _install_fake_supabase(monkeypatch, lambda params: [dict(_HELD_ROW[0])])
    monkeypatch.setattr(quantity, "own_held_quantities", lambda user_id: {})

    rows = quantity.check_inventory_availability(_ITEM, user_id="user-1")

    assert rows[0]["available_quantity"] == 0
    assert rows[0]["available"] is False


def test_availability_for_guests_never_looks_up_own_holds(monkeypatch):
    seen = []
    _install_fake_supabase(monkeypatch, lambda params: _ROWS)
    monkeypatch.setattr(
        quantity, "own_held_quantities", lambda user_id: seen.append(user_id) or {}
    )

    assert quantity.check_inventory_availability(_ITEM) == _ROWS
    assert seen == [None]


def test_release_superseded_holds_spares_the_new_attempt(monkeypatch):
    monkeypatch.setattr(
        quantity, "_own_pending_tx_refs", lambda user_id: ["order-old", "order-new"]
    )
    released = []
    monkeypatch.setattr(quantity, "release_inventory_hold", lambda ref: released.append(ref))

    quantity.release_superseded_holds("user-1", "order-new")

    assert released == ["order-old"]


def test_release_superseded_holds_is_a_noop_without_a_buyer(monkeypatch):
    monkeypatch.setattr(quantity, "_own_pending_tx_refs", lambda user_id: ["never"])
    released = []
    monkeypatch.setattr(quantity, "release_inventory_hold", lambda ref: released.append(ref))

    quantity.release_superseded_holds(None, "order-new")

    assert released == []
