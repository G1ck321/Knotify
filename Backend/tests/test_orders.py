"""Unit tests for the payment-status endpoint in Backend/routers/orders.py.

No database is touched: orders.supabase is monkeypatched per test with a
fake chain that returns a fixture row. Guards the PII whitelist on
GET /api/status/{tx_ref}: the raw orders row must never serialize.
"""
import asyncio

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

import routers.orders as orders


PII_FIELDS = (
    "buyer_name",
    "email_snapshot",
    "phone_snapshot",
    "parentsNumber",
    "room_number",
    "delivery_address",
    "order_details",
    "cart_snapshot",
    "user_id",
)

WHITELIST = {
    "tx_ref",
    "status",
    "amountpaid",
    "items_total",
    "item_count",
    "currency",
    "created_at",
    "paid_at",
}


def _full_row(**overrides):
    """Minimal `orders` row including every PII column."""
    row = {
        "tx_ref": "order_abc123def456",
        "user_id": "user-111",
        "status": "pending",
        "amountpaid": 5000.0,
        "items_total": 4750.0,
        "item_count": 2,
        "currency": "NGN",
        "created_at": "2026-01-15T10:00:00+00:00",
        "paid_at": None,
        "buyer_name": "Jane Student",
        "order_details": "2 x Plain Black Tie",
        "cart_snapshot": [{"tie_id": "plain-black", "quantity": 2}],
        "delivery_address": "Daniel Hall",
        "room_number": "D304",
        "email_snapshot": "jane.student@example.edu.ng",
        "phone_snapshot": "0123456789",
        "parentsNumber": "0123456789",
    }
    row.update(overrides)
    return row


class _Result:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, data):
        self._data = data
        self._field = None
        self._value = None

    def select(self, *_args):
        return self

    def eq(self, field, value):
        # Mirror Supabase .eq() semantics so lookups can actually miss.
        self._field = field
        self._value = value
        return self

    def limit(self, *_args):
        return self

    def execute(self):
        if self._field is not None:
            data = [row for row in self._data if row.get(self._field) == self._value]
        else:
            data = self._data
        return _Result(data)


class _Table:
    def __init__(self, data):
        self._data = data

    def select(self, *_args):
        return _Query(self._data)


class _FakeSupabase:
    def __init__(self, data):
        self._data = data

    def table(self, _name):
        return _Table(self._data)


def test_status_response_never_leaks_buyer_pii(monkeypatch):
    monkeypatch.setattr(orders, "supabase", _FakeSupabase([_full_row()]))
    result = asyncio.run(orders.get_order_by_tx_ref("order_abc123def456"))
    payload = result.model_dump()
    assert set(payload) == WHITELIST
    for field in PII_FIELDS:
        assert field not in payload


def test_status_response_keeps_fields_checkout_needs(monkeypatch):
    monkeypatch.setattr(orders, "supabase", _FakeSupabase([_full_row()]))
    result = asyncio.run(orders.get_order_by_tx_ref("order_abc123def456"))
    payload = result.model_dump()
    # The SPA's post-redirect poll only reads status, but amounts and the
    # reference stay available for the receipt/debugging.
    assert payload["tx_ref"] == "order_abc123def456"
    assert payload["status"] == "pending"
    assert payload["amountpaid"] == 5000.0
    assert payload["item_count"] == 2


def test_status_response_tolerates_missing_paid_at(monkeypatch):
    row = _full_row(paid_at=None)
    del row["paid_at"]
    monkeypatch.setattr(orders, "supabase", _FakeSupabase([row]))
    result = asyncio.run(orders.get_order_by_tx_ref("order_abc123def456"))
    assert result.model_dump()["paid_at"] is None


def test_unknown_tx_ref_returns_404(monkeypatch):
    monkeypatch.setattr(orders, "supabase", _FakeSupabase([]))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(orders.get_order_by_tx_ref("order_missing"))
    assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Wire-level: FastAPI's response_model must strip PII even at the HTTP layer
# ---------------------------------------------------------------------------
def test_http_status_endpoint_strips_pii(monkeypatch):
    monkeypatch.setattr(orders, "supabase", _FakeSupabase([_full_row()]))
    app = FastAPI()
    app.include_router(orders.router)
    client = TestClient(app)

    resp = client.get("/api/status/order_abc123def456")
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == WHITELIST
    for field in PII_FIELDS:
        assert field not in body

    missing = client.get("/api/status/order_missing")
    assert missing.status_code == 404
