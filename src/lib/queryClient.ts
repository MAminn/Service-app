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
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,
    },
  },
});
