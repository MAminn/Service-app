import * as Updates from "expo-updates";
import { I18nManager } from "react-native";

import i18n, { isRTL } from "./index";

/**
 * Keeps native layout direction in sync with the active locale.
 *
 * I18nManager.forceRTL only takes full effect after a full app reload, so this
 * sets the flag and reports whether a reload is required to apply it.
 * Returns true if the direction changed (caller should reload to apply).
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

/**
 * Attempt to reload the app so a pending RTL/LTR flip takes effect.
 * Returns true if a reload was triggered, false if it isn't available
 * (e.g. Expo Go / dev where embedded updates are disabled). Never throws.
 */
export async function reloadForDirectionChange(): Promise<boolean> {
  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    // Updates aren't available in this environment (dev client, Expo Go).
    // Caller should surface a "restart to apply" notice instead.
    return false;
  }
}
