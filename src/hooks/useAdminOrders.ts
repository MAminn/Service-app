import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type {
  I18nText,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../types";

/** Compact row for the admin order queue list. */
export interface AdminOrderListItem {
  id: string;
  reference: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  services: { name: I18nText } | null;
  zones: { name: string } | null;
}

/** Full order row for the admin detail screen. */
export interface AdminOrderDetail extends AdminOrderListItem {
  customer_email: string;
  customer_address: string;
  details: string | null;
  notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  scheduled_at: string | null;
  updated_at: string;
}

export const adminOrdersKey = ["adminOrders"] as const;
export const adminOrderKey = (orderId: string) =>
  ["adminOrders", orderId] as const;

const LIST_COLUMNS =
  "id, reference, status, created_at, customer_name, customer_phone, services(name), zones(name)";

const DETAIL_COLUMNS =
  LIST_COLUMNS +
  ", customer_email, customer_address, details, notes, payment_method, payment_status, scheduled_at, updated_at";

/**
 * All orders, newest first. Access is enforced by RLS: only an active admin
 * gets rows back — a non-admin session simply receives an empty set.
 */
async function fetchAdminOrders(): Promise<AdminOrderListItem[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminOrderListItem[];
}

export function useAdminOrders() {
  return useQuery({
    queryKey: adminOrdersKey,
    queryFn: fetchAdminOrders,
  });
}

async function fetchAdminOrder(orderId: string): Promise<AdminOrderDetail> {
  const { data, error } = await supabase
    .from("orders")
    .select(DETAIL_COLUMNS)
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data as unknown as AdminOrderDetail;
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: adminOrderKey(orderId),
    queryFn: () => fetchAdminOrder(orderId),
  });
}
