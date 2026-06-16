import { I18nManager } from "react-native";

import i18n, { isRTL } from "./index";

/**
 * Keeps native layout direction in sync with the active locale.
 *
 * I18nManager.forceRTL only takes full effect after an app reload, so we set
 * it as early as possible (before first render). Returns true if a direction
 * change was applied that requires a reload.
 */
export function applyLayoutDirection(locale: string = i18n.language): boolean {
  const shouldBeRTL = isRTL(locale);
  I18nManager.allowRTL(shouldBeRTL);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    return true;
  }
  return false;
}
