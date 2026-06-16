import { useMutation } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { NewOrderInput, Order } from "../types";

async function createOrder(input: NewOrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      service_id: input.service_id,
      zone_id: input.zone_id,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      customer_email: input.customer_email.trim(),
      customer_address: input.customer_address.trim(),
      details: input.details?.trim() || null,
      notes: input.notes?.trim() || null,
      payment_method: input.payment_method ?? "cash",
      // status / payment_status fall back to DB defaults (pending / unpaid).
    })
    .select(
      "id, reference, service_id, zone_id, customer_name, customer_phone, customer_email, customer_address, details, notes, status, payment_method, payment_status, scheduled_at, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as Order;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
  });
}
