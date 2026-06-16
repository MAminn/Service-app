import { useMutation } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { NewOrderInput, OrderStatus } from "../types";

/** Minimal order info returned by the create_order RPC. */
export interface CreatedOrder {
  id: string;
  reference: string;
  status: OrderStatus;
}

async function createOrder(input: NewOrderInput): Promise<CreatedOrder> {
  // Use the SECURITY DEFINER RPC: the anon role has no SELECT policy on
  // `orders`, so insert().select() would fail. status/payment_status are
  // forced server-side inside the function.
  const { data, error } = await supabase.rpc("create_order", {
    p_service_id: input.service_id,
    p_zone_id: input.zone_id,
    p_customer_name: input.customer_name,
    p_customer_phone: input.customer_phone,
    p_customer_email: input.customer_email,
    p_customer_address: input.customer_address,
    p_details: input.details ?? null,
    p_notes: input.notes ?? null,
    p_payment_method: input.payment_method ?? "cash",
  });

  if (error) throw error;

  // RPCs returning TABLE(...) come back as an array of rows.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.reference) {
    throw new Error("create_order returned no reference");
  }
  return row as CreatedOrder;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
  });
}
