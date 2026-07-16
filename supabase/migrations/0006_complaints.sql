-- ============================================================================
-- Milano Home Services — Milestone 3: complaints
-- complaint_status enum, complaints table, customer RPCs (create + read by
-- phone token) and admin_update_complaint with server-enforced transitions.
--
-- NO DELETE PATH — by design. Complaints are permanent records tied to
-- orders (order_id ON DELETE RESTRICT). Status changes are the only
-- lifecycle: open -> in_review -> resolved/dismissed. Do not add delete
-- RPCs or DELETE policies.
--
-- Access model:
--   * The table has NO anon/public policies at all. Customers go through
--     the SECURITY DEFINER RPCs below, keyed by the same phone_token
--     derivation as get_orders_by_phone.
--   * Admins read via a single SELECT policy (is_admin()).
--   * All writes go through RPCs — no INSERT/UPDATE policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enum: complaint status lifecycle
-- open -> in_review -> resolved | dismissed  (open may also close directly)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'complaint_status') then
    create type public.complaint_status as enum (
      'open',
      'in_review',
      'resolved',
      'dismissed'
    );
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- complaints
-- ----------------------------------------------------------------------------
create table if not exists public.complaints (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete restrict,
  message     text not null,
  status      public.complaint_status not null default 'open',
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists complaints_order_id_idx
  on public.complaints (order_id);

-- Reuse the generic updated_at trigger from 0001.
create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row-Level Security: admins read everything; nobody else reads the table
-- directly. No anon/public policies — customer access is RPC-only.
-- ----------------------------------------------------------------------------
alter table public.complaints enable row level security;

create policy "complaints_admin_select"
  on public.complaints for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- create_complaint
-- Customer files a complaint against their own order. Ownership is proven by
-- reference + phone: the phone is reduced to the same derived token used by
-- get_orders_by_phone. A miss raises ONE generic error — we deliberately do
-- not distinguish wrong-reference from wrong-phone, so order references
-- cannot be probed.
-- ----------------------------------------------------------------------------
create or replace function public.create_complaint(
  p_reference text,
  p_phone     text,
  p_message   text
)
returns table (
  id         uuid,
  status     public.complaint_status,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message  text := btrim(coalesce(p_message, ''));
  v_order_id uuid;
begin
  if v_message = '' then
    raise exception 'Complaint message is required'
      using errcode = '23514';
  end if;

  if length(v_message) > 2000 then
    raise exception 'Complaint message must be at most 2000 characters'
      using errcode = '23514';
  end if;

  select o.id into v_order_id
  from public.orders o
  where o.reference = btrim(p_reference)
    and o.phone_token = md5(regexp_replace(p_phone, '[^0-9]', '', 'g'));

  if v_order_id is null then
    -- Generic on purpose (see header): no reference-probing signal.
    raise exception 'Order not found for this phone number'
      using errcode = 'P0002';
  end if;

  -- Abuse guard: at most 3 complaints per order.
  if (select count(*) from public.complaints c where c.order_id = v_order_id) >= 3 then
    raise exception 'Complaint limit reached for this order'
      using errcode = 'P0001';
  end if;

  return query
  insert into public.complaints (order_id, message)
  values (v_order_id, v_message)
  returning
    public.complaints.id,
    public.complaints.status,
    public.complaints.created_at;
end;
$$;

grant execute on function public.create_complaint(text, text, text)
  to anon, authenticated;

-- ----------------------------------------------------------------------------
-- get_complaints_by_phone
-- All complaints belonging to this phone's orders, newest first. Same token
-- derivation as get_orders_by_phone; SECURITY DEFINER so the complaints
-- table itself stays unreadable to the anon role.
-- ----------------------------------------------------------------------------
create or replace function public.get_complaints_by_phone(p_phone text)
returns table (
  id              uuid,
  order_id        uuid,
  order_reference text,
  message         text,
  status          public.complaint_status,
  admin_note      text,
  created_at      timestamptz,
  updated_at      timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.id, c.order_id, o.reference, c.message, c.status,
    c.admin_note, c.created_at, c.updated_at
  from public.complaints c
  join public.orders o on o.id = c.order_id
  where o.phone_token = md5(regexp_replace(p_phone, '[^0-9]', '', 'g'))
  order by c.created_at desc;
$$;

grant execute on function public.get_complaints_by_phone(text)
  to anon, authenticated;

-- ----------------------------------------------------------------------------
-- admin_update_complaint
-- Admin-only status transition RPC. Allowed transitions (server-enforced):
--   open      -> in_review | resolved | dismissed
--   in_review -> resolved | dismissed
--   resolved / dismissed are terminal.
-- admin_note is set only when provided non-empty (at transition time);
-- an existing note is preserved otherwise.
-- SECURITY DEFINER: complaints has no UPDATE policy — this is the only
-- write path after creation.
-- ----------------------------------------------------------------------------
create or replace function public.admin_update_complaint(
  p_complaint_id uuid,
  p_status       public.complaint_status,
  p_admin_note   text default null
)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.complaint_status;
  v_allowed boolean;
  v_note    text := nullif(btrim(coalesce(p_admin_note, '')), '');
  v_row     public.complaints;
begin
  if not public.is_admin() then
    raise exception 'Only admins may update complaints'
      using errcode = '42501';
  end if;

  select c.status into v_current
  from public.complaints c
  where c.id = p_complaint_id
  for update;

  if v_current is null then
    raise exception 'Complaint % not found', p_complaint_id
      using errcode = 'P0002';
  end if;

  v_allowed := case v_current
    when 'open'      then p_status in ('in_review', 'resolved', 'dismissed')
    when 'in_review' then p_status in ('resolved', 'dismissed')
    else false -- resolved / dismissed are terminal
  end;

  if not v_allowed then
    raise exception 'Invalid complaint transition: % -> %', v_current, p_status
      using errcode = 'P0001';
  end if;

  update public.complaints c
  set status     = p_status,
      admin_note = coalesce(v_note, c.admin_note)
  where c.id = p_complaint_id
  returning * into v_row;

  return v_row;
end;
$$;

-- Admin-only in practice (is_admin() check); never callable by anon.
revoke execute on function public.admin_update_complaint(uuid, public.complaint_status, text) from public;
revoke execute on function public.admin_update_complaint(uuid, public.complaint_status, text) from anon;
grant execute on function public.admin_update_complaint(uuid, public.complaint_status, text) to authenticated;
