# Order Inventory Hold Lifecycle

## Policy

A tie is held for 10 minutes when a payment order is created. The hold prevents another customer from checking out with the same units while the first customer is on Flutterwave.

The hold is not the final sale. Base stock is decremented only after a successful payment webhook.

## Lifecycle

```text
cart
  -> availability check
  -> pending order + active inventory hold (10 minutes)
  -> Flutterwave payment
       -> successful webhook: order paid, stock decremented, hold consumed
       -> failed/cancelled webhook: order failed, hold released
       -> no webhook after expiry: hold expires and becomes available again
```

## Checkout behavior

When the user selects `Proceed to Details`:

1. Frontend calls `POST /quantity/availability`.
2. Backend expires old holds and calculates available quantity.
3. If every line is available, the payment details form opens.
4. If one or more lines are held, the cart remains unchanged and names the unavailable ties.
5. The user may continue with available ties only, or keep reviewing the full bag.
6. `/api/pay` performs the check again and atomically creates the hold. The frontend check is only an early warning.

Unavailable cart lines are never included in the payment payload after the user continues.

## Order states

| State | Meaning |
| --- | --- |
| `pending` | Payment session created and inventory held for 10 minutes. |
| `paid` | Flutterwave confirmed payment; stock was decremented. |
| `failed` | Flutterwave reported failure/cancellation; hold was released. |
| expired hold | No payment completion arrived before the 10-minute deadline. |

## Required migration

Run:

```text
Backend/sql/20261009_inventory_holds.sql
```

It creates:

- `inventory_holds`
- `check_inventory_availability(...)`
- `reserve_inventory(...)`
- `release_inventory_hold(...)`
- `consume_inventory_hold(...)`
- `orders.hold_expires_at`

## Deployment order

1. Run the SQL migration in the same Supabase project used by Render.
2. Deploy the backend code.
3. Confirm `POST /quantity/availability` returns live availability.
4. Confirm `/api/pay` creates a pending order and an active hold.
5. Confirm a second checkout sees the tie as temporarily unavailable.
6. Send a successful Flutterwave webhook and verify the hold becomes `consumed` and stock decreases once.
7. Send a failed webhook and verify the order becomes `failed` and the hold is released.
8. Deploy the frontend build.

## Operational safeguards

- Do not decrement base stock when an order is merely pending.
- Do not trust frontend quantities or prices; `/api/pay` revalidates them.
- Treat webhook retries as idempotent. A paid order must not decrement stock twice.
- Keep the Render backend and Supabase project aligned.
- Keep `SUPABASE_KEY` and Flutterwave secrets only in Render environment variables.
