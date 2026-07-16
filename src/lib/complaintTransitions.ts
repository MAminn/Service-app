import type { ComplaintStatus } from "../types";

/**
 * Allowed complaint status transitions — mirrors the server-side map in
 * supabase/migrations/0006_complaints.sql (admin_update_complaint).
 * The server is the enforcer; this only drives which buttons the UI shows.
 */
export const COMPLAINT_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> =
  {
    open: ["in_review", "resolved", "dismissed"],
    in_review: ["resolved", "dismissed"],
    resolved: [],
    dismissed: [],
  };

/** Transitions that need a confirmation dialog before firing (terminal ones). */
export const CONFIRMED_COMPLAINT_TRANSITIONS: ReadonlySet<ComplaintStatus> =
  new Set(["resolved", "dismissed"]);

export function allowedComplaintTransitions(
  status: ComplaintStatus,
): ComplaintStatus[] {
  return COMPLAINT_TRANSITIONS[status] ?? [];
}
