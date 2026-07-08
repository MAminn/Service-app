-- ============================================================================
-- Milano Home Services — Milestone 2, Step 1: admin auth
-- admin_users table, is_admin() helper, and admin read policies on orders
-- and order_status_history. Read-only for admins in this step — no
-- update/insert policies yet.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admin_users
-- Binds a Supabase Auth user to the admin role. Admin mode is unlocked by a
-- row here, never shipped open (see PROJECT_KNOWLEDGE.md, identity model).
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  role        text not null default 'admin',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- An authenticated user may read only their own admin row (used by the app
-- to decide whether to show admin mode).
create policy "admin_users_select_own"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- is_admin()
-- True iff the current auth user has an ACTIVE admin_users row.
-- SECURITY DEFINER so RLS policies on other tables can call it without
-- granting broader access to admin_users itself.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.active = true
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- Admin read access (RLS). Existing anon insert / catalog policies and the
-- customer RPCs are intentionally untouched.
-- ----------------------------------------------------------------------------
create policy "orders_admin_select"
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy "order_status_history_admin_select"
  on public.order_status_history for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Seeding an admin (manual, never committed):
--
-- 1. Create the auth user in the Supabase dashboard
--    (Authentication → Users → Add user, with email + password).
-- 2. Bind it to the admin role by inserting its UUID here, e.g. via SQL editor:
--
--    insert into public.admin_users (user_id)
--    values ('<auth-user-uuid>');
-- ----------------------------------------------------------------------------
