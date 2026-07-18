import { useQuery } from "@tanstack/react-query";

import { logCatalogError } from "../lib/logCatalogError";
import { supabase } from "../lib/supabase";
import type { ServiceCategory } from "../types";

export const categoriesKey = ["categories"] as const;

async function fetchCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from("service_categories")
    .select("id, name, icon, sort_order, active, image_path, created_at")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    logCatalogError("useCategories", error);
    throw error;
  }
  return (data ?? []) as ServiceCategory[];
}

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: fetchCategories,
  });
}
