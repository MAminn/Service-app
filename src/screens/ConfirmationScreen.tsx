import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

export default function ConfirmationScreen({
  route,
  navigation,
}: ScreenProps<"Confirmation">) {
  const { reference } = route.params;
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("confirmation.title"),
      headerBackVisible: false,
      gestureEnabled: false,
    });
  }, [navigation, t]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.heading}>{t("confirmation.heading")}</Text>
        <Text style={styles.message}>{t("confirmation.message")}</Text>

        <View style={styles.refBox}>
          <Text style={styles.refLabel}>
            {t("confirmation.referenceLabel")}
          </Text>
          <Text style={styles.refValue}>{reference}</Text>
        </View>

        <Text style={styles.hint}>{t("confirmation.trackHint")}</Text>
      </View>

      <View style={styles.footer}>
        <Button
          label={t("confirmation.trackCta")}
          onPress={() => navigation.replace("TrackOrder")}
        />
        <View style={styles.spacer} />
        <Button
          label={t("confirmation.done")}
          variant='secondary'
          onPress={() => navigation.popToTop()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.palette.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },
  check: { fontSize: 38, color: theme.palette.textInverse, fontWeight: "700" },
  heading: {
    ...theme.typography.h1,
    color: theme.palette.text,
    textAlign: "center",
  },
  message: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  refBox: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    backgroundColor: theme.palette.surface,
    alignItems: "center",
  },
  refLabel: { ...theme.typography.caption, color: theme.palette.textMuted },
  refValue: {
    ...theme.typography.h2,
    color: theme.palette.primary,
    marginTop: theme.spacing.xs,
    letterSpacing: 1,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.xl,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.palette.border,
    backgroundColor: theme.palette.surface,
  },
  spacer: { height: theme.spacing.md },
});
