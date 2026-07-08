import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StatusBadge from "../components/StatusBadge";
import { EmptyState, ErrorView, Loading } from "../components/States";
import {
  useAdminOrders,
  type AdminOrderListItem,
} from "../hooks/useAdminOrders";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { useLocalized } from "../i18n/useLocalized";
import { formatDateTime } from "../lib/format";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";

export default function AdminOrdersScreen({
  navigation,
}: ScreenProps<"AdminOrders">) {
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const queryClient = useQueryClient();
  const { session, isSessionLoading, signOut } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const orders = useAdminOrders();

  const isAuthorized = !!session && isAdminQuery.data === true;

  // Gate: only an authenticated active admin may stay on this screen.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!session || isAdminQuery.data === false) {
      navigation.replace("AdminLogin");
    }
  }, [isSessionLoading, session, isAdminQuery.data, navigation]);

  const onSignOut = async () => {
    await signOut();
    queryClient.removeQueries({ queryKey: ["adminOrders"] });
    queryClient.removeQueries({ queryKey: ["orderHistory"] });
    queryClient.removeQueries({ queryKey: ["isAdmin"] });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("admin.orders.title"),
      headerBackVisible: false,
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate("AdminCatalog")}
            hitSlop={theme.spacing.sm}>
            <Text style={styles.signOut}>{t("admin.catalog.manage")}</Text>
          </Pressable>
          <Pressable onPress={onSignOut} hitSlop={theme.spacing.sm}>
            <Text style={styles.signOut}>{t("admin.orders.signOut")}</Text>
          </Pressable>
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, t]);

  const renderItem = ({ item }: { item: AdminOrderListItem }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        navigation.navigate("AdminOrderDetail", { orderId: item.id })
      }>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>{item.reference}</Text>
        <StatusBadge status={item.status} />
      </View>
      {item.services && (
        <Text style={styles.service}>{localized(item.services.name)}</Text>
      )}
      <Text style={styles.customer}>
        {item.customer_name} · {item.customer_phone}
      </Text>
      <Text style={styles.meta}>
        {item.zones ? `${item.zones.name} · ` : ""}
        {formatDateTime(item.created_at, i18n.language)}
      </Text>
    </Pressable>
  );

  if (isSessionLoading || !isAuthorized) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {orders.isLoading ? (
        <Loading />
      ) : orders.isError ? (
        <ErrorView onRetry={orders.refetch} error={orders.error} />
      ) : (
        <FlatList
          data={orders.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={orders.isRefetching}
          onRefresh={orders.refetch}
          ListEmptyComponent={<EmptyState message={t("admin.orders.empty")} />}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  signOut: {
    ...theme.typography.bodyStrong,
    color: theme.palette.primary,
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
  service: {
    ...theme.typography.body,
    color: theme.palette.text,
    marginTop: theme.spacing.sm,
  },
  customer: {
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
