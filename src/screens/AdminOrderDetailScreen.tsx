import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import { ErrorView, Loading } from "../components/States";
import { useAdminOrder } from "../hooks/useAdminOrders";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { useOrderHistory } from "../hooks/useOrderHistory";
import { useUpdateOrderStatus } from "../hooks/useUpdateOrderStatus";
import { useLocalized } from "../i18n/useLocalized";
import { formatDateTime } from "../lib/format";
import {
  DESTRUCTIVE_TRANSITIONS,
  allowedTransitions,
} from "../lib/orderTransitions";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { OrderStatus } from "../types";

/** i18n label key under admin.actions.* for each target status. */
const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: "pending",
  reviewing: "review",
  accepted: "accept",
  rejected: "reject",
  in_progress: "startWork",
  completed: "complete",
  cancelled: "cancel",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AdminOrderDetailScreen({
  navigation,
  route,
}: ScreenProps<"AdminOrderDetail">) {
  const { orderId } = route.params;
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const order = useAdminOrder(orderId);
  const history = useOrderHistory(orderId);
  const updateStatus = useUpdateOrderStatus();

  const isAuthorized = !!session && isAdminQuery.data === true;

  // Gate: only an authenticated active admin may stay on this screen.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!session || isAdminQuery.data === false) {
      navigation.replace("AdminLogin");
    }
  }, [isSessionLoading, session, isAdminQuery.data, navigation]);

  if (isSessionLoading || !isAuthorized) return <Loading />;
  if (order.isLoading) return <Loading />;
  if (order.isError || !order.data) {
    return <ErrorView onRetry={order.refetch} error={order.error} />;
  }

  const o = order.data;
  const locale = i18n.language;
  const transitions = allowedTransitions(o.status);

  const fireTransition = (newStatus: OrderStatus) => {
    const mutate = () => updateStatus.mutate({ orderId, newStatus });
    if (DESTRUCTIVE_TRANSITIONS.has(newStatus)) {
      Alert.alert(
        t("admin.actions.confirmTitle"),
        t(`admin.actions.confirm.${newStatus}`),
        [
          { text: t("admin.actions.confirmNo"), style: "cancel" },
          {
            text: t("admin.actions.confirmYes"),
            style: "destructive",
            onPress: mutate,
          },
        ],
      );
    } else {
      mutate();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.reference}>{o.reference}</Text>
            <StatusBadge status={o.status} />
          </View>
          {o.services && (
            <Row
              label={t("admin.orderDetail.service")}
              value={localized(o.services.name)}
            />
          )}
          {o.zones && (
            <Row label={t("admin.orderDetail.zone")} value={o.zones.name} />
          )}
          <Row
            label={t("admin.orderDetail.createdAt")}
            value={formatDateTime(o.created_at, locale)}
          />
          {o.scheduled_at && (
            <Row
              label={t("admin.orderDetail.scheduledAt")}
              value={formatDateTime(o.scheduled_at, locale)}
            />
          )}
          <Row
            label={t("admin.orderDetail.payment")}
            value={`${t(`admin.orderDetail.paymentMethods.${o.payment_method}`)} · ${t(
              `admin.orderDetail.paymentStatuses.${o.payment_status}`,
            )}`}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {t("admin.orderDetail.customer")}
        </Text>
        <View style={styles.card}>
          <Row label={t("admin.orderDetail.name")} value={o.customer_name} />
          <Row label={t("admin.orderDetail.phone")} value={o.customer_phone} />
          <Row label={t("admin.orderDetail.email")} value={o.customer_email} />
          <Row
            label={t("admin.orderDetail.address")}
            value={o.customer_address}
          />
        </View>

        {(o.details || o.notes) && (
          <>
            <Text style={styles.sectionTitle}>
              {t("admin.orderDetail.request")}
            </Text>
            <View style={styles.card}>
              {o.details && (
                <Row label={t("admin.orderDetail.details")} value={o.details} />
              )}
              {o.notes && (
                <Row label={t("admin.orderDetail.notes")} value={o.notes} />
              )}
            </View>
          </>
        )}

        {transitions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t("admin.actions.title")}
            </Text>
            <View style={styles.card}>
              {transitions.map((target) => (
                <View key={target} style={styles.actionButton}>
                  <Button
                    label={t(`admin.actions.${ACTION_LABEL[target]}`)}
                    variant={
                      DESTRUCTIVE_TRANSITIONS.has(target)
                        ? "secondary"
                        : "primary"
                    }
                    loading={
                      updateStatus.isPending &&
                      updateStatus.variables?.newStatus === target
                    }
                    disabled={updateStatus.isPending}
                    onPress={() => fireTransition(target)}
                  />
                </View>
              ))}
              {updateStatus.isError && (
                <Text style={styles.actionError}>
                  {t("admin.actions.error")}
                  {__DEV__ && updateStatus.error instanceof Error
                    ? `\n${updateStatus.error.message}`
                    : null}
                </Text>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>{t("admin.history.title")}</Text>
        <View style={styles.card}>
          {history.isLoading ? (
            <Text style={styles.muted}>{t("common.loading")}</Text>
          ) : history.isError ? (
            <Text style={styles.muted}>{t("common.errorGeneric")}</Text>
          ) : (history.data ?? []).length === 0 ? (
            <Text style={styles.muted}>{t("admin.history.empty")}</Text>
          ) : (
            (history.data ?? []).map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.historyRow,
                  index > 0 && styles.historyRowBorder,
                ]}>
                <StatusBadge status={entry.status} />
                <View style={styles.historyMeta}>
                  {entry.changed_by && (
                    <Text style={styles.historyStaff}>
                      {t("admin.history.staff")}
                    </Text>
                  )}
                  <Text style={styles.historyDate}>
                    {formatDateTime(entry.at, locale)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  reference: { ...theme.typography.h3, color: theme.palette.text },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.palette.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  row: { marginTop: theme.spacing.sm },
  rowLabel: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
  rowValue: {
    ...theme.typography.body,
    color: theme.palette.text,
    marginTop: 2,
  },
  muted: { ...theme.typography.body, color: theme.palette.textMuted },
  actionButton: { marginTop: theme.spacing.sm },
  actionError: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
  },
  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.palette.border,
  },
  historyMeta: { alignItems: "flex-end" },
  historyStaff: {
    ...theme.typography.caption,
    color: theme.palette.text,
    fontWeight: "600",
  },
  historyDate: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
});
