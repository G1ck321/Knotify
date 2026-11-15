"""Rules that cost money or hide stock when they regress.

Four behaviours are locked in here:

  * email is REQUIRED on the checkout payload (receipt + order updates) and is
    validated as an address;
  * one order may not contain more than MAX_PER_TIE of a single tie;
  * archived ties (is_active = false) never reach the storefront, while the
    admin view can still see them;
  * a `discount_price` is charged when it is sane, ignored when it is not, and
    never turns a tie into a free one.

No database is touched: routers.quantity.supabase is monkeypatched with a fake
chain that supports the exact calls get_all_ties() makes.
"""

import pytest
from pydantic import ValidationError

import routers.quantity as quantity
from pricing import MAX_PER_TIE
from request_models import OrderCreateRequest


def _payload(**overrides):
    data = {
        "name": "Jane Student",
        "email": "jane@example.com",
        "telegramPhone": "08030000000",
        "parentsNumber": "08030000001",
        "address": "Daniel Hall",
        "roomNumber": "D304",
        "items": [
            {"item_id": "tie-a", "name": "Plain Black Tie", "quantity": 1, "unit_price": 2500}
        ],
        "amount": 2500,
    }
    data.update(overrides)
    return data


def _one_tie(quantity: int):
    return [
        {
            "item_id": "tie-a",
            "name": "Plain Black Tie",
            "quantity": quantity,
            "unit_price": 2500,
        }
    ]


# ---------------------------------------------------------------------------
# Required email
# ---------------------------------------------------------------------------


def test_checkout_payload_requires_an_email():
    data = _payload()
    data.pop("email")

    with pytest.raises(ValidationError):
        OrderCreateRequest(**data)


def test_an_empty_email_is_rejected():
    with pytest.raises(ValidationError):
        OrderCreateRequest(**_payload(email=""))


def test_malformed_email_is_rejected():
    with pytest.raises(ValidationError):
        OrderCreateRequest(**_payload(email="not-an-email"))


def test_a_valid_email_is_kept():
    payload = OrderCreateRequest(**_payload(email="Jane.Student@Example.edu.ng"))

    # email-validator normalises the domain; the local part is preserved.
    assert str(payload.email).lower() == "jane.student@example.edu.ng"


# ---------------------------------------------------------------------------
# Per-tie cap
# ---------------------------------------------------------------------------


def test_a_single_tie_is_capped_per_order():
    payload = OrderCreateRequest(**_payload(items=_one_tie(MAX_PER_TIE)))

    assert payload.items[0].quantity == MAX_PER_TIE


def test_ordering_more_than_the_cap_is_rejected():
    with pytest.raises(ValidationError):
        OrderCreateRequest(**_payload(items=_one_tie(MAX_PER_TIE + 1)))


# ---------------------------------------------------------------------------
# Archived ties
# ---------------------------------------------------------------------------


class _Result:
    def __init__(self, data):
        self.data = data


class _Query:
    """Stands in for supabase-py's chained query builder."""

    def __init__(self, rows):
        self._rows = rows

    def select(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def gt(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def execute(self):
        return _Result(self._rows)


class _FakeSupabase:
    def __init__(self, tables):
        self._tables = tables

    def table(self, name):
        return _Query(self._tables.get(name, []))

    def rpc(self, *args, **kwargs):
        # expire_inventory_holds(): the fake has no holds to expire.
        return _Query([])


def test_archived_ties_never_reach_the_storefront(monkeypatch):
    rows = [
        {"tie_id": "live-tie", "tie_name": "Live Tie", "price": 2000, "quantity": 3, "is_active": True},
        {"tie_id": "gone-tie", "tie_name": "Archived Tie", "price": 2000, "quantity": 0, "is_active": False},
    ]
    monkeypatch.setattr(quantity, "supabase", _FakeSupabase({"ties": rows}))

    served = quantity.get_all_ties()

    assert [tie.tie_id for tie in served] == ["live-tie"]


def test_the_admin_view_can_still_see_archived_ties(monkeypatch):
    rows = [
        {"tie_id": "live-tie", "tie_name": "Live Tie", "price": 2000, "quantity": 3, "is_active": True},
        {"tie_id": "gone-tie", "tie_name": "Archived Tie", "price": 2000, "quantity": 0, "is_active": False},
    ]
    monkeypatch.setattr(quantity, "supabase", _FakeSupabase({"ties": rows}))

    listed = quantity.get_all_ties(include_archived=True)

    assert sorted(tie.tie_id for tie in listed) == ["gone-tie", "live-tie"]


def test_a_legacy_row_without_is_active_is_still_served(monkeypatch):
    rows = [{"tie_id": "legacy", "tie_name": "Legacy Tie", "price": 2000, "quantity": 1}]
    monkeypatch.setattr(quantity, "supabase", _FakeSupabase({"ties": rows}))

    assert [tie.tie_id for tie in quantity.get_all_ties()] == ["legacy"]


# ---------------------------------------------------------------------------
# Per-tie discounts
# ---------------------------------------------------------------------------


def test_a_discount_price_is_charged_and_the_list_price_is_exposed():
    row = {
        "tie_id": "promo",
        "tie_name": "Promo Tie",
        "price": 4000,
        "discount_price": 3200,
        "quantity": 5,
    }

    assert quantity.disount_logic(row, "Promo Tie") == 3200

    normalized = quantity._normalize_inventory_row(row)
    assert normalized.price == 3200
    # The strike-through price only exists because there is a real saving.
    assert normalized.list_price == 4000


def test_a_tie_without_a_discount_has_no_list_price():
    row = {"tie_id": "plain", "tie_name": "Plain Tie", "price": 2500, "quantity": 5}

    normalized = quantity._normalize_inventory_row(row)

    assert normalized.price == 2500
    assert normalized.list_price is None


@pytest.mark.parametrize("bad_discount", [0, -100, 4000, 5000, "nonsense", None, ""])
def test_a_bad_discount_never_makes_a_tie_free_or_dearer(bad_discount):
    row = {
        "tie_id": "promo",
        "tie_name": "Promo Tie",
        "price": 4000,
        "discount_price": bad_discount,
        "quantity": 5,
    }

    assert quantity.disount_logic(row, "Promo Tie") == 4000
