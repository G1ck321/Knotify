# Telegram Inventory Automation Blueprint

## Goal

Give authorized inventory staff a Telegram workflow for registering sold ties and changing quantities without editing Supabase manually.

The Telegram bot must call the backend inventory service. It must not write directly to Supabase from the bot process. The backend remains the single source of truth used by the marketplace, checkout, and webhook.

## Commands

Suggested commands:

```text
/register_tie <tie_id> | <tie_name> | <price> | <quantity> | <image_url>
/stock <tie_id>
/set_quantity <tie_id> <quantity>
/sold <tie_id> [quantity]
/restock <tie_id> <quantity>
/inventory
```

Examples:

```text
/register_tie new-plain-black | Plain Black Tie | 2100 | 35 | https://...
/sold new-plain-black 1
/set_quantity new-plain-black 20
/restock new-plain-black 10
/stock new-plain-black
```

`/sold tie_id` should default to quantity `1`. The command must reject zero or negative sale quantities.

## Authorization

1. Read the Telegram sender ID from `message.from.id`.
2. Compare it with an allowlist stored in the backend environment, for example:

```env
TELEGRAM_INVENTORY_ADMIN_IDS=123456789,987654321
```

3. Reject all non-allowlisted users with a generic authorization message.
4. Never use a username as the identity check because usernames can change.
5. Log the Telegram user ID, command, tie ID, and result, but never log API keys or payment secrets.

## Database Changes

Add an inventory audit table:

```sql
create table if not exists inventory_events (
    id bigint generated always as identity primary key,
    tie_id text not null references ties(tie_id),
    event_type text not null check (event_type in ('registered', 'sold', 'restocked', 'quantity_set')),
    quantity_change integer not null,
    quantity_before integer not null check (quantity_before >= 0),
    quantity_after integer not null check (quantity_after >= 0),
    source text not null default 'telegram',
    actor_id text not null,
    idempotency_key text unique not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_inventory_events_tie_created
on inventory_events (tie_id, created_at desc);
```

The existing `ties.quantity` remains the current value. `inventory_events` explains how that value changed.

## Atomic Backend Operations

Implement database functions or transaction-backed service methods for:

### Register tie

- Validate `tie_id` and `tie_name`.
- Validate price is non-negative.
- Validate quantity is non-negative.
- Insert the tie only if the ID does not already exist.
- Set `is_active` to `quantity > 0`.
- Write a `registered` inventory event.
- Reject duplicate registration instead of overwriting an existing tie.

### Mark sold

- Lock the tie row with `FOR UPDATE` or use an atomic conditional update.
- Read the current quantity.
- Reject the request if the requested quantity is greater than available stock.
- Set `quantity = quantity - sold_quantity`.
- Set `is_active = quantity > 0`.
- Write a `sold` event.
- Use a unique idempotency key so Telegram retries cannot decrement twice.

Conceptual SQL:

```sql
update ties
set quantity = quantity - :sold_quantity,
    is_active = (quantity - :sold_quantity) > 0,
    updated_at = now()
where tie_id = :tie_id
  and quantity >= :sold_quantity;
```

The update must be checked. If zero rows are updated, return `not enough stock` or `tie not found`.

### Set quantity

- Lock the tie row.
- Replace the quantity with the validated non-negative value.
- Set `is_active = quantity > 0`.
- Write a `quantity_set` event containing before and after values.
- Require a reason for large changes or optionally require a second admin approval.

### Restock

- Validate the increment is positive.
- Atomically add it to the current quantity.
- Set `is_active = true` when the resulting quantity is positive.
- Write a `restocked` event.

## Idempotency

Every Telegram update can be retried. Build the idempotency key from the Telegram update ID and command, for example:

```text
telegram:<update_id>
```

Store it in `inventory_events.idempotency_key`. If the same update arrives again, return the original result without changing stock again.

## Telegram Handler Flow

```text
receive update
  -> verify sender ID
  -> parse command
  -> validate arguments
  -> create idempotency key
  -> call backend inventory service
  -> commit tie update and audit event in one transaction
  -> reply with old quantity, new quantity, and tie name
```

Example success response:

```text
Recorded sale
Plain Black Tie
Quantity: 35 -> 34
Event: sold
Reference: telegram:1234567890
```

Example failure responses:

```text
Not authorized.
Tie not found.
Insufficient stock: requested 3, available 2.
That Telegram update was already processed.
```

## Marketplace Behavior

The backend inventory response must include:

```json
{
  "tie_id": "new-plain-black",
  "tie_name": "Plain Black Tie",
  "quantity": 0,
  "is_active": false,
  "is_sold_out": true
}
```

The frontend must treat both `0` and `"0"` as sold out. A zero-quantity tie should:

- Remain visible if the catalog includes it.
- Display `OUT OF STOCK` or `SOLD OUT`.
- Be ordered after ties with available quantity.
- Disable reserve/add-to-bag actions.
- Be excluded when `only_active=true` is requested.

## Deployment Safety

- Keep Telegram bot tokens, admin IDs, Supabase keys, and Flutterwave secrets in Render environment variables.
- Never put these values in frontend `.env` files.
- Use the Render backend URL from the frontend build: `https://knotify-p9i2.onrender.com`.
- Configure the Telegram webhook URL to the Render backend, for example:

```text
https://knotify-p9i2.onrender.com/webhook/telegram
```

- Add a health check that verifies the process is running without exposing credentials.
- Deploy database migrations before deploying bot commands.
- Test the same Supabase project from local, Render, and the Telegram handler.

## Test Checklist

- Unauthorized Telegram user is rejected.
- Tie registration rejects duplicate IDs.
- Sale of one tie decrements exactly once.
- Sale of multiple ties rejects insufficient stock.
- Replayed Telegram update does not decrement again.
- Restocking a sold-out tie makes it active again.
- Setting quantity to zero marks the tie inactive.
- Marketplace shows zero-quantity ties as sold out.
- Checkout rejects quantities greater than current stock.
- Webhook stock decrement is idempotent and does not double-decrement a paid order.
- Every inventory mutation has an audit event.
