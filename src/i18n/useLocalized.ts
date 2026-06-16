import { useTranslation } from "react-i18next";

import type { I18nText, Locale } from "../types";
import { DEFAULT_LOCALE } from "./index";

/**
 * Resolve an i18n JSONB field ({ it, en, ar }) for the active locale,
 * gracefully falling back to Italian then any available value.
 */
export function pickLocalized(
  field: I18nText | null | undefined,
  locale: Locale,
): string {
  if (!field) return "";
  return (
    field[locale] ||
    field[DEFAULT_LOCALE] ||
    Object.values(field).find(Boolean) ||
    ""
  );
}

/** Hook variant bound to the currently active i18next language. */
export function useLocalized() {
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;
  return (field: I18nText | null | undefined) => pickLocalized(field, locale);
}
