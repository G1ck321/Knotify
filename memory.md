# Knotify Architectural Memory & Handoff Specification

This document provides a comprehensive, complete architectural overview of the **Knotify** e-commerce platform for Covenant University. It is designed to allow any AI agent or software engineer to immediately understand the repository structure, database setup, payment pipelines, environment configurations, and future roadmap.

---

## 1. Executive Summary & Core Philosophy

**Knotify** is a specialized e-commerce & residence hall delivery marketplace designed for Covenant University scholars. It provides chapel-compliant ties (Corporate, Official Chapel, Vintage, Bow Ties) with direct delivery coordinates assigned to student residence halls.

- **Frontend Technology Stack**: React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4, Motion (Framer Motion), Lucide React.
- **Backend Technology Stack**: Python FastAPI, Pydantic v2, Supabase Client (`supabase-py`), HTTPX, Uvicorn.
- **Deployment Targets**: Frontend hosted on Vercel (`https://knotifycu.vercel.app/`), Backend hosted on Render.

---

## 2. Directory Structure & Key Files

```
Knotify/
├── memory.md                        # Root handoff specification & architecture guide (THIS FILE)
├── index.html                       # Vite HTML entry point
├── package.json                     # Frontend dependencies & build scripts
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript compiler configuration
├── src/                             # Main Frontend Source Directory
│   ├── App.tsx                      # Main React Application shell, router & global state manager
│   ├── main.tsx                     # React root DOM renderer
│   ├── index.css                    # Tailwind CSS v4 styling & custom tokens
│   ├── types.ts                     # Core TypeScript interfaces (Product, CartItem, Order, Reservation)
│   └── components/                  # UI Components
│       ├── CheckoutPage.tsx         # Direct Payment Checkout (Flutterwave integration, delivery details)
│       ├── ProductDetailModal.tsx   # Detailed tie view modal with direct purchase action
│       ├── Marketplace.tsx          # Product catalog grid with search & category filtering
│       ├── LandingPage.tsx          # High-converting visual hero page & featured items
│       ├── Dashboard.tsx            # Student account dashboard & order tracking
│       ├── AuthModal.tsx            # Identity portal (Login / Register)
│       ├── BecomeSellerModal.tsx    # Seller listing form
│       ├── SellPage.tsx             # Merchant dashboard & inventory listing
│       ├── WishlistPage.tsx         # User wishlist manager
│       ├── Navbar.tsx               # Header navigation & cart badge counter
│       ├── Footer.tsx               # Footer navigation & compliance badge
│       ├── FAQSection.tsx           # Frequently Asked Questions
│       └── TiePlaceholder.tsx       # Fallback SVG graphics generator for tie cards
└── Backend/                         # FastAPI Backend Application
    ├── main.py                      # FastAPI app entry point & CORS configuration
    ├── config.py                    # Environment settings loaded via Pydantic BaseSettings
    ├── database.py                  # Supabase client instantiation
    ├── dependencies.py              # JWT authentication dependencies (`get_current_user`)
    ├── request_models.py            # Pydantic models (OrderCreateRequest, SignupRequest, LoginRequest)
    ├── schemas.py                   # Legacy database schemas
    ├── requirements.txt             # Backend Python dependencies
    ├── routers/                     # Endpoint Route Handlers
    │   ├── auth.py                  # User registration & authentication (`/api/signup`, `/api/login`)
    │   ├── orders.py                # Payment checkout initiation (`/api/pay`)
    │   └── webhooks.py              # Payment webhooks (`/webhook/flutterwave`, `/webhook/telegram`)
    └── utils/                       # Utility helpers
        ├── security.py              # Password hashing & JWT creation
        └── tokens.py                # Transaction reference generator (`generate_tx_ref`)
```

---

## 3. Database Architecture & Supabase Strategy

### Current Database Strategy: Supabase (Temporary / Preserved)
The system currently uses **Supabase** as its primary cloud data store and object storage bucket.

1. **Storage Bucket (`KnotifyTies`)**:
   - Product tie images are stored in Supabase storage buckets.
   - Example Image URL pattern in `src/types.ts`:
     `https://vncevwdwuvmwymisxfhh.supabase.co/storage/v1/object/sign/KnotifyTies/corporateTies/...`
   - **CRITICAL DIRECTIVE**: All Supabase storage URLs and client configuration (`Backend/database.py`) MUST be preserved until asset migration is explicitly requested.

2. **Database Table: `orders`**:
   | Field | Type | Description |
   |---|---|---|
   | `id` | UUID / Int | Primary Key |
   | `user_id` | Text / UUID | Owner user ID injected via JWT |
   | `tx_ref` | Text (Unique) | Transaction reference string (e.g. `KNT-ORD-123456`) |
   | `status` | Text | Order status (`pending`, `paid`, `failed`, `cancelled`) |
   | `amountpaid` | Numeric / Float | Total order amount (Items total + ₦200 delivery fee) |
   | `items_total` | Numeric / Float | Subtotal of purchased items |
   | `item_count` | Integer | Total count of tie units in order |
   | `currency` | Text | `NGN` |
   | `order_details` | Text | Human-readable line items summary (e.g. `1 x Blue Floral Corporate Tie`) |
   | `delivery_address` | Text | Selected Covenant Residence Hall (e.g. `Daniel Hall`) |
   | `room_number` | Text | Student room number (e.g. `A304`) |
   | `matric_number` | Text | Optional student matric number |
   | `email_snapshot` | Text | Student email at purchase time |
   | `phone_snapshot` | Text | Student phone / WhatsApp number |
   | `created_at` | Timestamp | Order creation timestamp |

### Future Database Strategy: Local PostgreSQL Migration Roadmap
When transitioning from Supabase to local/hosted PostgreSQL:
1. `DATABASE_URL` is already declared in `Backend/config.py`:
   `DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/knotify`
2. `Backend/request_models.py` contains pre-validated Pydantic models for SQLAlchemy models (`OrderCreateRequest`, `UserCreateRequest`).
3. Replace `Backend/database.py` with an async SQLAlchemy engine (`create_async_engine`) and session generator.

---

## 4. Production Direct Payment Checkout Flow (Flutterwave)

The application operates a direct payment checkout pipeline targeting **Flutterwave** as its primary payment gateway.

```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  Client React   │ ────> │  FastAPI /api/pay    │ ────> │  Flutterwave V3 API    │
│  Checkout Page  │       │ (Creates Pending     │       │  https://api.flutter... │
│  (Form & Cart)  │       │  Order in Supabase)  │       │ (Returns checkout_url) │
└─────────────────┘       └──────────────────────┘       └────────────────────────┘
         │                                                            │
         │ Redirects User to Flutterwave Hosted Payment Page          │
         ▼                                                            ▼
┌─────────────────┐                                      ┌────────────────────────┐
│ Payment Success │ <─────────────────────────────────── │ User Completes Payment │
│ Redirects back  │   Returns ?status=successful         │ via Card, Transfer,    │
│ with tx_ref     │           &tx_ref=...                │ USSD, or OPay          │
└─────────────────┘                                      └────────────────────────┘
                                                                      │
                                                                      │ Asynchronous Webhook
                                                                      ▼
                                                         ┌────────────────────────┐
                                                         │ /webhook/flutterwave   │
                                                         │ Validates verif-hash & │
                                                         │ sets order to 'paid'   │
                                                         └────────────────────────┘
```

### Key Workflow Details:
1. **Delivery Fee Calculation**:
   - Standard campus delivery & development fee is fixed at **₦200** across all residence halls.
   - Server calculates total: `calculated_total = items_total + 200`.

2. **Frontend Redirection & Query Parameters**:
   - Upon successful payment completion, Flutterwave redirects the user back to the application URL with query parameters:
     `https://knotifycu.vercel.app/?status=successful&tx_ref=KNT-ORD-XXXXXX`
   - `CheckoutPage.tsx` listens for `status === 'successful'` in `window.location.search`, switches to Step 03 (`Paid Receipt`), displays the receipt ticket, and clears the cart.

3. **Webhook Verification (`/webhook/flutterwave`)**:
   - Flutterwave posts an event payload to `https://<your-backend-domain>/webhook/flutterwave`.
   - The endpoint validates the secret header `verif-hash` against `settings.FLW_SECRET_HASH`.
   - On match, it fetches the matching order by `tx_ref`, updates `status = "paid"`, and triggers background admin notifications.

---

## 5. Alternative Payment Provider Guide: Moniepoint Integration

For redundancy or future migration to **Moniepoint** (Moniepoint Microfinance Bank API), follow this technical specification.

### Moniepoint Architecture Overview
Moniepoint offers two primary integration channels for online merchants in Nigeria:
1. **Dynamic Transfer / Reserved Account Payments** (Generating temporary bank accounts for bank transfer checkout).
2. **Moniepoint Web Checkout API** (Card, Transfer, Moniepoint App, & USSD).

### Environment Configuration for Moniepoint
Add the following settings to `Backend/config.py` & `.env`:
```env
MONIEPOINT_API_KEY=mpy_live_xxxxxxxxxxxxxxxx
MONIEPOINT_SECRET_KEY=MK_SEC_xxxxxxxxxxxxxxxx
MONIEPOINT_CONTRACT_CODE=8492048102
MONIEPOINT_BASE_URL=https://api.moniepoint.com/v1
MONIEPOINT_WEBHOOK_SECRET=moniepoint_wh_secret_key_123
```

### Moniepoint Payment Initiation Payload & Endpoint
To initiate a payment with Moniepoint, create a backend router method (e.g. `POST /api/pay/moniepoint`):

```python
# FastAPI Implementation Example for Moniepoint Payment Initiation
import httpx
from fastapi import APIRouter, HTTPException, Depends
from config import settings

router = APIRouter(prefix="/api/pay", tags=["Moniepoint Integration"])

@router.post("/moniepoint")
async def initiate_moniepoint_payment(payload: OrderCreateRequest, current_user: dict = Depends(get_current_user)):
    calculated_total = float(payload.amount) + 200
    tx_ref = generate_tx_ref("mnp_order")

    moniepoint_payload = {
        "amount": int(calculated_total * 100), # Amount in kobo
        "currency": "NGN",
        "transactionReference": tx_ref,
        "paymentReference": tx_ref,
        "customerName": payload.name,
        "customerEmail": payload.email,
        "customerPhoneNumber": payload.telegramPhone,
        "redirectUrl": "https://knotifycu.vercel.app/?status=successful&tx_ref=" + tx_ref,
        "paymentDescription": f"Knotify Ties - {payload.order_summary}"
    }

    headers = {
        "Authorization": f"Bearer {settings.MONIEPOINT_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.MONIEPOINT_BASE_URL}/merchant/transactions/initiate",
            json=moniepoint_payload,
            headers=headers
        )
        res_data = response.json()
        if response.status_code == 200 and res_data.get("status") == "SUCCESS":
            return {
                "checkout_url": res_data.get("data", {}).get("checkoutUrl"),
                "tx_ref": tx_ref
            }
        else:
            raise HTTPException(status_code=500, detail="Moniepoint Payment Initiation Failed")
```

### Moniepoint Webhook Verification
Moniepoint sends webhooks for completed payments. Signature verification uses HMAC SHA-512 over the request body:

```python
import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException

@router.post("/webhook/moniepoint")
async def moniepoint_webhook(request: Request, x_moniepoint_signature: str = Header(None, alias="x-moniepoint-signature")):
    body_bytes = await request.body()
    
    # Compute expected signature
    computed_signature = hmac.new(
        settings.MONIEPOINT_WEBHOOK_SECRET.encode('utf-8'),
        body_bytes,
        hashlib.sha512
    ).hexdigest()

    if not x_moniepoint_signature or x_moniepoint_signature != computed_signature:
        raise HTTPException(status_code=401, detail="Invalid Moniepoint Webhook Signature")

    payload = await request.json()
    if payload.get("paymentStatus") == "PAID" or payload.get("responseCode") == "00":
        tx_ref = payload.get("transactionReference")
        # Update order in Supabase / Postgres to 'paid'
        supabase.table("orders").update({"status": "paid"}).eq("tx_ref", tx_ref).execute()

    return {"status": "SUCCESS"}
```

---

## 6. Backend API Reference

### 1. `POST /api/signup`
- **Description**: Registers a new Covenant student user account.
- **Request Body**:
  ```json
  {
    "full_name": "Daniel Adebayo",
    "email": "daniel@student.covenant.edu.ng",
    "password": "Password123!",
    "parentsNumber": "08098765432",
    "telegramPhone": "08012345678"
  }
  ```
- **Response**: User object & JWT bearer access token.

### 2. `POST /api/login`
- **Description**: Authenticates user credentials and yields a JWT access token.
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "user": { "id": "...", "full_name": "...", "email": "..." }
  }
  ```

### 3. `POST /api/pay`
- **Description**: Initiates a Flutterwave payment order session.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "Daniel Adebayo",
    "email": "daniel@student.covenant.edu.ng",
    "telegramPhone": "08012345678",
    "parentsNumber": "08098765432",
    "address": "Daniel Hall",
    "roomNumber": "A304",
    "matricNumber": "21CG028491",
    "amount": 4000,
    "items": [
      {
        "item_id": "corp-blue-floral",
        "name": "Blue Floral Corporate Tie",
        "quantity": 1,
        "unit_price": 4000
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "checkout_url": "https://checkout.flutterwave.com/v3/hosted/pay/...",
    "tx_ref": "KNT-ORD-839201",
    "order": { ... }
  }
  ```

### 4. `POST /webhook/flutterwave`
- **Description**: Webhook endpoint for Flutterwave payment verification.
- **Headers**: `verif-hash: <FLW_SECRET_HASH>`

### 5. `POST /webhook/telegram`
- **Description**: Telegram bot webhook handling commands like `/today`.

---

## 7. Environment Setup Guide

### Frontend Environment (`.env`)
```env
VITE_BACKEND_URL=http://localhost:5500
```

### Backend Environment (`Backend/.env`)
```env
SUPABASE_URL=https://vncevwdwuvmwymisxfhh.supabase.co
SUPABASE_KEY=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMGY3ZjVmYy0...
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/knotify
FW_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxx-X
FLW_SECRET_HASH=your_custom_secret_hash_value
AUTH_SECRET_KEY=your_super_secret_jwt_key
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=-1001234567890
```

---

## 8. Summary Checklist & Open Tasks

- `[x]` Move frontend checkout from deposit reservation to direct Flutterwave payment.
- `[x]` Handle return query parameters `?status=successful&tx_ref=...` on payment completion.
- `[x]` Enforce fixed ₦200 campus delivery fee.
- `[x]` Preserve all Supabase storage image URLs in `src/types.ts`.
- `[x]` Create repository root `memory.md` architectural handoff.
- `[ ]` Configure live Flutterwave secret keys in Render production environment.
- `[ ]` Execute local PostgreSQL migration script when ready to switch off Supabase DB.
