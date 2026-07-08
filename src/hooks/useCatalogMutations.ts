import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import {
  adminCategoriesKey,
  adminServicesBaseKey,
  adminZonesKey,
} from "./useAdminCatalog";
import { categoriesKey } from "./useCategories";
import { zonesKey } from "./useZones";
import type { I18nText, Service, ServiceCategory, Zone } from "../types";

/**
 * Catalog write mutations. All writes go through the admin_upsert_* RPCs
 * (SECURITY DEFINER, admin-only) — there are no INSERT/UPDATE RLS policies
 * on catalog tables, and no delete path anywhere: deactivation is the only
 * removal mechanism.
 *
 * On success each mutation invalidates BOTH the admin catalog keys and the
 * corresponding customer-facing keys, so customer screens pick up price,
 * name, and availability changes on their next fetch.
 */

// Customer-facing service query key prefixes (see useServices.ts:
// servicesKey(categoryId) = ["services", id], serviceKey(id) = ["service", id]).
const customerServicesPrefix = ["services"] as const;
const customerServicePrefix = ["service"] as const;

export interface UpsertServiceInput {
  id?: string;
  category_id: string;
  name: I18nText;
  description?: I18nText;
  base_price: number;
  price_unit?: string;
  sort_order?: number;
  active?: boolean;
}

export interface UpsertCategoryInput {
  id?: string;
  name: I18nText;
  icon?: string | null;
  sort_order?: number;
  active?: boolean;
}

export interface UpsertZoneInput {
  id?: string;
  name: string;
  city: string;
  active?: boolean;
}

async function upsertService(input: UpsertServiceInput): Promise<Service> {
  const { data, error } = await supabase.rpc("admin_upsert_service", {
    p_id: input.id ?? null,
    p_category_id: input.category_id,
    p_name: input.name,
    p_description: input.description ?? {},
    p_base_price: input.base_price,
    p_price_unit: input.price_unit ?? "fixed",
    p_sort_order: input.sort_order ?? 0,
    p_active: input.active ?? true,
  });
  if (error) throw error;
  return data as Service;
}

async function upsertCategory(
  input: UpsertCategoryInput,
): Promise<ServiceCategory> {
  const { data, error } = await supabase.rpc("admin_upsert_category", {
    p_id: input.id ?? null,
    p_name: input.name,
    p_icon: input.icon ?? null,
    p_sort_order: input.sort_order ?? 0,
    p_active: input.active ?? true,
  });
  if (error) throw error;
  return data as ServiceCategory;
}

async function upsertZone(input: UpsertZoneInput): Promise<Zone> {
  const { data, error } = await supabase.rpc("admin_upsert_zone", {
    p_id: input.id ?? null,
    p_name: input.name,
    p_city: input.city,
    p_active: input.active ?? true,
  });
  if (error) throw error;
  return data as Zone;
}

function invalidateServices(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: adminServicesBaseKey });
  queryClient.invalidateQueries({ queryKey: customerServicesPrefix });
  queryClient.invalidateQueries({ queryKey: customerServicePrefix });
}

export function useUpsertService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertService,
    onSuccess: () => invalidateServices(queryClient),
  });
}

export function useUpsertCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKey });
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      // Deactivating a category affects what services are browsable too.
      invalidateServices(queryClient);
    },
  });
}

export function useUpsertZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminZonesKey });
      queryClient.invalidateQueries({ queryKey: zonesKey });
    },
  });
}
