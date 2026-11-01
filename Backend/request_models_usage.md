# Request Models Usage Notes

This file shows how the new request models should be used without editing the legacy `schemas.py` immediately.

## Why create a new file

The project currently has a flat checkout schema. That is fine for a single-item order, but it becomes awkward when:

- one checkout contains multiple items
- you want a user dashboard that lists all their orders
- you need item images stored in Supabase Storage
- you want to prevent duplicate inserts on retries

So the safer move is to create a new request model file and migrate routes toward it gradually.

## New models

- `OrderItemInput` represents one purchased item.
- `CheckoutRequest` represents the whole payment checkout request.
- `SignupRequest` represents account creation.
- `LoginRequest` represents login.

## How the checkout request should work

The frontend sends a normalized body like this:

```json
{
  "name": "Jane Doe",
  "phone": "0123456789",
  "matricNumber": "12AB345678",
  "address": "Hall A",
  "email": "jane@example.com",
  "roomNumber": "12",
  "items": [
    {
      "item_id": "rice-001",
      "name": "Jollof rice",
      "quantity": 1,
      "unit_price": 1500,
      "image_url": "https://..."
    },
    {
      "item_id": "drink-002",
      "name": "Chapman",
      "quantity": 2,
      "unit_price": 700,
      "image_url": "https://..."
    }
  ],
  "amount": 2900
}
```

## Building concept

The key idea is that the request model should describe the checkout as a collection of line items, not one long string.

That gives you:

- cleaner validation
- better duplicate detection
- easier database normalization
- simpler dashboard rendering

## Suggested service flow

1. Validate the request with `CheckoutRequest`.
2. Compute the cart fingerprint from `user_id + item list + amount`.
3. Search for an existing pending order with the same fingerprint.
4. Reuse the old order if it exists.
5. Otherwise create a new order row.
6. Insert one row per item in `order_items`.
7. Store image links in `image_url` or `image_path`.
8. Create the Flutterwave checkout session.
9. Save the `tx_ref` in the order row.
10. Update the order to `paid` from the webhook only once.

## What goes into the database

### `users`

Stores identity and login data.

### `orders`

Stores the payment transaction and the order owner.

### `order_items`

Stores each line item, its quantity, and its image link.

### `order_media`

Optional, only if one order can contain many uploaded files.

## How the dashboard should read data

The dashboard should query by `user_id` and return:

- order status
- transaction reference
- payment time
- items in the order
- image links from Supabase Storage

The frontend only renders the response.
The backend owns the ownership logic.

## What to change in Flutterwave payloads

Flutterwave itself does not need a rewrite.

You only need to pass more context in `meta`, such as:

- `user_id`
- `order_id`
- `cart_hash`
- `item_count`

That makes webhook reconciliation much easier.

## Duplicate prevention rule

Use all three of these together:

- a unique `tx_ref`
- a unique cart hash
- a unique pending-order check per user

That prevents double clicks, retry posts, and duplicate webhook inserts.
