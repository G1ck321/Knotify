-- Inventory and checkout normalization for tie stock tracking.

create table if not exists ties (
    tie_id text primary key,
    tie_name text not null,
    price numeric(12,2) not null default 0 check (price >= 0),
    quantity integer not null default 0 check (quantity >= 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_ties_is_active on ties(is_active);
create index if not exists idx_ties_quantity on ties(quantity);

alter table orders
    add column if not exists buyer_name text,
    add column if not exists cart_snapshot jsonb;

-- Optional seed values for the default launch set.
insert into ties (tie_id, tie_name, quantity, is_active)
values
    ('black-corporate-tie', 'Black Corporate Tie', 8, true),
    ('wine-corporate-tie', 'Wine Corporate Tie', 10, true)
on conflict (tie_id) do update
set tie_name = excluded.tie_name,
    price = excluded.price,
    quantity = excluded.quantity,
    is_active = excluded.is_active,
    updated_at = now();

-- Add new actual values
     insert into ties (tie_id, tie_name, price, quantity, is_active)
values
    ('new-blue-regimental', 'Blue Regimental White Striped Tie',2200, 1, true),
    ('new-navy-wine-striped', 'Navy and Wine Striped Tie',2400, 1, true),
    ('new-plain-wine', 'Plain Wine Tie',2100, 4, true),
    ('new-wine-striped', 'Wine Striped Tie',2200, 1, true),
    ('new-plain-black', 'Plain Black Tie',2000, 9, true),
    ('corp-blue-logo', 'Blue Logo Corporate Tie',2400, 1, true)
    -- ('corp-blue-floral', 'Blue Floral Corporate Tie', 8, true),
    -- ('corp-plain-blue', 'Plain Blue Corporate Tie', 8, true),
    -- ('vint-blue-dolphin', 'Blue Dolphin Character Vintage Tie', 8, true),
    -- ('vint-blue-pattern-char', 'Blue Pattern Character Tie', 10, true)