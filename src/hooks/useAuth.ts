import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

/**
 * Auth session state + actions for the admin area.
 * Customers never authenticate (guest flow); this is admin-only.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setIsSessionLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(
    (email: string, password: string) =>
      supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
    [],
  );

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { session, isSessionLoading, signInWithPassword, signOut };
}

export const isAdminKey = (userId: string | null | undefined) =>
  ["isAdmin", userId ?? null] as const;

/**
 * True iff the given auth user has an active admin_users row.
 * RLS only lets a user read their own row, so this can never leak other
 * admins — and server-side access is enforced by is_admin() regardless.
 */
export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.active === true;
}

/** TanStack Query wrapper: is the current session's user an active admin? */
export function useIsAdmin(userId: string | null | undefined) {
  return useQuery({
    queryKey: isAdminKey(userId),
    queryFn: () => fetchIsAdmin(userId as string),
    enabled: !!userId,
  });
}
