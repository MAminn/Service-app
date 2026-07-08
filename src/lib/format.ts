/** Display formatting helpers. Locale-aware, no business data hardcoded. */

/** Format a numeric base price as currency (EUR, Italian-style grouping). */
export function formatPrice(amount: number, locale = "it"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `€${amount}`;
  }
}

/** Format an ISO timestamp as a short localized date + time. */
export function formatDateTime(iso: string, locale = "it"): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format an ISO timestamp as a short localized date. */
export function formatDate(iso: string, locale = "it"): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
