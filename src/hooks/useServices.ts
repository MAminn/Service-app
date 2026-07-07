import { useQuery } from "@tanstack/react-query";

import { logCatalogError } from "../lib/logCatalogError";
import { supabase } from "../lib/supabase";
import type { Service } from "../types";

export const servicesKey = (categoryId: string) =>
  ["services", categoryId] as const;
export const serviceKey = (serviceId: string) =>
  ["service", serviceId] as const;

async function fetchServicesByCategory(categoryId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, category_id, name, description, base_price, price_unit, active, sort_order, created_at",
    )
    .eq("active", true)
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (error) {
    logCatalogError("useServices", error);
    throw error;
  }
  return (data ?? []) as Service[];
}

async function fetchService(serviceId: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, category_id, name, description, base_price, price_unit, active, sort_order, created_at",
    )
    .eq("id", serviceId)
    .maybeSingle();

  if (error) {
    logCatalogError("useServices", error);
    throw error;
  }
  return (data as Service) ?? null;
}

export function useServices(categoryId: string) {
  return useQuery({
    queryKey: servicesKey(categoryId),
    queryFn: () => fetchServicesByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function useService(serviceId: string) {
  return useQuery({
    queryKey: serviceKey(serviceId),
    queryFn: () => fetchService(serviceId),
    enabled: !!serviceId,
  });
}
