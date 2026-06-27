import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import type { Locale } from "../types";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import it from "./locales/it.json";

export const SUPPORTED_LOCALES: Locale[] = ["it", "en", "ar"];
export const RTL_LOCALES: Locale[] = ["ar"];
export const DEFAULT_LOCALE: Locale = "it";

export const resources = {
  it: { translation: it },
  en: { translation: en },
  ar: { translation: ar },
} as const;

/** Pick the best supported locale from the device, falling back to Italian. */
export function detectDeviceLocale(): Locale {
  const locales = Localization.getLocales();
  for (const l of locales) {
    const code = l.languageCode?.toLowerCase() as Locale | undefined;
    if (code && SUPPORTED_LOCALES.includes(code)) {
      return code;
    }
  }
  return DEFAULT_LOCALE;
}

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  compatibilityJSON: "v3",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
