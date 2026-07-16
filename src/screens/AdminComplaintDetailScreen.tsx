import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import TextField from "../components/TextField";
import { ErrorView, Loading } from "../components/States";
import {
  useAdminComplaint,
  useUpdateComplaint,
} from "../hooks/useAdminComplaints";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { formatDateTime } from "../lib/format";
import {
  CONFIRMED_COMPLAINT_TRANSITIONS,
  allowedComplaintTransitions,
} from "../lib/complaintTransitions";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { ComplaintStatus } from "../types";

export default function AdminComplaintDetailScreen({
  navigation,
  route,
}: ScreenProps<"AdminComplaintDetail">) {
  const { complaintId } = route.params;
  const { t, i18n } = useTranslation();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const complaint = useAdminComplaint(complaintId);
  const updateComplaint = useUpdateComplaint();

  const [note, setNote] = useState("");

  const isAuthorized = !!session && isAdminQuery.data === true;

  // Gate: only an authenticated active admin may stay on this screen.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!session || isAdminQuery.data === false) {
      navigation.replace("AdminLogin");
    }
  }, [isSessionLoading, session, isAdminQuery.data, navigation]);

  if (isSessionLoading || !isAuthorized) return <Loading />;
  if (complaint.isLoading) return <Loading />;
  if (complaint.isError || !complaint.data) {
    return <ErrorView onRetry={complaint.refetch} error={complaint.error} />;
  }

  const c = complaint.data;
  const locale = i18n.language;
  const transitions = allowedComplaintTransitions(c.status);

  const fireTransition = (newStatus: ComplaintStatus) => {
    const mutate = () =>
      updateComplaint.mutate(
        { complaintId, newStatus, adminNote: note },
        { onSuccess: () => setNote("") },
      );
    if (CONFIRMED_COMPLAINT_TRANSITIONS.has(newStatus)) {
      Alert.alert(
        t("admin.complaints.actions.confirmTitle"),
        t(`admin.complaints.actions.confirm.${newStatus}`),
        [
          { text: t("admin.complaints.actions.confirmNo"), style: "cancel" },
          {
            text: t("admin.complaints.actions.confirmYes"),
            style: newStatus === "dismissed" ? "destructive" : "default",
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Pressable
              onPress={() =>
                navigation.navigate("AdminOrderDetail", {
                  orderId: c.order_id,
                })
              }
              hitSlop={theme.spacing.sm}>
              <Text style={styles.reference}>
                {c.orders?.reference ?? c.order_id}
              </Text>
              <Text style={styles.viewOrder}>
                {t("admin.complaints.viewOrder")}
              </Text>
            </Pressable>
            <StatusBadge status={c.status} />
          </View>
          {c.orders && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                {t("admin.complaints.customer")}
              </Text>
              <Text style={styles.rowValue}>{c.orders.customer_name}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {t("admin.complaints.receivedAt")}
            </Text>
            <Text style={styles.rowValue}>
              {formatDateTime(c.created_at, locale)}
            </Text>
          </View>
          {c.updated_at !== c.created_at && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                {t("admin.complaints.updatedAt")}
              </Text>
              <Text style={styles.rowValue}>
                {formatDateTime(c.updated_at, locale)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t("admin.complaints.message")}</Text>
        <View style={styles.card}>
          <Text style={styles.messageText}>{c.message}</Text>
        </View>

        {c.admin_note && (
          <>
            <Text style={styles.sectionTitle}>
              {t("admin.complaints.note")}
            </Text>
            <View style={styles.card}>
              <Text style={styles.messageText}>{c.admin_note}</Text>
            </View>
          </>
        )}

        {transitions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t("admin.complaints.actions.title")}
            </Text>
            <View style={styles.card}>
              {/* v1: the note is saved together with a status transition. */}
              <TextField
                label={t("admin.complaints.note")}
                value={note}
                onChangeText={setNote}
                placeholder={t("admin.complaints.notePlaceholder")}
                multiline
              />
              {transitions.map((target) => (
                <View key={target} style={styles.actionButton}>
                  <Button
                    label={t(`admin.complaints.actions.${target}`)}
                    variant={target === "dismissed" ? "secondary" : "primary"}
                    loading={
                      updateComplaint.isPending &&
                      updateComplaint.variables?.newStatus === target
                    }
                    disabled={updateComplaint.isPending}
                    onPress={() => fireTransition(target)}
                  />
                </View>
              ))}
              {updateComplaint.isError && (
                <Text style={styles.actionError}>
                  {t("admin.complaints.actions.error")}
                  {__DEV__ && updateComplaint.error instanceof Error
                    ? `\n${updateComplaint.error.message}`
                    : null}
                </Text>
              )}
            </View>
          </>
        )}
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  reference: { ...theme.typography.h3, color: theme.palette.text },
  viewOrder: {
    ...theme.typography.caption,
    color: theme.palette.primary,
    marginTop: 2,
  },
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
  messageText: { ...theme.typography.body, color: theme.palette.text },
  actionButton: { marginTop: theme.spacing.sm },
  actionError: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
});
