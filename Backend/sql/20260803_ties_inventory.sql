-- Inventory and checkout normalization for tie stock tracking.

create table if not exists ties (
    tie_id text primary key,
    tie_name text not null,
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
    quantity = excluded.quantity,
    is_active = excluded.is_active,
    updated_at = now();