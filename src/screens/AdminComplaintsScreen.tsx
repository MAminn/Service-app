import React, { useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StatusBadge from "../components/StatusBadge";
import { EmptyState, ErrorView, Loading } from "../components/States";
import {
  useAdminComplaints,
  type AdminComplaint,
} from "../hooks/useAdminComplaints";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { formatDateTime } from "../lib/format";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

export default function AdminComplaintsScreen({
  navigation,
}: ScreenProps<"AdminComplaints">) {
  const { t, i18n } = useTranslation();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const complaints = useAdminComplaints();

  const isAuthorized = !!session && isAdminQuery.data === true;

  // Gate: only an authenticated active admin may stay on this screen.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!session || isAdminQuery.data === false) {
      navigation.replace("AdminLogin");
    }
  }, [isSessionLoading, session, isAdminQuery.data, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("admin.complaints.title") });
  }, [navigation, t]);

  const renderItem = ({ item }: { item: AdminComplaint }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        navigation.navigate("AdminComplaintDetail", { complaintId: item.id })
      }>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>
          {item.orders?.reference ?? item.order_id}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      {item.orders && (
        <Text style={styles.customer}>{item.orders.customer_name}</Text>
      )}
      <Text style={styles.message} numberOfLines={2}>
        {item.message}
      </Text>
      <Text style={styles.meta}>
        {formatDateTime(item.created_at, i18n.language)}
      </Text>
    </Pressable>
  );

  if (isSessionLoading || !isAuthorized) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {complaints.isLoading ? (
        <Loading />
      ) : complaints.isError ? (
        <ErrorView onRetry={complaints.refetch} error={complaints.error} />
      ) : (
        <FlatList
          data={complaints.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={complaints.isRefetching}
          onRefresh={complaints.refetch}
          ListEmptyComponent={
            <EmptyState message={t("admin.complaints.empty")} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  list: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    ...theme.shadow.card,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reference: { ...theme.typography.bodyStrong, color: theme.palette.text },
  customer: {
    ...theme.typography.body,
    color: theme.palette.text,
    marginTop: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
  },
});
