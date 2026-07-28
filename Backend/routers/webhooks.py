from fastapi.encoders import isoformat
import httpx
import re

from urllib import response
from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException, status, Header, Request, BackgroundTasks
from database import supabase
from config import settings
from datetime import timezone, datetime


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
    if not verif_hash or verif_hash != settings.FLW_SECRET_HASH:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature validation handshake mismatch"
        )

    # parse the webhook body after the signature check passes
    payload = await request.json()

    if payload.get("status") == "successful" or payload.get("data", {}).get("status")=="successful":

        data_block = payload.get("data",payload)
        tx_ref = data_block.get("tx_ref")

        # Ignore duplicate webhook orders for the same orders
        existing_order =  supabase.table("orders").select("*").eq("tx_ref",tx_ref).execute()

        if not existing_order.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order reference tx_ref not found."
            )
        order_record = existing_order.data[0]

        #If paid
        if order_record.get("status") == "paid":
            return {"status": "ignored", "reason": "Already processed transaction pattern."}
        
        # Update the order row to paid once the gateway confirms success.
        updated_order = supabase.table("orders").update({"status": "paid"}).eq("tx_ref", tx_ref).execute()

        # Check if database update was successful
        if updated_order.data:
            order_record = updated_order.data[0]
            
            # Background tasks keep the webhook response fast and non-blocking.
            # background_tasks.add_task(send_email_order_receipt, order_record)
            background_tasks.add_task(order_record)
        else:
            print("DEBUG: Supabase update failed or returned empty data.")

    return {"status": "acknowledged"}
        


@router.post("/telegram")
async def handle_telegram_requests(
    request:Request
):
    payload = await request.json()
    if "message" in payload and "text" in payload["message"]:
        chat_id = payload["message"]["chat"]["id"]
        incoming_text = payload["message"]["text"].strip().lower()
        
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

            async with httpx.AsyncClient() as client:
                client.post(telegram_api_url, json= response_payload)

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