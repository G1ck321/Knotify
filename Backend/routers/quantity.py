from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from database import supabase


router = APIRouter(prefix="/quantity", tags=["Inventory and paid user metrics"])


class TieInventoryResponse(BaseModel):
    tie_id: str
    tie_name: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=0)
    is_active: bool = True
    is_sold_out: bool = False


class PaidUsersResponse(BaseModel):
    status: str = "paid"
    paid_orders: int = Field(ge=0)
    unique_paid_users: int = Field(ge=0)


def _extract_tie_identity(row: dict[str, Any]) -> tuple[str, str]:
    tie_id = str(row.get("tie_id") or row.get("id") or row.get("name") or "").strip()
    tie_name = str(row.get("tie_name") or row.get("name") or tie_id).strip()
    return tie_id, tie_name


def _normalize_inventory_row(row: dict[str, Any]) -> TieInventoryResponse:
    tie_id, tie_name = _extract_tie_identity(row)
    price = float(row.get("price") or row.get("unit_price") or 0)
    quantity = int(row.get("quantity") or 0)
    is_active = bool(row.get("is_active", True))

    return TieInventoryResponse(
        tie_id=tie_id,
        tie_name=tie_name,
        price=price,
        quantity=quantity,
        is_active=is_active,
        is_sold_out=quantity <= 0 or not is_active,
    )


def get_tie_by_id(tie_id: str) -> Optional[dict[str, Any]]:
    response = (
        supabase.table("ties")
        .select("*")
        .or_(f"tie_id.eq.{tie_id},tie_name.eq.{tie_id}")
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def get_all_ties() -> list[TieInventoryResponse]:
    response = supabase.table("ties").select("*").order("tie_name", desc=False).execute()
    rows = response.data or []
    return [_normalize_inventory_row(row) for row in rows]


def get_paid_user_totals() -> PaidUsersResponse:
    response = supabase.table("orders").select("user_id", count="exact").eq("status", "paid").execute()
    rows = response.data or []
    unique_users = {str(row.get("user_id")) for row in rows if row.get("user_id")}

    return PaidUsersResponse(
        paid_orders=int(response.count or len(rows) or 0),
        unique_paid_users=len(unique_users),
    )


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
        .or_(f"tie_id.eq.{tie_id},id.eq.{tie_id},name.eq.{tie_id}")
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

        price = float(tie_row.get("price") or 0)
        total += price * item_quantity

    return total


@router.get("/ties", response_model=list[TieInventoryResponse])
async def list_tie_quantities(only_active: bool = Query(False, description="Return only active ties with stock")):
    ties = get_all_ties()
    if only_active:
        ties = [tie for tie in ties if tie.is_active and tie.quantity > 0]
    return ties


@router.get("/ties/{tie_id}", response_model=TieInventoryResponse)
async def read_tie_quantity(tie_id: str):
    tie_row = get_tie_by_id(tie_id)
    if not tie_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tie '{tie_id}' was not found")
    return _normalize_inventory_row(tie_row)


@router.get("/paid-users", response_model=PaidUsersResponse)
async def read_paid_user_count():
    return get_paid_user_totals()


