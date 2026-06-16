/**
 * Lightweight validation + formatting helpers used by the request form.
 * Pure functions, no business data hardcoded.
 */

// E.164-ish: optional leading +, 7–15 digits. Spaces/dashes stripped first.
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

export function isValidPhone(raw: string): boolean {
  const phone = normalizePhone(raw);
  return /^\+?\d{7,15}$/.test(phone);
}

export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isNonEmpty(raw: string): boolean {
  return raw.trim().length > 0;
}
