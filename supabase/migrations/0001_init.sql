-- ============================================================================
-- Milano Home Services — Milestone 1 schema
-- Catalog (categories, services, zones), orders, and status history.
-- i18n text is stored as JSONB: { "it": "...", "en": "...", "ar": "..." }.
-- Row-Level Security is enabled on every table.
-- ============================================================================

-- Needed for gen_random_uuid().
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enum: order status lifecycle
-- pending -> reviewing -> accepted/rejected -> in_progress -> completed
-- (+ cancelled at any point)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'reviewing',
      'accepted',
      'rejected',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('cash', 'online');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- service_categories
-- ----------------------------------------------------------------------------
create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  name        jsonb not null,            -- { it, en, ar }
  icon        text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- services
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) on delete cascade,
  name        jsonb not null,            -- { it, en, ar }
  description jsonb not null default '{}'::jsonb,
  base_price  numeric(10, 2) not null default 0,
  price_unit  text not null default 'fixed',
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists services_category_id_idx on public.services (category_id);

-- ----------------------------------------------------------------------------
-- zones
-- ----------------------------------------------------------------------------
create table if not exists public.zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- orders
-- Guest checkout: customer snapshot is stored inline (no mandatory sign-up).
-- phone_token is a derived, non-reversible key used for public order tracking.
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique
                     default ('MHS-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  service_id       uuid not null references public.services (id) on delete restrict,
  zone_id          uuid not null references public.zones (id) on delete restrict,

  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text not null,
  customer_address text not null,

  details          text,
  notes            text,

  status           public.order_status not null default 'pending',
  payment_method   public.payment_method not null default 'cash',
  payment_status   public.payment_status not null default 'unpaid',
  scheduled_at     timestamptz,

  -- Derived from the digits of the phone number. Used by the public
  -- tracking RPC so customers can find their orders without exposing
  -- the whole table.
  phone_token      text generated always as
                     (md5(regexp_replace(customer_phone, '[^0-9]', '', 'g'))) stored,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_phone_token_idx on public.orders (phone_token);
create index if not exists orders_service_id_idx on public.orders (service_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- order_status_history
-- ----------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  changed_by  uuid,                      -- admin_users.id in later milestones
  at          timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id);

-- ----------------------------------------------------------------------------
-- Trigger: write history row on insert and on every status change.
-- SECURITY DEFINER so it can write history regardless of caller RLS.
-- ----------------------------------------------------------------------------
create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- M1 has no admin context yet, so changed_by stays null.
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, status)
    values (new.id, new.status);
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, status)
    values (new.id, new.status);
    return new;
  end if;

  return new;
end;
$$;

create trigger orders_log_status_insert
  after insert on public.orders
  for each row execute function public.log_order_status();

create trigger orders_log_status_update
  after update on public.orders
  for each row execute function public.log_order_status();

-- ----------------------------------------------------------------------------
-- Public tracking RPC.
-- Customers call this with their phone number; it derives the same token and
-- returns only their orders. SECURITY DEFINER so the orders table itself stays
-- unreadable to the anon role.
-- ----------------------------------------------------------------------------
create or replace function public.get_orders_by_phone(p_phone text)
returns table (
  id             uuid,
  reference      text,
  service_id     uuid,
  zone_id        uuid,
  status         public.order_status,
  payment_method public.payment_method,
  payment_status public.payment_status,
  details        text,
  notes          text,
  scheduled_at   timestamptz,
  created_at     timestamptz,
  updated_at     timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    o.id, o.reference, o.service_id, o.zone_id, o.status,
    o.payment_method, o.payment_status, o.details, o.notes,
    o.scheduled_at, o.created_at, o.updated_at
  from public.orders o
  where o.phone_token = md5(regexp_replace(p_phone, '[^0-9]', '', 'g'))
  order by o.created_at desc;
$$;

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.service_categories   enable row level security;
alter table public.services             enable row level security;
alter table public.zones                enable row level security;
alter table public.orders               enable row level security;
alter table public.order_status_history enable row level security;

-- Catalog: public read of ACTIVE rows only.
create policy "categories_public_read_active"
  on public.service_categories for select
  to anon, authenticated
  using (active = true);

create policy "services_public_read_active"
  on public.services for select
  to anon, authenticated
  using (active = true);

create policy "zones_public_read_active"
  on public.zones for select
  to anon, authenticated
  using (active = true);

-- Orders: public may INSERT a new request, but only as 'pending'.
-- No public SELECT — tracking goes through get_orders_by_phone().
create policy "orders_public_insert_pending"
  on public.orders for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and payment_status = 'unpaid'
  );

-- order_status_history: no public access. Rows are written by the
-- SECURITY DEFINER trigger above and read by admins in later milestones.

-- Allow anon/authenticated to execute the tracking RPC.
grant execute on function public.get_orders_by_phone(text) to anon, authenticated;
