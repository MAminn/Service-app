import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client.
 * Catalog data (categories/services/zones) is fairly static, so we keep a
 * generous stale time; order tracking refetches on focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
