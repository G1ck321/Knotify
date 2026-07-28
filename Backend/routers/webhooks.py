import httpx

from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/webhook", tags=["Third Party Web Hooks"])

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