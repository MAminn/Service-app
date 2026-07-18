import { useQuery } from "@tanstack/react-query";

import { logCatalogError } from "../lib/logCatalogError";
import { supabase } from "../lib/supabase";
import type { I18nText, Service, ServiceCategory, Zone } from "../types";

/**
 * Admin-side catalog queries: fetch ALL rows (active AND inactive).
 * Server-side, the admin SELECT policies (is_admin()) expose inactive rows;
 * a non-admin session simply gets the public active-only subset back.
 *
 * Query keys are deliberately distinct from the customer-facing hooks
 * (useCategories/useServices/useZones) so the two caches never collide.
 */

export const adminCategoriesKey = ["admin", "categories"] as const;
export const adminServicesBaseKey = ["admin", "services"] as const;
export const adminServicesKey = (categoryId?: string) =>
  categoryId
    ? ([...adminServicesBaseKey, categoryId] as const)
    : adminServicesBaseKey;
export const adminZonesKey = ["admin", "zones"] as const;

/** Service row joined with its parent category name for the admin list. */
export interface AdminServiceRow extends Service {
  service_categories: { name: I18nText } | null;
}

async function fetchAdminCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from("service_categories")
    .select("id, name, icon, sort_order, active, image_path, created_at")
    .order("sort_order", { ascending: true });

  if (error) {
    logCatalogError("useAdminCategories", error);
    throw error;
  }
  return (data ?? []) as ServiceCategory[];
}

async function fetchAdminServices(
  categoryId?: string,
): Promise<AdminServiceRow[]> {
  let query = supabase
    .from("services")
    .select(
      "id, category_id, name, description, base_price, price_unit, active, sort_order, image_path, created_at, service_categories(name)",
    )
    .order("sort_order", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) {
    logCatalogError("useAdminServices", error);
    throw error;
  }
  return (data ?? []) as unknown as AdminServiceRow[];
}

async function fetchAdminZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from("zones")
    .select("id, name, city, active, created_at")
    .order("name", { ascending: true });

  if (error) {
    logCatalogError("useAdminZones", error);
    throw error;
  }
  return (data ?? []) as Zone[];
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminCategoriesKey,
    queryFn: fetchAdminCategories,
  });
}

export function useAdminServices(categoryId?: string) {
  return useQuery({
    queryKey: adminServicesKey(categoryId),
    queryFn: () => fetchAdminServices(categoryId),
  });
}

export function useAdminZones() {
  return useQuery({
    queryKey: adminZonesKey,
    queryFn: fetchAdminZones,
  });
}
