import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import theme from "../theme/theme";
import type { OrderStatus } from "../types";

const COLOR: Record<OrderStatus, string> = {
  pending: theme.palette.statusPending,
  reviewing: theme.palette.statusReviewing,
  accepted: theme.palette.statusAccepted,
  rejected: theme.palette.statusRejected,
  in_progress: theme.palette.statusInProgress,
  completed: theme.palette.statusCompleted,
  cancelled: theme.palette.statusCancelled,
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const color = COLOR[status];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}1A`, borderColor: color },
      ]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{t(`status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginEnd: theme.spacing.sm,
  },
  label: { ...theme.typography.caption, fontWeight: "600" },
});
