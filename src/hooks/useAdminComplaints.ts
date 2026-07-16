import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import { complaintsBaseKey } from "./useComplaints";
import type { Complaint, ComplaintStatus } from "../types";

/**
 * Admin-side complaint queries. Access is enforced by RLS (is_admin()):
 * a non-admin session simply receives an empty set / no row.
 * Writes go through the admin_update_complaint RPC — there is no UPDATE
 * policy on complaints, and no delete path anywhere.
 */

/** Complaint row joined with its order's reference and customer name. */
export interface AdminComplaint extends Complaint {
  orders: { reference: string; customer_name: string } | null;
}

export const adminComplaintsKey = ["admin", "complaints"] as const;
export const adminComplaintKey = (complaintId: string) =>
  ["admin", "complaints", complaintId] as const;

const COLUMNS =
  "id, order_id, message, status, admin_note, created_at, updated_at, orders(reference, customer_name)";

async function fetchAdminComplaints(): Promise<AdminComplaint[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminComplaint[];
}

export function useAdminComplaints() {
  return useQuery({
    queryKey: adminComplaintsKey,
    queryFn: fetchAdminComplaints,
  });
}

async function fetchAdminComplaint(
  complaintId: string,
): Promise<AdminComplaint> {
  const { data, error } = await supabase
    .from("complaints")
    .select(COLUMNS)
    .eq("id", complaintId)
    .single();
  if (error) throw error;
  return data as unknown as AdminComplaint;
}

export function useAdminComplaint(complaintId: string) {
  return useQuery({
    queryKey: adminComplaintKey(complaintId),
    queryFn: () => fetchAdminComplaint(complaintId),
  });
}

interface UpdateComplaintInput {
  complaintId: string;
  newStatus: ComplaintStatus;
  adminNote?: string;
}

async function updateComplaint({
  complaintId,
  newStatus,
  adminNote,
}: UpdateComplaintInput): Promise<Complaint> {
  // SECURITY DEFINER RPC — the only write path after creation.
  // Transitions are validated server-side; a disallowed one throws here.
  const { data, error } = await supabase.rpc("admin_update_complaint", {
    p_complaint_id: complaintId,
    p_status: newStatus,
    p_admin_note: adminNote?.trim() || null,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    throw new Error("admin_update_complaint returned no row");
  }
  return row as Complaint;
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComplaint,
    onSuccess: () => {
      // Refresh both the admin lists/detail and the customer by-phone view.
      queryClient.invalidateQueries({ queryKey: adminComplaintsKey });
      queryClient.invalidateQueries({ queryKey: complaintsBaseKey });
    },
  });
}
