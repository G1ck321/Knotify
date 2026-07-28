from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends

from dependencies import get_current_user
from request_models import OrderCreateRequest
from utils.tokens import generate_tx_ref


router = APIRouter(prefix="/api", tags=["Payment Initiaion pipeline"])

@router.post("/pay")
async def initialize_payment(
    payload: OrderCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    # Add delivery fee of 200 on the server so the frontend cannot alter it.
    calculated_total = float(payload.amount) + 200
    tx_ref = generate_tx_ref("order")

    # The frontend never supplies user_id; the backend injects it from the JWT.
    db_payload = {
        "user_id": current_user["id"],
        "tx_ref": tx_ref,
        "status": "pending",
        "amountpaid": calculated_total,
        "order_details": payload.order_summary,
        "delivery_address": payload.address,
        "room_number": payload.roomNumber,
        "matric_number": payload.matricNumber,
        "email": payload.email,
        "telegramPhone": payload.phone,
        "items_total": payload.items_total,
        "item_count": len(payload.items),
    }

    return JSONResponse(content={"message": "Payment initialized", "tx_ref": tx_ref, "order": db_payload})