from __future__ import annotations

from typing import Any, Optional
from datetime import datetime, timezone

import hmac
from typing import Optional as _Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field

from config import settings
from database import supabase
from dependencies import get_optional_current_user
from pricing import MAX_PER_TIE


router = APIRouter(prefix="/quantity", tags=["Inventory and paid user metrics"])


class TieInventoryResponse(BaseModel):
    tie_id: str
    tie_name: str
    image_url: Optional[str] = None
    price: float = Field(ge=0)
    # The pre-discount price, only present when `discount_price` is actually
    # applied. The storefront uses it for the strike-through.
    list_price: Optional[float] = Field(default=None, ge=0)
    quantity: int = Field(ge=0)
    is_active: bool = True
    is_sold_out: bool = False
    # When the tie entered the catalog (Feature B). The frontend uses it to
    # surface the latest arrivals first.
    added_at: Optional[str] = None


class PaidUsersResponse(BaseModel):
    status: str = "paid"
    paid_orders: int = Field(ge=0)
    unique_paid_users: int = Field(ge=0)


class InventoryAvailabilityRequest(BaseModel):
    items: list[dict[str, Any]]


HOLD_MINUTES = 10


def _extract_tie_identity(row: dict[str, Any]) -> tuple[str, str]:
    tie_id = str(row.get("tie_id") or row.get("id") or row.get("name") or "").strip()
    tie_name = str(row.get("tie_name") or row.get("name") or tie_id).strip()
    return tie_id, tie_name

# Launch-window promotion: these ties sell at discount_price for the first
# DISCOUNT_USER_THRESHOLD unique users who complete a paid order.
DISCOUNTED_TIE_NAMES = ("Plain Black Tie", "Plain Wine Tie")
DISCOUNT_USER_THRESHOLD = 3


def _paid_user_metrics() -> tuple[int, int]:
    """Query paid orders once and return (paid_orders, unique_paid_users)."""
    response = supabase.table("orders").select("user_id", count="exact").eq("status", "paid").execute()
    rows = response.data or []
    unique_users = {str(row.get("user_id")) for row in rows if row.get("user_id")}
    return int(response.count or len(rows) or 0), len(unique_users)


def _valid_discount_price(row: dict[str, Any]) -> Optional[float]:
    """The per-tie discount, when the row carries a sane one.

    Set `ties.discount_price` to discount one tie without touching code. It is
    ignored (never trusted blindly) when it is not a number, is not positive,
    or is not actually below the list price: a bad import must never turn a
    tie into a free one.
    """
    raw = row.get("discount_price")
    if raw in (None, ""):
        return None

    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None

    if value <= 0:
        return None

    list_price = float(row.get("price") or row.get("unit_price") or 0)
    if list_price > 0 and value >= list_price:
        return None

    return value


def disount_logic(row: dict[str, Any], tie_name: str) -> float:
    """
    Decide the price a customer should SEE and PAY for a tie.

    This is the single source of truth for pricing: the inventory endpoints
    (/quantity/ties) AND the payment pipeline (/api/pay, compute_order_total)
    all call it, so the price shown on the frontend checkout always equals the
    amount actually charged.

    A tie is charged at its `discount_price` when that column holds a sane
    value (see _valid_discount_price); otherwise it is charged its list
    `price`. The launch-window promotion below stays disabled on purpose.

    NOTE: each call queries Supabase for the paid-user count so the rule stays
    live. If a caller needs many prices in one request, hoist
    _paid_user_metrics() and pass the count in instead.
    """
    # _, unique_users = _paid_user_metrics()
    #
    # if tie_name in DISCOUNTED_TIE_NAMES and unique_users < DISCOUNT_USER_THRESHOLD:
    #     # Prefer the discounted column; fall back to the regular price so a
    #     # missing/zero discount_price never turns into a free tie.
    #     return float(row.get("discount_price") or row.get("price") or 0)

    # A per-tie `discount_price` wins over the list price. /api/pay, checkout
    # totals and /quantity/ties all funnel through here, so the price shown and
    # the price charged stay identical.
    return _valid_discount_price(row) or float(row.get("price") or row.get("unit_price") or 0)


#change logic for checkout to add recieve_discount true/false to db. 
# This discout logic will be removed once first 5 have obtained discount, 
#column may also be removed, to reduce cb write
def _normalize_inventory_row(row: dict[str, Any]) -> TieInventoryResponse:
    tie_id, tie_name = _extract_tie_identity(row)
    # The backend decides the price here (launch discount applied to the two
    # promo ties), and the frontend displays/charges exactly this value.
    price = disount_logic(row, tie_name)
    # Only expose a list price when a discount is really applied, so the
    # strike-through appears exactly when there is a saving to show.
    list_price = float(row.get("price") or 0) if _valid_discount_price(row) else None
    quantity = int(row.get("quantity") or 0)
    is_active = bool(row.get("is_active", True))

    return TieInventoryResponse(
        tie_id=tie_id,
        tie_name=tie_name,
        image_url=str(row.get("image_url") or row.get("image") or "").strip() or None,
        price=price,
        list_price=list_price,
        quantity=quantity,
        is_active=is_active,
        is_sold_out=quantity <= 0 or not is_active,
        added_at=str(row.get("added_at") or "") or None,
    )


def _active_hold_quantities() -> dict[str, int]:
    try:
        supabase.rpc("expire_inventory_holds").execute()
        response = (
            supabase.table("inventory_holds")
            .select("tie_id, quantity")
            .eq("status", "active")
            .gt("expires_at", datetime.now(timezone.utc).isoformat())
            .execute()
        )
    except Exception:
        return {}

    held: dict[str, int] = {}
    for hold in response.data or []:
        tie_id = str(hold.get("tie_id") or "")
        held[tie_id] = held.get(tie_id, 0) + int(hold.get("quantity") or 0)
    return held


def get_tie_by_id(tie_id: str) -> Optional[dict[str, Any]]:
    response = (
        supabase.table("ties")
        .select("*")
        .eq("tie_id", tie_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def get_all_ties(include_archived: bool = False) -> list[TieInventoryResponse]:
    # Newest first (Feature B): ties added later sit at the top of the catalog.
    # tie_name only breaks ties between rows inserted in the same instant.
    try:
        response = (
            supabase.table("ties")
            .select("*")
            .order("added_at", desc=True)
            .order("tie_name", desc=False)
            .execute()
        )
    except Exception:
        # The 20261030_ties_added_at migration has not run yet: serve the
        # catalog in the old order rather than taking the whole store down.
        response = supabase.table("ties").select("*").order("tie_name", desc=False).execute()
    rows = response.data or []
    # Archived ties stay in the table (so order history, holds and pic refs keep
    # resolving) but are never served to the storefront. `is_active` is missing
    # on legacy rows -> treat as live.
    if not include_archived:
        rows = [row for row in rows if bool(row.get("is_active", True))]
    held_quantities = _active_hold_quantities()
    normalized_rows = []
    for row in rows:
        available_row = dict(row)
        available_row["quantity"] = max(
            int(row.get("quantity") or 0) - held_quantities.get(str(row.get("tie_id")), 0),
            0,
        )
        normalized_rows.append(_normalize_inventory_row(available_row))
    return normalized_rows


def get_paid_user_totals() -> PaidUsersResponse:
    paid_orders, unique_users = _paid_user_metrics()
    return PaidUsersResponse(
        paid_orders=paid_orders,
        unique_paid_users=unique_users,
    )


def _own_pending_tx_refs(user_id: Optional[str]) -> list[str]:
    """Order refs of this buyer's still-unpaid checkout attempts.

    A pending order owns a 10-minute inventory hold. Those holds must never
    count against the same buyer, or one cancelled/failed payment locks them
    out of their own ties until the hold expires (or forever, for a guest who
    then signs in to the same account).
    """
    if not user_id:
        return []

    # Holds only live 10 minutes, so only the most recent attempts matter; the
    # cap also keeps the tx_ref list in the follow-up query small.
    response = (
        supabase.table("orders")
        .select("tx_ref")
        .eq("user_id", str(user_id))
        .eq("status", "pending")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return [str(row.get("tx_ref")) for row in (response.data or []) if row.get("tx_ref")]


def own_held_quantities(user_id: Optional[str]) -> dict[str, int]:
    """Active hold quantity per tie held by this buyer's own pending orders.

    Guests never reach this path: an order (and therefore a hold) can only be
    created from a signed-in checkout, so an anonymous caller has no holds of
    their own to add back and keeps the plain, strict availability answer.
    """
    try:
        tx_refs = _own_pending_tx_refs(user_id)
        if not tx_refs:
            return {}
        response = (
            supabase.table("inventory_holds")
            .select("tie_id, quantity")
            .in_("tx_ref", tx_refs)
            .eq("status", "active")
            .gt("expires_at", datetime.now(timezone.utc).isoformat())
            .execute()
        )
    except Exception as error:  # pragma: no cover - availability must not 500
        print(f"inventory: own hold lookup failed: {error}")
        return {}

    held: dict[str, int] = {}
    for hold in response.data or []:
        tie_id = str(hold.get("tie_id") or "")
        held[tie_id] = held.get(tie_id, 0) + int(hold.get("quantity") or 0)
    return held


def release_superseded_holds(user_id: Optional[str], keep_tx_ref: str) -> None:
    """Release this buyer's holds from earlier, still-unpaid attempts.

    reserve_inventory() only ignores holds that share the SAME tx_ref, so a
    retry after a cancelled payment would otherwise fail with 409 even though
    the buyer is the one holding the stock. Checkout calls this right before
    reserving; the newest attempt wins.
    """
    if not user_id:
        return

    try:
        stale_refs = [ref for ref in _own_pending_tx_refs(user_id) if ref != keep_tx_ref]
    except Exception as error:  # pragma: no cover - never block a new checkout
        print(f"inventory: superseded hold lookup failed: {error}")
        return

    for stale_ref in stale_refs:
        try:
            release_inventory_hold(stale_ref)
        except Exception as error:  # pragma: no cover
            print(f"inventory: could not release superseded hold {stale_ref}: {error}")


def check_inventory_availability(
    items: list[dict[str, Any]], user_id: Optional[str] = None
) -> list[dict[str, Any]]:
    response = supabase.rpc("check_inventory_availability", {"p_items": items}).execute()
    rows = [dict(row) for row in (response.data or [])]

    # The database counts every active hold, including the caller's own. Add
    # the caller's own held quantity back so their earlier attempt never makes
    # their own ties look sold out; other buyers' holds still count.
    own_held = own_held_quantities(user_id)
    if not own_held:
        return rows

    for row in rows:
        own_quantity = own_held.get(str(row.get("tie_id") or ""), 0)
        if not own_quantity:
            continue
        row["available_quantity"] = int(row.get("available_quantity") or 0) + own_quantity
        row["available"] = row["available_quantity"] >= int(row.get("requested_quantity") or 0)

    return rows


def reserve_inventory(tx_ref: str, items: list[dict[str, Any]], minutes: int = HOLD_MINUTES) -> None:
    try:
        supabase.rpc(
            "reserve_inventory",
            {
                "p_tx_ref": tx_ref,
                "p_items": items,
                "p_minutes": int(minutes),
            },
        ).execute()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Some requested ties are no longer available. Refresh your bag and try again.",
        ) from error


def release_inventory_hold(tx_ref: str, hold_status: str = "released") -> None:
    supabase.rpc("release_inventory_hold", {"p_tx_ref": tx_ref, "p_status": hold_status}).execute()


def consume_inventory_hold(tx_ref: str) -> None:
    supabase.rpc("consume_inventory_hold", {"p_tx_ref": tx_ref}).execute()


def decrement_tie_stock(tie_id: str, quantity: int) -> TieInventoryResponse:
    if quantity <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Quantity must be greater than zero")

    tie_row = get_tie_by_id(tie_id)
    if not tie_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tie '{tie_id}' was not found")

    current_quantity = int(tie_row.get("quantity") or 0)
    if current_quantity < quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Insufficient stock for tie '{tie_id}'. Requested {quantity}, available {current_quantity}",
        )

    new_quantity = current_quantity - quantity
    update_payload: dict[str, Any] = {"quantity": new_quantity, "is_active": new_quantity > 0}

    updated = (
        supabase.table("ties")
        .update(update_payload)
        .eq("tie_id", tie_id)
        .execute()
    )

    if not updated.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not update stock for tie '{tie_id}'")

    return _normalize_inventory_row(updated.data[0])


def decrement_stock_for_order(cart_snapshot: list[dict[str, Any]]) -> list[TieInventoryResponse]:
    updated_rows: list[TieInventoryResponse] = []

    for item in cart_snapshot:
        tie_id = str(item.get("tie_id") or item.get("item_id") or "").strip()
        item_quantity = int(item.get("quantity") or 0)
        if not tie_id:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Order item is missing tie_id")

        updated_rows.append(decrement_tie_stock(tie_id, item_quantity))

    return updated_rows

def compute_order_total(cart_snapshot: list[dict[str, Any]]) -> float:
    total = 0.0
    for item in cart_snapshot:
        tie_id = str(item.get("tie_id") or item.get("item_id") or "").strip()
        item_quantity = int(item.get("quantity") or 0)
        if not tie_id:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Order item is missing tie_id")

        tie_row = get_tie_by_id(tie_id)
        if not tie_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tie '{tie_id}' was not found")

        # Same pricing the frontend displays and /api/pay charges: the launch
        # discount for the promo ties is applied here too.
        _, tie_name = _extract_tie_identity(tie_row)
        price = disount_logic(tie_row, tie_name)
        total += price * item_quantity

    return total


@router.get("/ties", response_model=list[TieInventoryResponse])
async def list_tie_quantities(
    only_active: bool = Query(False, description="Return only active ties with stock"),
    include_archived: bool = Query(
        False, description="Admin view: also return archived (is_active=false) ties"
    ),
):
    ties = get_all_ties(include_archived=include_archived)
    if only_active:
        ties = [tie for tie in ties if tie.is_active and tie.quantity > 0]
    return ties


@router.get("/ties/{tie_id}", response_model=TieInventoryResponse)
async def read_tie_quantity(tie_id: str):
    tie_row = get_tie_by_id(tie_id)
    if not tie_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tie '{tie_id}' was not found")
    return _normalize_inventory_row(tie_row)


@router.post("/availability")
async def read_inventory_availability(
    payload: InventoryAvailabilityRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    return check_inventory_availability(
        payload.items, user_id=(current_user or {}).get("id")
    )


@router.get("/paid-users", response_model=PaidUsersResponse)
async def read_paid_user_count():
    return get_paid_user_totals()


# ---------------------------------------------------------------------------
# Catalog maintenance (used by the admin dashboard prototype)
# ---------------------------------------------------------------------------
# There is no admin role in the auth model yet, so these routes are gated by a
# shared secret header instead. With ADMIN_API_KEY unset they fail CLOSED with
# 503 rather than being open to anyone who finds the URL - the same rule the
# Telegram webhook follows.

MAX_TIE_STOCK = 500


class TieAdminUpdate(BaseModel):
    quantity: _Optional[int] = Field(default=None, ge=0, le=MAX_TIE_STOCK)
    is_active: _Optional[bool] = None


def require_admin_key(x_admin_key: _Optional[str] = Header(None, alias="X-Admin-Key")) -> None:
    expected = (settings.ADMIN_API_KEY or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin actions are not configured on this server.",
        )
    received = (x_admin_key or "").strip()
    if not received or not hmac.compare_digest(received, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key.",
        )


def _set_archived(tie_id: str, archived: bool) -> TieInventoryResponse:
    """Archive = hide from the storefront, never delete.

    Deleting would break `orders.cart_snapshot`, `inventory_holds` and pic rows
    that still point at the tie, and the paid-order webhook would 404 while
    decrementing stock for a tie that just disappeared.
    """
    payload: dict[str, Any] = {"is_active": not archived}
    if archived:
        payload["archived_at"] = datetime.now(timezone.utc).isoformat()

    try:
        updated = supabase.table("ties").update(payload).eq("tie_id", tie_id).execute()
    except Exception:
        # archived_at column not migrated yet: archiving still has to work.
        updated = (
            supabase.table("ties")
            .update({"is_active": not archived})
            .eq("tie_id", tie_id)
            .execute()
        )

    if not updated.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tie '{tie_id}' was not found"
        )
    return _normalize_inventory_row(updated.data[0])


@router.post(
    "/ties/{tie_id}/archive",
    response_model=TieInventoryResponse,
    dependencies=[Depends(require_admin_key)],
)
async def archive_tie(tie_id: str):
    """Hide a tie from the storefront. History and holds stay intact."""
    return _set_archived(tie_id, True)


@router.post(
    "/ties/{tie_id}/restore",
    response_model=TieInventoryResponse,
    dependencies=[Depends(require_admin_key)],
)
async def restore_tie(tie_id: str):
    return _set_archived(tie_id, False)


@router.patch(
    "/ties/{tie_id}",
    response_model=TieInventoryResponse,
    dependencies=[Depends(require_admin_key)],
)
async def update_tie_inventory(tie_id: str, payload: TieAdminUpdate):
    """Restock or re-price a tie from the admin dashboard.

    A restock must set `is_active` back to true: selling the last unit flips it
    false automatically, so raising `quantity` alone leaves the tie hidden.
    """
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Send at least one of quantity or is_active.",
        )

    if changes.get("is_active") is None and "quantity" in changes:
        changes["is_active"] = int(changes["quantity"]) > 0

    updated = supabase.table("ties").update(changes).eq("tie_id", tie_id).execute()
    if not updated.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tie '{tie_id}' was not found"
        )
    return _normalize_inventory_row(updated.data[0])


