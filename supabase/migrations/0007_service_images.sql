-- ============================================================================
-- Milano Home Services — Service images
-- Adds services.image_path, an admin-only RPC to set/clear it, and a public
-- 'service-images' storage bucket with admin-only write policies.
--
-- image_path stores a STORAGE OBJECT PATH (e.g. 'services/<id>.jpg'), never a
-- full URL. The client derives the public URL via getPublicUrl(). One object
-- per service — replacing overwrites the same path.
--
-- Scope is service images ONLY. admin_upsert_service and every other RPC /
-- policy from earlier migrations are intentionally left untouched.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Column: services.image_path (nullable; null = no image)
-- ----------------------------------------------------------------------------
alter table public.services
  add column if not exists image_path text;

-- ----------------------------------------------------------------------------
-- admin_set_service_image
-- Sets (or clears) the image path for one service. An empty/blank/null path
-- clears the column. Returns the updated row.
-- ----------------------------------------------------------------------------
create or replace function public.admin_set_service_image(
  p_service_id uuid,
  p_image_path text
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

  update public.services s
  set image_path = nullif(btrim(coalesce(p_image_path, '')), '')
  where s.id = p_service_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Service % not found', p_service_id
      using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_set_service_image(uuid, text) from public;
revoke execute on function public.admin_set_service_image(uuid, text) from anon;
grant execute on function public.admin_set_service_image(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Storage bucket: service-images (public read)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Storage policies on storage.objects for the service-images bucket.
-- Public read; admin-only insert/update/delete.
-- ----------------------------------------------------------------------------
drop policy if exists "service_images_select" on storage.objects;
create policy "service_images_select"
  on storage.objects for select
  using (bucket_id = 'service-images');

drop policy if exists "service_images_insert" on storage.objects;
create policy "service_images_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'service-images' and public.is_admin());

drop policy if exists "service_images_update" on storage.objects;
create policy "service_images_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'service-images' and public.is_admin())
  with check (bucket_id = 'service-images' and public.is_admin());

drop policy if exists "service_images_delete" on storage.objects;
create policy "service_images_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'service-images' and public.is_admin());
