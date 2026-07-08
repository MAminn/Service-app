-- ============================================================================
-- Milano Home Services — Milestone 2, Step 2: admin order actions
-- admin_update_order_status RPC with server-enforced status transitions,
-- and changed_by attribution in the history trigger.
-- All order writes go through the RPC — no UPDATE RLS policy on orders.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- log_order_status: attribute the history row to the acting admin.
-- When auth.uid() maps to an ACTIVE admin_users row, changed_by is that
-- admin's id; otherwise it stays null (customer inserts, anon context).
-- Stays SECURITY DEFINER so history writes bypass caller RLS.
-- ----------------------------------------------------------------------------
create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  select au.id into v_admin_id
  from public.admin_users au
  where au.user_id = auth.uid()
    and au.active = true;

  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, v_admin_id);
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, v_admin_id);
    return new;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- admin_update_order_status
-- Admin-only status transition RPC. Allowed transitions (server-enforced):
--   pending     -> reviewing | accepted | rejected | cancelled
--   reviewing   -> accepted | rejected | cancelled
--   accepted    -> in_progress | cancelled
--   in_progress -> completed | cancelled
--   rejected / completed / cancelled are terminal.
-- SECURITY DEFINER: orders has no UPDATE policy — this is the only write path.
-- ----------------------------------------------------------------------------
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_new_status public.order_status
)
returns table (
  id        uuid,
  reference text,
  status    public.order_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.order_status;
  v_allowed boolean;
begin
  if not public.is_admin() then
    raise exception 'Only admins may update order status'
      using errcode = '42501';
  end if;

  select o.status into v_current
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_current is null then
    raise exception 'Order % not found', p_order_id
      using errcode = 'P0002';
  end if;

  v_allowed := case v_current
    when 'pending'     then p_new_status in ('reviewing', 'accepted', 'rejected', 'cancelled')
    when 'reviewing'   then p_new_status in ('accepted', 'rejected', 'cancelled')
    when 'accepted'    then p_new_status in ('in_progress', 'cancelled')
    when 'in_progress' then p_new_status in ('completed', 'cancelled')
    else false -- rejected / completed / cancelled are terminal
  end;

  if not v_allowed then
    raise exception 'Invalid status transition: % -> %', v_current, p_new_status
      using errcode = 'P0001';
  end if;

  update public.orders o
  set status = p_new_status
  where o.id = p_order_id;

  return query
  select o.id, o.reference, o.status
  from public.orders o
  where o.id = p_order_id;
end;
$$;

-- Admin-only in practice (is_admin() check); never callable by anon.
revoke execute on function public.admin_update_order_status(uuid, public.order_status) from public;
revoke execute on function public.admin_update_order_status(uuid, public.order_status) from anon;
grant execute on function public.admin_update_order_status(uuid, public.order_status) to authenticated;
