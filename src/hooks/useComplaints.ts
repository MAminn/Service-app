import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Complaint, ComplaintStatus } from "../types";

/** Complaint row returned by get_complaints_by_phone (order reference joined). */
export interface TrackedComplaint extends Complaint {
  order_reference: string;
}

/** Minimal row returned by the create_complaint RPC. */
export interface CreatedComplaint {
  id: string;
  status: ComplaintStatus;
  created_at: string;
}

export interface NewComplaintInput {
  reference: string;
  phone: string;
  message: string;
}

export const complaintsBaseKey = ["complaints"] as const;
export const complaintsByPhoneKey = (phone: string) =>
  ["complaints", "byPhone", phone.trim()] as const;

async function createComplaint(
  input: NewComplaintInput,
): Promise<CreatedComplaint> {
  // SECURITY DEFINER RPC — the complaints table has no anon policies.
  // Ownership (reference + phone token) and the per-order limit are
  // validated server-side; violations throw here.
  const { data, error } = await supabase.rpc("create_complaint", {
    p_reference: input.reference.trim(),
    p_phone: input.phone.trim(),
    p_message: input.message.trim(),
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) {
    throw new Error("create_complaint returned no row");
  }
  return row as CreatedComplaint;
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintsBaseKey });
    },
  });
}

async function fetchComplaintsByPhone(
  phone: string,
): Promise<TrackedComplaint[]> {
  const { data, error } = await supabase.rpc("get_complaints_by_phone", {
    p_phone: phone.trim(),
  });
  if (error) throw error;
  return (data ?? []) as TrackedComplaint[];
}

export function useComplaintsByPhone(phone: string) {
  return useQuery({
    queryKey: complaintsByPhoneKey(phone),
    queryFn: () => fetchComplaintsByPhone(phone),
    enabled: phone.trim().length > 0,
  });
}
