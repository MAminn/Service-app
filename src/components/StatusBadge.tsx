import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import theme from "../theme/theme";
import type { ComplaintStatus, OrderStatus } from "../types";

type BadgeStatus = OrderStatus | ComplaintStatus;

const COLOR: Record<BadgeStatus, string> = {
  pending: theme.palette.statusPending,
  reviewing: theme.palette.statusReviewing,
  accepted: theme.palette.statusAccepted,
  rejected: theme.palette.statusRejected,
  in_progress: theme.palette.statusInProgress,
  completed: theme.palette.statusCompleted,
  cancelled: theme.palette.statusCancelled,
  // Complaint statuses — distinct colors, reusing existing theme tokens.
  open: theme.palette.warning,
  in_review: theme.palette.primary,
  resolved: theme.palette.success,
  dismissed: theme.palette.textMuted,
};

/** Complaint status values (no overlap with order status values). */
const COMPLAINT_STATUSES: ReadonlySet<string> = new Set([
  "open",
  "in_review",
  "resolved",
  "dismissed",
]);

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  const { t } = useTranslation();
  const color = COLOR[status];
  const labelKey = COMPLAINT_STATUSES.has(status)
    ? `complaints.status.${status}`
    : `status.${status}`;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}1A`, borderColor: color },
      ]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{t(labelKey)}</Text>
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
