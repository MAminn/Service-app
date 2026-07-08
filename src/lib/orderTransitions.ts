import type { OrderStatus } from "../types";

/**
 * Allowed order status transitions — mirrors the server-side map in
 * supabase/migrations/0004_order_actions.sql (admin_update_order_status).
 * The server is the enforcer; this only drives which buttons the UI shows.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["reviewing", "accepted", "rejected", "cancelled"],
  reviewing: ["accepted", "rejected", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  rejected: [],
  completed: [],
  cancelled: [],
};

/** Transitions that need a confirmation dialog before firing. */
export const DESTRUCTIVE_TRANSITIONS: ReadonlySet<OrderStatus> = new Set([
  "rejected",
  "cancelled",
]);

export function allowedTransitions(status: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[status] ?? [];
}
