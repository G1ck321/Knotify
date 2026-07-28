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

        # Use authenticated user ID if present; fallback to guest identifier
        user_id = current_user["id"] if (current_user and "id" in current_user) else f"guest_{payload.email}"

        db_payload = {
            "user_id": user_id,
            "tx_ref": tx_ref,
            "status": "pending",
            "amountpaid": calculated_total,
            "items_total": payload.items_total,
            "item_count": len(payload.items),
            "currency": "NGN",
            "order_details": payload.order_summary,
            # "delivery_address": payload.address,
            "room_number": payload.roomNumber,
            "matric_number": payload.matricNumber,
            "email": payload.email,
            "telegramPhone": payload.telegramPhone,
        }

        #Insert order into database before payment gateway
        print("Attempting to insert into Supabase..")
        order_insert = supabase.table("orders").insert(db_payload).execute()
        print("Inserted Boyy!")

        #create flutter payload
        flutterwave_api_url = "https://api.flutterwave.com/v3/payments"
        headers = {
            "Authorization": f"Bearer {settings.FW_SECRET_KEY}",
            "Content-Type":"application/json"
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
                "user_id": user_id,
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
