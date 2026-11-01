from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

import traceback
import uvicorn

from config import auth_secret
from routers import auth, orders, pic_requests, quantity, webhooks
# , webhooks

# ── MUST-FIX: dedicated JWT signing key ─────────────────────────────────────────
# Sessions are only as strong as the key that signs them. Reusing the payment
# key (FW_SECRET_KEY) or the database service-role key (SUPABASE_KEY) would
# turn a leak of either into full auth bypass, so the server refuses to start
# until AUTH_SECRET_KEY is set to a long, app-only random value.
MIN_AUTH_SECRET_LENGTH = 32


def _require_dedicated_auth_secret() -> None:
    secret = auth_secret()
    if len(secret) < MIN_AUTH_SECRET_LENGTH:
        raise RuntimeError(
            f"AUTH_SECRET_KEY is missing or shorter than {MIN_AUTH_SECRET_LENGTH} characters. "
            "Generate one with:\n"
            "  python -c \"import secrets; print(secrets.token_urlsafe(48))\"\n"
            "then add `AUTH_SECRET_KEY=<that value>` to Backend/.env and to the "
            "production environment. Never reuse FW_SECRET_KEY or SUPABASE_KEY."
        )


_require_dedicated_auth_secret()

app = FastAPI(title="Knotify Covenant University", version="2026.1.0")

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Generic 500: fixed body for the client, full traceback in the server log.

    Exception text can carry table names, connection strings, SQL fragments and
    file paths, so it must never be echoed back to the browser.
    """
    print(f"--- Unhandled error: {request.method} {request.url.path} ---")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Log validation failures in a readable way before returing 422"""
    print("\n--- FastAPI Validation Errors ---")
    for err in exc.errors():
        print(f"Field Location: {err['loc']}")
        print(f"Error Message: {err['msg']}")
        print(f"Error type: {err['type']}")

    return JSONResponse(status_code=422, content={"detail":exc.errors()})

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=[
        "http://localhost:3003",
        "http://localhost:3001",
        "https://knotifycu.vercel.app",
                   "https://knotifycu.knotifycu.workers.dev"],
)

app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(pic_requests.router)
app.include_router(quantity.router)
app.include_router(webhooks.router)

if __name__ =="__main__":
    uvicorn.run("main:app", port=5500, host="0.0.0.0", reload=True)