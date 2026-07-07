/**
 * Log a catalog read error, degrading the Supabase "waking up" case gracefully.
 *
 * When a paused/cold Supabase project is coming back online, Cloudflare returns
 * an HTML error page (522 / "Connection timed out") instead of JSON. Dumping
 * that raw HTML into Metro is noise: it's transient and React Query will retry.
 * For that case we emit a single clean warning. All other errors keep full
 * structured detail so genuine failures (bad key, RLS denial) stay debuggable.
 */
export function logCatalogError(hook: string, error: unknown): void {
  const text = extractText(error);
  const isWakingUp =
    text.includes("<!DOCTYPE html>") ||
    text.includes("522") ||
    text.includes("Connection timed out");

  if (isWakingUp) {
    console.warn(
      `[${hook}] Supabase origin not ready (likely waking up), will retry`,
    );
  } else {
    console.error(`[${hook}] supabase error:`, JSON.stringify(error));
  }
}

function extractText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return `${error.message} ${error.stack ?? ""}`;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
