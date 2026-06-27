import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import theme from "../theme/theme";
import Button from "./Button";

/** Dev-only: best-effort human-readable detail from an unknown error value. */
function formatErrorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <ActivityIndicator size='large' color={theme.palette.primary} />
      <Text style={styles.muted}>{t("common.loading")}</Text>
    </View>
  );
}

export function ErrorView({
  onRetry,
  error,
}: {
  onRetry?: () => void;
  error?: unknown;
}) {
  const { t } = useTranslation();
  const devDetail = __DEV__ && error != null ? formatErrorDetail(error) : null;
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t("common.errorTitle")}</Text>
      <Text style={styles.muted}>{t("common.errorGeneric")}</Text>
      {devDetail && <Text style={styles.devDetail}>{devDetail}</Text>}
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
  devDetail: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  action: { marginTop: theme.spacing.lg },
});
