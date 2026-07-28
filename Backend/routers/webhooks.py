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