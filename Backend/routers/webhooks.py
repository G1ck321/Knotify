from fastapi.encoders import isoformat
import httpx
import re

from urllib import response
from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException, status, Header, Request, BackgroundTasks
import hmac
from database import supabase
from config import settings
from datetime import timezone, datetime
from routers.quantity import (
    consume_inventory_hold,
    decrement_stock_for_order,
    get_tie_by_id,
    release_inventory_hold,
)
from routers.pic_requests import (
    mark_pic_requests_paid,
    release_pic_holds_for_paid_order,
    start_chat_for_token,
)


router = APIRouter(prefix="/webhook", tags=["Third Party Web Hooks"])

# ================
# Helper fuctions
# ----------------

def get_todays_orders():
    # Used by telegram to obtain daily orders
    # Calculates the start of today using timezone.UTC
    """Queries Supabbase for today's orders"""

    #The very start of the day
    today_order = datetime.now(timezone.utc).replace(hour=0,minute=0, second=0, microsecond=0)

    response = supabase.table("orders")\
                .select("*", count="exact")\
                .eq("status","paid")\
                .gte("created_at", today_order.isoformat())\
                .order("created_at", desc=False)\
                .execute()

    #return the list and the number in the list
    return response.data, response.count

def get_all_lifetime_orders():
    # Will be used by telegram to get all orders
    """Queries supabase for total lifetime orders"""

    response = supabase.table("orders")\
                .select("*", count="exact")\
                .eq("status", "paid")\
                .execute()


# =============
# Flutter Endpoint
@router.post("/flutterwave")
async def flutterwave_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    verif_hash: str = Header(None, alias="verif-hash")
):
    """Secure signature verified webhook handler
    Listens to server updates from Flutterwave."""

    # Verify the shared secret header before trusting the payload
    # Psst, this occurs after payment
    expected_hash = settings.FLW_SECRET_HASH.strip()
    received_hash = (verif_hash or "").strip()
    print(
        "Flutterwave webhook received: "
        f"hash_present={bool(received_hash)}, expected_hash_configured={bool(expected_hash)}"
    )
    if not expected_hash or not received_hash or not hmac.compare_digest(received_hash, expected_hash):
        print("Flutterwave webhook rejected: invalid or missing verif-hash")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature validation handshake mismatch"
        )

    # parse the webhook body after the signature check passes
    payload = await request.json()

    data_block = payload.get("data") or payload
    payment_status = str(data_block.get("status") or payload.get("status") or "").lower()
    tx_ref = str(data_block.get("tx_ref") or payload.get("tx_ref") or "").strip()

    if payment_status in {"failed", "cancelled", "canceled", "error"}:
        if tx_ref:
            supabase.table("orders").update({"status": "failed"}).eq("tx_ref", tx_ref).execute()
            release_inventory_hold(tx_ref)
        return {"status": "acknowledged", "order_status": "failed"}

    if payment_status == "successful":

        print(f"Flutterwave webhook transaction: tx_ref={tx_ref or '<missing>'}")

        if not tx_ref:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Flutterwave webhook did not include tx_ref",
            )

        # Ignore duplicate webhook orders for the same orders
        existing_order = (
            supabase.table("orders")
            .select("*")
            .eq("tx_ref", tx_ref)
            .limit(1)
            .execute()
        )

        if not existing_order.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order reference tx_ref not found."
            )
        order_record = existing_order.data[0]

        #If paid
        if order_record.get("status") == "paid":
            return {"status": "ignored", "reason": "Already processed transaction pattern."}
        
        cart_snapshot = order_record.get("cart_snapshot") or []
        if isinstance(cart_snapshot, str):
            import json
            try:
                cart_snapshot = json.loads(cart_snapshot)
            except Exception:
                cart_snapshot = []

        # Update the order row to paid once the gateway confirms success.
        updated_order = (
            supabase.table("orders")
            .update({"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()})
            .eq("tx_ref", tx_ref)
            .execute()
        )

        # Check if database update was successful
        if updated_order.data:
            order_record = updated_order.data[0]
            
            # Background tasks keep the webhook response fast and non-blocking.
            # background_tasks.add_task(send_email_order_receipt, order_record)
            if cart_snapshot:
                background_tasks.add_task(decrement_stock_for_order, cart_snapshot)
            background_tasks.add_task(consume_inventory_hold, tx_ref)
            # Feature C: settle exactly the pic fees this order paid for, and
            # free the buyer's 24h pic holds on ties they just purchased.
            background_tasks.add_task(
                mark_pic_requests_paid, order_record.get("pic_refs") or []
            )
            background_tasks.add_task(release_pic_holds_for_paid_order, order_record)
        else:
            print("DEBUG: Supabase update failed or returned empty data.")

    return {"status": "acknowledged"}
        


@router.post("/telegram")
async def handle_telegram_requests(
    request:Request
):
    # Anyone who discovers this URL can otherwise POST fake updates to your
    # bot. Telegram sends the setWebhook secret_token back on every update.
    #
    # MUST-FIX: fail CLOSED. If no secret is configured, every update would be
    # trusted, so anyone who finds the URL could drive the bot (send deep
    # links, flip records) as if they were Telegram.
    expected_secret = (settings.TELEGRAM_WEBHOOK_SECRET or "").strip()
    if not expected_secret:
        print("telegram webhook rejected: TELEGRAM_WEBHOOK_SECRET is not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook is not configured",
        )

    received_secret = (request.headers.get("X-Telegram-Bot-Api-Secret-Token") or "").strip()
    if not hmac.compare_digest(received_secret, expected_secret):
        print("telegram webhook rejected: missing/invalid secret token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    payload = await request.json()
    if "message" in payload and "text" in payload["message"]:
        chat_id = payload["message"]["chat"]["id"]
        raw_text = str(payload["message"]["text"] or "").strip()
        incoming_text = raw_text.lower()

        # ---- Feature C: the deep link the "Request knotted pic" button opens
        # t.me/<bot>?start=pic_<token> arrives as "/start pic_<token>".
        # (The raw, case-sensitive token is kept separately: lowering it
        # would corrupt the url-safe base64 token.)
        if incoming_text.startswith("/start"):
            parts = incoming_text.split(maxsplit=1)
            argument = parts[1] if len(parts) > 1 else ""
            reply_text = ""

            if argument.startswith("pic_"):
                token = raw_text.split(maxsplit=1)[1][4:] if " " in raw_text else ""
                record = start_chat_for_token(token, chat_id)

                if record:
                    tie_row = get_tie_by_id(str(record.get("tie_id") or ""))
                    tie_name = (
                        str(tie_row.get("tie_name") or tie_row.get("name"))
                        if tie_row
                        else str(record.get("tie_id"))
                    )
                    hold_until = str(record.get("hold_until") or "")
                    reply_text = (
                        f"Knotify knotted-pic request\n\n"
                        f"Tie: {tie_name}\n"
                        f"Draft: \"I'd like to view this tie knotted on someone "
                        f"before I buy.\"\n\n"
                        f"Your tie is held for 24 hours (until {hold_until}). "
                        f"A 100 NGN pic fee is added to your next checkout.\n"
                        f"Tell us the occasion / preferred knot and we'll send "
                        f"the photo."
                    )
                else:
                    reply_text = (
                        "This pic link is no longer valid. Open the product page "
                        "and tap \"Request knotted pic\" again."
                    )
            else:
                reply_text = (
                    "Welcome to Knotify. Browse ties at the shop, or tap "
                    "\"Request knotted pic\" on a tie to preview it knotted."
                )

            if reply_text:
                telegram_api_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
                reply_payload = {"chat_id": chat_id, "text": reply_text}
                async with httpx.AsyncClient() as client:
                    await client.post(telegram_api_url, json=reply_payload, timeout=15.0)
                return {"status": "okay"}

        final_report = "" # Default empty string
        
        # /today returns today's paid orders.
        if incoming_text == "/today":
            final_report = "Just testing"

        if final_report:
            telegram_api_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            response_payload = {
                "chat_id": chat_id,
                "text": final_report,
                "parse_mode": "Markdown" 
            }
            print("E work")

            async with httpx.AsyncClient() as client:
                response = await client.post(telegram_api_url, json= response_payload)
                print(response.status_code)
                print(response.text)

            return {"status":"okay"}
        

@router.head("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def system_check():
    """Light weight system function to check, and keep Render up"""

    return JSONResponse(
        content={
            "status": "running",
            "environment":"development",
            "message": "KnotifyCU"
        }
    )

@router.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def system_check():
    """Light weight system function to check, and keep Render up"""

    return JSONResponse(
        content={
            "status": "running",
            "environment":"development",
            "message": "KnotifyCU"
        }
    )