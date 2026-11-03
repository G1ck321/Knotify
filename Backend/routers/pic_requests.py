"""Feature C - "Request knotted tie pic" (150 NGN, 48-hour inventory hold).

Rules this module enforces (see DEPLOYMENT_NOTES.md Part 3, Feature C):

* A request creates a 150 NGN obligation the moment it exists - `fee_status`
  starts as `unpaid` and only a confirmed Flutterwave payment flips it. Not
  paying never erases the obligation, it only leaves it outstanding.
* The 48-hour hold is a real `inventory_holds` row created through the
  existing `reserve_inventory()` RPC, so `check_inventory_availability()`
  counts it automatically and other buyers are blocked without new logic.
* The requester is NOT blocked by their own hold: the RPCs exclude
  `reason = 'pic_request'` rows owned by this buyer's client_key / user id.
* Capacity guard: pic holds may never occupy more than
  `PIC_HOLD_CAPACITY_RATIO` (30%) of the distinct ties in the catalog, so a
  wave of pic requests cannot lock the whole shop.
* The Telegram bot token never leaves the backend. The browser only ever
  receives a one-time `t.me/<bot>?start=pic_<token>` user link.
* Idempotency: `tx_ref` is derived from (client_key, tie_id), so a double
  click resolves to the same row instead of minting a second fee or hold.
"""

from __future__ import annotations

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from config import settings
from database import supabase
from dependencies import get_optional_current_user
from routers.quantity import get_tie_by_id, release_inventory_hold, reserve_inventory
from utils.ratelimit import caller_key, rate_limit


router = APIRouter(prefix="/api/pic-requests", tags=["Knotted tie pic requests"])

PIC_FEE = 150.0
# The promise shown to the buyer is "24-48 hours": hold to the upper bound so
# a pic that takes a while to shoot still arrives while the tie is reserved.
HOLD_HOURS = 48
# Pic holds may cover at most this share of the distinct ties in the catalog.
PIC_HOLD_CAPACITY_RATIO = 0.30

_CLIENT_KEY_RE = re.compile(r"^[A-Za-z0-9_-]{16,64}$")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _derive_tx_ref(client_key: str, tie_id: str) -> str:
    """Deterministic per (device, tie): re-requesting returns the same row."""
    digest = hashlib.sha256(f"{client_key}:{tie_id}".encode("utf-8")).hexdigest()
    return f"pic_{digest[:40]}"


def _deep_link(token: str) -> Optional[str]:
    bot = (settings.TELEGRAM_BOT_USERNAME or "").strip().lstrip("@")
    if not bot:
        return None
    return f"https://t.me/{bot}?start=pic_{token}"


class PicRequestCreate(BaseModel):
    tie_id: str = Field(..., min_length=1, max_length=64)
    # Anonymous per-device secret kept in localStorage. It is what makes the
    # fee and the hold idempotent for guests, and it is unguessable, so it is
    # safe to accept from the client (unlike a user id, which is public).
    client_key: str = Field(..., min_length=16, max_length=64)
    email: Optional[EmailStr] = None
    note: Optional[str] = Field(default=None, max_length=300)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("client_key", mode="before")
    @classmethod
    def normalize_client_key(cls, value):
        value = str(value or "").strip()
        if not _CLIENT_KEY_RE.match(value):
            raise ValueError("client_key must be 16-64 characters of [A-Za-z0-9_-]")
        return value

    @field_validator("tie_id", mode="before")
    @classmethod
    def normalize_tie_id(cls, value):
        return str(value or "").strip()

    @field_validator("note", mode="before")
    @classmethod
    def normalize_note(cls, value):
        if value in (None, ""):
            return None
        return str(value).strip()[:300]


class PicRequestResponse(BaseModel):
    tx_ref: str
    tie_id: str
    tie_name: str
    status: str
    fee: float
    fee_status: str
    hold_expires_at: str
    deep_link: Optional[str] = None
    already_requested: bool = False


def _public(row: dict[str, Any], tie_name: str, already: bool = False) -> PicRequestResponse:
    return PicRequestResponse(
        tx_ref=str(row.get("tx_ref") or ""),
        tie_id=str(row.get("tie_id") or ""),
        tie_name=tie_name,
        status=str(row.get("status") or "requested"),
        fee=float(row.get("price") or PIC_FEE),
        fee_status=str(row.get("fee_status") or "unpaid"),
        hold_expires_at=str(row.get("hold_until") or ""),
        deep_link=_deep_link(str(row.get("token") or "")),
        already_requested=already,
    )


def _find_by_tx_ref(tx_ref: str) -> Optional[dict[str, Any]]:
    response = (
        supabase.table("pic_requests").select("*").eq("tx_ref", tx_ref).limit(1).execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


def _find_open_request(tie_id: str, client_key: str) -> Optional[dict[str, Any]]:
    response = (
        supabase.table("pic_requests")
        .select("*")
        .eq("tie_id", tie_id)
        .eq("client_key", client_key)
        .eq("status", "requested")
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


def pic_hold_capacity() -> dict[str, Any]:
    """How much of the catalog is currently locked by pic holds.

    Returns the numbers every capacity decision is made from:

    * ``held_ties``   - DISTINCT ties with a live ``pic_request`` hold
    * ``catalog_ties`` - DISTINCT ties in the catalog (``ties`` table)
    * ``ratio``        - held / catalog, 0.0 when the catalog is empty
    * ``slots_left``   - how many MORE distinct ties may be put on hold

    Distinct ties, not hold count: ten holds on the same tie still only
    remove one tie from what other buyers can reserve.
    """
    try:
        holds = (
            supabase.table("inventory_holds")
            .select("tie_id")
            .eq("status", "active")
            .eq("reason", "pic_request")
            .gt("expires_at", _utcnow().isoformat())
            .execute()
        )
        ties = supabase.table("ties").select("tie_id").execute()
    except Exception as error:
        # Fail OPEN and log: a lookup hiccup must not take the feature down
        # (the insert below would fail anyway if the database is truly gone).
        print(f"pic_requests: capacity lookup failed: {error}")
        return {"held_ties": 0, "catalog_ties": 0, "ratio": 0.0, "slots_left": None}

    held = {
        str(row.get("tie_id") or "")
        for row in (holds.data or [])
        if row.get("tie_id")
    }
    catalog = {
        str(row.get("tie_id") or "")
        for row in (ties.data or [])
        if row.get("tie_id")
    }

    held_count = len(held)
    catalog_count = len(catalog)
    budget = int(catalog_count * PIC_HOLD_CAPACITY_RATIO)

    return {
        "held_ties": held_count,
        "catalog_ties": catalog_count,
        "ratio": (held_count / catalog_count) if catalog_count else 0.0,
        "slots_left": max(budget - held_count, 0),
    }


def enforce_pic_hold_capacity() -> dict[str, Any]:
    """Dependency: reject new pic requests once pic holds cover 30% of ties.

    Without this, a wave of requests could park most of the catalog behind
    48-hour holds while nothing has been bought, and honest buyers would see
    "out of stock" everywhere. Integer comparison (held * 100 >= catalog * 30)
    avoids float rounding exactly on the boundary.
    """
    capacity = pic_hold_capacity()
    catalog_count = int(capacity["catalog_ties"])
    held_count = int(capacity["held_ties"])

    if catalog_count and held_count * 100 >= catalog_count * (PIC_HOLD_CAPACITY_RATIO * 100):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Every other student is ahead of you: too many ties are "
                "currently held for pics. Pic requests reopen automatically "
                "as those holds expire - please try again later."
            ),
        )

    return capacity


def _notify_admin(text: str) -> None:
    """Best-effort admin ping. Failures never fail the buyer's request."""
    token = (settings.TELEGRAM_BOT_TOKEN or "").strip()
    chat_id = (settings.TELEGRAM_CHAT_ID or "").strip()
    if not token or not chat_id:
        return
    try:
        httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=10.0,
        )
    except Exception as error:  # pragma: no cover - network dependent
        print(f"pic_requests: admin notify failed: {error}")


@router.post("", status_code=status.HTTP_201_CREATED, response_model=PicRequestResponse)
async def create_pic_request(
    payload: PicRequestCreate,
    request: Request,
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """Create a knotted-tie-pic request: 150 NGN owed + a 48-hour hold."""
    rate_limit(keys=[f"pic:ip:{caller_key(request)}"], limit=10, window_seconds=300)

    tie_row = get_tie_by_id(payload.tie_id)
    if not tie_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tie not found")

    if int(tie_row.get("quantity") or 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This tie is out of stock, so it cannot be held for a pic request.",
        )

    tie_name = str(tie_row.get("tie_name") or tie_row.get("name") or payload.tie_id)
    user_id = str(current_user.get("id")) if current_user and current_user.get("id") else None
    email = payload.email or (current_user.get("email") if current_user else None)
    email = str(email).strip().lower() if email else None

    base_tx_ref = _derive_tx_ref(payload.client_key, payload.tie_id)

    # Idempotent path: an open request for this device+tie returns the same
    # link and never creates a second fee or a second hold.
    open_row = _find_open_request(payload.tie_id, payload.client_key)
    if open_row:
        return _public(open_row, tie_name, already=True)

    # Capacity guard runs AFTER the idempotent return above, so someone who
    # already holds this tie can always re-open their link even when the
    # 30% budget is exhausted by other people's requests.
    enforce_pic_hold_capacity()

    existing = _find_by_tx_ref(base_tx_ref)
    if existing:
        # A previous request already lived and died (expired/delivered/...).
        # Start a fresh round with a distinct tx_ref; the partial unique index
        # on (tie_id, client_key) while status='requested' still backs this up.
        tx_ref = f"{base_tx_ref}-{secrets.token_hex(4)}"
    else:
        tx_ref = base_tx_ref

    token = secrets.token_urlsafe(24)
    hold_until = _utcnow() + timedelta(hours=HOLD_HOURS)

    row = {
        "tx_ref": tx_ref,
        "token": token,
        "tie_id": payload.tie_id,
        "user_id": user_id,
        "email": email,
        "client_key": payload.client_key,
        "status": "requested",
        "fee_status": "unpaid",
        "price": PIC_FEE,
        "hold_until": hold_until.isoformat(),
        "note": payload.note,
    }

    try:
        inserted = supabase.table("pic_requests").insert(row).execute()
    except Exception:
        # Unique-index race: someone else created this exact request first.
        concurrent = _find_open_request(payload.tie_id, payload.client_key)
        if concurrent:
            return _public(concurrent, tie_name, already=True)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not record this pic request. Please try again.",
        )

    created = (inserted.data or [row])[0]

    # Real inventory hold: 24h, tagged as a pic hold and owned by this buyer.
    try:
        reserve_inventory(
            tx_ref,
            [{"tie_id": payload.tie_id, "quantity": 1}],
            minutes=HOLD_HOURS * 60,
            client_key=payload.client_key,
            user_id=user_id,
        )
    except HTTPException:
        # Someone else holds the last unit - roll the row back so no orphan
        # 100 NGN obligation survives a failed hold.
        try:
            supabase.table("pic_requests").delete().eq("tx_ref", tx_ref).execute()
        except Exception as cleanup_error:  # pragma: no cover
            print(f"pic_requests: rollback failed: {cleanup_error}")
        raise
    except Exception as error:
        try:
            supabase.table("pic_requests").delete().eq("tx_ref", tx_ref).execute()
        except Exception as cleanup_error:  # pragma: no cover
            print(f"pic_requests: rollback failed: {cleanup_error}")
        print(f"pic_requests: reserve failed: {error}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This tie is being held by another buyer right now. Try again in a moment.",
        )

    requester = email or user_id or "guest"
    _notify_admin(
        f"New knotted-pic request\n"
        f"Tie: {tie_name} ({payload.tie_id})\n"
        f"From: {requester}\n"
        f"Fee: NGN {PIC_FEE:.0f} (unpaid until checkout)\n"
        f"Held until: {hold_until.isoformat()}\n"
        f"Note: {payload.note or '-'}"
    )

    return _public(created, tie_name)


# ---------------------------------------------------------------------------
# Helpers used by /api/pay and the Flutterwave webhook
# ---------------------------------------------------------------------------

def _rows_where(**filters: Any) -> list[dict[str, Any]]:
    query = supabase.table("pic_requests").select("*").eq("fee_status", "unpaid")
    for key, value in filters.items():
        query = query.eq(key, value)
    try:
        return query.execute().data or []
    except Exception as error:  # pragma: no cover
        print(f"pic_requests: query failed: {error}")
        return []


def collect_unpaid_pic_requests(
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    client_keys: Optional[list[str]] = None,
) -> list[dict[str, Any]]:
    """Every outstanding 100 NGN obligation this buyer could be charged for.

    Three identities are matched server-side so the fee cannot be stripped by
    editing the request body: signed-in user id, the checkout email, and the
    device's unguessable client_key. De-duplicated by tx_ref.
    """
    found: dict[str, dict[str, Any]] = {}

    if user_id:
        for row in _rows_where(user_id=str(user_id)):
            found[str(row.get("tx_ref"))] = row

    if email:
        normalized = str(email).strip().lower()
        # ilike with an escaped pattern keeps the match exact-but-case-safe.
        escaped = normalized.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        try:
            response = (
                supabase.table("pic_requests")
                .select("*")
                .eq("fee_status", "unpaid")
                .ilike("email", escaped)
                .execute()
            )
            for row in response.data or []:
                found[str(row.get("tx_ref"))] = row
        except Exception as error:  # pragma: no cover
            print(f"pic_requests: email lookup failed: {error}")

    keys = [str(key).strip() for key in (client_keys or []) if str(key or "").strip()]
    if keys:
        try:
            response = (
                supabase.table("pic_requests")
                .select("*")
                .eq("fee_status", "unpaid")
                .in_("client_key", keys)
                .execute()
            )
            for row in response.data or []:
                found[str(row.get("tx_ref"))] = row
        except Exception as error:  # pragma: no cover
            print(f"pic_requests: client_key lookup failed: {error}")

    return list(found.values())


def pic_fee_total(rows: list[dict[str, Any]]) -> float:
    return sum(float(row.get("price") or PIC_FEE) for row in rows)


def mark_pic_requests_paid(tx_refs: list[str]) -> None:
    """Flip the 100 NGN rows an order actually paid for."""
    for tx_ref in tx_refs or []:
        try:
            supabase.table("pic_requests").update(
                {
                    "fee_status": "paid",
                    "paid_at": _utcnow().isoformat(),
                    "updated_at": _utcnow().isoformat(),
                }
            ).eq("tx_ref", tx_ref).execute()
        except Exception as error:  # pragma: no cover
            print(f"pic_requests: mark paid failed for {tx_ref}: {error}")


def release_pic_holds_for_paid_order(order_record: dict[str, Any]) -> None:
    """Once the buyer purchases the tie, their 24h pic hold has no purpose.

    Without this, a stock-1 vintage tie stays invisible to other buyers for
    the rest of the window even though it was just sold.
    """
    cart = order_record.get("cart_snapshot") or []
    if isinstance(cart, str):
        import json

        try:
            cart = json.loads(cart)
        except Exception:
            cart = []

    tie_ids = {
        str(item.get("tie_id") or item.get("item_id") or "").strip()
        for item in cart
        if str(item.get("tie_id") or item.get("item_id") or "").strip()
    }
    if not tie_ids:
        return

    user_id = order_record.get("user_id")
    email = str(order_record.get("email_snapshot") or "").strip().lower()

    rows: list[dict[str, Any]] = []
    if user_id:
        try:
            response = (
                supabase.table("pic_requests")
                .select("*")
                .eq("status", "requested")
                .eq("user_id", str(user_id))
                .execute()
            )
            rows.extend(response.data or [])
        except Exception as error:  # pragma: no cover
            print(f"pic_requests: release lookup failed: {error}")

    if email:
        try:
            response = (
                supabase.table("pic_requests")
                .select("*")
                .eq("status", "requested")
                .ilike("email", email)
                .execute()
            )
            rows.extend(response.data or [])
        except Exception as error:  # pragma: no cover
            print(f"pic_requests: release lookup failed: {error}")

    seen: set[str] = set()
    for row in rows:
        tx_ref = str(row.get("tx_ref") or "")
        if not tx_ref or tx_ref in seen or str(row.get("tie_id")) not in tie_ids:
            continue
        seen.add(tx_ref)
        try:
            release_inventory_hold(tx_ref)
        except Exception as error:  # pragma: no cover
            print(f"pic_requests: hold release failed for {tx_ref}: {error}")


def start_chat_for_token(token: str, telegram_chat_id: str) -> Optional[dict[str, Any]]:
    """Record that the buyer tapped the deep link (used by /webhook/telegram)."""
    token = str(token or "").strip()
    if not token:
        return None
    response = (
        supabase.table("pic_requests").select("*").eq("token", token).limit(1).execute()
    )
    rows = response.data or []
    if not rows:
        return None

    row = rows[0]
    try:
        updated = (
            supabase.table("pic_requests")
            .update(
                {
                    "telegram_chat_id": str(telegram_chat_id),
                    "started_at": _utcnow().isoformat(),
                    "updated_at": _utcnow().isoformat(),
                }
            )
            .eq("tx_ref", row["tx_ref"])
            .execute()
        )
        if updated.data:
            row = updated.data[0]
    except Exception as error:  # pragma: no cover
        print(f"pic_requests: start chat update failed: {error}")
    return row
