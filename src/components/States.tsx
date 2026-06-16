import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import theme from "../theme/theme";
import Button from "./Button";

export function Loading() {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <ActivityIndicator size='large' color={theme.palette.primary} />
      <Text style={styles.muted}>{t("common.loading")}</Text>
    </View>
  );
}

export function ErrorView({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t("common.errorTitle")}</Text>
      <Text style={styles.muted}>{t("common.errorGeneric")}</Text>
      {onRetry && (
        <View style={styles.action}>
          <Button
            label={t("common.retry")}
            onPress={onRetry}
            variant='secondary'
          />
        </View>
      )}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h3,
    color: theme.palette.text,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  muted: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  action: { marginTop: theme.spacing.lg },
});
