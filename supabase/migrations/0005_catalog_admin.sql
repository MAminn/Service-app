-- ============================================================================
-- Milano Home Services — Milestone 2, Step 3: admin catalog management
-- admin_upsert_service / admin_upsert_category / admin_upsert_zone RPCs and
-- admin SELECT policies so inactive catalog rows stay visible to admins.
--
-- NO DELETE FUNCTIONS — by design. Deactivation (active = false) is the ONLY
-- removal mechanism: orders reference services and zones with
-- ON DELETE RESTRICT, and order history must stay intact forever. Do not add
-- delete RPCs or DELETE policies for catalog tables.
--
-- All writes go through these RPCs — there are intentionally no INSERT/UPDATE
-- RLS policies on catalog tables.
--
-- Note on parameter order: Postgres requires defaulted parameters to be
-- trailing, so required params come first and p_id (default null) follows.
-- Clients call with named arguments, so the order is irrelevant to them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admin_upsert_service
-- p_id null  -> INSERT a new service
-- p_id given -> UPDATE the existing row
-- Validates: name.it non-empty (Italian is the primary language; en/ar may be
-- empty strings), base_price >= 0, category must exist.
-- ----------------------------------------------------------------------------
create or replace function public.admin_upsert_service(
  p_category_id uuid,
  p_name jsonb,
  p_base_price numeric,
  p_id uuid default null,
  p_description jsonb default '{}'::jsonb,
  p_price_unit text default 'fixed',
  p_sort_order integer default 0,
  p_active boolean default true
)
returns public.services
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.services;
begin
  if not public.is_admin() then
    raise exception 'Only admins may manage the catalog'
      using errcode = '42501';
  end if;

  if coalesce(btrim(p_name->>'it'), '') = '' then
    raise exception 'Italian name (name.it) is required'
      using errcode = '23514';
  end if;

  if p_base_price is null or p_base_price < 0 then
    raise exception 'base_price must be greater than or equal to 0'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.service_categories c where c.id = p_category_id
  ) then
    raise exception 'Category % does not exist', p_category_id
      using errcode = '23503';
  end if;

  if p_id is null then
    insert into public.services
      (category_id, name, description, base_price, price_unit, sort_order, active)
    values (
      p_category_id,
      p_name,
      coalesce(p_description, '{}'::jsonb),
      p_base_price,
      coalesce(nullif(btrim(p_price_unit), ''), 'fixed'),
      coalesce(p_sort_order, 0),
      coalesce(p_active, true)
    )
    returning * into v_row;
  else
    update public.services s
    set category_id = p_category_id,
        name        = p_name,
        description = coalesce(p_description, '{}'::jsonb),
        base_price  = p_base_price,
        price_unit  = coalesce(nullif(btrim(p_price_unit), ''), 'fixed'),
        sort_order  = coalesce(p_sort_order, 0),
        active      = coalesce(p_active, true)
    where s.id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Service % not found', p_id
        using errcode = 'P0002';
    end if;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_upsert_service(uuid, jsonb, numeric, uuid, jsonb, text, integer, boolean) from public;
revoke execute on function public.admin_upsert_service(uuid, jsonb, numeric, uuid, jsonb, text, integer, boolean) from anon;
grant execute on function public.admin_upsert_service(uuid, jsonb, numeric, uuid, jsonb, text, integer, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- admin_upsert_category
-- ----------------------------------------------------------------------------
create or replace function public.admin_upsert_category(
  p_name jsonb,
  p_id uuid default null,
  p_icon text default null,
  p_sort_order integer default 0,
  p_active boolean default true
)
returns public.service_categories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.service_categories;
begin
  if not public.is_admin() then
    raise exception 'Only admins may manage the catalog'
      using errcode = '42501';
  end if;

  if coalesce(btrim(p_name->>'it'), '') = '' then
    raise exception 'Italian name (name.it) is required'
      using errcode = '23514';
  end if;

  if p_id is null then
    insert into public.service_categories (name, icon, sort_order, active)
    values (
      p_name,
      nullif(btrim(coalesce(p_icon, '')), ''),
      coalesce(p_sort_order, 0),
      coalesce(p_active, true)
    )
    returning * into v_row;
  else
    update public.service_categories c
    set name       = p_name,
        icon       = nullif(btrim(coalesce(p_icon, '')), ''),
        sort_order = coalesce(p_sort_order, 0),
        active     = coalesce(p_active, true)
    where c.id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Category % not found', p_id
        using errcode = 'P0002';
    end if;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_upsert_category(jsonb, uuid, text, integer, boolean) from public;
revoke execute on function public.admin_upsert_category(jsonb, uuid, text, integer, boolean) from anon;
grant execute on function public.admin_upsert_category(jsonb, uuid, text, integer, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- admin_upsert_zone
-- ----------------------------------------------------------------------------
create or replace function public.admin_upsert_zone(
  p_name text,
  p_city text,
  p_id uuid default null,
  p_active boolean default true
)
returns public.zones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.zones;
begin
  if not public.is_admin() then
    raise exception 'Only admins may manage the catalog'
      using errcode = '42501';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Zone name is required'
      using errcode = '23514';
  end if;

  if coalesce(btrim(p_city), '') = '' then
    raise exception 'Zone city is required'
      using errcode = '23514';
  end if;

  if p_id is null then
    insert into public.zones (name, city, active)
    values (btrim(p_name), btrim(p_city), coalesce(p_active, true))
    returning * into v_row;
  else
    update public.zones z
    set name   = btrim(p_name),
        city   = btrim(p_city),
        active = coalesce(p_active, true)
    where z.id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Zone % not found', p_id
        using errcode = 'P0002';
    end if;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_upsert_zone(text, text, uuid, boolean) from public;
revoke execute on function public.admin_upsert_zone(text, text, uuid, boolean) from anon;
grant execute on function public.admin_upsert_zone(text, text, uuid, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- Admin read access (RLS).
-- The public catalog policies only expose active = true rows; without these,
-- deactivated items would vanish from the admin management UI too.
-- ----------------------------------------------------------------------------
create policy "categories_admin_select"
  on public.service_categories for select
  to authenticated
  using (public.is_admin());

create policy "services_admin_select"
  on public.services for select
  to authenticated
  using (public.is_admin());

create policy "zones_admin_select"
  on public.zones for select
  to authenticated
  using (public.is_admin());
