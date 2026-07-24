from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

import uvicorn
from routers import auth, orders
# , webhooks

app = FastAPI(title="Knotify COvenant University", version="2026.1.0")

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=["*"],
)

app.include_router(auth.router)
app.include_router(orders.router)
# app.include_router(webhooks)

if __name__ =="__main__":
    uvicorn.run("main:app", port=5500, host="0.0.0.0", reload=True)