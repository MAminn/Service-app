import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import { adminOrderKey, adminOrdersKey } from "./useAdminOrders";
import { orderHistoryKey } from "./useOrderHistory";
import type { OrderStatus } from "../types";

/** Row returned by the admin_update_order_status RPC. */
export interface UpdatedOrder {
  id: string;
  reference: string;
  status: OrderStatus;
}

interface UpdateOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
}

async function updateOrderStatus({
  orderId,
  newStatus,
}: UpdateOrderStatusInput): Promise<UpdatedOrder> {
  // SECURITY DEFINER RPC — the only write path to orders.status.
  // Transitions are validated server-side; a disallowed one throws here.
  const { data, error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    throw new Error("admin_update_order_status returned no row");
  }
  return row as UpdatedOrder;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: adminOrdersKey });
      queryClient.invalidateQueries({ queryKey: adminOrderKey(orderId) });
      queryClient.invalidateQueries({ queryKey: orderHistoryKey(orderId) });
    },
  });
}
