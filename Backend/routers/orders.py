import traceback

import httpx

from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, HTTPException, status

from database import supabase
from config import settings

from typing import Optional
from dependencies import get_optional_current_user
from request_models import OrderCreateRequest
from utils.tokens import generate_tx_ref


router = APIRouter(prefix="/api", tags=["Payment Initiaion pipeline"])

@router.post("/pay")
async def initialize_payment(
    payload: OrderCreateRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    try:
        # Add delivery fee of 200 on the server so the frontend cannot alter it.
        calculated_total = float(payload.amount) + 200
        tx_ref = generate_tx_ref("order")

        # Determine valid user_id UUID from authenticated session or lookup/auto-create guest user in Supabase
        user_id = current_user.get("id") if current_user else None

        if not user_id:
            cleaned_email = payload.email.strip().lower()
            existing_user = supabase.table("users").select("id").eq("email", cleaned_email).limit(1).execute()
            if existing_user.data and len(existing_user.data) > 0:
                user_id = existing_user.data[0]["id"]
            else:
                # Auto-register guest record in users table to satisfy foreign key constraint
                import uuid
                guest_uuid = str(uuid.uuid4())
                guest_payload = {
                    "id": guest_uuid,
                    "full_name": payload.name.strip(),
                    "email": cleaned_email,
                    "phone": payload.telegramPhone.strip() if payload.telegramPhone else None,
                    "password_hash": "$2b$12$GuestCheckoutUnusablePasswordHashPlaceholder",
                    "is_active": True
                }
                user_res = supabase.table("users").insert(guest_payload).execute()
                if user_res.data:
                    user_id = user_res.data[0]["id"]
                else:
                    user_id = guest_uuid

        db_payload = {
            "user_id": user_id,
            "tx_ref": tx_ref,
            "status": "pending",
            "amountpaid": calculated_total,
            "items_total": payload.items_total,
            "item_count": len(payload.items),
            "currency": "NGN",
            "order_details": payload.order_summary,
            "room_number": payload.roomNumber,
            "email": payload.email,
            "telegramPhone": payload.telegramPhone,
        }

        #Insert order into database before payment gateway
        print("Attempting to insert into Supabase..")
        order_insert = supabase.table("orders").insert(db_payload).execute()
        print("Inserted Boyy!")

        fw_key = settings.FW_SECRET_KEY.strip() if settings.FW_SECRET_KEY else ""

        # If Flutterwave secret key is not set in backend .env, return error or fallback checkout URL
        if not fw_key:
            print("WARNING: FW_SECRET_KEY is empty in backend .env file.")
            # Return demo payment checkout redirect to prevent crash during key setup
            demo_url = f"https://knotifycu.vercel.app/?status=successful&tx_ref={tx_ref}"
            return {
                "checkout_url": demo_url,
                "tx_ref": tx_ref,
                "order": order_insert.data[0] if (order_insert.data and len(order_insert.data) > 0) else db_payload,
                "note": "FW_SECRET_KEY missing in .env - running in demo checkout mode"
            }

        # create flutter payload
        flutterwave_api_url = "https://api.flutterwave.com/v3/payments"
        headers = {
            "Authorization": f"Bearer {fw_key}",
            "Content-Type": "application/json"
        }

        flutter_payload = {
            "tx_ref":tx_ref,
            "amount": calculated_total,
            "redirect_url":"https://knotifycu.vercel.app/",
            "customer":{
                "name": payload.name,
                "phone": payload.telegramPhone,
                "email":payload.email
            },
            "meta":{
                "user_id": user_id or "guest",
                "item_count": len(payload.items),
                "roomNumber": payload.roomNumber
            },
            "payment_options":"card, ussd, banktransfer, opay",
            "customizations":{
                "title":"KnotifyCu",
                "description": f"Ties NGN {payload.amount} | Delivery & Development Fee: NGN 200"
            }
        }

        #Ask flutterwave for the checkout link
        print("Reaching out to Flutterwave..")
        async with httpx.AsyncClient() as client:
            response = await client.post(flutterwave_api_url, json=flutter_payload, headers=headers)
            flw_data = response.json()

            if response.status_code == 200 and flw_data.get("status") == "success":
                hosted_checkout_url = flw_data.get("data",{}).get("link")
                print("Checkout Link generated successfully")
                return {"checkout_url": hosted_checkout_url, "tx_ref": tx_ref, "order": order_insert.data[0] if order_insert.data else db_payload}

            else:
                print(f"Flutterwave rejected request with status {response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Gateway Error {flw_data.get("message")}"
                )

    except Exception as e: 
    
        print("!! Look Out Error Occured Mehn!!")
        traceback.print_exc()
        print("!!!!!!!!!!!!!!!!!!!!!!!! \n")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crash details: {str(e)}"
        )
