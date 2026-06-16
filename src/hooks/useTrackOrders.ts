import { useMutation } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { I18nText, Order } from "../types";

/** Order row returned by the tracking RPC (no customer PII). */
type TrackedRow = Omit<
  Order,
  | "customer_name"
  | "customer_phone"
  | "customer_email"
  | "customer_address"
  | "service"
  | "zone"
>;

export interface TrackedOrder extends TrackedRow {
  service_name: I18nText | null;
}

/**
 * Look up orders for a phone number via the SECURITY DEFINER RPC, then enrich
 * each with its (publicly readable) service name for display.
 */
async function trackOrders(phone: string): Promise<TrackedOrder[]> {
  const { data, error } = await supabase.rpc("get_orders_by_phone", {
    p_phone: phone.trim(),
  });
  if (error) throw error;

  const rows = (data ?? []) as TrackedRow[];
  if (rows.length === 0) return [];

  const serviceIds = Array.from(new Set(rows.map((r) => r.service_id)));
  const { data: services, error: svcError } = await supabase
    .from("services")
    .select("id, name")
    .in("id", serviceIds);
  if (svcError) throw svcError;

  const nameById = new Map<string, I18nText>(
    (services ?? []).map((s: { id: string; name: I18nText }) => [s.id, s.name]),
  );

  return rows.map((r) => ({
    ...r,
    service_name: nameById.get(r.service_id) ?? null,
  }));
}

export function useTrackOrders() {
  return useMutation({
    mutationFn: trackOrders,
  });
}
