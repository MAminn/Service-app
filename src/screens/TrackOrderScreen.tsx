import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import TextField from "../components/TextField";
import { EmptyState } from "../components/States";
import {
  useComplaintsByPhone,
  useCreateComplaint,
  type TrackedComplaint,
} from "../hooks/useComplaints";
import { useTrackOrders, type TrackedOrder } from "../hooks/useTrackOrders";
import { useLocalized } from "../i18n/useLocalized";
import { formatDate } from "../lib/format";
import { isValidPhone } from "../lib/validation";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

/** Map a create_complaint server error to a user-facing i18n key. */
function complaintErrorKey(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown })?.message === "string"
        ? (error as { message: string }).message
        : "";
  if (message.includes("Complaint limit reached")) {
    return "complaints.errors.limitReached";
  }
  if (message.includes("Order not found")) {
    return "complaints.errors.orderNotFound";
  }
  return "complaints.errors.submit";
}

export default function TrackOrderScreen({
  navigation,
}: ScreenProps<"TrackOrder">) {
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const track = useTrackOrders();
  const createComplaint = useCreateComplaint();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  // The phone that actually returned results — drives the complaints query
  // and is reused for complaint submission (never asked again).
  const [searchedPhone, setSearchedPhone] = useState("");

  // Report-an-issue modal state.
  const [reportOrder, setReportOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const complaints = useComplaintsByPhone(searchedPhone);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("track.title") });
  }, [navigation, t]);

  const onSearch = () => {
    if (!isValidPhone(phone)) {
      setError(t("request.errors.phone"));
      return;
    }
    setError(null);
    track.mutate(phone, {
      onSuccess: () => {
        setSearched(true);
        setSearchedPhone(phone);
      },
    });
  };

  const openReport = (order: TrackedOrder) => {
    createComplaint.reset();
    setMessage("");
    setMessageError(null);
    setSubmitted(false);
    setReportOrder(order);
  };

  const closeReport = () => setReportOrder(null);

  const onSubmitComplaint = () => {
    if (!reportOrder) return;
    if (message.trim().length === 0) {
      setMessageError(t("complaints.errors.message"));
      return;
    }
    setMessageError(null);
    createComplaint.mutate(
      {
        reference: reportOrder.reference,
        phone: searchedPhone,
        message,
      },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  const orders = track.data ?? [];
  const trackedComplaints = complaints.data ?? [];

  const renderItem = ({ item }: { item: TrackedOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>{item.reference}</Text>
        <StatusBadge status={item.status} />
      </View>
      {item.service_name && (
        <Text style={styles.service}>{localized(item.service_name)}</Text>
      )}
      <Text style={styles.date}>
        {t("track.placedOn", {
          date: formatDate(item.created_at, i18n.language),
        })}
      </Text>
      <Pressable
        onPress={() => openReport(item)}
        hitSlop={theme.spacing.sm}
        style={styles.reportLink}>
        <Text style={styles.reportLinkText}>{t("complaints.report")}</Text>
      </Pressable>
    </View>
  );

  const renderComplaint = (item: TrackedComplaint) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>{item.order_reference}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.service} numberOfLines={2}>
        {item.message}
      </Text>
      {item.admin_note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>{t("complaints.adminNote")}</Text>
          <Text style={styles.noteText}>{item.admin_note}</Text>
        </View>
      )}
      <Text style={styles.date}>
        {formatDate(item.created_at, i18n.language)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps='handled'
        ListHeaderComponent={
          <View>
            <Text style={styles.intro}>{t("track.intro")}</Text>
            <TextField
              label={t("track.phone")}
              value={phone}
              onChangeText={setPhone}
              error={error}
              keyboardType='phone-pad'
            />
            <Button
              label={track.isPending ? t("track.searching") : t("track.search")}
              onPress={onSearch}
              loading={track.isPending}
            />
            {orders.length > 0 && (
              <Text style={styles.listTitle}>{t("track.yourOrders")}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          searched && !track.isPending ? (
            <EmptyState message={t("track.empty")} />
          ) : null
        }
        ListFooterComponent={
          trackedComplaints.length > 0 ? (
            <View>
              <Text style={styles.listTitle}>
                {t("complaints.yourComplaints")}
              </Text>
              <View style={styles.complaintList}>
                {trackedComplaints.map(renderComplaint)}
              </View>
            </View>
          ) : null
        }
      />

      <Modal
        visible={reportOrder !== null}
        transparent
        animationType='fade'
        onRequestClose={closeReport}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("complaints.modalTitle")}</Text>
            {reportOrder && (
              <Text style={styles.modalReference}>
                {t("complaints.forOrder", {
                  reference: reportOrder.reference,
                })}
              </Text>
            )}
            {submitted ? (
              <>
                <Text style={styles.submittedText}>
                  {t("complaints.submitted")}
                </Text>
                <Button label={t("common.back")} onPress={closeReport} />
              </>
            ) : (
              <>
                <TextField
                  label={t("complaints.message")}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t("complaints.messagePlaceholder")}
                  error={messageError}
                  multiline
                  required
                />
                {createComplaint.isError && (
                  <Text style={styles.submitError}>
                    {t(complaintErrorKey(createComplaint.error))}
                  </Text>
                )}
                <Button
                  label={
                    createComplaint.isPending
                      ? t("complaints.submitting")
                      : t("complaints.submit")
                  }
                  onPress={onSubmitComplaint}
                  loading={createComplaint.isPending}
                />
                <View style={styles.modalCancel}>
                  <Button
                    label={t("common.cancel")}
                    onPress={closeReport}
                    variant='secondary'
                    disabled={createComplaint.isPending}
                  />
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  intro: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginBottom: theme.spacing.lg,
  },
  listTitle: {
    ...theme.typography.h3,
    color: theme.palette.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
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
  },
  reference: { ...theme.typography.bodyStrong, color: theme.palette.text },
  service: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.sm,
  },
  date: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
  },
  reportLink: {
    marginTop: theme.spacing.md,
    alignSelf: "flex-start",
  },
  reportLinkText: {
    ...theme.typography.bodyStrong,
    color: theme.palette.primary,
  },
  complaintList: { gap: theme.spacing.md },
  noteBox: {
    backgroundColor: theme.palette.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  noteLabel: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
  noteText: {
    ...theme.typography.body,
    color: theme.palette.text,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: { ...theme.typography.h3, color: theme.palette.text },
  modalReference: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  modalCancel: { marginTop: theme.spacing.sm },
  submittedText: {
    ...theme.typography.body,
    color: theme.palette.text,
    marginVertical: theme.spacing.lg,
  },
  submitError: {
    ...theme.typography.caption,
    color: theme.palette.danger,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
});
