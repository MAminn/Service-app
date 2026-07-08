import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { OrderStatusHistory } from "../types";

export const orderHistoryKey = (orderId: string) =>
  ["orderHistory", orderId] as const;

/**
 * Status timeline for one order, oldest first. Readable only by admins
 * (RLS via is_admin()) — the anon role has no SELECT on this table.
 */
async function fetchOrderHistory(
  orderId: string,
): Promise<OrderStatusHistory[]> {
  const { data, error } = await supabase
    .from("order_status_history")
    .select("id, order_id, status, changed_by, at")
    .eq("order_id", orderId)
    .order("at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrderStatusHistory[];
}

export function useOrderHistory(orderId: string) {
  return useQuery({
    queryKey: orderHistoryKey(orderId),
    queryFn: () => fetchOrderHistory(orderId),
  });
}
