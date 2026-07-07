import { useQuery } from "@tanstack/react-query";

import { logCatalogError } from "../lib/logCatalogError";
import { supabase } from "../lib/supabase";
import type { Zone } from "../types";

export const zonesKey = ["zones"] as const;

async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from("zones")
    .select("id, name, city, active, created_at")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    logCatalogError("useZones", error);
    throw error;
  }
  return (data ?? []) as Zone[];
}

export function useZones() {
  return useQuery({
    queryKey: zonesKey,
    queryFn: fetchZones,
  });
}
