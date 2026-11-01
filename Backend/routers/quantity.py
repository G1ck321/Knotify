from __future__ import annotations

from typing import Any, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from database import supabase
from dependencies import get_optional_current_user


router = APIRouter(prefix="/quantity", tags=["Inventory and paid user metrics"])


class TieInventoryResponse(BaseModel):
    tie_id: str
    tie_name: str
    image_url: Optional[str] = None
    price: float = Field(ge=0)
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
    # Unguessable per-device secret from localStorage. Lets the caller's OWN
    # 24-hour pic hold be ignored so a pic request never locks them out of
    # checking out that same tie. Safe to trust because it is a bearer secret
    # (128+ bits), unlike a user id which is public.
    client_key: Optional[str] = None


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


def disount_logic(row: dict[str, Any], tie_name: str) -> float:
    """
    Decide the price a customer should SEE and PAY for a tie.

    This is the single source of truth for pricing: the inventory endpoints
    (/quantity/ties) AND the payment pipeline (/api/pay, compute_order_total)
    all call it, so the price shown on the frontend checkout always equals the
    amount actually charged.

    Discounts are currently disabled. The promotion code is kept below for
    future use, while all ties use their regular price.

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

    return float(row.get("price") or row.get("unit_price") or 0)


#change logic for checkout to add recieve_discount true/false to db. 
# This discout logic will be removed once first 5 have obtained discount, 
#column may also be removed, to reduce cb write
def _normalize_inventory_row(row: dict[str, Any]) -> TieInventoryResponse:
    tie_id, tie_name = _extract_tie_identity(row)
    # The backend decides the price here (launch discount applied to the two
    # promo ties), and the frontend displays/charges exactly this value.
    price = disount_logic(row, tie_name)
    quantity = int(row.get("quantity") or 0)
    is_active = bool(row.get("is_active", True))

    return TieInventoryResponse(
        tie_id=tie_id,
        tie_name=tie_name,
        image_url=str(row.get("image_url") or row.get("image") or "").strip() or None,
        price=price,
        quantity=quantity,
        is_active=is_active,
        is_sold_out=quantity <= 0 or not is_active,
        added_at=str(row.get("added_at") or "") or None,
    )


def _active_hold_quantities(client_key: Optional[str] = None) -> dict[str, int]:
    try:
        supabase.rpc("expire_inventory_holds").execute()
        response = (
            supabase.table("inventory_holds")
            .select("tie_id, quantity, reason, client_key")
            .eq("status", "active")
            .gt("expires_at", datetime.now(timezone.utc).isoformat())
            .execute()
        )
    except Exception:
        return {}

    held: dict[str, int] = {}
    for hold in response.data or []:
        # Show the requester their own tie as available: their pic hold must
        # not make the catalog render "OUT OF STOCK" for the one person who
        # is allowed to buy it. Other people's pic holds still count.
        if (
            client_key
            and hold.get("reason") == "pic_request"
            and str(hold.get("client_key") or "") == client_key
        ):
            continue
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


def get_all_ties(client_key: Optional[str] = None) -> list[TieInventoryResponse]:
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
    held_quantities = _active_hold_quantities(client_key)
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


def check_inventory_availability(
    items: list[dict[str, Any]],
    client_key: Optional[str] = None,
    user_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"p_items": items}
    if client_key:
        params["p_pic_client_key"] = client_key
    if user_id:
        params["p_pic_user_id"] = str(user_id)
    response = supabase.rpc("check_inventory_availability", params).execute()
    return response.data or []


def reserve_inventory(
    tx_ref: str,
    items: list[dict[str, Any]],
    minutes: int = HOLD_MINUTES,
    client_key: Optional[str] = None,
    user_id: Optional[str] = None,
) -> None:
    params: dict[str, Any] = {
        "p_tx_ref": tx_ref,
        "p_items": items,
        "p_minutes": int(minutes),
    }
    if client_key:
        params["p_client_key"] = str(client_key)
    if user_id:
        params["p_user_id"] = str(user_id)
    try:
        supabase.rpc("reserve_inventory", params).execute()
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
    client_key: Optional[str] = Query(
        None,
        description="Device key so the caller's own 24h pic hold still shows as available",
    ),
):
    ties = get_all_ties(client_key=client_key)
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
    # user_id comes from the JWT, never from the body: a spoofed user id would    # otherwise let an attacker ignore someone else's pic hold and buy the
    # tie out from under them.
    user_id = current_user.get("id") if current_user else None
    return check_inventory_availability(
        payload.items,
        client_key=(payload.client_key or "").strip() or None,
        user_id=user_id,
    )


@router.get("/paid-users", response_model=PaidUsersResponse)
async def read_paid_user_count():
    return get_paid_user_totals()


