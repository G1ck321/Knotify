"""Unit tests for Feature C (knotted-tie-pic requests).

No database is touched: pic_requests.supabase is monkeypatched with a fake
chain. These tests lock in the three rules that are easy to regress:

  * every pic request carries a 100 NGN obligation, and the fee total is a
    server-side sum - nothing the browser sends can change it;
  * one buyer matched through several identities (account id, email, device
    key) is still charged ONCE, not three times;
  * the device key and pic_keys payload are shape-checked, so the lookup
    cannot be used as an open-ended query parameter.
"""

import pytest

import routers.pic_requests as pic_requests
from request_models import CheckoutRequest, OrderCreateRequest
from routers.pic_requests import PicRequestCreate, _derive_tx_ref, pic_fee_total


def _row(**overrides):
    row = {
        "tx_ref": "pic_aaa",
        "token": "token-a",
        "tie_id": "vnt-rwb-sequence",
        "user_id": None,
        "email": None,
        "client_key": "device-key-0123456789",
        "status": "requested",
        "fee_status": "unpaid",
        "price": 100,
    }
    row.update(overrides)
    return row


class _Result:
    def __init__(self, data):
        self.data = data


class _FakeQuery:
    """Stands in for supabase-py's chained query builder."""

    def __init__(self, rows):
        self._rows = rows
        self._filters = {}

    def select(self, *args, **kwargs):
        return self

    def eq(self, key, value):
        self._filters[key] = value
        return self

    def ilike(self, key, value):
        self._filters[key] = value
        return self

    def in_(self, key, value):
        self._filters[key] = value
        return self

    def limit(self, _value):
        return self

    def execute(self):
        rows = self._rows
        for key, expected in self._filters.items():
            if isinstance(expected, list):
                rows = [row for row in rows if row.get(key) in expected]
            else:
                rows = [
                    row
                    for row in rows
                    if str(row.get(key) or "").lower() == str(expected).lower()
                ]
        return _Result(rows)


class _FakeTable:
    def __init__(self, rows):
        self._rows = rows

    def select(self, *args, **kwargs):
        return _FakeQuery(self._rows)


class _FakeSupabase:
    def __init__(self, rows):
        self._rows = rows

    def table(self, _name):
        return _FakeTable(self._rows)


@pytest.fixture
def fake_rows(monkeypatch):
    rows = [
        _row(tx_ref="pic_one", user_id="user-1", email=None, client_key="device-key-0123456789"),
        _row(tx_ref="pic_two", user_id=None, email="jane@example.com", client_key="device-key-0987654321"),
        _row(tx_ref="pic_paid", user_id="user-1", fee_status="paid"),
    ]
    monkeypatch.setattr(pic_requests, "supabase", _FakeSupabase(rows))
    return rows


def test_pic_fee_total_is_one_hundred_per_unpaid_request():
    assert pic_fee_total([_row(), _row(tx_ref="pic_b")]) == 200
    assert pic_fee_total([]) == 0


def test_matching_identities_are_deduped_so_the_buyer_is_charged_once(fake_rows):
    # Same request is reachable through user id AND device key.
    collected = pic_requests.collect_unpaid_pic_requests(
        user_id="user-1",
        email=None,
        client_keys=["device-key-0123456789"],
    )

    tx_refs = [row["tx_ref"] for row in collected]
    assert tx_refs.count("pic_one") == 1
    assert "pic_paid" not in tx_refs  # already paid -> never recharged
    assert pic_fee_total(collected) == 100


def test_email_match_covers_a_guest_who_never_sends_a_device_key(fake_rows):
    collected = pic_requests.collect_unpaid_pic_requests(email="Jane@Example.com")
    assert [row["tx_ref"] for row in collected] == ["pic_two"]
    assert pic_fee_total(collected) == 100


def test_derived_tx_ref_is_deterministic_per_device_and_tie():
    key = "device-key-0123456789"
    assert _derive_tx_ref(key, "tie-a") == _derive_tx_ref(key, "tie-a")
    assert _derive_tx_ref(key, "tie-a") != _derive_tx_ref(key, "tie-b")
    assert _derive_tx_ref(key, "tie-a").startswith("pic_")


def test_client_key_must_be_an_unguessable_bearer_secret():
    with pytest.raises(ValueError):
        PicRequestCreate(tie_id="tie-a", client_key="too-short")

    with pytest.raises(ValueError):
        PicRequestCreate(tie_id="tie-a", client_key="spaces are not allowed here!!")

    ok = PicRequestCreate(tie_id="tie-a", client_key="abcdefghijklmnop1234")
    assert ok.client_key == "abcdefghijklmnop1234"


def test_checkout_payload_cleans_and_caps_pic_keys():
    payload = OrderCreateRequest(
        name="Jane Student",
        email="jane@example.com",
        telegramPhone="08030000000",
        parentsNumber="08030000001",
        address="Daniel Hall",
        roomNumber="D304",
        items=[{"item_id": "tie-a", "name": "Plain Black Tie", "quantity": 1, "unit_price": 2500}],
        amount=2500,
        client_key="abcdefghijklmnop1234",
        pic_keys=["abcdefghijklmnop1234", "bad key!!", "x", "y" * 70],
    )

    # Only the well-formed keys survive; the shape check is what stops this
    # field from becoming an arbitrary lookup parameter.
    assert payload.pic_keys == ["abcdefghijklmnop1234"]
    assert payload.client_key == "abcdefghijklmnop1234"


def test_checkout_payload_tolerates_a_missing_client_key():
    payload = CheckoutRequest(
        name="Jane Student",
        email="jane@example.com",
        telegramPhone="08030000000",
        parentsNumber="08030000001",
        address="Daniel Hall",
        roomNumber="D304",
        items=[{"item_id": "tie-a", "name": "Plain Black Tie", "quantity": 1, "unit_price": 2500}],
        amount=2500,
    )
    assert payload.client_key is None
    assert payload.pic_keys == []
