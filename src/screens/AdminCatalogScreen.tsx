import React, { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState, ErrorView, Loading } from "../components/States";
import {
  useAdminCategories,
  useAdminServices,
  useAdminZones,
  type AdminServiceRow,
} from "../hooks/useAdminCatalog";
import { useAuth, useIsAdmin } from "../hooks/useAuth";
import { useLocalized } from "../i18n/useLocalized";
import { formatPrice } from "../lib/format";
import theme from "../theme/theme";
import type { ScreenProps } from "../navigation/types";
import type { ServiceCategory, Zone } from "../types";

type Tab = "categories" | "services" | "zones";

const TABS: Tab[] = ["categories", "services", "zones"];

function InactiveBadge() {
  const { t } = useTranslation();
  return (
    <View style={styles.inactiveBadge}>
      <Text style={styles.inactiveBadgeText}>{t("admin.catalog.inactive")}</Text>
    </View>
  );
}

export default function AdminCatalogScreen({
  navigation,
}: ScreenProps<"AdminCatalog">) {
  const { t, i18n } = useTranslation();
  const localized = useLocalized();
  const { session, isSessionLoading } = useAuth();
  const isAdminQuery = useIsAdmin(session?.user.id);
  const [tab, setTab] = useState<Tab>("categories");

  const categories = useAdminCategories();
  const services = useAdminServices();
  const zones = useAdminZones();

  const isAuthorized = !!session && isAdminQuery.data === true;

  // Gate: only an authenticated active admin may stay on this screen.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!session || isAdminQuery.data === false) {
      navigation.replace("AdminLogin");
    }
  }, [isSessionLoading, session, isAdminQuery.data, navigation]);

  const onAdd = () => {
    if (tab === "categories") navigation.navigate("AdminCategoryEdit", {});
    else if (tab === "services") navigation.navigate("AdminServiceEdit", {});
    else navigation.navigate("AdminZoneEdit", {});
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("admin.catalog.title"),
      headerRight: () => (
        <Pressable onPress={onAdd} hitSlop={theme.spacing.sm}>
          <Text style={styles.headerAction}>{t("admin.catalog.add")}</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, t, tab]);

  if (isSessionLoading || !isAuthorized) return <Loading />;

  const renderCategory = ({ item }: { item: ServiceCategory }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !item.active && styles.cardInactive,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate("AdminCategoryEdit", { categoryId: item.id })
      }>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.icon ? `${item.icon}  ` : ""}
          {localized(item.name)}
        </Text>
        {!item.active && <InactiveBadge />}
      </View>
    </Pressable>
  );

  const renderService = ({ item }: { item: AdminServiceRow }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !item.active && styles.cardInactive,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate("AdminServiceEdit", { serviceId: item.id })
      }>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{localized(item.name)}</Text>
        {!item.active && <InactiveBadge />}
      </View>
      {item.service_categories && (
        <Text style={styles.cardMeta}>
          {localized(item.service_categories.name)}
        </Text>
      )}
      <Text style={styles.cardMeta}>
        {formatPrice(item.base_price, i18n.language)} · {item.price_unit}
      </Text>
    </Pressable>
  );

  const renderZone = ({ item }: { item: Zone }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !item.active && styles.cardInactive,
        pressed && styles.cardPressed,
      ]}
      onPress={() => navigation.navigate("AdminZoneEdit", { zoneId: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.name} — {item.city}
        </Text>
        {!item.active && <InactiveBadge />}
      </View>
    </Pressable>
  );

  const active =
    tab === "categories" ? categories : tab === "services" ? services : zones;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={styles.tabs}>
        {TABS.map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}>
            <Text
              style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>
              {t(`admin.catalog.tabs.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {active.isLoading ? (
        <Loading />
      ) : active.isError ? (
        <ErrorView onRetry={active.refetch} error={active.error} />
      ) : tab === "categories" ? (
        <FlatList
          data={categories.data}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          refreshing={categories.isRefetching}
          onRefresh={categories.refetch}
          ListEmptyComponent={
            <EmptyState message={t("admin.catalog.empty.categories")} />
          }
        />
      ) : tab === "services" ? (
        <FlatList
          data={services.data}
          keyExtractor={(item) => item.id}
          renderItem={renderService}
          contentContainerStyle={styles.list}
          refreshing={services.isRefetching}
          onRefresh={services.refetch}
          ListEmptyComponent={
            <EmptyState message={t("admin.catalog.empty.services")} />
          }
        />
      ) : (
        <FlatList
          data={zones.data}
          keyExtractor={(item) => item.id}
          renderItem={renderZone}
          contentContainerStyle={styles.list}
          refreshing={zones.isRefetching}
          onRefresh={zones.refetch}
          ListEmptyComponent={
            <EmptyState message={t("admin.catalog.empty.zones")} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.background },
  headerAction: {
    ...theme.typography.bodyStrong,
    color: theme.palette.primary,
  },
  tabs: {
    flexDirection: "row",
    margin: theme.spacing.lg,
    marginBottom: 0,
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.palette.border,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  tabActive: { backgroundColor: theme.palette.primary },
  tabLabel: { ...theme.typography.bodyStrong, color: theme.palette.textMuted },
  tabLabelActive: { color: theme.palette.primaryContrast },
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
  cardInactive: { opacity: 0.55 },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { ...theme.typography.bodyStrong, color: theme.palette.text },
  cardMeta: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
    marginTop: theme.spacing.xs,
  },
  inactiveBadge: {
    backgroundColor: theme.palette.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    ...theme.typography.caption,
    color: theme.palette.textMuted,
  },
});
