import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import i18n, { SUPPORTED_LOCALES } from "../i18n";
import { applyLayoutDirection, reloadForDirectionChange } from "../i18n/rtl";
import theme from "../theme/theme";
import type { Locale } from "../types";

/**
 * Compact language switcher. Changing language updates i18next and, when the
 * RTL-ness changes, flips native layout direction and reloads the app so the
 * new direction takes effect. If reload isn't available, shows a one-line
 * "restart to apply" notice.
 */
export default function LanguageSwitcher() {
  const { t, i18n: instance } = useTranslation();
  const current = instance.language as Locale;
  const [needsRestart, setNeedsRestart] = useState(false);

  const change = async (locale: Locale) => {
    if (locale === current) return;
    await i18n.changeLanguage(locale);
    // Flip native direction if needed; reload to apply when possible.
    const directionChanged = applyLayoutDirection(locale);
    if (directionChanged) {
      const reloaded = await reloadForDirectionChange();
      if (!reloaded) setNeedsRestart(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {SUPPORTED_LOCALES.map((locale) => {
          const active = locale === current;
          return (
            <Pressable
              key={locale}
              onPress={() => change(locale)}
              accessibilityRole='button'
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t(`language.${locale}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {needsRestart && (
        <Text style={styles.notice}>{t("language.restartNotice")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-end", gap: theme.spacing.xs },
  row: { flexDirection: "row", gap: theme.spacing.sm },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.palette.border,
    backgroundColor: theme.palette.surface,
  },
  chipActive: {
    borderColor: theme.palette.primary,
    backgroundColor: theme.palette.primary,
  },
  chipText: { ...theme.typography.caption, color: theme.palette.textMuted },
  chipTextActive: { color: theme.palette.primaryContrast, fontWeight: "600" },
  notice: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    textAlign: "right",
  },
});
