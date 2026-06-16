-- ============================================================================
-- Milano Home Services — create_order RPC (Milestone 1 fix)
-- The anon role has no SELECT policy on orders (by design), so an
-- insert().select() round-trip fails. This SECURITY DEFINER function performs
-- the insert and returns just the fields the client needs to show a
-- confirmation. status/payment_status are forced server-side — never trusted
-- from the client.
-- ============================================================================

create or replace function public.create_order(
  p_service_id       uuid,
  p_zone_id          uuid,
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_email   text,
  p_customer_address text,
  p_details          text default null,
  p_notes            text default null,
  p_payment_method   public.payment_method default 'cash'
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
begin
  return query
  insert into public.orders (
    service_id,
    zone_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    details,
    notes,
    payment_method,
    -- Forced server-side regardless of client input.
    status,
    payment_status
  )
  values (
    p_service_id,
    p_zone_id,
    btrim(p_customer_name),
    btrim(p_customer_phone),
    btrim(p_customer_email),
    btrim(p_customer_address),
    nullif(btrim(coalesce(p_details, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    coalesce(p_payment_method, 'cash'),
    'pending',
    'unpaid'
  )
  returning
    public.orders.id,
    public.orders.reference,
    public.orders.status;
end;
$$;

grant execute on function public.create_order(
  uuid, uuid, text, text, text, text, text, text, public.payment_method
) to anon, authenticated;
