from email import message
import traceback, httpx
from urllib import response

from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, HTTPException, status
from flask import redirect
from database import supabase
from config import settings

from dependencies import get_current_user
from request_models import OrderCreateRequest
from utils.tokens import generate_tx_ref


router = APIRouter(prefix="/api", tags=["Payment Initiaion pipeline"])

@router.post("/pay")
async def initialize_payment(
    payload: OrderCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    try: 
        # Add delivery fee of 200 on the server so the frontend cannot alter it.
        calculated_total = float(payload.amount) + 200
        tx_ref = generate_tx_ref("order")

        # The frontend never supplies user_id; the backend injects it from the JWT.
        db_payload = {
            "user_id": current_user["id"],
            "tx_ref": tx_ref,
            "status": "pending",
            "amountpaid": calculated_total,
            "order_details": payload.order_details,
            "room_number": payload.roomNumber,
            "email": payload.email,
            "telegramPhone": payload.telegramPhone,
            "items_total": payload.items_total,
            "status":"pending",
            "item_count": len(payload.items),
        }

        #Insert order into database before payment gateway
        print("Attempting to insert into Supabase..")
        supabase.table("orders").insert(db_payload).execute()
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
                "name":payload.name,
                "phone":payload.telegramPhone,
                "email":payload.email
            },
            "meta":{
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
                return {"checkout_url": hosted_checkout_url}

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

        #Return 500 to client

    raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crash details: {str(e)}"
    )


    return JSONResponse(content={"message": "Payment initialized", "tx_ref": tx_ref, "order": db_payload})
