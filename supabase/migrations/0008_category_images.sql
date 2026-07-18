-- ============================================================================
-- Milano Home Services — Category images
-- Adds service_categories.image_path and an admin-only RPC to set/clear it,
-- mirroring 0007_service_images.sql.
--
-- STORAGE: no new bucket. The existing public 'service-images' bucket now
-- holds ALL public catalog images under two prefixes — 'services/...' and
-- 'categories/...'. Its existing policies (public SELECT; admin-only
-- INSERT/UPDATE/DELETE via is_admin(), see 0007) already cover both prefixes
-- because they match on bucket_id only. They are intentionally NOT modified.
--
-- image_path stores a STORAGE OBJECT PATH (e.g. 'categories/<id>-<ts>.jpg'),
-- never a full URL. Paths are versioned per upload for cache busting; the
-- client deletes the previous object after a successful swap.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Column: service_categories.image_path (nullable; null = no image)
-- ----------------------------------------------------------------------------
alter table public.service_categories
  add column if not exists image_path text;

-- ----------------------------------------------------------------------------
-- admin_set_category_image
-- Sets (or clears) the image path for one category. An empty/blank/null path
-- clears the column. Returns the updated row.
-- ----------------------------------------------------------------------------
create or replace function public.admin_set_category_image(
  p_category_id uuid,
  p_image_path text
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

  update public.service_categories c
  set image_path = nullif(btrim(coalesce(p_image_path, '')), '')
  where c.id = p_category_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Category % not found', p_category_id
      using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_set_category_image(uuid, text) from public;
revoke execute on function public.admin_set_category_image(uuid, text) from anon;
grant execute on function public.admin_set_category_image(uuid, text) to authenticated;
