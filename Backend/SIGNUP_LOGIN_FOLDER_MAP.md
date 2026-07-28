# Item 7 FastAPI Folder Map for Signup and Login

This is a practical view of how this backend could be organized if it also handled user signup and login.

The goal is to keep authentication separate from payment logic, so the code stays easy to read, test, and extend.

## Big idea

Signup and login should solve one problem only: prove who the user is.

Orders should solve a different problem only: track what was bought, who bought it, and whether payment succeeded.

Do not mix those two responsibilities in the same table or the same route.

## Recommended folder shape

```text
Item7/
├── main.py
├── config.py
├── database.py
├── schemas.py
├── requirements.txt
├── README.md
├── SIGNUP_LOGIN_FOLDER_MAP.md
├── routers/
│   ├── orders.py
│   ├── webhooks.py
│   └── auth.py
├── services/
│   └── auth_service.py
├── utils/
│   ├── security.py
│   └── tokens.py
├── models/
│   └── user.py
├── dependencies.py
└── tests/
    ├── test_auth.py
    └── test_orders.py
```

## What each part would do

- `routers/auth.py` would hold the API routes for signup, login, logout, password reset, and maybe profile lookup.
- `services/auth_service.py` would contain the real auth business logic, such as checking password hashes and creating users.
- `utils/security.py` would store reusable security helpers like password hashing and verification.
- `utils/tokens.py` would create and decode access tokens, usually JWTs.
- `models/user.py` would define the database shape for a user record.
- `dependencies.py` would hold shared FastAPI dependencies like `get_current_user`.
- `tests/test_auth.py` would test signup and login behavior.

## Full project walkover

### 1. User signs up

The frontend sends name, email, phone, and password to the auth route.

The backend validates the payload, hashes the password, and inserts one row into `users`.

### 2. User logs in

The frontend sends email and password to the login route.

The backend checks the password hash and returns an access token.

### 3. User creates an order

The frontend sends the order details while the access token is attached in the header.

The backend reads the logged-in user from the token and creates the order with a `user_id` foreign key.

### 4. Payment is created

The backend creates a unique `tx_ref`, stores the order as `pending`, and sends the customer to Flutterwave.

### 5. Flutterwave confirms payment

Flutterwave calls your webhook.

The webhook finds the exact order by `tx_ref`, marks it `paid`, and never creates a second copy if the same webhook arrives again.

### 6. Reports and admin tools

Telegram commands, CSV exports, and admin dashboards all read from the same normalized order tables.

## Example auth flow

### Signup

1. The frontend sends user details to `POST /auth/signup`.
2. `routers/auth.py` validates the request body with Pydantic.
3. `services/auth_service.py` checks whether the email already exists.
4. If the email is new, the password is hashed and the user is saved.
5. The API returns a success message or a token.

### Login

1. The frontend sends email and password to `POST /auth/login`.
2. `routers/auth.py` passes the request to the auth service.
3. The service compares the supplied password against the stored hash.
4. If the credentials are valid, the API returns an access token.
5. The frontend stores the token and sends it with protected requests.

## Practical database design

If you want signup, login, and orders to work cleanly, these are the core tables.

### `users`

Stores one account per person.

Suggested columns:

- `id` UUID primary key
- `full_name` text
- `email` text unique not null
- `phone` text unique nullable
- `password_hash` text not null
- `is_active` boolean default true
- `created_at` timestamp default now()
- `updated_at` timestamp default now()

Why this table exists:

- It gives each person one stable identity.
- It keeps login credentials separate from order data.
- It makes it easy to attach many orders to one user.

### `orders`

Stores one row per checkout attempt or completed purchase.

Suggested columns:

- `id` UUID primary key
- `user_id` UUID foreign key to `users.id`
- `tx_ref` text unique not null
- `status` text not null
- `amountpaid` numeric not null
- `currency` text default `NGN`
- `order_details` text not null
- `delivery_address` text
- `room_number` text
- `matric_number` text nullable
- `email_snapshot` text nullable
- `phone_snapshot` text nullable
- `created_at` timestamp default now()
- `paid_at` timestamp nullable

Why this table exists:

- It records the payment lifecycle.
- It gives each checkout attempt a unique `tx_ref`.
- It lets Flutterwave webhooks update one exact order row.

### `order_items`

Use this only if one order contains many menu items.

Suggested columns:

- `id` UUID primary key
- `order_id` UUID foreign key to `orders.id`
- `item_name` text not null
- `quantity` integer not null
- `unit_price` numeric not null
- `created_at` timestamp default now()

Why this table exists:

- It normalizes repeated menu items.
- It avoids stuffing many items into one long text field.
- It makes reporting and analytics easier later.

### `payment_attempts`

Use this if you want to track retries and prevent duplicate payment sessions.

Suggested columns:

- `id` UUID primary key
- `order_id` UUID foreign key to `orders.id`
- `provider` text not null
- `provider_ref` text unique not null
- `status` text not null
- `raw_response` jsonb nullable
- `created_at` timestamp default now()

Why this table exists:

- It helps with retry handling.
- It gives you a history of gateway responses.
- It is useful when debugging webhook or checkout issues.

## SQL schema that follows the plan

This SQL is written for PostgreSQL or Supabase.

```sql
-- One row per user account.
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null unique,
    phone text unique,
    password_hash text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- One row per checkout or payment attempt.
create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    tx_ref text not null unique,
    status text not null default 'pending',
    amountpaid numeric(12,2) not null,
    currency text not null default 'NGN',
    order_details text not null,
    delivery_address text,
    room_number text,
    matric_number text,
    email_snapshot text,
    phone_snapshot text,
    created_at timestamptz not null default now(),
    paid_at timestamptz
);

-- Optional normalized child table for menu items inside one order.
create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    item_name text not null,
    quantity integer not null check (quantity > 0),
    unit_price numeric(12,2) not null check (unit_price >= 0),
    created_at timestamptz not null default now()
);

-- Optional audit table for payment gateway retries and webhook tracing.
create table if not exists payment_attempts (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    provider text not null,
    provider_ref text not null unique,
    status text not null,
    raw_response jsonb,
    created_at timestamptz not null default now()
);

-- Helpful indexes for common lookups.
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_order_items_order_id on order_items(order_id);

-- If you want to auto-update updated_at, add a trigger later.
-- That is optional, but it is a good production improvement.
```

## Why these constraints stop duplicates

- `users.email` unique stops one email from being registered twice.
- `orders.tx_ref` unique stops the same checkout from being inserted twice.
- `orders.user_id` lets you attribute every order to exactly one authenticated account.
- `payment_attempts.provider_ref` unique helps prevent duplicate gateway records.

If the frontend retries the same request or Flutterwave sends the same webhook more than once, the database can reject the duplicate safely.

## How to prevent duplicates in the database

This is the important part.

### 1. Use one `user_id` per order

Each order row must belong to one user.

That means the backend can always say, "this order belongs to this account."

### 2. Generate a unique `tx_ref`

Every checkout attempt gets its own transaction reference.

Make it unique in the database, not just unique in Python.

### 3. Put a unique constraint on `tx_ref`

If Flutterwave retries a webhook, the same `tx_ref` should not create a second row.

### 4. Use an idempotency key for order creation

If the frontend submits the same order twice by mistake, the backend should reuse the existing pending order instead of inserting a second one.

### 5. Check before insert, but enforce uniqueness in SQL too

Checking first in Python is helpful.

The real protection is a unique index in the database.

### 6. Mark existing pending orders instead of creating new ones

If the same user clicks checkout twice for the same cart, update the old pending order rather than inserting a fresh one.

### 7. Use one server-side cart hash

Create a hash from the user ID plus the cart contents.

If the hash matches an existing pending order, reuse that row.

That keeps accidental double-clicks from creating a duplicate order.

## A simple anti-duplicate rule

One good pattern is:

- same authenticated user
- same cart hash
- same pending status

If all three match, reuse the row.

That is usually better than creating another order.

## Should you normalize the data?

Yes, mostly.

Normalization means you store each real thing once.

That gives you cleaner data and fewer bugs.

### Keep in `users`

- name
- email
- phone
- password hash

### Keep in `orders`

- user id
- payment reference
- payment status
- delivery info
- total amount

### Keep in `order_items`

- the actual menu items

### Do not repeat unless you need a snapshot

It is okay to copy the user's email or phone into an order snapshot if you want historical records to stay readable even if the profile changes later.

That is a deliberate snapshot, not a design mistake.

## Practical FastAPI code sketch

Below is a small but realistic example of how the auth side could look.

```python
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Auth"])


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    # 1. check whether the email already exists
    # 2. hash the password
    # 3. insert the user
    # 4. return a token or success message
    return {"message": "Account created"}


@router.post("/login")
async def login(payload: LoginRequest):
    # 1. find the user by email
    # 2. verify password hash
    # 3. create access token
    # 4. return token to the frontend
    return {"access_token": "token-here", "token_type": "bearer"}
```

## What the auth folders mean

### `security` folder

This folder is for security-specific logic only.

Typical contents:

- password hashing
- password verification
- JWT encoding and decoding
- token expiry helpers
- auth constants like secret key names and algorithms

Example:

```python
# security.py

from passlib.context import CryptContext

# Configure a single password hasher for the whole project.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # Always store hashes, never plaintext passwords.
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Compare the entered password against the stored hash.
    return pwd_context.verify(plain_password, hashed_password)
```

### `models` folder

This folder is for database-shaped objects.

Yes, it is similar to schemas, but it is not the same.

The difference is:

- `schemas` are for request and response validation.
- `models` are for database structure and persistence.

If you use SQLAlchemy or another ORM, the `models` folder usually holds your table classes.

Example:

```python
# models/user.py

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    # ORM model for the users table.
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### `services` folder

This folder holds business logic.

It should answer questions like:

- Can this email register?
- Is this password correct?
- Should this order be reused or inserted?
- What should happen after payment success?

Example:

```python
# services/auth_service.py

from utils.security import hash_password, verify_password


def register_user(user_repo, payload):
    # Check if the email already exists before creating a new user.
    existing_user = user_repo.get_by_email(payload.email)
    if existing_user:
        raise ValueError("Email already registered")

    hashed_password = hash_password(payload.password)
    return user_repo.create_user(payload, hashed_password)


def authenticate_user(user_repo, email: str, password: str):
    # Validate credentials and return the user when the match succeeds.
    user = user_repo.get_by_email(email)
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
```

### `utils` folder

This folder is for reusable helper functions that are not business rules by themselves.

Typical contents:

- small date helpers
- string normalizers
- token utilities
- cart hashing helpers
- formatting helpers

Example:

```python
# utils/tokens.py

from datetime import datetime, timedelta, timezone
from jose import jwt


def create_access_token(data: dict, secret_key: str, algorithm: str = "HS256", expires_minutes: int = 60):
    # Attach an expiry so the token cannot live forever.
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, secret_key, algorithm=algorithm)
```

### `dependencies.py` file

This file holds FastAPI dependency functions.

These are used when a route needs the current user, a database session, or any shared context.

Example:

```python
# dependencies.py

from fastapi import Depends, HTTPException, status


def get_current_user(token: str = Depends(oauth2_scheme)):
    # Decode the token and return the authenticated user.
    # Raise 401 if the token is missing, invalid, or expired.
    ...
```

## Building concepts to keep in mind

- Put data validation in `schemas`.
- Put table definitions in `models`.
- Put real decision-making in `services`.
- Put tiny reusable helpers in `utils`.
- Put auth/security-specific code in `security`.
- Put shared route inputs like `get_current_user` in `dependencies.py`.

That split keeps the codebase easy to grow without turning every file into a kitchen sink.

## Practical order code sketch

This is the part that attributes an order to a signed-in user.

```python
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout")
async def checkout(payload: dict, current_user=Depends(get_current_user)):
    # 1. build an idempotency key from the user and cart
    # 2. check whether a pending order already exists
    # 3. reuse it if present, otherwise insert a new row
    # 4. create tx_ref and call Flutterwave
    return {"checkout_url": "https://..."}
```

## How orders are attributed to a user

This is the answer to the big question.

Every order should carry the authenticated user ID.

That means the backend can always answer:

- who placed the order
- which orders belong to one account
- which payment belongs to which order

The Flutterwave reference should point back to that same order row.

So the chain becomes:

`user -> order -> tx_ref -> webhook -> paid order`

That chain is how you avoid duplicate and orphaned records.

## Practical rule for order ownership

When a logged-in user starts checkout, the backend should do this:

1. Read `current_user.id` from the token.
2. Look for an existing pending order with the same `user_id` and cart hash.
3. Reuse that order if it exists.
4. Otherwise insert a new order row with `user_id`.
5. Generate a new `tx_ref` only for the row that is actually being paid.

That makes it easy to tell which order belongs to which person.

## Do you need an orders base class?

Usually, no separate "orders base class" is needed unless you are using an ORM and want shared fields reused across multiple models.

What you actually need is one of these patterns:

- a `Base` ORM class, which is the parent class for all database models
- an `Order` model, which represents the orders table
- optional mixins, such as `TimestampMixin`, for shared columns like `created_at` and `updated_at`

So the answer is:

- use a base ORM class if you are using SQLAlchemy or similar
- do not create a special "orders base class" just for business logic

The business logic should live in services, not in the model base class.

Example concept:

```python
# models/base.py

from sqlalchemy.orm import declarative_base

# Shared parent for all ORM models.
Base = declarative_base()


# models/order.py

from sqlalchemy import Column, String, Numeric
from models.base import Base


class Order(Base):
        # This represents the orders table only.
        __tablename__ = "orders"

        id = Column(String, primary_key=True)
        tx_ref = Column(String, unique=True, nullable=False)
        status = Column(String, nullable=False)
        amountpaid = Column(Numeric, nullable=False)
```

## Dashboard logic for logged-in users

If users have a dashboard, the dashboard should show all of their own orders and nothing else.

### Where the logic lives

The logic belongs in the backend service layer and route layer, not in the frontend alone.

Typical placement:

- `routers/dashboard.py` for the HTTP endpoint
- `services/order_service.py` for fetching and shaping data
- `dependencies.py` for getting the current authenticated user

### What the dashboard endpoint should do

1. Read the logged-in user from the JWT or session token.
2. Query the `orders` table using `user_id`.
3. Join or fetch `order_items` if the dashboard needs item-level detail.
4. Optionally fetch image URLs from `order_items` or a related `order_media` table.
5. Return a clean JSON response for the frontend dashboard.

### What the frontend dashboard does

The frontend only renders the response.

It should not decide which orders belong to which user.

That decision must happen server-side.

### Suggested dashboard response shape

```json
{
    "user": {
        "id": "...",
        "full_name": "Jane Doe"
    },
    "orders": [
        {
            "id": "...",
            "tx_ref": "order-123",
            "status": "paid",
            "amountpaid": 2650,
            "created_at": "2026-07-23T10:00:00Z",
            "items": [
                {
                    "item_name": "Jollof rice",
                    "quantity": 1,
                    "unit_price": 1500,
                    "image_url": "https://..."
                }
            ]
        }
    ]
}
```

## If images live in a Supabase storage bucket

Yes, that is a good approach.

Store the image file in Supabase Storage and save only the public or signed URL in the database.

That keeps the database light and avoids storing binary files in tables.

### What to store in the DB

You usually store one of these:

- `image_url` if the image is public
- `image_path` if you want to generate signed URLs later
- both, if you want flexibility

### Where to store it

The best place is usually one of these tables:

- `order_items` if each item has its own image
- `menu_items` if the image belongs to the product itself
- `order_media` if an order needs multiple attached images

### Recommended pattern

If the same menu item image is reused across many orders, store it in `menu_items`.

If each order uploads a unique image, store it on the order item row.

## SQL change required for image links

If you want to store image links with the purchase, add an `image_url` column to the table that owns the item row.

### Option 1: one image per order item

```sql
-- Add a public or signed Supabase Storage URL to each ordered item.
alter table order_items
add column if not exists image_url text;

-- Optional: store the storage path too, if you want to generate fresh signed URLs later.
alter table order_items
add column if not exists image_path text;
```

### Option 2: one image per order summary row

```sql
-- If your system stores only one image snapshot per order, add it to orders instead.
alter table orders
add column if not exists image_url text;

alter table orders
add column if not exists image_path text;
```

### Option 3: separate media table

If an order may have multiple images, use a separate table.

```sql
-- Stores one or more media files linked to a single order.
create table if not exists order_media (
        id uuid primary key default gen_random_uuid(),
        order_id uuid not null references orders(id) on delete cascade,
        image_url text not null,
        image_path text,
        caption text,
        created_at timestamptz not null default now()
);

create index if not exists idx_order_media_order_id on order_media(order_id);
```

## Which option is best

- use `order_items.image_url` if each food item has its own image
- use `orders.image_url` if the whole order needs one snapshot image
- use `order_media` if one order can have many uploaded files

## Building concept for the dashboard

Think of the dashboard as a read-only aggregation layer.

It should not own the data.

It only reads:

- the user record from `users`
- the order rows from `orders`
- the item rows from `order_items`
- the image links from `order_items`, `orders`, or `order_media`

That separation keeps the app easy to scale and avoids mixing presentation with storage.

## Will Flutterwave need to be altered?

Not fundamentally.

You do not need to rewrite Flutterwave itself.

You only need to adjust how your backend uses it.

### What changes in your backend

- Add the authenticated user ID to the order before payment creation.
- Add a unique `tx_ref` for every order.
- Send `user_id`, `order_id`, or both in Flutterwave `meta`.
- In the webhook, find the order by `tx_ref` and update that exact row.

### What stays the same

- The Flutterwave payment endpoint stays the same.
- The redirect flow stays the same.
- The webhook verification header stays the same.

### What you may want to add

- `meta.user_id`
- `meta.order_id`
- `meta.cart_hash`

That makes reconciliation much easier.

## Recommended implementation order

1. Create the `users` table.
2. Create signup and login routes.
3. Add JWT auth middleware or dependency.
4. Add `user_id` to the `orders` table.
5. Add a unique constraint on `tx_ref`.
6. Add idempotent checkout creation.
7. Update Flutterwave payload metadata.
8. Update the webhook to mark the exact order row as paid.
9. Add tests for duplicate submission and duplicate webhook events.

## Folder layout with auth and payments together

```text
Item7/
├── main.py
├── config.py
├── database.py
├── schemas.py
├── dependencies.py
├── requirements.txt
├── README.md
├── SIGNUP_LOGIN_FOLDER_MAP.md
├── routers/
│   ├── auth.py
│   ├── orders.py
│   └── webhooks.py
├── services/
│   ├── auth_service.py
│   └── order_service.py
├── utils/
│   ├── security.py
│   └── tokens.py
└── tests/
    ├── test_auth.py
    └── test_orders.py
```

## Final rule

If the same request can be sent twice, the database must be able to ignore the second copy safely.

That means:

- unique `tx_ref`
- unique `email` in users
- foreign keys for ownership
- idempotent webhook handling
- reusable pending orders instead of blind reinserts

That is the cleanest way to keep signup, login, and payments from duplicating rows.

## How this fits with the current app

Right now, this backend is focused on payment creation, webhook handling, and Telegram admin reporting.

If signup and login were added, authentication should stay separate from those features:

- Payments should continue to live in `routers/orders.py`.
- Webhooks should continue to live in `routers/webhooks.py`.
- Authentication should live in `routers/auth.py` and its helper modules.

That separation keeps the project easier to reason about as it grows.

## A beginner-friendly auth file breakdown

If you wanted the smallest possible auth feature set, this is a good starting point:

```text
Item7/
├── routers/
│   └── auth.py
├── schemas.py
├── utils/
│   ├── security.py
│   └── tokens.py
└── dependencies.py
```

That minimal version is enough for:

- registering a user
- logging a user in
- protecting a route with a token

## Suggested endpoints

- `POST /auth/signup` for creating a new account.
- `POST /auth/login` for issuing a token.
- `GET /auth/me` for returning the current logged-in user.
- `POST /auth/logout` if you want to support token revocation later.

## If you want to scale it later

When the app gets bigger, you can split auth even further:

- `repositories/user_repository.py` for database queries only.
- `services/password_service.py` for password rules.
- `middlewares/` for request logging or auth guards.
- `docs/` for API examples and integration notes.

## Simple rule of thumb

If a file decides HTTP behavior, put it in `routers/`.
If a file decides business rules, put it in `services/`.
If a file decides how to talk to users or tokens, put it in `utils/`.

That keeps signup and login from becoming tangled with payment logic.